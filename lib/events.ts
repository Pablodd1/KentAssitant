import { EventEmitter } from 'events';

// Use a global variable to ensure singleton across hot-reloads in dev
const globalForEvents = global as unknown as { eventEmitter: EventEmitter };

// Note: This in-memory EventEmitter works for single-instance deployments (e.g. VPS, local dev).
// For serverless (Vercel) or clustered environments, replace this with Redis Pub/Sub or similar.
export const eventEmitter = globalForEvents.eventEmitter || new EventEmitter();

if (process.env.NODE_ENV !== 'production') globalForEvents.eventEmitter = eventEmitter;
