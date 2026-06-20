import { detectedExpenseRepository } from '@/lib/db/repositories/detectedExpenseRepository.js'
import { expenseRepository } from '@/lib/db/repositories/expenseRepository.js'
import { incomeRepository } from '@/lib/db/repositories/incomeRepository.js'
import { salaryCutoffRepository } from '@/lib/db/repositories/salaryCutoffRepository.js'
import { savingsRepository } from '@/lib/db/repositories/savingsRepository.js'

import { expenseService } from '@/features/expenses/services/expenseService.js'
import { incomeService } from '@/features/income/services/incomeService.js'
import { generateSalaryCutoffCycle } from '@/features/salary-cutoff/services/cutoffCycle.js'
import { cutoffService } from '@/features/salary-cutoff/services/cutoffService.js'
import { savingsService } from '@/features/savings/services/savingsService.js'

export const QA_SEED_MARKER = 'QA_SEED'

const expenseSamples = [
  { merchant: 'Jollibee', categoryId: 'food', paymentMethod: 'Cash', amount: 250 },
  { merchant: "McDonald's", categoryId: 'food', paymentMethod: 'GCash', amount: 320 },
  { merchant: 'Grab', categoryId: 'transport', paymentMethod: 'Credit Card', amount: 180 },
  { merchant: 'Maya', categoryId: 'other', paymentMethod: 'Maya', amount: 600 },
  { merchant: 'GCash', categoryId: 'other', paymentMethod: 'GCash', amount: 850 },
  { merchant: 'Meralco', categoryId: 'bills', paymentMethod: 'Bank Transfer', amount: 3200 },
  { merchant: 'Maynilad', categoryId: 'bills', paymentMethod: 'Bank Transfer', amount: 1100 },
  { merchant: 'Shopee', categoryId: 'shopping', paymentMethod: 'Maya', amount: 1450 },
  { merchant: 'Lazada', categoryId: 'shopping', paymentMethod: 'Debit Card', amount: 980 },
  { merchant: '7-Eleven', categoryId: 'groceries', paymentMethod: 'Cash', amount: 165 },
]

const incomeSamples = [
  { source: 'Salary', amount: 42000 },
  { source: 'Freelance', amount: 18000 },
  { source: 'Bonus', amount: 10000 },
]

const savingsSamples = [
  { source: 'Emergency Fund', amount: 5000 },
  { source: 'General Savings', amount: 3000 },
  { source: 'Travel Fund', amount: 2500 },
]

const inboxSamples = [
  { merchant: 'Grab Ride', amount: 220, categoryId: 'transport', paymentMethod: 'GCash' },
  { merchant: 'Jollibee', amount: 275, categoryId: 'food', paymentMethod: 'Cash' },
  { merchant: 'Shopee Order', amount: 1280, categoryId: 'shopping', paymentMethod: 'Maya' },
  { merchant: '7-Eleven', amount: 190, categoryId: 'groceries', paymentMethod: 'Cash' },
  { merchant: 'Meralco Bill', amount: 3500, categoryId: 'bills', paymentMethod: 'Bank Transfer' },
]

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

function parseIsoDate(value) {
  return new Date(`${value}T00:00:00.000Z`)
}

function formatIsoDate(date) {
  return date.toISOString().slice(0, 10)
}

function addDays(date, days) {
  const nextDate = new Date(date)
  nextDate.setUTCDate(nextDate.getUTCDate() + days)
  return nextDate
}

function addMonths(date, months) {
  const nextDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
  nextDate.setUTCMonth(nextDate.getUTCMonth() + months)
  return nextDate
}

function shiftReferenceDateByMonths(referenceDate, months) {
  const parsedDate = parseIsoDate(referenceDate)
  const shiftedMonth = new Date(
    Date.UTC(parsedDate.getUTCFullYear(), parsedDate.getUTCMonth() + months, 1),
  )
  const lastDay = new Date(
    Date.UTC(shiftedMonth.getUTCFullYear(), shiftedMonth.getUTCMonth() + 1, 0),
  ).getUTCDate()

  return formatIsoDate(
    new Date(
      Date.UTC(
        shiftedMonth.getUTCFullYear(),
        shiftedMonth.getUTCMonth(),
        Math.min(parsedDate.getUTCDate(), lastDay),
      ),
    ),
  )
}

function getDateInMonth(baseDate, day) {
  const lastDay = new Date(
    Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth() + 1, 0),
  ).getUTCDate()

  return formatIsoDate(
    new Date(
      Date.UTC(
        baseDate.getUTCFullYear(),
        baseDate.getUTCMonth(),
        Math.min(day, lastDay),
      ),
    ),
  )
}

