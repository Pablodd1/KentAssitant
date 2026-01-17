import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
    try {
        return new PrismaClient({
            log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        })
    } catch (e) {
        console.error("Failed to initialize Prisma Client:", e);
        return undefined;
    }
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClientSingleton | undefined
}

// Only create Prisma client if DATABASE_URL is set
const createPrismaClient = () => {
    if (!process.env.DATABASE_URL) {
        console.warn('DATABASE_URL not set - running in demo mode');
        return null;
    }
    try {
        return globalForPrisma.prisma ?? prismaClientSingleton();
    } catch (e) {
         console.error("Failed to create/retrieve Prisma Client:", e);
         return null;
    }
}

export const db = createPrismaClient() as PrismaClient;

if (process.env.NODE_ENV !== 'production' && db) {
    globalForPrisma.prisma = db;
}

// Graceful connection handling - only connect if db exists
if (db) {
    // Attempt connection but don't crash if it fails
    // db.$connect is a promise, catching it prevents unhandled rejections
    db.$connect()
        .then(() => {
            console.log('Prisma Client connected successfully');
        })
        .catch((error) => {
            console.error('Prisma Client Connection Error:', error);
        });
}
