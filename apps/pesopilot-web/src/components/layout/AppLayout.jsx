import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/Button.jsx'
import { ErrorState } from '@/components/ui/ErrorState.jsx'
import { LoadingState } from '@/components/ui/LoadingState.jsx'
import { Modal } from '@/components/ui/Modal.jsx'
import { cutoffService } from '@/features/salary-cutoff/services/cutoffService.js'
import { ensureApplicationDefaults } from '@/lib/db/seed.js'
import {
  FIRST_USE_WELCOME_KEY,
  isStorageFlagSet,
  setStorageFlag,
} from '@/components/guidance/guidanceStorage.js'

import { Header } from './Header.jsx'
import { HeaderProvider } from './HeaderContent.jsx'
import { PageContainer } from './PageContainer.jsx'
import { Sidebar } from './Sidebar.jsx'

const CUTOFF_NOTICE_SESSION_KEY = 'pesopilot:no-current-cutoff-notice-dismissed'

export function AppLayout({ children }) {
  const navigate = useNavigate()
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const [isCutoffNoticeOpen, setIsCutoffNoticeOpen] = useState(false)
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false)
  const [startupError, setStartupError] = useState(null)
  const [startupRetryKey, setStartupRetryKey] = useState(0)
  const [startupStatus, setStartupStatus] = useState('loading')

  useEffect(() => {
    let isMounted = true

    async function prepareApplicationDefaults() {
      setStartupStatus('loading')
      setStartupError(null)

      try {
        await ensureApplicationDefaults()

        if (isMounted) {
          setStartupStatus('ready')
        }
      } catch (defaultsError) {
        if (isMounted) {
          setStartupError(
            defaultsError.message || 'Unable to prepare local PesoPilot data.',
          )
          setStartupStatus('error')
        }
      }
    }

    prepareApplicationDefaults()

    return () => {
      isMounted = false
    }
  }, [startupRetryKey])

  useEffect(() => {
    if (startupStatus !== 'ready') {
      return undefined
    }

    let isMounted = true

    async function checkCutoffLifecycle() {
      try {
        const result = await cutoffService.syncCutoffLifecycle()
        const isDismissed = window.sessionStorage.getItem(CUTOFF_NOTICE_SESSION_KEY)

        if (isMounted && !result.currentCutoff && !isDismissed) {
          setIsCutoffNoticeOpen(true)
        }
      } catch {
        // Cutoff guidance is helpful, but it should never block app startup.
      }
    }

    checkCutoffLifecycle()

    if (!isStorageFlagSet(FIRST_USE_WELCOME_KEY)) {
      setIsWelcomeOpen(true)
    }

    return () => {
      isMounted = false
    }
  }, [startupStatus])

  function dismissWelcome() {
    setStorageFlag(FIRST_USE_WELCOME_KEY)
    setIsWelcomeOpen(false)
  }

  function startWelcomeFlow() {
    dismissWelcome()
    navigate('/salary-cutoff')
  }

  function dismissCutoffNotice() {
    window.sessionStorage.setItem(CUTOFF_NOTICE_SESSION_KEY, 'true')
    setIsCutoffNoticeOpen(false)
  }

  function openSalaryCutoffPage() {
    dismissCutoffNotice()
    navigate('/salary-cutoff')
  }

  return (
    <HeaderProvider>
      <Sidebar
        isMobileOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
      />
      <Header onMenuClick={() => setIsMobileNavOpen(true)} />
      <PageContainer>
        {startupStatus === 'loading' ? (
          <LoadingState label="Preparing local data" />
        ) : null}

        {startupStatus === 'error' ? (
          <div className="space-y-3">
            <ErrorState
              title="Unable to prepare local data"
              message={startupError}
            />
            <Button
              type="button"
              onClick={() => setStartupRetryKey((value) => value + 1)}
            >
              Retry
            </Button>
          </div>
        ) : null}

        {startupStatus === 'ready' ? children : null}
      </PageContainer>
      <Modal
        description="PesoPilot is built around salary-funded spending cycles."
        footer={
          <>
            <Button variant="ghost" onClick={dismissWelcome}>
              Skip
            </Button>
            <Button onClick={startWelcomeFlow}>
              Get Started
            </Button>
          </>
        }
        isOpen={isWelcomeOpen}
        onClose={dismissWelcome}
        size="md"
        title="Welcome to PesoPilot"
      >
        <ol className="space-y-2 rounded border border-outline-variant bg-surface-container-low p-3 text-body-sm text-on-surface-variant">
          <li>1. Create a Salary Cutoff</li>
          <li>2. Record your Income</li>
          <li>3. Create a Savings Goal</li>
          <li>4. Add Savings Contributions</li>
          <li>5. Track Expenses</li>
          <li>6. Review Reports</li>
        </ol>
      </Modal>
      <Modal
        description="PesoPilot could not find a salary cutoff covering today. Create the current cycle so new income, expenses, savings, dashboard, and cashflow values have the right period."
        footer={
          <>
            <Button variant="ghost" onClick={dismissCutoffNotice}>
              Later
            </Button>
            <Button onClick={openSalaryCutoffPage}>
              Create Cutoff
            </Button>
          </>
        }
        isOpen={isCutoffNoticeOpen}
        onClose={dismissCutoffNotice}
        size="md"
        title="No Current Cutoff"
      >
        <div className="rounded border border-outline-variant bg-surface-container-low p-3 text-body-sm text-on-surface-variant">
          Cutoffs are salary-funded cycles. When the current period ends,
          PesoPilot closes it and activates the planned cutoff that covers today.
          If none exists, you will need to create one before current-cycle
          tracking can continue.
        </div>
      </Modal>
    </HeaderProvider>
  )
}
