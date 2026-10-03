import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { PageHeader } from '@/components/dashboard'
import { useHeader } from '@/components/layout/headerContext.js'
import { Button } from '@/components/ui/Button.jsx'
import { ErrorState } from '@/components/ui/ErrorState.jsx'
import { LoadingState } from '@/components/ui/LoadingState.jsx'

import {
  CompletionScreen,
  ParsedPreview,
  ParserInputCard,
} from '../components/ManualAiExpenseFlow.jsx'
import { useManualAiExpense } from '../hooks/useManualAiExpense.js'

export function SuccessPanel({ record }) {
  if (!record) {
    return null
  }

  return (
    <div className="rounded border border-secondary/25 bg-secondary-container/25 p-4">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <p className="font-body-md text-body-md font-semibold text-secondary">
            Sent to Expense Inbox
          </p>
          <p className="text-body-sm text-on-surface-variant">
            {record.merchant} is now pending review. It will become an official
            expense only after approval.
          </p>
        </div>
        <Link to="/expense-inbox" className="no-underline">
          <Button variant="secondary">Open Expense Inbox</Button>
        </Link>
      </div>
    </div>
  )
}

export function ManualAiExpensePage() {
  const navigate = useNavigate()
  const { resetHeaderConfig, setHeaderConfig } = useHeader()
  const [inputText, setInputText] = useState('')
  const {
    categories,
    error,
    isLoading,
    isSubmitting,
    parseInput,
    parsedResult,
    resetForAnother,
    submitParsedResult,
    successRecord,
    updateParsedResult,
  } = useManualAiExpense()

  useEffect(() => {
    setHeaderConfig({
      searchValue: '',
      showSearch: false,
    })

    return () => resetHeaderConfig()
  }, [resetHeaderConfig, setHeaderConfig])

  async function handleParse() {
    await parseInput(inputText)
  }

  async function handleExampleClick(example) {
    setInputText(example)
    await parseInput(example)
  }

  async function handleSubmit() {
    await submitParsedResult()
    setInputText('')
  }

  function handleAddAnother() {
    resetForAnother()
    setInputText('')
  }

  function handleCloseCompletion() {
    handleAddAnother()
    navigate('/manual-ai-expense')
  }

  if (isLoading) {
    return <LoadingState label="Loading AI expense input" />
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Manual AI Input"
        title="AI Expense Input"
        description="Type an expense naturally and send the parsed result to your review inbox. Categories may be suggested from your saved merchant rules."
      />

      {error ? (
        <ErrorState title="Unable to process expense input" message={error} />
      ) : null}

      {successRecord ? (
        <CompletionScreen
          record={successRecord}
          onAddAnother={handleAddAnother}
          onClose={handleCloseCompletion}
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <ParserInputCard
            inputText={inputText}
            onExampleClick={handleExampleClick}
            onInputChange={setInputText}
            onParse={handleParse}
          />
          <ParsedPreview
            categories={categories}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onUpdate={updateParsedResult}
            parsedResult={parsedResult}
          />
        </div>
      )}
    </div>
  )
}
