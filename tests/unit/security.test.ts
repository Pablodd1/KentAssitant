import { describe, it, expect, beforeEach } from 'vitest'
import { 
    sanitizeInput, 
    sanitizeCaseCode, 
    checkRateLimit, 
    validateCaseId,
    caseIdSchema,
    fileIdSchema
} from '@/lib/security'

describe('Security Utilities', () => {
    describe('sanitizeInput', () => {
        it('should remove angle brackets', () => {
            expect(sanitizeInput('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script')
        })

        it('should remove javascript: protocol', () => {
            expect(sanitizeInput('javascript:alert(1)')).toBe('alert(1)')
        })

        it('should remove event handlers', () => {
            expect(sanitizeInput('onclick=alert(1)')).toBe('alert(1)')
        })

        it('should remove data: protocol', () => {
            expect(sanitizeInput('data:text/html,<script>')).toBe('text/html,script')
        })

        it('should trim whitespace', () => {
            expect(sanitizeInput('  hello world  ')).toBe('hello world')
        })

        it('should handle non-string input', () => {
            expect(sanitizeInput(123 as any)).toBe(123)
        })
    })

    describe('sanitizeCaseCode', () => {
        it('should uppercase case codes', () => {
            expect(sanitizeCaseCode('awm-2025-0001')).toBe('AWM-2025-0001')
        })

        it('should remove invalid characters', () => {
            expect(sanitizeCaseCode('AWM@2025!0001')).toBe('AWM20250001')
        })

        it('should truncate long codes', () => {
            const longCode = 'A'.repeat(30)
            expect(sanitizeCaseCode(longCode).length).toBe(20)
        })
    })

    describe('validateCaseId', () => {
        it('should validate UUID format', () => {
            const result = validateCaseId('123e4567-e89b-12d3-a456-426614174000')
            expect(result.valid).toBe(true)
        })

        it('should validate demo case format', () => {
            const result = validateCaseId('case-1234567890')
            expect(result.valid).toBe(true)
        })

        it('should reject null', () => {
            const result = validateCaseId(null)
            expect(result.valid).toBe(false)
        })

        it('should reject undefined', () => {
            const result = validateCaseId(undefined)
            expect(result.valid).toBe(false)
        })
    })

    describe('caseIdSchema', () => {
        it('should accept valid UUID', () => {
            const result = caseIdSchema.safeParse('123e4567-e89b-12d3-a456-426614174000')
            expect(result.success).toBe(true)
        })

        it('should accept demo case format', () => {
            const result = caseIdSchema.safeParse('case-1234567890')
            expect(result.success).toBe(true)
        })

        it('should reject invalid format', () => {
            const result = caseIdSchema.safeParse('invalid')
            expect(result.success).toBe(false)
        })
    })

    describe('fileIdSchema', () => {
        it('should accept valid UUID', () => {
            const result = fileIdSchema.safeParse('123e4567-e89b-12d3-a456-426614174000')
            expect(result.success).toBe(true)
        })

        it('should accept demo file format', () => {
            const result = fileIdSchema.safeParse('demo-file-1234567890')
            expect(result.success).toBe(true)
        })
    })

    describe('checkRateLimit', () => {
        beforeEach(() => {
            // Reset rate limit state between tests by using unique identifiers
        })

        it('should allow requests within limit', () => {
            const identifier = `test-${Date.now()}-1`
            const result = checkRateLimit(identifier, 5, 60000)
            expect(result.allowed).toBe(true)
            expect(result.remaining).toBe(4)
        })

        it('should track remaining requests', () => {
            const identifier = `test-${Date.now()}-2`
            checkRateLimit(identifier, 5, 60000)
            const result = checkRateLimit(identifier, 5, 60000)
            expect(result.remaining).toBe(3)
        })

        it('should block when limit exceeded', () => {
            const identifier = `test-${Date.now()}-3`
            // Exhaust the limit
            for (let i = 0; i < 5; i++) {
                checkRateLimit(identifier, 5, 60000)
            }
            const result = checkRateLimit(identifier, 5, 60000)
            expect(result.allowed).toBe(false)
            expect(result.remaining).toBe(0)
        })
    })
})
