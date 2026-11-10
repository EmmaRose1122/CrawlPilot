import { createAdminClient } from "@insforge/sdk";
import { randomUUID } from "node:crypto";

let insforgeClient;

function getInsforgeClient() {
    if (!insforgeClient) {
        const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
        // Full-access admin key — server-side only. Bypasses RLS (the public
        // anon key shipped to the browser has no row access).
        const apiKey = process.env.INSFORGE_API_KEY;

        if (!baseUrl || !apiKey) {
            throw new Error("InsForge environment variables are missing");
        }

        insforgeClient = createAdminClient({
            baseUrl,
            apiKey,
            // Leave headroom for the Prisma fallback inside the function timeout.
            timeout: 5000,
        });
    }

    return insforgeClient;
}

export async function withInsforgeFallback(label, prismaLoader, insforgeLoader) {
    try {
        return await prismaLoader();
    } catch (error) {
        console.warn(`${label} Prisma read failed, using InsForge fallback:`, error.message);
        return insforgeLoader();
    }
}

export async function withPrismaFallback(label, insforgeLoader, prismaLoader) {
    try {
        return await insforgeLoader();
    } catch (error) {
        console.warn(`${label} InsForge read failed, using Prisma fallback:`, error.message);
        return prismaLoader();
    }
}

async function readTable(table, columns = "*") {
    const { data, error } = await getInsforgeClient().database
        .from(table)
        .select(columns);

    if (error) {
        throw new Error(error.message || `Failed to read ${table}`);
    }

    return data || [];
}

async function countTable(table) {
    const { count, error } = await getInsforgeClient().database
        .from(table)
        .select("*", { count: "exact", head: true });

    if (error) {
        throw new Error(error.message || `Failed to count ${table}`);
    }

    return count || 0;
}

const byNewest = (items) => [...items].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
const nowIso = () => new Date().toISOString();
const indexingResultColumns = "id,url,status,bots,userId,signalingResults,createdAt,updatedAt";

async function updateTableById(table, id, data, columns = "*") {
    const { data: updated, error } = await getInsforgeClient().database
        .from(table)
        .update({ ...data, updatedAt: nowIso() })
        .eq("id", id)
        .select(columns)
        .maybeSingle();

    if (error) {
        throw new Error(error.message || `Failed to update ${table}`);
    }

    return updated;
}

export async function readUsersFromInsforge() {
    const users = await readTable("User", "id,name,email,role,plan,allowedBots,canAddLinks,balance,createdAt");
    return byNewest(users);
}

export async function readUserByEmailFromInsforge(email, columns = "id,name,email,role,password,balance,plan,allowedBots,canAddLinks") {
    const { data, error } = await getInsforgeClient().database
        .from("User")
        .select(columns)
        .eq("email", email)
        .maybeSingle();

    if (error) {
        throw new Error(error.message || "Failed to read user by email");
    }

    return data || null;
}

export async function readUserByIdFromInsforge(id, columns = "id,name,email,role,balance,image,plan,allowedBots,canAddLinks,googleIndexingConfig") {
    const { data, error } = await getInsforgeClient().database
        .from("User")
        .select(columns)
        .eq("id", id)
        .maybeSingle();

    if (error) {
        throw new Error(error.message || "Failed to read user by id");
    }

    return data || null;
}

export async function readIndexingResultsByUserFromInsforge(userId, options = {}) {
    const buildQuery = () => {
        let query = getInsforgeClient().database
            .from("IndexingResult")
            .select(indexingResultColumns)
            .eq("userId", userId)
            .order("createdAt", { ascending: false });

        if (options.startDate) {
            query = query.gte("createdAt", options.startDate.toISOString());
        }

        return query;
    };

    const pageSize = 1000;
    const maxRows = options.take || Infinity;
    const results = [];

    while (results.length < maxRows) {
        const batchSize = Math.min(pageSize, maxRows - results.length);
        const { data, error } = await buildQuery().range(results.length, results.length + batchSize - 1);

        if (error) {
            throw new Error(error.message || "Failed to read indexing results");
        }

        const batch = data || [];
        results.push(...batch);

        if (batch.length < batchSize) {
            break;
        }
    }

    return results;
}

export async function createIndexingResultsInInsforge({ urls, bots, userId }) {
    if (!Array.isArray(urls) || urls.length === 0) {
        return [];
    }

    const timestamp = nowIso();
    const records = urls.map((url) => ({
        id: randomUUID(),
        url,
        bots: JSON.stringify(bots),
        status: "queued",
        userId,
        createdAt: timestamp,
        updatedAt: timestamp,
    }));

    const { data, error } = await getInsforgeClient().database
        .from("IndexingResult")
        .insert(records)
        .select("*");

    if (error) {
        throw new Error(error.message || "Failed to create indexing records");
    }

    return data || records;
}

export async function updateUserInInsforge(id, data, columns = "id,balance") {
    return updateTableById("User", id, data, columns);
}

export async function updateIndexingResultInInsforge(id, data, columns = "id,signalingResults") {
    return updateTableById("IndexingResult", id, data, columns);
}

export async function readBlogsFromInsforge() {
    const [blogs, users] = await Promise.all([
        readTable("Blog", "id,title,slug,category,excerpt,content,views,authorId,createdAt,updatedAt"),
        readTable("User", "id,name"),
    ]);
    const usersById = new Map(users.map((user) => [user.id, user]));

    return byNewest(blogs).map((blog) => ({
        ...blog,
        author: {
            name: usersById.get(blog.authorId)?.name || "Unknown",
        },
    }));
}

export async function readTasksFromInsforge() {
    const [tasks, submissions, users] = await Promise.all([
        readTable("Task", "id,title,description,reward,type,link,isActive,createdAt,updatedAt"),
        readTable("TaskSubmission", "id,taskId,userId,status,proofText,proofImage,adminNote,createdAt,updatedAt"),
        readTable("User", "id,name,email"),
    ]);
    const usersById = new Map(users.map((user) => [user.id, user]));
    const submissionsByTaskId = submissions.reduce((map, submission) => {
        const taskSubmissions = map.get(submission.taskId) || [];
        taskSubmissions.push({
            ...submission,
            user: usersById.get(submission.userId) || null,
        });
        map.set(submission.taskId, taskSubmissions);
        return map;
    }, new Map());

    return byNewest(tasks).map((task) => ({
        ...task,
        submissions: byNewest(submissionsByTaskId.get(task.id) || []),
    }));
}

export async function readStatsFromInsforge() {
    const [userCount, blogCount, discoveryCount] = await Promise.all([
        countTable("User"),
        countTable("Blog"),
        countTable("IndexingResult"),
    ]);

    return {
        userCount,
        blogCount,
        discoveryCount,
        totalRevenue: 0,
    };
}
