import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { PageHeader, SectionCard, StatusBadge } from '@/components/dashboard'
import { useHeader } from '@/components/layout/headerContext.js'
import { Button } from '@/components/ui/Button.jsx'
import { EmptyState } from '@/components/ui/EmptyState.jsx'
import { ErrorState } from '@/components/ui/ErrorState.jsx'
import { Input } from '@/components/ui/Input.jsx'
import { LoadingState } from '@/components/ui/LoadingState.jsx'

import { PAYMENT_METHODS } from '@/features/expenses/constants/expenseConstants.js'
import { CATEGORY_SOURCES } from '@/features/merchant-rules/services/merchantRuleMatcher.js'

import { useManualAiExpense } from '../hooks/useManualAiExpense.js'

const examplePrompts = [
  'Bought Jollibee for 250 yesterday using GCash',
  'Paid Meralco bill 1850 today',
  'Grab ride 320 from office to home',
  'Coffee at Starbucks 180',
  'Shopee order 999 on 2026-06-20',
]

function getConfidenceTone(confidence) {
  if (confidence >= 0.8) {
    return 'success'
  }

  if (confidence >= 0.6) {
    return 'warning'
  }

  return 'critical'
}

function formatCategorySource(source) {
  const labels = {
    manual_override: 'Manual Override',
    merchant_rule: 'Merchant Rule',
    parser_guess: 'Parser Guess',
    unknown: 'Unknown',
  }

  return labels[source] ?? 'Parser Guess'
}

function ParserInputCard({ inputText, onExampleClick, onInputChange, onParse }) {
  return (
    <SectionCard
      title="Natural Language Input"
      description="Type one expense in plain language. Parsed records still require inbox approval."
    >
      <div className="space-y-4">
        <label className="block space-y-2">
          <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
            Expense Text
          </span>
          <textarea
            className="min-h-28 w-full rounded border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-sm text-on-surface outline-none transition placeholder:text-on-surface-variant/70 focus:border-primary focus:ring-2 focus:ring-primary/15"
            placeholder="Example: Bought Jollibee for 250 yesterday using GCash"
            value={inputText}
            onChange={(event) => onInputChange(event.target.value)}
          />
        </label>

        <div className="flex flex-wrap gap-2">
          {examplePrompts.map((example) => (
            <button
              key={example}
              type="button"
              className="rounded border border-outline-variant bg-surface-container-lowest px-2.5 py-1 text-left text-body-sm text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
              onClick={() => onExampleClick(example)}
            >
              {example}
            </button>
          ))}
        </div>

        <div className="flex justify-end">
          <Button onClick={onParse} disabled={!inputText.trim()}>
            <span className="material-symbols-outlined text-sm">auto_awesome</span>
            Parse Expense
          </Button>
        </div>
      </div>
    </SectionCard>
  )
}

function ParsedPreview({
  categories,
  isSubmitting,
  onSubmit,
  onUpdate,
  parsedResult,
}) {
  const categoryNameById = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  )
  const canSubmit =
    parsedResult?.amount > 0 &&
    parsedResult?.merchant?.trim() &&
    parsedResult?.transactionDate &&
    parsedResult?.suggestedCategoryId

  if (!parsedResult) {
    return (
      <EmptyState
        title="No parsed result yet"
        message="Enter an expense and run the parser to preview the detected fields."
      />
    )
  }

  function updateCategory(categoryId) {
    onUpdate({
      categoryName: categoryNameById.get(categoryId) ?? 'Other',
      categorySource: CATEGORY_SOURCES.manualOverride,
      merchantRuleId: null,
      suggestedCategoryId: categoryId,
    })
  }

  return (
    <SectionCard
      title="Parsed Result Preview"
      description="Review and correct the fields before sending this item to Expense Inbox."
      actions={
        <StatusBadge tone={getConfidenceTone(parsedResult.confidence)}>
          {Math.round(parsedResult.confidence * 100)}% confidence
        </StatusBadge>
      }
    >
      <div className="space-y-4">
        {parsedResult.warnings.length > 0 ? (
          <div className="rounded border border-tertiary/30 bg-tertiary-container/20 p-3">
            <p className="mb-2 font-label-caps text-label-caps uppercase text-tertiary">
              Parser Warnings
            </p>
            <ul className="list-disc space-y-1 pl-5 text-body-sm text-on-surface">
              {parsedResult.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Input
            id="manual-ai-amount"
            label="Amount"
            min="0"
            step="0.01"
            type="number"
            value={parsedResult.amount ?? ''}
            onChange={(event) =>
              onUpdate({
                amount:
                  event.target.value === '' ? null : Number(event.target.value),
              })
            }
          />
          <Input
            id="manual-ai-merchant"
            label="Merchant"
            value={parsedResult.merchant}
            onChange={(event) => onUpdate({ merchant: event.target.value })}
          />
          <Input
            id="manual-ai-date"
            label="Date"
            type="date"
            value={parsedResult.transactionDate}
            onChange={(event) =>
              onUpdate({ transactionDate: event.target.value })
            }
          />

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-content">
              Payment Method
            </span>
            <select
              className="min-h-9 w-full rounded border border-outline-variant bg-surface-container-lowest px-3 text-sm leading-5 text-content outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
              value={parsedResult.suggestedPaymentMethod ?? ''}
              onChange={(event) =>
                onUpdate({ suggestedPaymentMethod: event.target.value })
              }
            >
              <option value="">No payment method</option>
              {PAYMENT_METHODS.map((paymentMethod) => (
                <option key={paymentMethod} value={paymentMethod}>
                  {paymentMethod}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-content">
              Category
            </span>
            <select
              className="min-h-9 w-full rounded border border-outline-variant bg-surface-container-lowest px-3 text-sm leading-5 text-content outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
              value={parsedResult.suggestedCategoryId}
              onChange={(event) => updateCategory(event.target.value)}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <div className="rounded border border-outline-variant bg-surface-container p-3">
            <p className="font-label-caps text-label-caps uppercase text-on-surface-variant">
              Category Source
            </p>
            <p className="mt-1 text-body-sm font-medium text-on-surface">
              {formatCategorySource(parsedResult.categorySource)}
            </p>
          </div>

          <Input
            id="manual-ai-note"
            label="Note"
            value={parsedResult.note}
            onChange={(event) => onUpdate({ note: event.target.value })}
          />
        </div>

        <div className="rounded border border-outline-variant bg-surface-container p-3">
          <p className="font-label-caps text-label-caps uppercase text-on-surface-variant">
            Raw Text
          </p>
          <p className="mt-1 text-body-sm text-on-surface">
            {parsedResult.rawText}
          </p>
        </div>

        <div className="flex justify-end">
          <Button onClick={onSubmit} disabled={!canSubmit || isSubmitting}>
            Send to Expense Inbox
          </Button>
        </div>
      </div>
    </SectionCard>
  )
}

function SuccessPanel({ record }) {
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
  const { resetHeaderConfig, setHeaderConfig } = useHeader()
  const [inputText, setInputText] = useState('')
  const {
    categories,
    error,
    isLoading,
    isSubmitting,
    parseInput,
    parsedResult,
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

      <SuccessPanel record={successRecord} />

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
    </div>
  )
}
