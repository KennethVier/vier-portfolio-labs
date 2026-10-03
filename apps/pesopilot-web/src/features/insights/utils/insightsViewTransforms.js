const currencyFormatter = new Intl.NumberFormat('en-PH', {
  currency: 'PHP',
  style: 'currency',
})

export function formatMoney(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '--'
  }
  return currencyFormatter.format(value)
}

export function formatPercent(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '--'
  }
  return `${Math.round(value)}%`
}

export function formatGeneratedAt(isoString) {
  if (!isoString) {
    return ''
  }
  try {
    const date = new Date(isoString)
    if (Number.isNaN(date.getTime())) {
      return ''
    }
    return date.toLocaleString('en-PH', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return ''
  }
}

export function mapSeverityToTone(severity) {
  if (typeof severity !== 'string') {
    return 'neutral'
  }

  const normalized = severity.trim().toLowerCase()
  switch (normalized) {
    case 'critical':
      return 'critical'
    case 'warning':
      return 'warning'
    case 'info':
      return 'info'
    default:
      return 'neutral'
  }
}

export function mapHealthStatusToTone(status) {
  if (typeof status !== 'string') {
    return 'neutral'
  }

  const normalized = status.trim().toLowerCase()
  switch (normalized) {
    case 'excellent':
    case 'healthy':
      return 'success'
    case 'needs attention':
      return 'warning'
    case 'critical':
      return 'critical'
    case 'fair':
      return 'neutral'
    default:
      return 'neutral'
  }
}

export function filterSummarySectionsByHorizon(sections, horizon = 'all') {
  if (!Array.isArray(sections)) {
    return []
  }

  if (horizon === 'all') {
    return sections.map((section) => ({
      ...section,
      paragraphs: Array.isArray(section.paragraphs) ? [...section.paragraphs] : [],
    }))
  }

  const filtered = []

  for (const section of sections) {
    if (!section || typeof section !== 'object') {
      continue
    }

    const matchingParagraphs = (section.paragraphs ?? []).filter(
      (paragraph) => paragraph?.horizon === horizon,
    )

    if (matchingParagraphs.length > 0) {
      filtered.push({
        ...section,
        paragraphs: matchingParagraphs,
      })
    }
  }

  return filtered
}

export function getHorizonCoverageNotice(horizon, coverage) {
  if (horizon === 'all') {
    return null
  }

  if (!coverage || typeof coverage !== 'object') {
    return 'Not enough comparison history is available for this view yet.'
  }

  if (coverage[horizon] === 'available') {
    return null
  }

  return 'Not enough comparison history is available for this view yet.'
}
