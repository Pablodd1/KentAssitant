import { describe, it, expect, beforeEach } from 'vitest'
import {
    getDemoCases,
    getDemoCase,
    addDemoCase,
    updateDemoCase,
    deleteDemoCase,
    getDemoAnalysis,
    addFileToDemoCase,
    generateDemoCaseId,
    generateDemoCaseCode,
    isDemoMode
} from '@/lib/demoData'

describe('Demo Data Management', () => {
    describe('isDemoMode', () => {
        it('should return true when DATABASE_URL is not set', () => {
            expect(isDemoMode).toBe(true)
        })
    })

    describe('getDemoCases', () => {
        it('should return an array of cases', () => {
            const cases = getDemoCases()
            expect(Array.isArray(cases)).toBe(true)
            expect(cases.length).toBeGreaterThan(0)
        })

        it('should include sample cases', () => {
            const cases = getDemoCases()
            const caseIds = cases.map(c => c.id)
            expect(caseIds).toContain('case-001')
        })
    })

    describe('getDemoCase', () => {
        it('should return existing case by id', () => {
            const kase = getDemoCase('case-001')
            expect(kase).toBeDefined()
            expect(kase?.caseCode).toBe('AWM-2025-0001')
        })

        it('should return undefined for non-existent case', () => {
            const kase = getDemoCase('non-existent-id')
            expect(kase).toBeUndefined()
        })

        it('should create dynamic case for matching pattern', () => {
            const kase = getDemoCase('case-9999999999')
            expect(kase).toBeDefined()
            expect(kase?.id).toBe('case-9999999999')
        })
    })

    describe('addDemoCase', () => {
        it('should add a new case to the beginning of the list', () => {
            const newCase = {
                id: 'test-case-' + Date.now(),
                caseCode: 'TEST-001',
                status: 'DRAFT',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                files: []
            }
            
            addDemoCase(newCase)
            const cases = getDemoCases()
            
            expect(cases[0].id).toBe(newCase.id)
        })
    })

    describe('updateDemoCase', () => {
        it('should update an existing case', () => {
            const updated = updateDemoCase('case-001', { status: 'COMPLETED' })
            expect(updated?.status).toBe('COMPLETED')
        })

        it('should return undefined for non-existent case', () => {
            const updated = updateDemoCase('non-existent', { status: 'COMPLETED' })
            expect(updated).toBeUndefined()
        })
    })

    describe('deleteDemoCase', () => {
        it('should delete an existing case', () => {
            // First add a case to delete
            const testCase = {
                id: 'delete-test-' + Date.now(),
                caseCode: 'DELETE-001',
                status: 'DRAFT',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                files: []
            }
            addDemoCase(testCase)
            
            const result = deleteDemoCase(testCase.id)
            expect(result).toBe(true)
            
            const deleted = getDemoCase(testCase.id)
            expect(deleted).toBeUndefined()
        })

        it('should return false for non-existent case', () => {
            const result = deleteDemoCase('non-existent-case-id')
            expect(result).toBe(false)
        })
    })

    describe('getDemoAnalysis', () => {
        it('should return analysis for existing case', () => {
            const analysis = getDemoAnalysis('case-001')
            expect(analysis).toBeDefined()
            expect(analysis.executiveSummary).toBeDefined()
        })

        it('should return default analysis for unknown case', () => {
            const analysis = getDemoAnalysis('unknown-case')
            expect(analysis).toBeDefined()
            expect(analysis.executiveSummary).toContain('New patient case')
        })
    })

    describe('addFileToDemoCase', () => {
        it('should add file to existing case', () => {
            const file = {
                id: 'test-file-' + Date.now(),
                filename: 'test.pdf',
                mimeType: 'application/pdf',
                size: 1000,
                status: 'READY'
            }
            
            const result = addFileToDemoCase('case-002', file)
            expect(result).toBe(true)
            
            const kase = getDemoCase('case-002')
            expect(kase?.files.some(f => f.id === file.id)).toBe(true)
        })

        it('should return false for non-existent case', () => {
            const file = {
                id: 'test-file',
                filename: 'test.pdf',
                mimeType: 'application/pdf',
                size: 1000,
                status: 'READY'
            }
            
            const result = addFileToDemoCase('non-existent', file)
            expect(result).toBe(false)
        })
    })

    describe('generateDemoCaseId', () => {
        it('should generate case IDs with correct format', () => {
            const id1 = generateDemoCaseId()
            
            expect(id1).toMatch(/^case-\d+-[a-z0-9]+$/)
            expect(id1.startsWith('case-')).toBe(true)
        })

        it('should generate unique case IDs', () => {
            const id1 = generateDemoCaseId()
            const id2 = generateDemoCaseId()
            
            expect(id1).not.toBe(id2)
        })
    })

    describe('generateDemoCaseCode', () => {
        it('should generate case code with current year', () => {
            const code = generateDemoCaseCode()
            const year = new Date().getFullYear()
            
            expect(code).toContain(`AWM-${year}`)
        })
    })
})
