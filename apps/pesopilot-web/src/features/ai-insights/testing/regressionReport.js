export const REGRESSION_REPORT_VERSION = '1.0.0'

export function createRegressionReport({
  total = 0,
  passed = 0,
  failed = 0,
  durationMs = 0,
  timestamp = null,
  results = [],
} = {}) {
  const safeTimestamp = typeof timestamp === 'string' && timestamp.trim()
    ? timestamp.trim()
    : new Date().toISOString()

  const safeResults = Array.isArray(results)
    ? results.map((r) => Object.freeze({
        scenarioId: String(r.scenarioId || 'unknown'),
        name: String(r.name || ''),
        status: r.status === 'passed' ? 'passed' : 'failed',
        durationMs: Math.max(0, Number(r.durationMs) || 0),
        failures: Object.freeze(
          Array.isArray(r.failures)
            ? r.failures.map((f) => Object.freeze({
                invariantId: String(f.invariantId || 'UNKNOWN_INVARIANT'),
                safeCode: String(f.safeCode || 'INVARIANT_FAILURE'),
                message: String(f.message || 'Invariant check failed.'),
              }))
            : [],
        ),
      }))
    : []

  return Object.freeze({
    version: REGRESSION_REPORT_VERSION,
    total: Number(total),
    passed: Number(passed),
    failed: Number(failed),
    durationMs: Math.max(0, Number(durationMs) || 0),
    timestamp: safeTimestamp,
    results: Object.freeze(safeResults),
  })
}
