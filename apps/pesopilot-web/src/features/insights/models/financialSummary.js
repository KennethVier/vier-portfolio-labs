import { DEFAULT_INSIGHT_SCOPE } from '../utils/insightConstants.js'

export const SUMMARY_VERSION = '1.0.0'
export const ENGINE_VERSION = '1.0.0'
export const NARRATIVE_VERSION = '1.0.0'
export const SUMMARY_TYPE = 'standard'

export function createFinancialSummary({
  diagnostics = {
    counts: {
      actions: 0,
      highlights: 0,
      positives: 0,
      risks: 0,
    },
    coverage: {
      current: 'available',
      historical: 'unavailable',
      monthly: 'unavailable',
    },
    omitted: [],
    state: 'ready',
    warnings: [],
  },
  generatedAt = new Date().toISOString(),
  metadata = {
    engineVersion: ENGINE_VERSION,
    generatedAt,
    language: 'en',
    narrativeVersion: NARRATIVE_VERSION,
    summaryId: '',
    summaryType: SUMMARY_TYPE,
    templateVersion: '1.0.0',
  },
  scope = DEFAULT_INSIGHT_SCOPE,
  sections = [],
  version = SUMMARY_VERSION,
} = {}) {
  return {
    version,
    scope,
    generatedAt,
    sections,
    diagnostics,
    metadata,
  }
}
