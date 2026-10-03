import {
  createFinancialSummary,
  ENGINE_VERSION,
  NARRATIVE_VERSION,
  SUMMARY_TYPE,
  SUMMARY_VERSION,
} from '../models/financialSummary.js'
import {
  createSummaryParagraph,
  createSummarySection,
} from '../models/summarySection.js'
import {
  EMPTY_SUMMARY_TEXT,
  SUMMARY_SECTION_TITLES,
  SUMMARY_SECTION_TYPES,
} from './summaryConstants.js'

export function buildEmptyFinancialSummary({
  generatedAt = new Date().toISOString(),
  scope = 'current_cutoff',
  warnings = [],
} = {}) {
  const emptyParagraph = createSummaryParagraph({
    evidence: [],
    horizon: 'current',
    key: 'summary_empty',
    relatedInsights: [],
    relatedRecommendations: [],
    templateId: 'summary.empty',
    text: EMPTY_SUMMARY_TEXT,
    variables: {},
  })

  const executiveSection = createSummarySection({
    paragraphs: [emptyParagraph],
    relatedInsights: [],
    relatedRecommendations: [],
    title: SUMMARY_SECTION_TITLES[SUMMARY_SECTION_TYPES.executive],
    type: SUMMARY_SECTION_TYPES.executive,
  })

  return createFinancialSummary({
    diagnostics: {
      counts: {
        actions: 0,
        highlights: 0,
        positives: 0,
        risks: 0,
      },
      coverage: {
        current: 'unavailable',
        historical: 'unavailable',
        monthly: 'unavailable',
      },
      omitted: [],
      state: 'empty',
      warnings,
    },
    generatedAt,
    metadata: {
      engineVersion: ENGINE_VERSION,
      generatedAt,
      language: 'en',
      narrativeVersion: NARRATIVE_VERSION,
      summaryId: `summary:${scope}:${generatedAt}`,
      summaryType: SUMMARY_TYPE,
      templateVersion: '1.0.0',
    },
    scope,
    sections: [executiveSection],
    version: SUMMARY_VERSION,
  })
}

export function buildReadyFinancialSummary({
  counts = { actions: 0, highlights: 0, positives: 0, risks: 0 },
  coverage = {
    current: 'available',
    historical: 'unavailable',
    monthly: 'unavailable',
  },
  generatedAt = new Date().toISOString(),
  omitted = [],
  scope = 'current_cutoff',
  sections = [],
  warnings = [],
} = {}) {
  return createFinancialSummary({
    diagnostics: {
      counts,
      coverage,
      omitted,
      state: 'ready',
      warnings,
    },
    generatedAt,
    metadata: {
      engineVersion: ENGINE_VERSION,
      generatedAt,
      language: 'en',
      narrativeVersion: NARRATIVE_VERSION,
      summaryId: `summary:${scope}:${generatedAt}`,
      summaryType: SUMMARY_TYPE,
      templateVersion: '1.0.0',
    },
    scope,
    sections,
    version: SUMMARY_VERSION,
  })
}
