import { describe, expect, it } from 'vitest'
import { runRegressionSuite, createRegressionRunner } from './regressionRunner.js'
import { createRegressionScenario } from './regressionScenario.js'
import { createSyntheticWorkflowInput } from './fixtures/syntheticFixtures.js'

describe('Phase 11B.9 — Regression Runner', () => {
  const baseInput = createSyntheticWorkflowInput()

  const passingScenario1 = createRegressionScenario({
    id: 'test-pass-1',
    name: 'Passing Scenario 1',
    input: baseInput,
    providerScript: { generateScript: ['Valid response 1.'] },
    invariants: [
      {
        id: 'STATUS_CHECK',
        name: 'Workflow succeeds',
        check: (sim) => sim.workflow?.status === 'succeeded',
      },
    ],
  })

  const passingScenario2 = createRegressionScenario({
    id: 'test-pass-2',
    name: 'Passing Scenario 2',
    input: baseInput,
    providerScript: { generateScript: ['Valid response 2.'] },
    invariants: [
      {
        id: 'STATUS_CHECK',
        name: 'Workflow succeeds',
        check: (sim) => sim.workflow?.status === 'succeeded',
      },
    ],
  })

  const failingScenario = createRegressionScenario({
    id: 'test-fail-1',
    name: 'Failing Scenario',
    input: baseInput,
    providerScript: { generateScript: ['Valid response.'] },
    invariants: [
      {
        id: 'FAILING_CHECK',
        code: 'INTENTIONAL_FAILURE',
        name: 'Always fails',
        check: () => false,
      },
    ],
  })

  it('executes scenarios in stable order and generates valid all-pass report', async () => {
    const report = await runRegressionSuite({
      scenarios: [passingScenario1, passingScenario2],
    })

    expect(report.version).toBe('1.0.0')
    expect(report.total).toBe(2)
    expect(report.passed).toBe(2)
    expect(report.failed).toBe(0)
    expect(report.results.length).toBe(2)
    expect(report.results[0].scenarioId).toBe('test-pass-1')
    expect(report.results[0].status).toBe('passed')
    expect(report.results[1].scenarioId).toBe('test-pass-2')
    expect(report.results[1].status).toBe('passed')
  })

  it('continues after an individual failure and reports aggregated failure statistics', async () => {
    const report = await runRegressionSuite({
      scenarios: [passingScenario1, failingScenario, passingScenario2],
    })

    expect(report.total).toBe(3)
    expect(report.passed).toBe(2)
    expect(report.failed).toBe(1)

    expect(report.results[0].status).toBe('passed')
    expect(report.results[1].status).toBe('failed')
    expect(report.results[1].failures.length).toBe(1)
    expect(report.results[1].failures[0].invariantId).toBe('FAILING_CHECK')
    expect(report.results[1].failures[0].safeCode).toBe('INTENTIONAL_FAILURE')
    expect(report.results[2].status).toBe('passed')
  })

  it('converts unexpected exception into an explicit failed scenario result without crashing runner', async () => {
    const crashingScenario = createRegressionScenario({
      id: 'test-crash',
      name: 'Crashing Scenario',
      input: baseInput,
      providerScript: {
        generateScript: [
          () => {
            throw new Error('Unexpected simulated crash')
          },
        ],
      },
      invariants: [],
    })

    const report = await runRegressionSuite({
      scenarios: [passingScenario1, crashingScenario],
    })

    expect(report.total).toBe(2)
    expect(report.passed).toBe(1)
    expect(report.failed).toBe(1)

    const crashResult = report.results.find((r) => r.scenarioId === 'test-crash')
    expect(crashResult.status).toBe('failed')
    expect(crashResult.failures.length).toBeGreaterThan(0)
    expect(crashResult.failures[0].safeCode).toBe('EXECUTION_CRASH')
  })

  it('does not mutate input scenarios and returns deterministic results on rerun', async () => {
    const scenarioSnapshot = JSON.stringify(passingScenario1)

    const report1 = await runRegressionSuite({ scenarios: [passingScenario1] })
    const report2 = await runRegressionSuite({ scenarios: [passingScenario1] })

    expect(JSON.stringify(passingScenario1)).toBe(scenarioSnapshot)
    expect(report1.total).toBe(report2.total)
    expect(report1.passed).toBe(report2.passed)
    expect(report1.failed).toBe(report2.failed)
  })

  it('createRegressionRunner wraps execution cleanly', async () => {
    const runner = createRegressionRunner({
      scenarios: [passingScenario1],
    })

    const report = await runner.run()
    expect(report.passed).toBe(1)
  })
})