function getDateInsideRange(startDate, endDate, offset) {
  const start = parseIsoDate(startDate)
  const end = parseIsoDate(endDate)
  const totalDays = Math.max(
    0,
    Math.floor((end.getTime() - start.getTime()) / 86400000),
  )

  return formatIsoDate(addDays(start, totalDays === 0 ? 0 : offset % (totalDays + 1)))
}

function getQANote(label) {
  return `${QA_SEED_MARKER} ${label}`
}

function hasMarker(value) {
  return String(value ?? '').includes(QA_SEED_MARKER)
}

function rangesOverlap(firstRange, secondRange) {
  return (
    firstRange.startDate <= secondRange.endDate &&
    firstRange.endDate >= secondRange.startDate
  )
}

function getInboxStatus(index) {
  if (index % 10 === 8) {
    return 'REJECTED'
  }

  if (index % 10 === 9) {
    return 'APPROVED'
  }

  return 'PENDING'
}

function buildBasicCutoffSpecs(referenceDate) {
  return [
    {
      expectedIncome: 42000,
      name: `${QA_SEED_MARKER} Previous Salary Cycle`,
      payday1: 10,
      payday2: 25,
      referenceDate: formatIsoDate(addDays(parseIsoDate(referenceDate), -14)),
      status: 'closed',
      type: 'semi_monthly',
    },
    {
      expectedIncome: 42000,
      name: `${QA_SEED_MARKER} Current Salary Cycle`,
      payday1: 10,
      payday2: 25,
      referenceDate,
      status: 'active',
      type: 'semi_monthly',
    },
  ]
}

function buildLargeCutoffSpecs(referenceDate) {
  const reference = parseIsoDate(referenceDate)
  const specs = []

  for (let monthOffset = -5; monthOffset <= -3; monthOffset += 1) {
    const month = addMonths(reference, monthOffset)
    specs.push({
      expectedIncome: 48000,
      name: `${QA_SEED_MARKER} Monthly ${getDateInMonth(month, 25)}`,
      payday1: 25,
      referenceDate: getDateInMonth(month, 25),
      status: 'closed',
      type: 'monthly',
    })
  }

  for (let monthOffset = -2; monthOffset <= 0; monthOffset += 1) {
    const month = addMonths(reference, monthOffset)
    const shouldCreateFirstHalf = monthOffset > -2

    if (shouldCreateFirstHalf) {
      specs.push({
        expectedIncome: 25000,
        name: `${QA_SEED_MARKER} Semi ${getDateInMonth(month, 10)}`,
        payday1: 10,
        payday2: 25,
        referenceDate: getDateInMonth(month, 10),
        status: monthOffset === 0 ? 'planned' : 'closed',
        type: 'semi_monthly',
      })
    }

    specs.push({
      expectedIncome: 25000,
      name: `${QA_SEED_MARKER} Semi ${getDateInMonth(month, 25)}`,
      payday1: 10,
      payday2: 25,
      referenceDate: getDateInMonth(month, 25),
      status: monthOffset === 0 ? 'active' : 'closed',
      type: 'semi_monthly',
    })
  }

  return specs
}

function pickCutoff(cutoffs, index) {
  return cutoffs[index % cutoffs.length]
}

function buildExpensePayload(cutoff, index) {
  const sample = expenseSamples[index % expenseSamples.length]
  const amount = Math.min(5000, sample.amount + ((index * 137) % 850))

  return {
    amount,
    categoryId: sample.categoryId,
    cutoffId: cutoff.id,
    date: getDateInsideRange(cutoff.startDate, cutoff.endDate, index),
    merchant: sample.merchant,
    note: getQANote(`expense ${index + 1}`),
    paymentMethod: sample.paymentMethod,
    source: 'manual',
  }
}

function buildIncomePayload(cutoff, index) {
  const sample = incomeSamples[index % incomeSamples.length]

  return {
    amount: Math.min(60000, sample.amount + ((index * 2500) % 8000)),
    cutoffId: cutoff.id,
    date: cutoff.startDate,
    note: getQANote(`income ${index + 1}`),
    source: sample.source,
  }
}

function buildSavingsPayload(cutoff, index) {
  const sample = savingsSamples[index % savingsSamples.length]

  return {
    amount: Math.min(10000, sample.amount + ((index * 700) % 2500)),
    cutoffId: cutoff.id,
    date: getDateInsideRange(cutoff.startDate, cutoff.endDate, index + 3),
    note: getQANote(`savings ${index + 1}`),
    source: sample.source,
  }
}

