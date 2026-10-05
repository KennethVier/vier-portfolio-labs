import { describe, expect, it } from 'vitest'
import { createPromptSimulator } from './promptSimulator.js'
import {
  createSyntheticFinancialSummary,
  createSyntheticInsightBundle,
  createSyntheticRecommendationBundle,
  createSyntheticConversationContext,
  createSyntheticMemoryState,
} from './fixtures/syntheticFixtures.js'
import { memoryService } from '../memory/memoryService.js'

describe('Phase 11B.9 — Prompt Simulator', () => {
  it('executes real Prompt Builder and returns valid PromptPackage DTO', () => {
    const simulator = createPromptSimulator()

    const financialSummary = createSyntheticFinancialSummary()
    const insightBundle = createSyntheticInsightBundle()
    const recommendationBundle = createSyntheticRecommendationBundle()

    const result = simulator.simulatePrompt({
      financialSummary,
      insightBundle,
      recommendationBundle,
    })

    expect(result.validation.valid).toBe(true)
    expect(result.promptPackage.version).toBe('1.0.0')
    expect(result.promptPackage.template.id).toBe('financial-summary-explanation')
    expect(result.systemPrompt).toContain('Do not invent')
    expect(result.userPrompt).toContain('P5,000')
  })

  it('includes conversation context and memory context in prompt assembly', () => {
    const simulator = createPromptSimulator()

    const financialSummary = createSyntheticFinancialSummary()
    const insightBundle = createSyntheticInsightBundle()
    const recommendationBundle = createSyntheticRecommendationBundle()
    const conversationContext = createSyntheticConversationContext({
      topic: { current: 'savings' },
      recentMessages: [{ role: 'user', content: 'Tell me about my emergency fund.' }],
    })

    const memoryState = createSyntheticMemoryState()
    const memoryContext = memoryService.retrieveContext({
      memoryDto: memoryState,
      query: { workflowType: 'financial-summary-explanation', topic: 'savings' },
    })

    const result = simulator.simulatePrompt({
      financialSummary,
      insightBundle,
      recommendationBundle,
      conversationContext,
      memoryContext,
    })

    expect(result.validation.valid).toBe(true)
    expect(result.userPrompt).toContain('emergency fund')
    expect(result.userPrompt).toContain('coaching_preference')
  })

  it('preserves input immutability and generates identical packages for identical inputs', () => {
    const simulator = createPromptSimulator()

    const financialSummary = createSyntheticFinancialSummary()
    const insightBundle = createSyntheticInsightBundle()
    const recommendationBundle = createSyntheticRecommendationBundle()

    const snapshot = JSON.stringify({ financialSummary, insightBundle, recommendationBundle })

    const result1 = simulator.simulatePrompt({
      financialSummary,
      insightBundle,
      recommendationBundle,
    })

    const result2 = simulator.simulatePrompt({
      financialSummary,
      insightBundle,
      recommendationBundle,
    })

    expect(JSON.stringify({ financialSummary, insightBundle, recommendationBundle })).toBe(snapshot)
    expect(result1.systemPrompt).toBe(result2.systemPrompt)
    expect(result1.userPrompt).toBe(result2.userPrompt)
  })
})
