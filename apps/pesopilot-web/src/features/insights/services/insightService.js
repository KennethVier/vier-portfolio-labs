import { createInsightBundle } from '../models/insightBundle.js'
import { generateHealthInsight } from '../rules/health/healthEngine.js'
import { DEFAULT_INSIGHT_SCOPE } from '../utils/insightConstants.js'

export const insightService = {
  async loadInsights({ scope = DEFAULT_INSIGHT_SCOPE } = {}) {
    const bundle = createInsightBundle({ scope })

    bundle.health = await generateHealthInsight({ scope })

    return bundle
  },
}
