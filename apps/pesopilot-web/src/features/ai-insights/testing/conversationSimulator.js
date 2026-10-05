import { conversationEngine as defaultConversationEngine } from '../conversation/conversationEngine.js'

export function createConversationSimulator({
  conversationEngine = defaultConversationEngine,
  conversationId = 'sim-conv-001',
  topic = 'general',
  initialCreatedAt = '2026-10-05T00:00:00.000Z',
} = {}) {
  let currentTimeMs = new Date(initialCreatedAt).getTime()
  let messageCounter = 0

  function nextTimestamp() {
    currentTimeMs += 1000
    return new Date(currentTimeMs).toISOString()
  }

  function nextMessageId() {
    messageCounter += 1
    return `msg-${String(messageCounter).padStart(3, '0')}`
  }

  let conversation = conversationEngine.startConversation({
    conversationId,
    createdAt: initialCreatedAt,
    topic,
  })

  function appendMessage({
    role,
    content,
    createdAt = null,
    messageId = null,
  } = {}) {
    const timestamp = createdAt || nextTimestamp()
    const id = messageId || nextMessageId()

    conversation = conversationEngine.appendMessage(conversation, {
      role,
      content,
      createdAt: timestamp,
      messageId: id,
    })
    return conversation
  }

  function updateTopic(newTopic, updatedAt = null) {
    const timestamp = updatedAt || nextTimestamp()
    conversation = conversationEngine.updateTopic(conversation, {
      topic: newTopic,
      updatedAt: timestamp,
    })
    return conversation
  }

  function requestClarification({
    reason,
    missingFields = [],
    updatedAt = null,
  } = {}) {
    const timestamp = updatedAt || nextTimestamp()
    conversation = conversationEngine.requestClarification(conversation, {
      reason,
      missingFields,
      updatedAt: timestamp,
    })
    return conversation
  }

  function resolveClarification(updatedAt = null) {
    const timestamp = updatedAt || nextTimestamp()
    conversation = conversationEngine.resolveClarification(conversation, {
      updatedAt: timestamp,
    })
    return conversation
  }

  function close(updatedAt = null) {
    const timestamp = updatedAt || nextTimestamp()
    conversation = conversationEngine.closeConversation(conversation, {
      updatedAt: timestamp,
    })
    return conversation
  }

  function applyTurn(turn) {
    if (!turn || typeof turn !== 'object') {
      throw new Error('applyTurn requires an object.')
    }
    return appendMessage({
      role: turn.role,
      content: turn.content,
      createdAt: turn.createdAt,
      messageId: turn.messageId,
    })
  }

  function applyScript(operations) {
    if (!Array.isArray(operations)) {
      throw new TypeError('applyScript requires an array of operations.')
    }

    for (const op of operations) {
      if (!op || typeof op !== 'object') continue
      const type = op.op || (op.role ? 'message' : null)

      switch (type) {
        case 'message':
          appendMessage({
            role: op.role,
            content: op.content,
            createdAt: op.createdAt,
            messageId: op.messageId,
          })
          break
        case 'topic':
          updateTopic(op.topic, op.updatedAt)
          break
        case 'clarification':
          requestClarification({
            reason: op.reason,
            missingFields: op.missingFields,
            updatedAt: op.updatedAt,
          })
          break
        case 'resolveClarification':
          resolveClarification(op.updatedAt)
          break
        case 'close':
          close(op.updatedAt)
          break
        default:
          throw new Error(`Unknown conversation script operation: "${type}".`)
      }
    }

    return conversation
  }

  function getConversation() {
    return conversation
  }

  function getContext() {
    return conversationEngine.buildConversationContext({ conversation })
  }

  function validate() {
    return conversationEngine.validateConversation(conversation)
  }

  function validateContext() {
    return conversationEngine.validateConversationContext(getContext())
  }

  return Object.freeze({
    appendMessage,
    applyTurn,
    applyScript,
    updateTopic,
    requestClarification,
    resolveClarification,
    close,
    getConversation,
    getContext,
    validate,
    validateContext,
  })
}
