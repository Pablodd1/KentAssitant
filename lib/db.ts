import { PrismaClient } from '@prisma/client'

/**
 * Prisma Client Singleton for Database Connection
 * Optimized for serverless environments (Vercel, AWS Lambda)
 */

const prismaClientSingleton = () => {
    return new PrismaClient({
        log: process.env.NODE_ENV === 'development' 
            ? ['error', 'warn'] // Reduced logging for performance
            : ['error'],
        // Connection pool settings for serverless
        datasources: {
            db: {
                url: process.env.DATABASE_URL
            }
        }
    })
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClientSingleton | undefined
    dbConnected: boolean
}

// Only create Prisma client if DATABASE_URL is set
const createPrismaClient = (): PrismaClient | null => {
    if (!process.env.DATABASE_URL) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn('DATABASE_URL not set - running in demo mode');
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
