import { describe, expect, it } from 'vitest'
import { runRegressionSuite } from './regressionRunner.js'
import { goldenScenarios, GOLDEN_SCENARIO_IDS } from './scenarios/goldenScenarios.js'
import * as productionAiInsights from '../index.js'

describe('Phase 11B.9 — Integrated AI Regression Suite', () => {
  it('executes full curated golden scenarios suite and proves all architectural invariants pass', async () => {
    const report = await runRegressionSuite({ scenarios: goldenScenarios })

    expect(report.version).toBe('1.0.0')
    expect(report.total).toBe(goldenScenarios.length)
    expect(report.failed).toBe(0)
    expect(report.passed).toBe(goldenScenarios.length)

    // Detailed verification of specific high-value scenario results
    const syncSuccess = report.results.find((r) => r.scenarioId === GOLDEN_SCENARIO_IDS.SYNC_SUCCESS)
    expect(syncSuccess.status).toBe('passed')

    const responseGuardrail = report.results.find((r) => r.scenarioId === GOLDEN_SCENARIO_IDS.RESPONSE_GUARDRAIL_REJECTION)
    expect(responseGuardrail.status).toBe('passed')

    const financialGuidance = report.results.find((r) => r.scenarioId === GOLDEN_SCENARIO_IDS.FINANCIAL_GUIDANCE_REJECTION)
    expect(financialGuidance.status).toBe('passed')

    const retryRecovery = report.results.find((r) => r.scenarioId === GOLDEN_SCENARIO_IDS.PROVIDER_RETRY_RECOVERY)
    expect(retryRecovery.status).toBe('passed')

    const streamingGate = report.results.find((r) => r.scenarioId === GOLDEN_SCENARIO_IDS.STREAMING_SAFE_GATE)
    expect(streamingGate.status).toBe('passed')

    const streamingRejection = report.results.find((r) => r.scenarioId === GOLDEN_SCENARIO_IDS.STREAMING_GUARDRAIL_REJECTION)
    expect(streamingRejection.status).toBe('passed')
  })

  it('guarantees diagnostic privacy: report excludes raw prompts, generated content, and credentials', async () => {
    const report = await runRegressionSuite({ scenarios: goldenScenarios })
    const serializedReport = JSON.stringify(report)

    // Ensure raw system instructions, sensitive keys, or fixture values are NOT exposed in summary report
    expect(serializedReport).not.toContain('DO NOT invent missing financial information')
    expect(serializedReport).not.toContain('apiKey')
    expect(serializedReport).not.toContain('password')
    expect(serializedReport).not.toContain('stack')
  })

  it('verifies production AI facade does not expose test harness exports', () => {
    expect(productionAiInsights.aiGateway).toBeDefined()
    expect(productionAiInsights.promptBuilder).toBeDefined()
    expect(productionAiInsights.conversationEngine).toBeDefined()
    expect(productionAiInsights.providerLayer).toBeDefined()
    expect(productionAiInsights.guardrailEngine).toBeDefined()
    expect(productionAiInsights.aiOrchestrator).toBeDefined()
    expect(productionAiInsights.memoryService).toBeDefined()
    expect(productionAiInsights.streamingEngine).toBeDefined()

    // Test harness must NOT be exported from production facade
    expect(productionAiInsights.createMockProvider).toBeUndefined()
    expect(productionAiInsights.createWorkflowSimulator).toBeUndefined()
    expect(productionAiInsights.createPromptSimulator).toBeUndefined()
    expect(productionAiInsights.createConversationSimulator).toBeUndefined()
    expect(productionAiInsights.createMemorySimulator).toBeUndefined()
    expect(productionAiInsights.runRegressionSuite).toBeUndefined()
  })
})
