import { describe, it, expect } from 'vitest'
import { generateClinicalPrompt } from '@/lib/clinicalPrompt'

describe('Clinical Prompt Generator', () => {
    describe('generateClinicalPrompt', () => {
        it('should include case code in prompt', () => {
            const context = {
                caseCode: 'AWM-2025-0001',
                rawDocuments: 'Test document content',
                activeTranscripts: 'Test transcript',
                timestamp: new Date().toISOString()
            }
            
            const prompt = generateClinicalPrompt(context)
            
            expect(prompt).toContain('AWM-2025-0001')
        })

        it('should include documents section', () => {
            const context = {
                caseCode: 'TEST-001',
                rawDocuments: 'Lab results: Blood glucose 120 mg/dL',
                activeTranscripts: '',
                timestamp: new Date().toISOString()
            }
            
            const prompt = generateClinicalPrompt(context)
            
            expect(prompt).toContain('DOCUMENTS:')
            expect(prompt).toContain('Lab results: Blood glucose 120 mg/dL')
        })

        it('should include transcripts section', () => {
            const context = {
                caseCode: 'TEST-001',
                rawDocuments: '',
                activeTranscripts: 'Patient reports mild headache',
                timestamp: new Date().toISOString()
            }
            
            const prompt = generateClinicalPrompt(context)
            
            expect(prompt).toContain('TRANSCRIPTS:')
            expect(prompt).toContain('Patient reports mild headache')
        })

        it('should include output schema', () => {
            const context = {
                caseCode: 'TEST-001',
                rawDocuments: '',
                activeTranscripts: '',
                timestamp: new Date().toISOString()
            }
            
            const prompt = generateClinicalPrompt(context)
            
            expect(prompt).toContain('OUTPUT SCHEMA')
            expect(prompt).toContain('executiveSummary')
            expect(prompt).toContain('abnormalFindings')
            expect(prompt).toContain('medicationImpacts')
        })

        it('should include clinical rules', () => {
            const context = {
                caseCode: 'TEST-001',
                rawDocuments: '',
                activeTranscripts: '',
                timestamp: new Date().toISOString()
            }
            
            const prompt = generateClinicalPrompt(context)
            
            expect(prompt).toContain('RULES & BEHAVIOR')
            expect(prompt).toContain('DATA SOURCES')
            expect(prompt).toContain('REFERENCE RANGES')
        })

        it('should mention provider-only output', () => {
            const context = {
                caseCode: 'TEST-001',
                rawDocuments: '',
                activeTranscripts: '',
                timestamp: new Date().toISOString()
            }
            
            const prompt = generateClinicalPrompt(context)
            
            expect(prompt).toContain('doctors only')
            expect(prompt).toContain('not patients')
        })
    })
})
