import { executeRegressionScenario } from './regressionScenario.js'
import { createRegressionReport } from './regressionReport.js'
import { goldenScenarios as defaultGoldenScenarios } from './scenarios/goldenScenarios.js'

export async function runRegressionSuite({
  scenarios = defaultGoldenScenarios,
  simulatorOptions = {},
  timestamp = null,
} = {}) {
  const scenarioList = Array.isArray(scenarios) ? scenarios : [scenarios]
  const suiteStartMs = Date.now()

  const scenarioResults = []
  let passedCount = 0
  let failedCount = 0

  // Deterministic sequential execution
  for (const scenario of scenarioList) {
    const result = await executeRegressionScenario(scenario, simulatorOptions)
    if (result.status === 'passed') {
      passedCount += 1
    } else {
      failedCount += 1
    }
    scenarioResults.push(result)
  }

  const suiteDurationMs = Math.max(0, Date.now() - suiteStartMs)

  return createRegressionReport({
    total: scenarioList.length,
    passed: passedCount,
    failed: failedCount,
    durationMs: suiteDurationMs,
    timestamp: timestamp || new Date().toISOString(),
    results: scenarioResults,
  })
}

export function createRegressionRunner(runnerConfig = {}) {
  return Object.freeze({
    run(options = {}) {
      return runRegressionSuite({
        ...runnerConfig,
        ...options,
      })
    },
  })
}
