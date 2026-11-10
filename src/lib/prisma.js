import { PrismaClient } from '@prisma/client'

const globalForPrisma = global;

// Serverless instances each keep their own pool; the default pool can exhaust
// the database's connection limit during bursts of cold starts.
function withServerlessPooling(url) {
    if (!url || !process.env.VERCEL) return url;
    try {
        const parsed = new URL(url);
        if (!parsed.searchParams.has('connection_limit')) {
            parsed.searchParams.set('connection_limit', '1');
        }
        if (!parsed.searchParams.has('pool_timeout')) {
            parsed.searchParams.set('pool_timeout', '20');
        }
        return parsed.toString();
    } catch {
        return url;
    }
}

const datasourceUrl = withServerlessPooling(process.env.DATABASE_URL);

export const prisma = globalForPrisma.prisma || new PrismaClient(
    datasourceUrl ? { datasources: { db: { url: datasourceUrl } } } : undefined
);

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
