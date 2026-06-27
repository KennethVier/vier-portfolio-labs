import { useState } from 'react'

import { ErrorState } from '@/components/ui/ErrorState.jsx'
import { LoadingState } from '@/components/ui/LoadingState.jsx'
import { Modal } from '@/components/ui/Modal.jsx'

import { useManualAiExpense } from '../hooks/useManualAiExpense.js'
import {
  CompletionScreen,
  ParsedPreview,
  ParserInputCard,
} from '../pages/ManualAiExpensePage.jsx'

export function AiQuickAddModal({ isOpen, onClose }) {
  const [inputText, setInputText] = useState('')
  const {
    categories,
    error,
    isLoading,
    isSubmitting,
    parseInput,
    parsedResult,
    resetForAnother,
    resetParser,
    submitParsedResult,
    successRecord,
    updateParsedResult,
  } = useManualAiExpense()

  function handleClose() {
    resetParser()
    setInputText('')
    onClose()
  }

  async function handleExampleClick(example) {
    setInputText(example)
    await parseInput(example)
  }

  async function handleParse() {
    await parseInput(inputText)
  }

  async function handleSubmit() {
    await submitParsedResult()
    setInputText('')
  }

  function handleAddAnother() {
    resetForAnother()
    setInputText('')
  }

  return (
    <Modal
      isOpen={isOpen}
      title="AI Quick Add Expense"
      description="Type an expense naturally. Parsed records still require Expense Inbox approval."
      size="xl"
      onClose={handleClose}
    >
      {isLoading ? (
        <LoadingState label="Loading AI quick add" />
      ) : (
        <div className="space-y-4">
          {error ? (
            <ErrorState title="Unable to process expense input" message={error} />
          ) : null}
          {successRecord ? (
            <CompletionScreen
              record={successRecord}
              onAddAnother={handleAddAnother}
              onClose={handleClose}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <ParserInputCard
                inputText={inputText}
                onExampleClick={handleExampleClick}
                onInputChange={setInputText}
                onParse={handleParse}
              />
              <ParsedPreview
                categories={categories}
                isSubmitting={isSubmitting}
                parsedResult={parsedResult}
                onSubmit={handleSubmit}
                onUpdate={updateParsedResult}
              />
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