function buildInboxRecord(referenceDate, index) {
  const sample = inboxSamples[index % inboxSamples.length]
  const timestamp = `${referenceDate}T08:00:00.000Z`

  return {
    amount: Math.min(5000, sample.amount + ((index * 89) % 600)),
    confidence: 0.78 + ((index % 4) * 0.04),
    createdAt: timestamp,
    merchant: sample.merchant,
    note: getQANote(`detected ${index + 1}`),
    rawText: `${QA_SEED_MARKER} ${sample.merchant} PHP ${sample.amount}`,
    reviewedAt: getInboxStatus(index) === 'PENDING' ? null : timestamp,
    source: index % 2 === 0 ? 'receipt_scan' : 'manual_input',
    status: getInboxStatus(index),
    suggestedCategoryId: sample.categoryId,
    suggestedPaymentMethod: sample.paymentMethod,
    transactionDate: formatIsoDate(addDays(parseIsoDate(referenceDate), -(index % 30))),
    updatedAt: timestamp,
  }
}

function getCutoffSpecRange(cutoffSpec) {
  if (cutoffSpec.type === 'custom') {
    return {
      endDate: cutoffSpec.endDate,
      startDate: cutoffSpec.startDate,
    }
  }

  return generateSalaryCutoffCycle({
    payday1: cutoffSpec.payday1,
    payday2: cutoffSpec.payday2,
    referenceDate: cutoffSpec.referenceDate,
    type: cutoffSpec.type,
  })
}

function specsOverlapExistingCutoffs(cutoffSpecs, existingCutoffs) {
  const generatedRanges = cutoffSpecs.map(getCutoffSpecRange)

  return generatedRanges.some((generatedRange, index) => {
    const overlapsEarlierSeedRange = generatedRanges
      .slice(0, index)
      .some((existingSeedRange) => rangesOverlap(generatedRange, existingSeedRange))
    const overlapsExistingRange = existingCutoffs.some((existingCutoff) =>
      rangesOverlap(generatedRange, existingCutoff),
    )

    return overlapsEarlierSeedRange || overlapsExistingRange
  })
}

function preserveUserActiveCutoff(cutoffSpecs, existingCutoffs) {
  const hasUserActiveCutoff = existingCutoffs.some(
    (cutoff) => cutoff.status === 'active' && !hasMarker(cutoff.name),
  )

  if (!hasUserActiveCutoff) {
    return cutoffSpecs
  }

  return cutoffSpecs.map((cutoffSpec) => ({
    ...cutoffSpec,
    status: cutoffSpec.status === 'active' ? 'planned' : cutoffSpec.status,
  }))
}

async function buildNonOverlappingSeedPlan(buildCutoffSpecs, referenceDate) {
  const existingCutoffs = await salaryCutoffRepository.findAll()

  for (let monthOffset = 0; monthOffset <= 60; monthOffset += 1) {
    const candidateReferenceDate = shiftReferenceDateByMonths(referenceDate, monthOffset)
    const cutoffSpecs = preserveUserActiveCutoff(
      buildCutoffSpecs(candidateReferenceDate),
      existingCutoffs,
    )

    if (!specsOverlapExistingCutoffs(cutoffSpecs, existingCutoffs)) {
      return {
        cutoffSpecs,
        referenceDate: candidateReferenceDate,
      }
    }
  }

  throw new Error('Unable to find a non-overlapping QA seed cutoff window')
}

async function clearRecords(repository, isQaRecord) {
  const records = await repository.findAll()
  const qaRecords = records.filter(isQaRecord)

  await Promise.all(qaRecords.map((record) => repository.remove(record.id)))

  return qaRecords.length
}

async function clearQaGeneratedData({ includeCutoffs = true } = {}) {
  const [
    salaryCutoffs,
    expenses,
    income,
    savings,
    detectedExpenses,
  ] = await Promise.all([
    includeCutoffs
      ? clearRecords(salaryCutoffRepository, (record) => hasMarker(record.name))
      : Promise.resolve(0),
    clearRecords(expenseRepository, (record) => hasMarker(record.note)),
    clearRecords(incomeRepository, (record) => hasMarker(record.note)),
    clearRecords(savingsRepository, (record) => hasMarker(record.note)),
    clearRecords(
      detectedExpenseRepository,
      (record) => hasMarker(record.rawText) || hasMarker(record.note),
    ),
  ])

  return {
    detectedExpenses,
    expenses,
    income,
    salaryCutoffs,
    savings,
    total: salaryCutoffs + expenses + income + savings + detectedExpenses,
  }
}

