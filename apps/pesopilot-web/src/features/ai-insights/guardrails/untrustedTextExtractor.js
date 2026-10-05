export const UNTRUSTED_PATH_ALLOWLIST = Object.freeze([
  'conversationContext.recentMessages[*].content',
  'memoryContext.items[*].content',
  'context.insights.expenses.topSpendingCategory',
])

export function collectUntrustedStrings(promptPackage) {
  const untrusted = []
  if (!promptPackage || typeof promptPackage !== 'object') {
    return Object.freeze(untrusted)
  }

  const context = promptPackage.context
  if (!context || typeof context !== 'object') {
    return Object.freeze(untrusted)
  }

  // 1. Conversation Messages
  const conversationContext = context.conversationContext
  if (conversationContext && Array.isArray(conversationContext.recentMessages)) {
    conversationContext.recentMessages.forEach((msg, idx) => {
      if (typeof msg?.content === 'string' && msg.content.trim()) {
        untrusted.push(Object.freeze({
          path: `conversationContext.recentMessages[${idx}].content`,
          text: msg.content,
        }))
      }
    })
  }

  // 2. Memory Context Items
  const memoryContext = context.memoryContext
  if (memoryContext && Array.isArray(memoryContext.items)) {
    memoryContext.items.forEach((item, idx) => {
      if (typeof item?.content === 'string' && item.content.trim()) {
        untrusted.push(Object.freeze({
          path: `memoryContext.items[${idx}].content`,
          text: item.content,
        }))
      }
    })
  }

  // 3. Proven User-Origin String in Selected Financial Context: topSpendingCategory
  const topCategory = context.insights?.expenses?.topSpendingCategory
  if (typeof topCategory === 'string' && topCategory.trim()) {
    untrusted.push(Object.freeze({
      path: 'context.insights.expenses.topSpendingCategory',
      text: topCategory,
    }))
  }

  return Object.freeze(untrusted)
}
