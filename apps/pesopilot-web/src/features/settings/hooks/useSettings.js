import { useCallback, useEffect, useRef, useState } from 'react'

import { useSettingsStore } from '@/app/settingsStore.js'

import { settingsService } from '../services/settingsService.js'

const initialActionState = {
  message: '',
  tone: 'neutral',
}

export function useSettings() {
  const storeSettings = useSettingsStore((state) => state.settings)
  const [settings, setSettings] = useState(storeSettings)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [actionState, setActionState] = useState(initialActionState)
  const systemThemeListenerRef = useRef(null)

  const applyPreferences = useCallback((nextSettings) => {
    settingsService.applyThemePreference(nextSettings.theme)
    settingsService.applyDensityPreference(nextSettings.density)
  }, [])

  useEffect(() => {
    let isMounted = true

    async function load() {
      try {
        setIsLoading(true)
        setError('')
        const loadedSettings = await settingsService.loadSettings()

        if (!isMounted) {
          return
        }

        setSettings(loadedSettings)
        applyPreferences(loadedSettings)
      } catch (settingsError) {
        if (isMounted) {
          setError(settingsError.message || 'Unable to load settings.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    load()

    return () => {
      isMounted = false
    }
  }, [applyPreferences])

  useEffect(() => {
    systemThemeListenerRef.current?.()
    systemThemeListenerRef.current = null

    if (settings?.theme !== 'system' || !globalThis.matchMedia) {
      return undefined
    }

    const mediaQuery = globalThis.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemThemeChange = () => {
      settingsService.applyThemePreference('system')
    }

    mediaQuery.addEventListener?.('change', handleSystemThemeChange)
    systemThemeListenerRef.current = () => {
      mediaQuery.removeEventListener?.('change', handleSystemThemeChange)
    }

    return systemThemeListenerRef.current
  }, [settings?.theme])

  const updateSetting = useCallback(
    async (changes) => {
      try {
        setIsSaving(true)
        setError('')
        const updatedSettings = await settingsService.updateSettings(changes)
        setSettings(updatedSettings)
        applyPreferences(updatedSettings)
        setActionState({
          message: 'Settings saved.',
          tone: 'success',
        })
        return updatedSettings
      } catch (settingsError) {
        const message = settingsError.message || 'Unable to save settings.'
        setError(message)
        setActionState({ message, tone: 'critical' })
        throw settingsError
      } finally {
        setIsSaving(false)
      }
    },
    [applyPreferences],
  )

  const exportData = useCallback(async () => {
    const backupData = await settingsService.buildBackupData()
    const fileName = settingsService.createBackupFileName()
    return { backupData, fileName }
  }, [])

  const importData = useCallback(
    async (backupData) => {
      try {
        setIsSaving(true)
        setError('')
        const result = await settingsService.importBackupData(backupData)
        setSettings(result.settings)
        applyPreferences(result.settings)
        setActionState({
          message: 'Backup imported. Local data has been replaced.',
          tone: 'success',
        })
        return result
      } catch (settingsError) {
        const message = settingsError.message || 'Unable to import backup.'
        setError(message)
        setActionState({ message, tone: 'critical' })
        throw settingsError
      } finally {
        setIsSaving(false)
      }
    },
    [applyPreferences],
  )

  const resetData = useCallback(async () => {
    try {
      setIsSaving(true)
      setError('')
      const resetSettings = await settingsService.resetLocalData()
      setSettings(resetSettings)
      applyPreferences(resetSettings)
      setActionState({
        message: 'Local PesoPilot data has been reset.',
        tone: 'success',
      })
      return resetSettings
    } catch (settingsError) {
      const message = settingsError.message || 'Unable to reset local data.'
      setError(message)
      setActionState({ message, tone: 'critical' })
      throw settingsError
    } finally {
      setIsSaving(false)
    }
  }, [applyPreferences])

  return {
    actionState,
    error,
    exportData,
    importData,
    isLoading,
    isSaving,
    resetData,
    settings,
    updateSetting,
  }
}
