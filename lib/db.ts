import { PrismaClient } from '@prisma/client'

/**
 * Prisma Client Singleton for Database Connection
 * Optimized for serverless environments (Vercel, AWS Lambda)
 */

// Support multiple database URL environment variable names
// Neon uses POSTGRES_URL, standard is DATABASE_URL
const getDatabaseUrl = (): string | undefined => {
    return process.env.DATABASE_URL 
        || process.env.POSTGRES_URL 
        || process.env.POSTGRES_PRISMA_URL
        || process.env.DATABASE_URL_UNPOOLED;
}

const prismaClientSingleton = () => {
    const dbUrl = getDatabaseUrl();
    return new PrismaClient({
        log: process.env.NODE_ENV === 'development' 
            ? ['error', 'warn'] // Reduced logging for performance
            : ['error'],
        // Connection pool settings for serverless
        datasources: {
            db: {
                url: dbUrl
            }
        }
    })
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClientSingleton | undefined
    dbConnected: boolean
}

// Only create Prisma client if a database URL is set
const createPrismaClient = (): PrismaClient | null => {
    const dbUrl = getDatabaseUrl();
    if (!dbUrl) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn('No database URL set (DATABASE_URL, POSTGRES_URL, etc.) - running in demo mode');
        }
        return null;
    }
    return globalForPrisma.prisma ?? prismaClientSingleton();
}

export const db = createPrismaClient() as PrismaClient;

// Cache in global for hot reload in development
if (process.env.NODE_ENV !== 'production' && db) {
    globalForPrisma.prisma = db;
}

// Lazy connection - only connect on first query (Prisma handles this automatically)
// We removed the eager $connect() call for better serverless performance

/**
 * Check if database is available
 */
export async function isDatabaseAvailable(): Promise<boolean> {
    if (!db) return false;
    try {
        await db.$queryRaw`SELECT 1`;
        return true;
    } catch {
        return false;
    }
}

/**
 * Graceful shutdown for the database connection
 */
export async function disconnectDatabase(): Promise<void> {
    if (db) {
        await db.$disconnect();
    }
}
