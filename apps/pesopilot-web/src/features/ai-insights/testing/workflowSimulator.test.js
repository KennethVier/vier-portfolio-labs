import { describe, expect, it } from 'vitest'
import { createWorkflowSimulator } from './workflowSimulator.js'
import { createMockProvider } from './providerMock.js'
import { createDeterministicRuntime } from './deterministicRuntime.js'
import {
  createSyntheticWorkflowInput,
  createSyntheticMemoryState,
  createSyntheticConversationContext,
} from './fixtures/syntheticFixtures.js'
import { PROVIDER_ERROR_CODES } from '../providers/providerErrors.js'

describe('Phase 11B.9 — Workflow Simulator', () => {
  it('executes successful synchronous workflow with real Prompt Builder and mock provider', async () => {
    const provider = createMockProvider({
      generateScript: ['Your net savings of P5,000 indicates a healthy cash position.'],
    })
    const simulator = createWorkflowSimulator({ provider })

    const input = createSyntheticWorkflowInput()
    const result = await simulator.runSync(input)

    expect(result.error).toBeNull()
    expect(result.workflow.status).toBe('succeeded')
    expect(result.response.content).toContain('P5,000')
    expect(result.providerCalls.length).toBe(1)
    expect(result.auditEvents.length).toBe(0)
  })

  it('propagates ConversationContext through real Prompt Builder to provider request', async () => {
    const provider = createMockProvider({
      generateScript: ['Responding to your savings question.'],
    })
    const simulator = createWorkflowSimulator({ provider })

    const input = createSyntheticWorkflowInput({
      conversationContext: createSyntheticConversationContext({
        topic: { current: 'savings' },
        recentMessages: [{ role: 'user', content: 'What is my savings status?' }],
      }),
    })

    const result = await simulator.runSync(input)
    expect(result.workflow.status).toBe('succeeded')

    const capturedPrompt = provider.getLastCall().request.prompt.user
    expect(capturedPrompt).toContain('savings')
  })

  it('retrieves memory through real Memory Service when memoryState is provided', async () => {
    const provider = createMockProvider({
      generateScript: ['Explanation tailored to user preferences.'],
    })
    const simulator = createWorkflowSimulator({ provider })

    const input = createSyntheticWorkflowInput({
      memoryState: createSyntheticMemoryState(),
    })

    const result = await simulator.runSync(input)
    expect(result.workflow.status).toBe('succeeded')

    const capturedPrompt = provider.getLastCall().request.prompt.user
    expect(capturedPrompt).toContain('coaching_preference')
  })

  it('executes deterministic retry on retryable provider failure and recovers', async () => {
    const provider = createMockProvider({
      generateScript: [
        { errorCode: PROVIDER_ERROR_CODES.PROVIDER_UNAVAILABLE, message: 'Temporary glitch.' },
        'Successful explanation after retry.',
      ],
    })
    const simulator = createWorkflowSimulator({ provider })

    const input = createSyntheticWorkflowInput()
    const result = await simulator.runSync(input)

    expect(result.workflow.status).toBe('succeeded')
    expect(result.workflow.attempt).toBe(2)
    expect(result.providerCalls.length).toBe(2)
    expect(result.response.content).toBe('Successful explanation after retry.')
  })

  it('triggers real Response Guardrail rejection on prohibited action claim', async () => {
    const provider = createMockProvider({
      generateScript: ['I have transferred your funds to the savings account.'],
    })
    const simulator = createWorkflowSimulator({ provider })

    const input = createSyntheticWorkflowInput()
    const result = await simulator.runSync(input)

    expect(result.workflow.status).toBe('failed')
    expect(result.response).toBeNull()
    expect(result.error.code).toBe('GUARDRAIL_REJECTED')
    expect(result.auditEvents.length).toBeGreaterThan(0)
    expect(result.auditEvents[0].decision).toBe('reject')
  })

  it('handles timeout deterministically without real wall-clock delays', async () => {
    const runtime = createDeterministicRuntime()
    // Provider advances timer beyond timeout threshold (30000ms)
    const provider = createMockProvider({
      generateScript: [
        () => {
          runtime.timer.advanceTime(35000)
          const err = new Error('Execution delayed past deadline.')
          err.code = 'TRANSPORT_TIMEOUT'
          throw err
        },
      ],
    })

    const simulator = createWorkflowSimulator({
      provider,
      clock: runtime.clock,
      timer: runtime.timer,
      idGenerator: runtime.idGenerator,
      workflowTimeoutMs: 30000,
    })

    const input = createSyntheticWorkflowInput()
    const result = await simulator.runSync(input)

    expect(result.workflow.status).toBe('timed_out')
    expect(result.error.code).toBe('WORKFLOW_TIMEOUT')
  })

  it('executes streaming workflow with ordered chunk publication via Safe Publication Gate', async () => {
    const provider = createMockProvider({
      streamScript: [
        [
          { textFragment: 'Fragment A. ', done: false },
          { textFragment: 'Fragment B. ', done: false },
          { textFragment: 'Fragment C.', done: true },
        ],
      ],
    })
    const simulator = createWorkflowSimulator({ provider })

    const input = createSyntheticWorkflowInput()
    const result = await simulator.runStreaming(input)

    expect(result.workflow.status).toBe('succeeded')
    expect(result.chunks.length).toBeGreaterThan(0)
    expect(result.events.length).toBeGreaterThan(0)

    const joined = result.chunks.map((c) => c.content).join('')
    expect(joined).toBe('Fragment A. Fragment B. Fragment C.')
  })

  it('streaming guardrail rejection prevents leaking chunks through Safe Publication Gate', async () => {
    const provider = createMockProvider({
      streamScript: [
        [
          { textFragment: 'Guaranteed 100% return on your money ', done: false },
          { textFragment: 'with zero risk to all funds.', done: true },
        ],
      ],
    })
    const simulator = createWorkflowSimulator({ provider })

    const input = createSyntheticWorkflowInput()
    const result = await simulator.runStreaming(input)

    expect(result.workflow.status).toBe('failed')
    expect(result.chunks.length).toBe(0) // Zero chunks leaked!
    expect(result.auditEvents.length).toBeGreaterThan(0)
  })

  it('proves scripted provider fragments -> real executeStreamingWorkflow() -> real StreamManager receives textFragment -> reconstructed ProviderResponse.content exactly equals concatenated fragments', async () => {
    const rawFragments = ['Net savings ', 'remain strong. ', 'Automate reserve allocation.']
    const expectedConcatenated = rawFragments.join('')

    const provider = createMockProvider({
      streamScript: [
        [
          { textFragment: rawFragments[0], done: false },
          { textFragment: rawFragments[1], done: false },
          { textFragment: rawFragments[2], done: true },
        ],
      ],
    })
    const simulator = createWorkflowSimulator({ provider })

    const input = createSyntheticWorkflowInput()
    const result = await simulator.runStreaming(input)

    expect(result.workflow.status).toBe('succeeded')
    expect(result.response).not.toBeNull()
    // Reconstructed ProviderResponse content matches concatenated fragment textFragment values
    expect(result.response.content).toBe(expectedConcatenated)
    // StreamManager buffer length matches concatenated length
    expect(result.response.content.length).toBe(expectedConcatenated.length)
  })
})

