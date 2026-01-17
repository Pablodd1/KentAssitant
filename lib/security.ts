import { z } from 'zod';

// Case ID validation - UUID format
export const caseIdSchema = z.string().uuid({ message: "Invalid case ID format" });

// File upload validation
export const fileUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string(),
  size: z.number().min(0).max(50 * 1024 * 1024), // Max 50MB
});

// Sanitize input to prevent XSS
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

// Validate and sanitize case code format
export function sanitizeCaseCode(code: string): string {
  return code
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '')
    .slice(0, 20);
}

// Validate API response structure
export function validateApiResponse<T>(
  data: unknown,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return { 
    success: false, 
    error: `Validation error: ${result.error.errors.map(e => e.message).join(', ')}` 
  };
}

// Rate limiting helper (simple in-memory implementation)
// In production, use Redis or similar
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000 // 1 minute
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);
  
  if (!record || now > record.resetTime) {
    // First request or window expired
    rateLimitStore.set(identifier, { 
      count: 1, 
      resetTime: now + windowMs 
    });
    return { allowed: true, remaining: maxRequests - 1, resetTime: now + windowMs };
  }
  
  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }
  
  record.count++;
  return { allowed: true, remaining: maxRequests - record.count, resetTime: record.resetTime };
}

// Audit logging for HIPAA compliance
export interface AuditLogEntry {
  timestamp: string;
  action: string;
  userId?: string;
  caseId?: string;
  resourceType: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failure' | 'warning';
  errorMessage?: string;
  details?: any;
}

const auditLogs: AuditLogEntry[] = [];

export function logAuditEvent(entry: Omit<AuditLogEntry, 'timestamp'>): void {
  const logEntry: AuditLogEntry = {
    timestamp: new Date().toISOString(),
    ...entry
  };
  
  // In production, send to secure logging service
  auditLogs.push(logEntry);
  
  // Log to console in development
  if (process.env.NODE_ENV !== 'production') {
    console.log('[AUDIT]', JSON.stringify(logEntry));
  }
}

// Get recent audit logs (for admin review)
export function getAuditLogs(filters?: Partial<AuditLogEntry>): AuditLogEntry[] {
  let logs = [...auditLogs];
  
  if (filters?.caseId) {
    logs = logs.filter(l => l.caseId === filters.caseId);
  }
  if (filters?.userId) {
    logs = logs.filter(l => l.userId === filters.userId);
  }
  if (filters?.action) {
    logs = logs.filter(l => l.action === filters.action);
  }
  
  return logs.slice(-100); // Return last 100 entries
}

// Export for external logging service integration
export { auditLogs };
