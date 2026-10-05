import { createRegressionScenario } from '../regressionScenario.js'
import {
  createSyntheticConversationContext,
  createSyntheticMemoryState,
  createSyntheticWorkflowInput,
} from '../fixtures/syntheticFixtures.js'
import { PROVIDER_ERROR_CODES } from '../../providers/providerErrors.js'

export const GOLDEN_SCENARIO_IDS = Object.freeze({
  SYNC_SUCCESS: 'golden-01-sync-success',
  RESPONSE_GUARDRAIL_REJECTION: 'golden-02-response-guardrail-rejection',
  FINANCIAL_GUIDANCE_REJECTION: 'golden-03-financial-guidance-rejection',
  PROVIDER_RETRY_RECOVERY: 'golden-04-provider-retry-recovery',
  MEMORY_BOUNDS_RETRIEVAL: 'golden-05-memory-bounds-retrieval',
  CONVERSATION_PROPAGATION: 'golden-06-conversation-propagation',
  STREAMING_SAFE_GATE: 'golden-07-streaming-safe-gate',
  STREAMING_GUARDRAIL_REJECTION: 'golden-08-streaming-guardrail-rejection',
})

export function createGoldenScenarios() {
  const baseInput = createSyntheticWorkflowInput()

  return Object.freeze([
    // 1. Successful synchronous financial explanation
    createRegressionScenario({
      id: GOLDEN_SCENARIO_IDS.SYNC_SUCCESS,
      name: 'Successful Synchronous Financial Explanation',
      mode: 'sync',
      description: 'Valid financial context yields successful explanation without mutating inputs.',
      input: baseInput,
      providerScript: {
        generateScript: [
          'Based on your financial summary, your net savings of P5,000 indicates a healthy cash position. Continue automating transfers.',
        ],
      },
      invariants: [
        {
          id: 'TERMINAL_STATUS_SUCCEEDED',
          code: 'STATUS_NOT_SUCCEEDED',
          name: 'Workflow terminal status must be succeeded',
          check: (sim) => sim.workflow?.status === 'succeeded',
        },
        {
          id: 'RESPONSE_DELIVERED',
          code: 'RESPONSE_MISSING',
          name: 'ProviderResponse must be returned with non-empty content',
          check: (sim) => Boolean(sim.response?.content && sim.response.content.length > 0),
        },
        {
          id: 'PROVIDER_CALLED_ONCE',
          code: 'UNEXPECTED_CALL_COUNT',
          name: 'Provider must be invoked exactly once',
          check: (sim) => sim.providerCalls.length === 1,
        },
        {
          id: 'FINANCIAL_SOURCE_OF_TRUTH_IMMUTABLE',
          code: 'INPUT_MUTATED',
          name: 'Deterministic financial inputs must remain completely unmutated',
          check: (sim, scenario) => {
            const initialNetSavings = 5000
            return scenario.input.financialSummary.netSavings === initialNetSavings
          },
        },
      ],
    }),

    // 2. Response Guardrail rejection
    createRegressionScenario({
      id: GOLDEN_SCENARIO_IDS.RESPONSE_GUARDRAIL_REJECTION,
      name: 'Response Guardrail Rejection',
      mode: 'sync',
      description: 'Prohibited action claim triggers real Response Guardrail rejection.',
      input: baseInput,
      providerScript: {
        generateScript: [
          'I have transferred your funds to the savings account.',
        ],
      },
      invariants: [
        {
          id: 'TERMINAL_STATUS_FAILED',
          code: 'EXPECTED_FAILURE_NOT_FOUND',
          name: 'Workflow terminal status must be failed',
          check: (sim) => sim.workflow?.status === 'failed',
        },
        {
          id: 'GUARDRAIL_REJECTED_CODE',
          code: 'ERROR_CODE_MISMATCH',
          name: 'Error code must be GUARDRAIL_REJECTED',
          check: (sim) => sim.error?.code === 'GUARDRAIL_REJECTED',
        },
        {
          id: 'STAGE_RESPONSE',
          code: 'WRONG_GUARDRAIL_STAGE',
          name: 'Rejection must originate from response stage',
          check: (sim) => sim.auditEvents.some((e) => e.stage === 'response'),
        },
        {
          id: 'AUDIT_REJECTION_LOGGED',
          code: 'AUDIT_NOT_LOGGED',
          name: 'Audit logger must record rejection',
          check: (sim) => sim.auditEvents.length > 0,
        },
        {
          id: 'ZERO_RESPONSE_DELIVERED',
          code: 'RESPONSE_LEAKED',
          name: 'No ProviderResponse must be delivered to caller',
          check: (sim) => sim.response === null,
        },
      ],
    }),

    // 3. Financial Guidance Guardrail rejection
    createRegressionScenario({
      id: GOLDEN_SCENARIO_IDS.FINANCIAL_GUIDANCE_REJECTION,
      name: 'Financial Guidance Guardrail Rejection',
      mode: 'sync',
      description: 'Guaranteed returns claim triggers real Financial Guidance Guardrail rejection.',
      input: baseInput,
      providerScript: {
        generateScript: [
          'Guaranteed returns: this plan offers a guaranteed 50% return with zero risk.',
        ],
      },
      invariants: [
        {
          id: 'TERMINAL_STATUS_FAILED',
          code: 'EXPECTED_FAILURE_NOT_FOUND',
          name: 'Workflow terminal status must be failed',
          check: (sim) => sim.workflow?.status === 'failed',
        },
        {
          id: 'STAGE_FINANCIAL_GUIDANCE',
          code: 'WRONG_GUARDRAIL_STAGE',
          name: 'Rejection must originate from financial_guidance stage',
          check: (sim) => sim.auditEvents.some((e) => e.stage === 'financial_guidance'),
        },
        {
          id: 'ZERO_RESPONSE_DELIVERED',
          code: 'RESPONSE_LEAKED',
          name: 'No ProviderResponse must be delivered to caller',
          check: (sim) => sim.response === null,
        },
      ],
    }),

    // 4. Retryable provider failure -> recovery
    createRegressionScenario({
      id: GOLDEN_SCENARIO_IDS.PROVIDER_RETRY_RECOVERY,
      name: 'Retryable Provider Failure then Recovery',
      mode: 'sync',
      description: 'Provider unavailable error on attempt 1 retries and recovers on attempt 2.',
      input: baseInput,
      providerScript: {
        generateScript: [
          {
            errorCode: PROVIDER_ERROR_CODES.PROVIDER_UNAVAILABLE,
            message: 'Ollama daemon connection reset',
          },
          'Recovered explanation on attempt 2: Your financial foundation is sound.',
        ],
      },
      invariants: [
        {
          id: 'TERMINAL_STATUS_SUCCEEDED',
          code: 'RETRY_DID_NOT_RECOVER',
          name: 'Workflow terminal status must be succeeded',
          check: (sim) => sim.workflow?.status === 'succeeded',
        },
        {
          id: 'ATTEMPTS_EQUALS_TWO',
          code: 'UNEXPECTED_ATTEMPT_COUNT',
          name: 'Workflow must record 2 attempts',
          check: (sim) => sim.workflow?.attempt === 2,
        },
        {
          id: 'PROVIDER_CALLED_TWICE',
          code: 'UNEXPECTED_PROVIDER_CALL_COUNT',
          name: 'Provider must be called exactly twice',
          check: (sim) => sim.providerCalls.length === 2,
        },
      ],
    }),

    // 5. Memory retrieval -> bounded Prompt Context
    createRegressionScenario({
      id: GOLDEN_SCENARIO_IDS.MEMORY_BOUNDS_RETRIEVAL,
      name: 'Memory Retrieval Bounds Enforcement',
      mode: 'sync',
      description: 'Supplied memory state is retrieved via real Memory Service into bounded context.',
      input: createSyntheticWorkflowInput({
        memoryState: createSyntheticMemoryState(),
      }),
      providerScript: {
        generateScript: [
          'Explanation considering preferences: Bullet points with conservative recommendations.',
        ],
      },
      invariants: [
        {
          id: 'TERMINAL_STATUS_SUCCEEDED',
          code: 'STATUS_NOT_SUCCEEDED',
          name: 'Workflow terminal status must be succeeded',
          check: (sim) => sim.workflow?.status === 'succeeded',
        },
        {
          id: 'PROVIDER_CALLED_WITH_PROMPT',
          code: 'PROMPT_MISSING',
          name: 'Provider request must include built prompt package with memory context',
          check: (sim) => {
            const req = sim.providerCalls[0]?.request
            const userPrompt = req?.prompt?.user || ''
            return Boolean(req?.prompt?.system) && userPrompt.includes('UNTRUSTED_MEMORY_CONTEXT_JSON')
          },
        },
      ],
    }),

    // 6. Conversation context -> Prompt Builder
    createRegressionScenario({
      id: GOLDEN_SCENARIO_IDS.CONVERSATION_PROPAGATION,
      name: 'Conversation Context Propagation',
      mode: 'sync',
      description: 'Conversation context with topic and recent messages propagates into prompt context.',
      input: createSyntheticWorkflowInput({
        conversationContext: createSyntheticConversationContext({
          topic: { current: 'savings' },
        }),
      }),
      providerScript: {
        generateScript: [
          'Answering your question on savings: Your net savings remain positive.',
        ],
      },
      invariants: [
        {
          id: 'TERMINAL_STATUS_SUCCEEDED',
          code: 'STATUS_NOT_SUCCEEDED',
          name: 'Workflow terminal status must be succeeded',
          check: (sim) => sim.workflow?.status === 'succeeded',
        },
        {
          id: 'USER_PROMPT_CONTAINS_TOPIC',
          code: 'TOPIC_CONTEXT_MISSING',
          name: 'User prompt contains conversation context',
          check: (sim) => {
            const userPrompt = sim.providerCalls[0]?.request?.prompt?.user || ''
            return userPrompt.includes('UNTRUSTED_CONVERSATION_CONTEXT_JSON') && userPrompt.includes('savings')
          },
        },
      ],
    }),

    // 7. Successful streaming Safe Publication Gate
    createRegressionScenario({
      id: GOLDEN_SCENARIO_IDS.STREAMING_SAFE_GATE,
      name: 'Streaming Safe Publication Gate',
      mode: 'stream',
      description: 'Streamed fragments buffer safely and publish strictly after guardrail validation.',
      input: baseInput,
      providerScript: {
        streamScript: [
          [
            { textFragment: 'Net savings ', done: false },
            { textFragment: 'healthy. Automate reserve.', done: true },
          ],
        ],
      },
      invariants: [
        {
          id: 'STREAM_STATUS_SUCCEEDED',
          code: 'STREAM_NOT_SUCCEEDED',
          name: 'Streaming workflow status must be succeeded',
          check: (sim) => sim.workflow?.status === 'succeeded',
        },
        {
          id: 'CHUNKS_PUBLISHED',
          code: 'ZERO_CHUNKS',
          name: 'Chunks must be published to listener',
          check: (sim) => sim.chunks.length > 0,
        },
        {
          id: 'CHUNK_SEQUENCING_STRICT',
          code: 'INVALID_CHUNK_SEQUENCE',
          name: 'Chunk sequences must be strictly 1..N',
          check: (sim) => sim.chunks.every((c, idx) => c.sequence === idx + 1),
        },
        {
          id: 'STREAM_EVENTS_COMPLETED',
          code: 'STREAM_NOT_COMPLETED',
          name: 'Lifecycle events must end with completed',
          check: (sim) => {
            const last = sim.events[sim.events.length - 1]
            return last?.eventType === 'completed'
          },
        },
      ],
    }),

    // 8. Streaming guardrail rejection (zero chunks published)
    createRegressionScenario({
      id: GOLDEN_SCENARIO_IDS.STREAMING_GUARDRAIL_REJECTION,
      name: 'Streaming Guardrail Rejection Safe Gate',
      mode: 'stream',
      description: 'Streamed prohibited advice is buffered and rejected before publishing any chunk.',
      input: baseInput,
      providerScript: {
        streamScript: [
          [
            { textFragment: 'Guaranteed 100% return ', done: false },
            { textFragment: 'with risk-free outcomes for all funds.', done: true },
          ],
        ],
      },
      invariants: [
        {
          id: 'STREAM_STATUS_FAILED',
          code: 'STREAM_UNEXPECTED_PASS',
          name: 'Streaming workflow must be rejected/failed',
          check: (sim) => sim.workflow?.status === 'failed',
        },
        {
          id: 'SAFE_GATE_ZERO_CHUNKS_LEAKED',
          code: 'CHUNK_LEAK_BEFORE_VALIDATION',
          name: 'Safe Publication Gate must publish zero chunks when rejected',
          check: (sim) => sim.chunks.length === 0,
        },
        {
          id: 'AUDIT_REJECTION_LOGGED',
          code: 'AUDIT_NOT_LOGGED',
          name: 'Guardrail rejection must be recorded in audit log',
          check: (sim) => sim.auditEvents.length > 0,
        },
      ],
    }),
  ])
}

export const goldenScenarios = createGoldenScenarios()
