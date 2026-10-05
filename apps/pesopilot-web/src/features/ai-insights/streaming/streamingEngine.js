import { createStreamSession } from './streamManager.js'

export const streamingEngine = Object.freeze({
  name: 'streaming-engine',
  status: 'ready',

  startStream(options = {}) {
    const session = createStreamSession(options)
    return Object.freeze({
      streamId: session.streamId,
      cancel: (reason) => session.cancel(reason),
      getDiagnostics: () => session.getDiagnostics(),
      promise: session.promise,
    })
  },
})
