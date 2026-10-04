import {
  appendConversationMessage,
  closeConversation,
  requestConversationClarification,
  resolveConversationClarification,
  startConversation,
  updateConversationTopic,
} from './conversation.js'
import { buildConversationContext } from './conversationContextBuilder.js'
import {
  validateConversation,
  validateConversationContext,
} from './conversationValidator.js'

export const conversationEngine = Object.freeze({
  name: 'conversation-engine',
  status: 'ready',

  startConversation,
  appendMessage: appendConversationMessage,
  updateTopic: updateConversationTopic,
  requestClarification: requestConversationClarification,
  resolveClarification: resolveConversationClarification,
  closeConversation,

  buildConversationContext,

  validateConversation,
  validateConversationContext,
})
