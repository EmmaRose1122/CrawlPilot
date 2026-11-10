import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { lstat, mkdir, open, readFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nextEnv from '@next/env';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Opt-in live tests only. Start Next separately; this script never starts a server.
// scratch/ is already ignored by this repository. Retained passwords are random,
// disposable TEST-ONLY credentials, never application or real-user credentials.
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const scratchDirectory = path.join(projectRoot, 'scratch');
const fixtureFile = path.join(scratchDirectory, 'phase5-fixtures.json');
const definitions = [
    { key: 'admin', name: 'Phase 5 Test Admin', role: 'ADMIN' },
    { key: 'user', name: 'Phase 5 Test User', role: 'USER' },
    { key: 'user2', name: 'Phase 5 Test Isolation User', role: 'USER' },
];
const routes = {
    topup: '/api/topup', support: '/api/support',
    adminTopups: '/api/admin/topups', adminSupport: '/api/admin/support',
    activity: '/api/admin/activity',
};
// Activity exports GET only; POST would be 405, not an authorization contract.
const writableRoutes = [routes.topup, routes.support, routes.adminTopups, routes.adminSupport];
let group = 'Safety preflight';
let checkpoint = 'initialization';
let baseUrl;
let prisma;
let stopped = false;
let password;
let passwordHash;
let users = [];

function check(value, label) {
    checkpoint = label;
    assert.ok(value, label);
}

function equal(actual, expected, label) {
    checkpoint = label;
    assert.deepEqual(actual, expected, label);
}

function pass(label = group) {
    console.log(`PASS ${label}`);
}

function localOrigin(value) {
    checkpoint = 'base URL must be a loopback HTTP(S) origin';
    const url = new URL(value);
    check(['http:', 'https:'].includes(url.protocol), checkpoint);
    check(['localhost', '127.0.0.1'].includes(url.hostname), checkpoint);
    check(!url.username && !url.password && !url.search && !url.hash && url.pathname === '/', checkpoint);
    return url.origin;
}

async function statOrNull(filename) {
    try {
        return await lstat(filename);
    } catch (error) {
        if (error.code === 'ENOENT') return null;
        throw error;
    }
}

function validateOwners(owners, runId, complete = false) {
    check(/^[a-f0-9]{16}$/.test(runId), 'fixture run identifier is valid');
    check(Array.isArray(owners) && owners.length > 0 && owners.length <= 3, 'fixture owner count is valid');
    if (complete) equal(owners.length, 3, 'manifest contains exactly three fixture users');
    const seen = new Set();
    for (const owner of owners) {
        const definition = definitions.find((item) => owner?.id === `phase5-${runId}-${item.key}`);
        check(definition && !seen.has(owner.id), 'fixture IDs are unique and belong to this run');
        seen.add(owner.id);
        equal(owner.email, `phase5-test-${runId}-${definition.key}@example.invalid`, 'fixture email has the exact disposable prefix');
        equal(owner.role, definition.role, 'fixture roles match their intended accounts');
    }
}

async function cleanupOwners(owners, runId, allowMissing = false) {
    if (!owners.length) return;
    validateOwners(owners, runId);
    const ids = owners.map((owner) => owner.id);
    await prisma.$transaction(async (tx) => {
        const existing = await tx.user.findMany({
            where: { id: { in: ids } }, select: { id: true, email: true },
        });
        // Validate EVERY record before deleting ANY record. Missing attempted
        // inserts are allowed only during failure cleanup, never manifest cleanup.
        if (!allowMissing) equal(existing.length, owners.length, 'all cleanup owners exist');
        for (const row of existing) {
            const owner = owners.find((item) => item.id === row.id);
            equal(row.email, owner.email, 'cleanup database ID/email match');
            check(row.email.startsWith(`phase5-test-${runId}-`), 'cleanup database email prefix matches');
        }
        for (const row of existing) {
            const deleted = await tx.user.deleteMany({ where: { id: row.id, email: row.email } });
            equal(deleted.count, 1, 'cleanup deletes exactly one validated owner');
        }
        equal(await tx.user.count({ where: { id: { in: ids } } }), 0, 'fixture users were deleted');
        equal(await tx.topupRequest.count({ where: { userId: { in: ids } } }), 0, 'fixture top-ups cascade on cleanup');
        equal(await tx.supportTicket.count({ where: { userId: { in: ids } } }), 0, 'fixture tickets cascade on cleanup');
    }, { maxWait: 10000, timeout: 60000 });
}

class CookieJar {
    values = new Map();

    accept(headers) {
        for (const cookie of headers.getSetCookie()) {
            const [pair, ...attributes] = cookie.split(';');
            const separator = pair.indexOf('=');
            check(separator > 0, 'authentication returned a valid cookie');
            const name = pair.slice(0, separator).trim();
            const value = pair.slice(separator + 1);
            const expired = attributes.some((attribute) => {
                const normalized = attribute.trim();
                if (/^max-age=/i.test(normalized)) return Number(normalized.slice(8)) <= 0;
                if (/^expires=/i.test(normalized)) return Date.parse(normalized.slice(8)) <= Date.now();
                return false;
            });
            if (expired || !value) this.values.delete(name);
            else this.values.set(name, value);
        }
    }

    header() {
        return [...this.values].map(([name, value]) => `${name}=${value}`).join('; ');
    }
}

async function request(jar, pathname, options = {}) {
    check(!stopped, 'run was not interrupted');
    const { method = 'GET', json, raw, form, headers: extraHeaders } = options;
    checkpoint = `${method} ${pathname.split('?')[0]}`;
    const url = new URL(pathname, baseUrl);
    check(url.origin === baseUrl, 'HTTP requests remain on the configured loopback origin');
    const headers = new Headers(extraHeaders);
    headers.set('accept', 'application/json');
    if (jar?.values.size) headers.set('cookie', jar.header());
    let body;
    if (form) {
        headers.set('content-type', 'application/x-www-form-urlencoded');
        body = form.toString();
    } else if (Object.hasOwn(options, 'raw') || Object.hasOwn(options, 'json')) {
        headers.set('content-type', 'application/json');
        body = Object.hasOwn(options, 'raw') ? raw : JSON.stringify(json);
    }
    checkpoint = `${method} ${pathname.split('?')[0]} response`;
    const response = await fetch(url, {
        method, headers, body, redirect: 'manual', cache: 'no-store',
        signal: AbortSignal.timeout(60000),
    });
    jar?.accept(response.headers);
    const text = await response.text();
    checkpoint = `${method} ${pathname.split('?')[0]} JSON response`;
    const data = JSON.parse(text);
    return { status: response.status, data };
}

function status(result, expected, label) {
    equal(result.status, expected, `${label}: HTTP ${expected}`);
    if (expected >= 400) check(typeof result.data?.error === 'string', `${label}: JSON error`);
    return result.data;
}

async function get(jar, pathname) {
    return status(await request(jar, pathname), 200, `GET ${pathname.split('?')[0]}`);
}

async function post(jar, pathname, body, expected = 200) {
    return status(await request(jar, pathname, { method: 'POST', json: body }), expected, `POST ${pathname}`);
}

async function together(tasks) {
    // Wait for every request to settle before assertions/cleanup, including errors.
    const results = await Promise.allSettled(tasks);
    check(results.every((result) => result.status === 'fulfilled'), 'all concurrent HTTP requests completed');
    return results.map((result) => result.value);
}

function safeProjection(value) {
    const serialized = JSON.stringify(value);
    if (password) check(!serialized.includes(password), 'response never includes the test password');
    if (passwordHash) check(!serialized.includes(passwordHash), 'response never includes the password hash');
    function visit(item) {
        if (!item || typeof item !== 'object') return;
        for (const [key, child] of Object.entries(item)) {
            check(!/password|secret|token|cookie|googleIndexingConfig/i.test(key), 'response excludes credential fields');
            visit(child);
        }
    }
    visit(value);
}

function keys(value, expected, label) {
    check(value && typeof value === 'object' && !Array.isArray(value), label);
    equal(Object.keys(value).sort(), [...expected].sort(), label);
}

function descending(rows, field, label) {
    for (let index = 0; index < rows.length; index += 1) {
        const time = Date.parse(rows[index][field]);
        check(Number.isFinite(time), `${label}: valid timestamp`);
        if (index) check(Date.parse(rows[index - 1][field]) >= time, `${label}: newest first`);
    }
}

async function login(owner) {
    const jar = new CookieJar();
    const csrf = await get(jar, '/api/auth/csrf');
    check(typeof csrf.csrfToken === 'string' && csrf.csrfToken.length > 0, 'NextAuth issued a CSRF token');
    check(jar.values.size > 0, 'NextAuth CSRF cookie was captured');
    const result = await request(jar, '/api/auth/callback/credentials', {
        method: 'POST',
        headers: { 'x-auth-return-redirect': '1' },
        form: new URLSearchParams({
            csrfToken: csrf.csrfToken, email: owner.email, password,
            callbackUrl: `${baseUrl}/panel`,
        }),
    });
    equal(result.status, 200, 'credentials callback succeeded');
    check(typeof result.data.url === 'string', 'credentials callback returned a redirect URL');
    const redirect = new URL(result.data.url, baseUrl);
    check(redirect.origin === baseUrl && !redirect.searchParams.has('error'), 'credentials callback has no authentication error');
    const session = await get(jar, '/api/auth/session');
    equal(session.user?.id, owner.id, 'real NextAuth session maps to the fixture database ID');
    equal(session.user?.email, owner.email, 'real NextAuth session email matches');
    equal(session.user?.role, owner.role, 'real NextAuth session role matches');
    equal(session.user?.name, owner.name, 'real NextAuth session name matches');
    safeProjection(session);
    return jar;
}

async function userRow(owner) {
    const row = await prisma.user.findFirst({
        where: { id: owner.id, email: owner.email },
        select: { id: true, email: true, balance: true, role: true },
    });
    check(row, 'fixture database user exists with the expected email');
    return row;
}

async function topupRow(owner, id) {
    const row = await prisma.topupRequest.findFirst({ where: { id, userId: owner.id } });
    check(row, 'top-up is owned by the expected disposable user');
    return row;
}

async function ticketRow(owner, id) {
    const row = await prisma.supportTicket.findFirst({ where: { id, userId: owner.id } });
    check(row, 'ticket is owned by the expected disposable user');
    return row;
}

async function fixtureState() {
    const userIds = users.map((owner) => owner.id);
    return {
        users: await prisma.user.findMany({
            where: { id: { in: userIds } }, orderBy: { id: 'asc' },
            select: { id: true, email: true, balance: true, role: true },
        }),
        topups: await prisma.topupRequest.findMany({ where: { userId: { in: userIds } }, orderBy: { id: 'asc' } }),
        tickets: await prisma.supportTicket.findMany({ where: { userId: { in: userIds } }, orderBy: { id: 'asc' } }),
    };
}

async function activity(admin) {
    const data = await get(admin, routes.activity);
    keys(data, ['activity', 'summary'], 'activity envelope is a safe projection');
    check(Array.isArray(data.activity) && data.activity.length <= 20, 'activity is bounded to twenty events');
    equal(new Set(data.activity.map((item) => item.id)).size, data.activity.length, 'activity IDs are unique');
    keys(data.summary, ['pendingTopups', 'openTickets', 'approvedCredits'], 'activity summary projection');
    for (const value of Object.values(data.summary)) check(Number.isSafeInteger(value) && value >= 0, 'activity summary values are nonnegative integers');
    for (const item of data.activity) {
        keys(item, ['id', 'title', 'detail', 'at', 'href'], 'activity event safe projection');
        for (const field of ['id', 'title', 'detail', 'at']) check(typeof item[field] === 'string', 'activity event fields are strings');
        check([null, '/admin/requests', '/admin/users'].includes(item.href), 'activity links are restricted to supported destinations');
    }
    descending(data.activity, 'at', 'activity');
    safeProjection(data);
    return data;
}

async function activityEvent(admin, id, title, owner) {
    const data = await activity(admin);
    const event = data.activity.find((item) => item.id === id);
    check(event, 'latest activity includes the fixture event');
    equal(event.title, title, 'activity reflects the current fixture state');
    check(event.detail.includes(owner.email), 'activity identifies the fixture owner');
    equal(event.href, '/admin/requests', 'request activity links to the review UI');
    return event;
}

async function createTopup(client, owner, amount, extra = {}) {
    const data = await post(client, routes.topup, { amount, ...extra });
    equal(data.success, true, 'top-up creation reports success');
    check(typeof data.request?.id === 'string', 'top-up creation returned an ID');
    const row = await topupRow(owner, data.request.id);
    equal(row.amount, amount, 'top-up amount persisted');
    equal(row.status, 'pending', 'new top-up starts pending');
    equal(row.adminNote, null, 'new top-up has no admin note');
    equal(row.reviewedAt, null, 'new top-up has not been reviewed');
    equal(data.request, JSON.parse(JSON.stringify(row)), 'top-up response matches the fixture database row');
    return row;
}

async function createTicket(client, owner, message, category, extra = {}) {
    const data = await post(client, routes.support, { message, category, ...extra });
    equal(data.success, true, 'support creation reports success');
    check(typeof data.ticket?.id === 'string', 'support creation returned an ID');
    const row = await ticketRow(owner, data.ticket.id);
    equal(row.message, message.trim(), 'support message is trimmed and persisted');
    equal(row.status, 'open', 'new support ticket starts open');
    equal(row.adminReply, null, 'new support ticket has no admin reply');
    equal(row.answeredAt, null, 'new support ticket has no answer timestamp');
    equal(data.ticket, JSON.parse(JSON.stringify(row)), 'support response matches the fixture database row');
    return row;
}

async function assertLatest(client, owner, route, collection, model, limit = 20) {
    const data = await get(client, `${route}?userId=${encodeURIComponent(users[0].id)}`);
    const rows = data[collection];
    const expected = await prisma[model].findMany({ where: { userId: owner.id } });
    check(Array.isArray(rows), 'user history is an array');
    equal(rows.length, Math.min(limit, expected.length), 'user history has the correct twenty-item bound');
    equal(new Set(rows.map((row) => row.id)).size, rows.length, 'user history contains no duplicate rows');
    descending(rows, 'createdAt', 'user history');
    for (const row of rows) {
        equal(row.userId, owner.id, 'user history cannot expose another owner');
        const dbRow = expected.find((item) => item.id === row.id);
        check(dbRow, 'user history ID belongs to the fixture');
        equal(row, JSON.parse(JSON.stringify(dbRow)), 'user history matches current database state');
    }
    const returned = new Set(rows.map((row) => row.id));
    const omitted = expected.filter((row) => !returned.has(row.id));
    if (omitted.length) {
        const oldestReturned = Date.parse(rows.at(-1).createdAt);
        check(omitted.every((row) => row.createdAt.getTime() <= oldestReturned), 'user history includes only the latest twenty rows');
    }
    safeProjection(data);
    return rows;
}

async function runTests(clients, runId) {
    const [admin, primary, secondary] = clients;
    const [adminOwner, primaryOwner, secondaryOwner] = users;
    const ids = {};
    group = 'Anonymous and role authorization';
    const beforeAuthorization = await fixtureState();
    for (const route of Object.values(routes)) {
        status(await request(null, route), 401, 'anonymous GET');
    }
    for (const route of writableRoutes) {
        status(await request(null, route, {
            method: 'POST', json: { amount: 5, message: 'Valid message', id: `phase5-missing-${runId}`, action: 'approve', reply: 'Valid reply' },
        }), 401, 'anonymous POST');
    }
    for (const client of [primary, secondary]) {
        for (const route of [routes.adminTopups, routes.adminSupport, routes.activity]) {
            status(await request(client, route), 401, 'non-admin GET');
        }
        for (const route of [routes.adminTopups, routes.adminSupport]) {
            await post(client, route, { id: `phase5-missing-${runId}`, action: route === routes.adminTopups ? 'approve' : 'reply', reply: 'Valid reply' }, 401);
        }
    }
    equal(await fixtureState(), beforeAuthorization, 'unauthorized calls cannot mutate fixtures');
    const baseline = (await activity(admin)).summary;
    pass();

    group = 'JSON, amount, note, message, and ID validation';
    const beforeValidation = await fixtureState();
    for (const route of writableRoutes) {
        const client = route.startsWith('/api/admin/') ? admin : primary;
        for (const body of [null, {}, [], false, true, 7, 'not an object']) await post(client, route, body, 400);
        for (const raw of ['', '{', 'not-json', '{"amount":NaN}']) {
            status(await request(client, route, { method: 'POST', raw }), 400, 'malformed JSON');
        }
    }
    for (const amount of [undefined, null, 0, -1, 1000001, 1.5, 0.5, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER + 1, '1', '1.5', '', true, false, [], [1], {}]) {
        await post(primary, routes.topup, { amount }, 400);
    }
    status(await request(primary, routes.topup, { method: 'POST', raw: '{"amount":1e309}' }), 400, 'non-finite numeric amount');
    for (const note of [true, false, 1, [], {}, 'n'.repeat(1001)]) await post(primary, routes.topup, { amount: 1, note }, 400);
    for (const message of [undefined, null, true, 5, [], {}, '', '    ', 'abcd', '  abcd  ', 'm'.repeat(5001)]) {
        await post(primary, routes.support, { message }, 400);
    }
    for (const route of [routes.adminTopups, routes.adminSupport]) {
        const action = route === routes.adminTopups ? 'approve' : 'close';
        for (const id of [undefined, null, '', '   ', {}, { equals: 'anything' }, [], 1, true]) {
            await post(admin, route, { id, action }, 400);
        }
        for (const invalidAction of [undefined, null, '', 'unknown', {}, true]) {
            await post(admin, route, { id: `phase5-missing-${runId}`, action: invalidAction }, 400);
        }
    }
    await post(admin, routes.adminTopups, { id: `phase5-missing-${runId}`, action: 'approve' }, 404);
    await post(admin, routes.adminSupport, { id: `phase5-missing-${runId}`, action: 'close' }, 400);
    await post(admin, routes.adminSupport, { id: `phase5-missing-${runId}`, action: 'reply', reply: 'OK' }, 400);
    equal(await fixtureState(), beforeValidation, 'invalid inputs leave fixture database state unchanged');
    pass();

    group = 'Top-up ownership, pending creation, and exactly-once approval';
    const approved = await createTopup(primary, primaryOwner, 37, {
        note: '  Phase 5 approval check  ', userId: secondaryOwner.id, status: 'approved',
        adminNote: 'forged', reviewedAt: new Date().toISOString(),
    });
    ids.approvedTopup = approved.id;
    equal(approved.note, 'Phase 5 approval check', 'top-up note is trimmed');
    equal((await userRow(primaryOwner)).balance, 100, 'pending request does not credit its owner');
    equal((await userRow(secondaryOwner)).balance, 100, 'spoofed owner is not credited');
    await activityEvent(admin, `topup-${approved.id}`, 'Top-up pending', primaryOwner);
    for (const note of [1, true, false, [], {}, 'n'.repeat(1001)]) {
        await post(admin, routes.adminTopups, { id: approved.id, action: 'approve', adminNote: note }, 400);
        await post(admin, routes.adminTopups, { id: approved.id, action: 'reject', adminNote: note }, 400);
    }
    for (const client of [primary, secondary]) {
        for (const action of ['approve', 'reject']) await post(client, routes.adminTopups, { id: approved.id, action }, 401);
    }
    equal(await topupRow(primaryOwner, approved.id), approved, 'invalid reviews and ordinary users cannot change a pending top-up');
    const approvalResults = await together([0, 1].map(() => request(admin, routes.adminTopups, {
        method: 'POST', json: { id: approved.id, action: 'approve', adminNote: '  Verified test payment  ' },
    })));
    equal(approvalResults.map((result) => result.status).sort(), [200, 400], 'concurrent approval has exactly one winner');
    const winner = status(approvalResults.find((result) => result.status === 200), 200, 'approval winner');
    equal(winner, { success: true, credited: true }, 'approval winner reports one credit');
    status(approvalResults.find((result) => result.status === 400), 400, 'approval loser');
    const credited = await topupRow(primaryOwner, approved.id);
    equal(credited.status, 'approved', 'approval is persisted');
    equal(credited.adminNote, 'Verified test payment', 'admin note is trimmed');
    check(credited.reviewedAt instanceof Date, 'approval records its review timestamp');
    equal((await userRow(primaryOwner)).balance, 137, 'concurrent approval increments balance exactly once');
    for (const action of ['approve', 'reject']) await post(admin, routes.adminTopups, { id: approved.id, action }, 400);
    equal(await topupRow(primaryOwner, approved.id), credited, 'processed approval cannot be changed');
    equal((await userRow(primaryOwner)).balance, 137, 'reprocessing never credits again');
    await activityEvent(admin, `topup-${approved.id}`, 'Top-up approved', primaryOwner);
    pass();

    group = 'Amount/note boundaries and rejection without credit';
    const rejected = await createTopup(primary, primaryOwner, 1000000, { note: 'n'.repeat(1000) });
    ids.rejectedTopup = rejected.id;
    equal(rejected.note.length, 1000, 'maximum-length user note is accepted');
    const rejection = await post(admin, routes.adminTopups, { id: rejected.id, action: 'reject', adminNote: 'r'.repeat(1000) });
    equal(rejection, { success: true, credited: false }, 'rejection reports no credit');
    const rejectedState = await topupRow(primaryOwner, rejected.id);
    equal(rejectedState.status, 'rejected', 'rejection is persisted');
    equal(rejectedState.adminNote.length, 1000, 'maximum-length admin note is accepted');
    check(rejectedState.reviewedAt instanceof Date, 'rejection records its review timestamp');
    for (const action of ['approve', 'reject']) await post(admin, routes.adminTopups, { id: rejected.id, action }, 400);
    equal(await topupRow(primaryOwner, rejected.id), rejectedState, 'rejected request cannot be reprocessed');
    equal((await userRow(primaryOwner)).balance, 137, 'rejection and denied approval do not credit');
    await activityEvent(admin, `topup-${rejected.id}`, 'Top-up rejected', primaryOwner);
    const minimum = await createTopup(primary, primaryOwner, 1, { note: null });
    equal(minimum.note, null, 'null user note is accepted');
    await post(admin, routes.adminTopups, { id: minimum.id, action: 'reject', adminNote: null });
    equal((await topupRow(primaryOwner, minimum.id)).adminNote, null, 'null admin note is accepted');
    const emptyNote = await createTopup(primary, primaryOwner, 2, { note: '   ' });
    equal(emptyNote.note, '', 'whitespace-only optional note is trimmed');
    await post(admin, routes.adminTopups, { id: emptyNote.id, action: 'reject', adminNote: '   ' });
    equal((await topupRow(primaryOwner, emptyNote.id)).adminNote, '', 'whitespace-only admin note is trimmed');
    const pending = await createTopup(primary, primaryOwner, 125);
    ids.pendingTopup = pending.id;
    equal(pending.note, null, 'omitted optional note is accepted');
    equal((await userRow(primaryOwner)).balance, 137, 'all non-approved boundary requests leave balance unchanged');
    pass();

    group = 'Concurrent five-pending cap on a fresh isolated user';
    equal(await prisma.topupRequest.count({ where: { userId: secondaryOwner.id } }), 0, 'second user starts with no top-ups');
    const capResults = await together(Array.from({ length: 6 }, (_, index) => request(secondary, routes.topup, {
        method: 'POST', json: { amount: index + 10, note: 'Phase 5 concurrent cap check' },
    })));
    equal(capResults.map((result) => result.status).sort(), [200, 200, 200, 200, 200, 429], 'six parallel creates yield five successes and one 429');
    const successfulIds = [];
    for (const result of capResults) {
        if (result.status === 429) {
            status(result, 429, 'pending cap refusal');
            continue;
        }
        const data = status(result, 200, 'pending cap creation');
        equal(data.success, true, 'concurrent create reports success');
        equal(data.request.userId, secondaryOwner.id, 'parallel request belongs to its caller');
        equal(data.request.status, 'pending', 'parallel request remains pending');
        successfulIds.push(data.request.id);
    }
    equal(new Set(successfulIds).size, 5, 'parallel creation returns five distinct IDs');
    const secondTopups = await prisma.topupRequest.findMany({ where: { userId: secondaryOwner.id } });
    equal(secondTopups.map((row) => row.id).sort(), successfulIds.sort(), 'only successful parallel requests were persisted');
    check(secondTopups.every((row) => row.status === 'pending' && row.reviewedAt === null), 'all five persisted requests are unreviewed');
    await post(secondary, routes.topup, { amount: 1 }, 429);
    equal(await prisma.topupRequest.count({ where: { userId: secondaryOwner.id, status: 'pending' } }), 5, 'subsequent create cannot exceed the cap');
    equal((await userRow(secondaryOwner)).balance, 100, 'parallel pending creation never credits balance');
    pass();

    group = 'Support ownership, reply validation/replacement, and closed transitions';
    const ticket = await createTicket(primary, primaryOwner, '  abcde  ', 'Billing & Payments', {
        userId: secondaryOwner.id, status: 'closed', adminReply: 'forged', answeredAt: new Date().toISOString(),
    });
    ids.closedTicket = ticket.id;
    equal(ticket.category, 'Billing & Payments', 'supported category is preserved');
    await activityEvent(admin, `support-${ticket.id}`, 'Support ticket open', primaryOwner);
    for (const reply of [undefined, null, 1, true, [], {}, '', ' ', 'a', ' a ', 'r'.repeat(5001)]) {
        await post(admin, routes.adminSupport, { id: ticket.id, action: 'reply', reply }, 400);
    }
    for (const client of [primary, secondary]) {
        await post(client, routes.adminSupport, { id: ticket.id, action: 'reply', reply: 'No authority' }, 401);
        await post(client, routes.adminSupport, { id: ticket.id, action: 'close' }, 401);
    }
    equal(await ticketRow(primaryOwner, ticket.id), ticket, 'invalid replies and non-admin actions leave ticket unchanged');
    equal(await post(admin, routes.adminSupport, { id: ticket.id, action: 'reply', reply: '  OK  ' }), { success: true }, 'minimum-length reply succeeds');
    const answered = await ticketRow(primaryOwner, ticket.id);
    equal(answered.status, 'answered', 'reply transitions open to answered');
    equal(answered.adminReply, 'OK', 'reply is trimmed');
    check(answered.answeredAt instanceof Date, 'reply stores an answer timestamp');
    await activityEvent(admin, `support-${ticket.id}`, 'Support ticket answered', primaryOwner);
    await post(admin, routes.adminSupport, { id: ticket.id, action: 'reply', reply: 'R'.repeat(5000) });
    const replaced = await ticketRow(primaryOwner, ticket.id);
    equal(replaced.status, 'answered', 'replacement keeps answered status');
    equal(replaced.adminReply, 'R'.repeat(5000), 'maximum-length reply replaces previous text');
    check(replaced.answeredAt >= answered.answeredAt, 'replacement refreshes the answer timestamp');
    await post(admin, routes.adminSupport, { id: ticket.id, action: 'close' });
    const closed = await ticketRow(primaryOwner, ticket.id);
    equal(closed.status, 'closed', 'answered ticket can close');
    equal(closed.adminReply, replaced.adminReply, 'closing preserves the latest reply');
    equal(closed.answeredAt, replaced.answeredAt, 'closing preserves the answer timestamp');
    await post(admin, routes.adminSupport, { id: ticket.id, action: 'reply', reply: 'Cannot reopen' }, 400);
    await post(admin, routes.adminSupport, { id: ticket.id, action: 'close' }, 400);
    equal(await ticketRow(primaryOwner, ticket.id), closed, 'closed ticket cannot be replied to or closed again');
    await activityEvent(admin, `support-${ticket.id}`, 'Support ticket closed', primaryOwner);
    const direct = await createTicket(primary, primaryOwner, 'M'.repeat(5000), 'Technical Question');
    equal(direct.category, 'Technical Question', 'technical category is preserved');
    await post(admin, routes.adminSupport, { id: direct.id, action: 'close' });
    const directClosed = await ticketRow(primaryOwner, direct.id);
    equal(directClosed.status, 'closed', 'open ticket can close without a reply');
    equal(directClosed.adminReply, null, 'direct close does not invent a reply');
    equal(directClosed.answeredAt, null, 'direct close does not invent an answer timestamp');
    await post(admin, routes.adminSupport, { id: direct.id, action: 'reply', reply: 'Cannot reopen either' }, 400);
    equal(await ticketRow(primaryOwner, direct.id), directClosed, 'directly closed ticket stays closed');
    pass();

    group = 'Fixed support categories and cross-user isolation';
    const indexed = await createTicket(primary, primaryOwner, 'Please check this test indexing issue.', 'Indexing Issue');
    equal(indexed.category, 'Indexing Issue', 'indexing category is preserved');
    const apiTicket = await createTicket(primary, primaryOwner, 'Please check this test integration.', 'API & Integration');
    equal(apiTicket.category, 'API & Integration', 'integration category is preserved');
    ids.answeredTicket = apiTicket.id;
    await post(admin, routes.adminSupport, { id: apiTicket.id, action: 'reply', reply: 'This disposable test integration has been checked.' });
    for (const category of [undefined, null, 'Not a category', 'indexing issue', {}, [], 7, true]) {
        const general = await createTicket(secondary, secondaryOwner, 'Disposable category fallback check.', category);
        equal(general.category, 'General', 'unrecognized category falls back to General');
        await post(admin, routes.adminSupport, { id: general.id, action: 'close' });
    }
    const openTicket = await createTicket(primary, primaryOwner, 'Disposable open ticket for browser review.', 'Billing & Payments');
    ids.openTicket = openTicket.id;
    for (const [client, owner] of [[primary, primaryOwner], [secondary, secondaryOwner], [admin, adminOwner]]) {
        await assertLatest(client, owner, routes.topup, 'requests', 'topupRequest');
        await assertLatest(client, owner, routes.support, 'tickets', 'supportTicket');
    }
    await activityEvent(admin, `support-${openTicket.id}`, 'Support ticket open', primaryOwner);
    pass();

    group = 'Latest-twenty user histories and bounded safe admin lists';
    // Seed only completed, old fixture history. It cannot credit balances or
    // consume pending slots, and forces both admin fifty-item limits to apply.
    const historical = Array.from({ length: 51 }, (_, index) => ({
        index, at: new Date(Date.now() - 86400000 - index * 1000),
    }));
    await prisma.topupRequest.createMany({
        data: historical.map(({ index, at }) => ({
            id: `phase5-${runId}-history-topup-${index}`, userId: primaryOwner.id,
            amount: 1, note: 'Disposable historical request', status: 'rejected',
            adminNote: 'Disposable historical rejection', reviewedAt: at, createdAt: at, updatedAt: at,
        })),
    });
    await prisma.supportTicket.createMany({
        data: historical.map(({ index, at }) => ({
            id: `phase5-${runId}-history-support-${index}`, userId: primaryOwner.id,
            category: 'General', message: 'Disposable historical support ticket',
            status: 'closed', createdAt: at, updatedAt: at,
        })),
    });
    for (const [client, owner] of [[primary, primaryOwner], [secondary, secondaryOwner]]) {
        await assertLatest(client, owner, routes.topup, 'requests', 'topupRequest');
        await assertLatest(client, owner, routes.support, 'tickets', 'supportTicket');
    }
    for (const [route, collection, fields] of [
        [routes.adminTopups, 'requests', ['id', 'name', 'email', 'balance']],
        [routes.adminSupport, 'tickets', ['id', 'name', 'email']],
    ]) {
        const data = await get(admin, route);
        const rows = data[collection];
        check(Array.isArray(rows), 'admin list is an array');
        equal(rows.length, 50, 'admin list applies its fifty-item bound');
        equal(new Set(rows.map((row) => row.id)).size, rows.length, 'admin list has unique rows');
        descending(rows, 'createdAt', 'admin list');
        for (const row of rows) {
            keys(row.user, fields, 'admin user relation is a safe projection');
            const owner = users.find((candidate) => candidate.id === row.userId);
            if (owner) {
                equal(row.user.id, owner.id, 'admin list projects the correct fixture ID');
                equal(row.user.email, owner.email, 'admin list projects the correct fixture email');
                equal(row.user.name, owner.name, 'admin list projects the correct fixture name');
                const dbRow = route === routes.adminTopups
                    ? await topupRow(owner, row.id) : await ticketRow(owner, row.id);
                const { user, ...record } = row;
                equal(record, JSON.parse(JSON.stringify(dbRow)), 'admin list reflects fixture database state');
                if (route === routes.adminTopups) equal(user.balance, (await userRow(owner)).balance, 'admin list shows current fixture balance');
            }
        }
        safeProjection(data);
    }
    pass();

    group = 'Activity summary, fixture states, and browser-ready history';
    const state = await fixtureState();
    const finalActivity = await activity(admin);
    equal(finalActivity.activity.length, 20, 'activity applies its twenty-item bound');
    // Compare API baseline plus fixture-only contributions: never query or mutate
    // real users directly. Concurrent unrelated backend writes may invalidate this
    // exact global-summary assertion, so run against a quiescent local app.
    equal(finalActivity.summary, {
        pendingTopups: baseline.pendingTopups + state.topups.filter((row) => row.status === 'pending').length,
        openTickets: baseline.openTickets + state.tickets.filter((row) => row.status === 'open').length,
        approvedCredits: baseline.approvedCredits + state.topups.filter((row) => row.status === 'approved').reduce((sum, row) => sum + row.amount, 0),
    }, 'global activity summary reflects fixture-only state changes');
    for (const event of finalActivity.activity) {
        const topup = state.topups.find((row) => event.id === `topup-${row.id}`);
        const ticket = state.tickets.find((row) => event.id === `support-${row.id}`);
        if (topup || ticket) {
            const record = topup || ticket;
            equal(event.title, topup ? `Top-up ${record.status}` : `Support ticket ${record.status}`, 'activity fixture status matches the database');
            equal(event.at, record.updatedAt.toISOString(), 'activity fixture timestamp matches the database');
        }
    }
    await activityEvent(admin, `support-${ids.openTicket}`, 'Support ticket open', primaryOwner);
    await activityEvent(admin, `support-${ids.answeredTicket}`, 'Support ticket answered', primaryOwner);
    equal((await topupRow(primaryOwner, ids.pendingTopup)).status, 'pending', 'browser fixture retains a pending top-up');
    const primaryPending = state.topups.filter((row) => row.userId === primaryOwner.id && row.status === 'pending').length;
    check(primaryPending > 0 && primaryPending < 5, 'primary browser user retains room for more top-ups');
    equal((await userRow(primaryOwner)).balance, 137, 'only the single approved request credited the primary user');
    equal((await userRow(secondaryOwner)).balance, 100, 'isolated user balance remains unchanged');
    equal((await userRow(adminOwner)).balance, 100, 'administrator balance remains unchanged');
    pass();
    return ids;
}

async function main() {
    const attempted = [];
    let runId;
    let ownsManifest = false;
    let disconnected = false;
    const onSignal = () => { stopped = true; };
    process.on('SIGINT', onSignal);
    process.on('SIGTERM', onSignal);
    try {
        check(process.env.RUN_LIVE_PHASE5_TESTS === '1', 'RUN_LIVE_PHASE5_TESTS=1 is required');
        const args = process.argv.slice(2);
        check(args.every((arg) => ['--keep-fixtures', '--cleanup'].includes(arg)), 'only --keep-fixtures or --cleanup is supported');
        check(args.length <= 1, 'fixture options are mutually exclusive and cannot repeat');
        const keep = args.includes('--keep-fixtures');
        const cleanup = args.includes('--cleanup');
        nextEnv.loadEnvConfig(projectRoot, process.env.NODE_ENV !== 'production', { info() {}, error() {}, warn() {} });
        baseUrl = localOrigin(process.env.PHASE5_BASE_URL || 'http://localhost:3210');
        check(typeof fetch === 'function' && typeof Headers.prototype.getSetCookie === 'function', 'Node must support fetch and Headers.getSetCookie');
        check(Boolean(process.env.DATABASE_URL), 'DATABASE_URL must be configured');
        const scratch = await statOrNull(scratchDirectory);
        check(!scratch || (scratch.isDirectory() && !scratch.isSymbolicLink()), 'scratch must be a real local directory');
        const existing = await statOrNull(fixtureFile);
        check(cleanup ? Boolean(existing) : !existing, cleanup
            ? 'cleanup requires an existing fixture manifest'
            : 'existing scratch/phase5-fixtures.json must be cleaned before any mutations');
        if (existing) check(existing.isFile() && !existing.isSymbolicLink(), 'fixture manifest must be a regular file');
        pass();
        prisma = new PrismaClient({ log: [], errorFormat: 'minimal' });

        if (cleanup) {
            group = 'Exact-ID retained fixture cleanup';
            checkpoint = 'read and validate fixture manifest';
            const manifest = JSON.parse(await readFile(fixtureFile, 'utf8'));
            equal(manifest.version, 1, 'supported fixture manifest version');
            equal(localOrigin(manifest.baseUrl), baseUrl, 'cleanup base URL matches the retained fixture origin');
            validateOwners(manifest.users, manifest.runId, true);
            await cleanupOwners(manifest.users, manifest.runId);
            await unlink(fixtureFile);
            pass();
            return;
        }

        group = 'Disposable fixture creation and real NextAuth credentials login';
        runId = randomBytes(8).toString('hex');
        password = randomBytes(32).toString('base64url');
        passwordHash = await bcrypt.hash(password, 10);
        users = definitions.map((definition) => ({
            id: `phase5-${runId}-${definition.key}`,
            email: `phase5-test-${runId}-${definition.key}@example.invalid`,
            name: definition.name, role: definition.role,
        }));
        validateOwners(users, runId, true);
        const collisions = await prisma.user.count({
            where: { OR: [{ id: { in: users.map((owner) => owner.id) } }, { email: { in: users.map((owner) => owner.email) } }] },
        });
        equal(collisions, 0, 'all disposable fixture identities are unused');
        for (const owner of users) {
            check(!stopped, 'run was not interrupted before fixture insertion');
            // Track the exact attempted identity BEFORE awaiting the insert, so an
            // ambiguous connection failure after commit still triggers cleanup.
            attempted.push(owner);
            checkpoint = 'insert one disposable fixture user';
            await prisma.user.create({ data: { ...owner, password: passwordHash, balance: 100 } });
            equal((await userRow(owner)).balance, 100, 'fixture starts with exactly one hundred credits');
        }
        const clients = [];
        for (const owner of users) clients.push(await login(owner));
        pass();
        const ids = await runTests(clients, runId);
        check(!stopped, 'run was not interrupted before finalization');

        if (keep) {
            group = 'Retain successful TEST-ONLY browser fixtures';
            // Finish database teardown before declaring retention successful. A
            // disconnect failure follows the same exact-ID failure cleanup path.
            checkpoint = 'disconnect before retaining successful fixtures';
            await prisma.$disconnect();
            disconnected = true;
            await mkdir(scratchDirectory, { recursive: true });
            // Exclusive creation prevents overwriting even if another run wrote a
            // manifest after preflight. A write error still cleans this run's users.
            checkpoint = 'exclusively create the ignored fixture manifest';
            const handle = await open(fixtureFile, 'wx', 0o600);
            ownsManifest = true;
            try {
                await handle.writeFile(`${JSON.stringify({
                    version: 1, runId, baseUrl, createdAt: new Date().toISOString(),
                    users: users.map((owner) => ({ ...owner, password })), ids,
                }, null, 2)}\n`, 'utf8');
            } finally {
                await handle.close();
            }
            check(!stopped, 'run was not interrupted while retaining fixtures');
            pass('All live checks; TEST-ONLY browser fixtures retained in ignored scratch/phase5-fixtures.json');
        } else {
            group = 'Exact-ID automatic fixture cleanup';
            await cleanupOwners(attempted, runId);
            pass();
            pass('All live Phase 5 checks');
        }
    } catch {
        // Never print caught errors, assertion operands, HTTP bodies, Prisma
        // diagnostics, passwords, or cookie values; they may contain secrets.
        console.error(`FAIL ${group}: ${checkpoint}`);
        process.exitCode = 1;
        if (prisma && attempted.length) {
            try {
                await cleanupOwners(attempted, runId, true);
                if (ownsManifest) await unlink(fixtureFile);
                pass('Failure cleanup removed only this run\'s disposable users');
            } catch {
                console.error('FAIL Disposable fixture cleanup; database cleanup could not be confirmed. No broad deletion was attempted.');
            }
        }
    } finally {
        if (prisma) {
            try {
                await prisma.$disconnect();
            } catch {
                process.exitCode = 1;
                console.error('FAIL Database client disconnect');
            }
        }
        process.off('SIGINT', onSignal);
        process.off('SIGTERM', onSignal);
    }
}

await main();
