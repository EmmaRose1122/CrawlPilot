const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
    // Admin from .env (Master Access) — required, no default credentials
    const masterAdminEmail = process.env.ADMIN_EMAIL;
    const masterAdminPass = process.env.ADMIN_PASSWORD;

    if (!masterAdminEmail || !masterAdminPass) {
        throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in the environment before seeding');
    }

    const adminPassword = await bcrypt.hash(masterAdminPass, 10)

    const admin = await prisma.user.upsert({
        where: { email: masterAdminEmail },
        update: { password: adminPassword, role: 'ADMIN' },
        create: {
            email: masterAdminEmail,
            name: 'Master Admin',
            password: adminPassword,
            role: 'ADMIN',
            balance: 1000000
        },
    })

    // Create a mock blog for the admin
    await prisma.blog.upsert({
        where: { slug: 'welcome-to-crawlpilot' },
        update: {},
        create: {
            title: 'Welcome to Crawl Pilot',
            slug: 'welcome-to-crawlpilot',
            category: 'Engineering',
            excerpt: 'The fastest path to search indexing starts here.',
            content: '<h1>Hello!</h1><p>Our engineering team is dedicated to providing real-time indexing solutions for SEO masters.</p>',
            authorId: admin.id
        }
    })

    console.log({ admin, blogsCreated: 1 })
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
