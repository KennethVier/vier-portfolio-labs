import { DEFAULT_MEMORY_POLICY } from './memoryPolicy.js'

export const MEMORY_CONTEXT_VERSION = '1.0.0'

export function buildMemoryContext({
  records = [],
  policy = DEFAULT_MEMORY_POLICY,
} = {}) {
  if (!Array.isArray(records) || records.length === 0) {
    return null
  }

  const seenIds = new Set()
  const seenNormalizedContent = new Set()
  const items = []
  let totalChars = 0

  for (const record of records) {
    if (!record || typeof record !== 'object') continue

    // 1. Deduplication by memoryId (preserve highest ranked)
    if (record.memoryId && seenIds.has(record.memoryId)) {
      continue
    }

    // 2. Deduplication by exact normalized content (trim, lowercase, exact equality)
    const rawContent = typeof record.content === 'string' ? record.content : ''
    const normalizedContent = rawContent.trim().toLowerCase()
    if (!normalizedContent || seenNormalizedContent.has(normalizedContent)) {
      continue
    }

    const trimmedContent = rawContent.trim()
    const contentLen = trimmedContent.length

    // 3. Max item length check (individual items exceeding maxContentLength are excluded)
    if (contentLen > policy.maxContentLength) {
      continue
    }

    // 4. Max items limit
    if (items.length >= policy.maxRetrievedItems) {
      break
    }

    // 5. Total character ceiling check (do not truncate content silently; exclude whole item)
    if (totalChars + contentLen > policy.maxTotalContextChars) {
      break
    }

    if (record.memoryId) {
      seenIds.add(record.memoryId)
    }
    seenNormalizedContent.add(normalizedContent)

    items.push(
      Object.freeze({
        type: record.type,
        content: trimmedContent,
      }),
    )
    totalChars += contentLen
  }

  if (items.length === 0) {
    return null
  }

  return Object.freeze({
    version: MEMORY_CONTEXT_VERSION,
    items: Object.freeze(items),
  })
}
