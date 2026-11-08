import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { workspaceService } from '../services/workspaceService.js'

export function useWorkspaceRoute(workspace, enabled = true) {
  const { pathname } = useLocation()
  useEffect(() => {
    if (enabled) workspaceService.rememberRoute(workspace)
  }, [workspace, enabled, pathname])
}
