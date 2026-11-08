import { FIRST_USE_WELCOME_KEY, isStorageFlagSet, setStorageFlag } from '@/components/guidance/guidanceStorage.js'
import { workspaceRepository } from '../repositories/workspaceRepository.js'
import { getWorkspaceChoice, setActiveWorkspace } from './workspacePreference.js'

export const workspaceService = {
  async shouldOfferChoice() {
    try {
      if (getWorkspaceChoice() || isStorageFlagSet(FIRST_USE_WELCOME_KEY)) return false
    } catch {
      // Storage preferences are optional; IndexedDB records still identify existing users.
    }
    return !(await workspaceRepository.hasPersonalRecords())
  },

  rememberRoute(workspace) {
    setActiveWorkspace(workspace)
    try {
      setStorageFlag(FIRST_USE_WELCOME_KEY)
    } catch {
      // Navigation continues when browser preferences cannot be persisted.
    }
  },
}
