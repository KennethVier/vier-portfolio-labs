export const PROMPT_PACKAGE_VERSION = '1.0.0'

export function createPromptPackage({
  context = {},
  metadata = {},
  systemPrompt = '',
  task = '',
  template = {},
  userPrompt = '',
  version = PROMPT_PACKAGE_VERSION,
} = {}) {
  return {
    version,
    template: {
      id: template?.id ?? '',
      version: template?.version ?? '',
    },
    task,
    systemPrompt,
    userPrompt,
    context,
    metadata: {
      language: metadata?.language ?? 'en',
      contextVersion: metadata?.contextVersion ?? '1.0.0',
      safetyVersion: metadata?.safetyVersion ?? '1.0.0',
    },
  }
}