async function createCutoffs(cutoffSpecs) {
  const cutoffs = []

  for (const cutoffSpec of cutoffSpecs) {
    cutoffs.push(await cutoffService.createCutoff(cutoffSpec))
  }

  return cutoffs
}

async function createExpenses(count, cutoffs) {
  for (let index = 0; index < count; index += 1) {
    await expenseService.createExpense(buildExpensePayload(pickCutoff(cutoffs, index), index))
  }

  return count
}

async function createIncome(count, cutoffs) {
  for (let index = 0; index < count; index += 1) {
    await incomeService.createIncome(buildIncomePayload(pickCutoff(cutoffs, index), index))
  }

  return count
}

async function createSavings(count, cutoffs) {
  for (let index = 0; index < count; index += 1) {
    await savingsService.createSavings(buildSavingsPayload(pickCutoff(cutoffs, index), index))
  }

  return count
}

async function createInboxItems(count, referenceDate) {
  for (let index = 0; index < count; index += 1) {
    await detectedExpenseRepository.create(buildInboxRecord(referenceDate, index))
  }

  return count
}

async function findActiveCutoff() {
  const cutoffs = await salaryCutoffRepository.findAll()
  return cutoffs.find((cutoff) => cutoff.status === 'active') ?? null
}

export async function clearQaData() {
  return clearQaGeneratedData()
}

async function seedDataset({
  buildCutoffSpecs,
  detectedExpenseCount,
  expenseCount,
  incomeCount,
  referenceDate,
  savingsCount,
  targetActiveCutoff = false,
}) {
  if (targetActiveCutoff) {
    const activeCutoff = await findActiveCutoff()

    if (activeCutoff) {
      await clearQaGeneratedData({ includeCutoffs: false })

      const [expenses, income, savings, detectedExpenses] = await Promise.all([
        createExpenses(expenseCount, [activeCutoff]),
        createIncome(incomeCount, [activeCutoff]),
        createSavings(savingsCount, [activeCutoff]),
        createInboxItems(detectedExpenseCount, activeCutoff.startDate),
      ])

      return {
        detectedExpenses,
        expenses,
        income,
        message: `Seeded ledger records into active cutoff: ${activeCutoff.name}`,
        salaryCutoffs: 0,
        savings,
        target: 'activeCutoff',
      }
    }
  }

  await clearQaData()
  const seedPlan = await buildNonOverlappingSeedPlan(buildCutoffSpecs, referenceDate)
  const cutoffs = await createCutoffs(seedPlan.cutoffSpecs)

  const [expenses, income, savings, detectedExpenses] = await Promise.all([
    createExpenses(expenseCount, cutoffs),
    createIncome(incomeCount, cutoffs),
    createSavings(savingsCount, cutoffs),
    createInboxItems(detectedExpenseCount, seedPlan.referenceDate),
  ])

  return {
    detectedExpenses,
    expenses,
    income,
    message: targetActiveCutoff
      ? 'No active cutoff found. Seeded generated QA cutoffs instead.'
      : 'Seeded generated QA cutoffs.',
    salaryCutoffs: cutoffs.length,
    savings,
    target: 'generatedCutoffs',
  }
}

export async function seedBasicDataset(
  referenceDate = todayIsoDate(),
  { targetActiveCutoff = false } = {},
) {
  return seedDataset({
    buildCutoffSpecs: buildBasicCutoffSpecs,
    detectedExpenseCount: 3,
    expenseCount: 10,
    incomeCount: 3,
    referenceDate,
    savingsCount: 3,
    targetActiveCutoff,
  })
}

export async function seedLargeDataset(
  referenceDate = todayIsoDate(),
  { targetActiveCutoff = false } = {},
) {
  return seedDataset({
    buildCutoffSpecs: buildLargeCutoffSpecs,
    detectedExpenseCount: 20,
    expenseCount: 200,
    incomeCount: 20,
    referenceDate,
    savingsCount: 20,
    targetActiveCutoff,
  })
}

export async function seedExpenseInboxItems(referenceDate = todayIsoDate()) {
  const cleared = await clearRecords(
    detectedExpenseRepository,
    (record) => hasMarker(record.rawText) || hasMarker(record.note),
  )
  const detectedExpenses = await createInboxItems(20, referenceDate)

  return {
    cleared,
    detectedExpenses,
  }
}

export const devQaSeedInternals = {
  buildBasicCutoffSpecs,
  buildExpensePayload,
  buildInboxRecord,
  buildLargeCutoffSpecs,
  buildNonOverlappingSeedPlan,
  clearQaGeneratedData,
  getDateInsideRange,
  hasMarker,
}
