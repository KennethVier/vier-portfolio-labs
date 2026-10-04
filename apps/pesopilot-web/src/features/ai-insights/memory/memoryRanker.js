const IMPORTANCE_WEIGHTS = Object.freeze({
  high: 3,
  medium: 2,
  low: 1,
})

export function rankMemories(records, { query } = {}) {
  if (!Array.isArray(records)) {
    return []
  }

  const rawTopic = typeof query?.topic === 'string' ? query.topic.trim() : ''
  const queryTopic = rawTopic || 'general'

  return [...records].sort((a, b) => {
    // 1. Exact topic match before 'general' (when query is not 'general')
    if (queryTopic !== 'general') {
      const aExact = a.topics?.includes(queryTopic) ? 1 : 0
      const bExact = b.topics?.includes(queryTopic) ? 1 : 0
      if (aExact !== bExact) {
        return bExact - aExact // 1 before 0
      }
    }

    // 2. Importance: high > medium > low
    const aImp = IMPORTANCE_WEIGHTS[a.importance] ?? 0
    const bImp = IMPORTANCE_WEIGHTS[b.importance] ?? 0
    if (aImp !== bImp) {
      return bImp - aImp
    }

    // 3. createdAt descending (newest first)
    const aTime = Date.parse(a.createdAt) || 0
    const bTime = Date.parse(b.createdAt) || 0
    if (aTime !== bTime) {
      return bTime - aTime
    }

    // 4. memoryId ascending (lexicographical)
    return String(a.memoryId).localeCompare(String(b.memoryId))
  })
}
