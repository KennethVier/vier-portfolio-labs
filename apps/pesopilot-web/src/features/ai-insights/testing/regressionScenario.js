import { createWorkflowSimulator } from './workflowSimulator.js'
import { createMockProvider } from './providerMock.js'
import { createDeterministicRuntime } from './deterministicRuntime.js'

export function createRegressionScenario({
  id,
  name,
  mode = 'sync',
  description = '',
  input,
  providerScript = {},
  options = {},
  invariants = [],
} = {}) {
  if (typeof id !== 'string' || !id.trim()) {
    throw new Error('RegressionScenario requires a non-empty string id.')
  }
  if (typeof name !== 'string' || !name.trim()) {
    throw new Error('RegressionScenario requires a non-empty string name.')
  }
  if (!input || typeof input !== 'object') {
    throw new Error('RegressionScenario requires an input object.')
  }
  if (!Array.isArray(invariants)) {
    throw new TypeError('RegressionScenario invariants must be an array.')
  }

  return Object.freeze({
    id: id.trim(),
    name: name.trim(),
    mode: mode === 'stream' ? 'stream' : 'sync',
    description: String(description || ''),
    input: Object.freeze({ ...input }),
    providerScript: Object.freeze({ ...providerScript }),
    options: Object.freeze({ ...options }),
    invariants: Object.freeze([...invariants]),
  })
}

export async function executeRegressionScenario(scenario, {
  customSimulator = null,
  runtime = null,
} = {}) {
  const startMs = Date.now()
  const activeRuntime = runtime || createDeterministicRuntime({ idPrefix: `wf-${scenario.id}` })
  const mockProvider = createMockProvider({
    id: scenario.input?.provider?.id || 'ollama',
    ...scenario.providerScript,
  })

  const simulator = customSimulator || createWorkflowSimulator({
    provider: mockProvider,
    clock: activeRuntime.clock,
    timer: activeRuntime.timer,
    idGenerator: activeRuntime.idGenerator,
  })

  let simResult
  try {
    simResult = await simulator.runScenario(scenario)
  } catch {
    const durationMs = Math.max(0, Date.now() - startMs)
    return Object.freeze({
      scenarioId: scenario.id,
      name: scenario.name,
      status: 'failed',
      durationMs,
      failures: Object.freeze([
        Object.freeze({
          invariantId: 'UNEXPECTED_EXCEPTION',
          safeCode: 'EXECUTION_CRASH',
          message: 'Scenario execution encountered an unexpected error.',
        }),
      ]),
    })
  }

  const failures = []
  if (simResult?.error && scenario.invariants.length === 0) {
    failures.push(Object.freeze({
      invariantId: 'UNEXPECTED_EXCEPTION',
      safeCode: 'EXECUTION_CRASH',
      message: 'Scenario execution ended with an unexpected workflow error.',
    }))
  }

  for (const inv of scenario.invariants) {
    try {
      const checkRes = inv.check(simResult, scenario)
      const passed = typeof checkRes === 'boolean' ? checkRes : Boolean(checkRes?.passed)
      if (!passed) {
        failures.push(Object.freeze({
          invariantId: inv.id || inv.name || 'UNNAMED_INVARIANT',
          safeCode: inv.code || 'INVARIANT_UNSATISFIED',
          message: `Invariant "${inv.name || inv.id || 'check'}" unsatisfied.`,
        }))
      }
    } catch {
      failures.push(Object.freeze({
        invariantId: inv.id || inv.name || 'INVARIANT_EVAL_ERROR',
        safeCode: 'INVARIANT_EVAL_EXCEPTION',
        message: 'Invariant check threw an unexpected exception during evaluation.',
      }))
    }
  }

  const durationMs = Math.max(0, Date.now() - startMs)
  return Object.freeze({
    scenarioId: scenario.id,
    name: scenario.name,
    status: failures.length === 0 ? 'passed' : 'failed',
    durationMs,
    failures: Object.freeze(failures),
    simulationResult: simResult,
  })
}
