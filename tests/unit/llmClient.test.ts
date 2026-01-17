import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getLLMProviderInfo } from '@/lib/llmClient'

describe('LLM Client', () => {
    const originalEnv = process.env

    beforeEach(() => {
        vi.resetModules()
        process.env = { ...originalEnv }
    })

    afterEach(() => {
        process.env = originalEnv
    })

    describe('getLLMProviderInfo', () => {
        it('should return gemini when GEMINI_API_KEY is set', async () => {
            process.env.GEMINI_API_KEY = 'test-gemini-key'
            delete process.env.OPENAI_API_KEY
            
            // Re-import to pick up new env
            const { getLLMProviderInfo: freshGetInfo } = await import('@/lib/llmClient')
            const info = freshGetInfo()
            
            expect(info.provider).toBe('gemini')
            expect(info.model).toBe('gemini-1.5-pro')
        })

        it('should return openai when only OPENAI_API_KEY is set', async () => {
            delete process.env.GEMINI_API_KEY
            process.env.OPENAI_API_KEY = 'test-openai-key'
            
            const { getLLMProviderInfo: freshGetInfo } = await import('@/lib/llmClient')
            const info = freshGetInfo()
            
            expect(info.provider).toBe('openai')
            expect(info.model).toBe('gpt-4o')
        })

        it('should prefer gemini over openai when both are set', async () => {
            process.env.GEMINI_API_KEY = 'test-gemini-key'
            process.env.OPENAI_API_KEY = 'test-openai-key'
            
            const { getLLMProviderInfo: freshGetInfo } = await import('@/lib/llmClient')
            const info = freshGetInfo()
            
            expect(info.provider).toBe('gemini')
        })

        it('should return none when no API keys are set', async () => {
            delete process.env.GEMINI_API_KEY
            delete process.env.OPENAI_API_KEY
            
            const { getLLMProviderInfo: freshGetInfo } = await import('@/lib/llmClient')
            const info = freshGetInfo()
            
            expect(info.provider).toBe('none')
            expect(info.model).toBe('none')
        })
    })
})
