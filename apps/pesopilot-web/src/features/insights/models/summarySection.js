export function createSummarySection({
  paragraphs = [],
  relatedInsights = [],
  relatedRecommendations = [],
  title = '',
  type = '',
} = {}) {
  return {
    type,
    title,
    paragraphs,
    relatedInsights,
    relatedRecommendations,
  }
}

export function createSummaryParagraph({
  evidence = [],
  horizon = 'current',
  key = '',
  relatedInsights = [],
  relatedRecommendations = [],
  templateId = '',
  text = '',
  variables = {},
} = {}) {
  return {
    key,
    templateId,
    variables,
    text,
    horizon,
    evidence,
    relatedInsights,
    relatedRecommendations,
  }
}
