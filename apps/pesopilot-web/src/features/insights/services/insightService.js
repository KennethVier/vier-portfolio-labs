import { createInsightBundle } from '../models/insightBundle.js'
import { DEFAULT_INSIGHT_SCOPE } from '../utils/insightConstants.js'

export const insightService = {
  async loadInsights({ scope = DEFAULT_INSIGHT_SCOPE } = {}) {
    return createInsightBundle({ scope })
  },
}
