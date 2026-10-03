import {
  CUTOFF_TREND,
  createEmptyCutoffComparison,
  createEmptyCutoffMetrics,
} from '../../models/cutoffInsight.js'

const STABLE_TOLERANCE_PERCENT = 5
// Trend needs the current cutoff plus at least this many eligible historical cutoffs.
const MIN_TREND_HISTORY = 2
const COMPARED_FIELDS = ['income', 'expenses', 'savings', 'remainingCash']

function round(value, precision = 2) {
  const factor = 10 ** precision

  return Math.round((value + Number.EPSILON) * factor) / factor
}

export function buildComparison(currentTotal, comparisonTotal) {
  if (!Number.isFinite(currentTotal) || !Number.isFinite(comparisonTotal)) {
    return createEmptyCutoffComparison()
  }

  const difference = round(currentTotal - comparisonTotal)

  if (comparisonTotal === 0) {
    return {
      currentTotal,
      comparisonTotal,
      difference,
      percentageChange: 0,
      direction:
        difference === 0
          ? CUTOFF_TREND.stable
          : difference > 0
            ? CUTOFF_TREND.increasing
            : CUTOFF_TREND.decreasing,
    }
  }

  const percentageChange = round((difference / Math.abs(comparisonTotal)) * 100)
  const direction =
    Math.abs(percentageChange) <= STABLE_TOLERANCE_PERCENT
      ? CUTOFF_TREND.stable
      : difference > 0
        ? CUTOFF_TREND.increasing
        : CUTOFF_TREND.decreasing

  return {
    currentTotal,
    comparisonTotal,
    difference,
    percentageChange,
    direction,
  }
}

function toCutoffSummary(snapshot) {
  return {
    cutoffId: snapshot.cutoffId,
    cutoffName: snapshot.cutoffName,
    income: snapshot.income,
    expenses: snapshot.expenses,
    savings: snapshot.savings,
    remainingCash: snapshot.remainingCash,
  }
}

function compareFields(current, baseline) {
  return Object.fromEntries(
    COMPARED_FIELDS.map((field) => [
      field,
      buildComparison(current[field], baseline[field]),
    ]),
  )
}

function averageOf(snapshots) {
  return Object.fromEntries(
    COMPARED_FIELDS.map((field) => [
      field,
      round(
        snapshots.reduce((total, snapshot) => total + snapshot[field], 0) /
          snapshots.length,
      ),
    ]),
  )
}

function rankCutoffs(snapshots) {
  return [...snapshots].sort((first, second) => {
    if (second.remainingCash !== first.remainingCash) {
      return second.remainingCash - first.remainingCash
    }

    return String(second.endDate).localeCompare(String(first.endDate))
  })
}

function getSnapshotMonth(snapshot) {
  if (!snapshot) {
    return null
  }

  const dateValue = snapshot.startDate || snapshot.endDate

  return String(dateValue ?? '').slice(0, 7) || null
}

export function aggregateMonthlyBuckets(snapshots, currentMonth = null) {
  const buckets = new Map()

  for (const snapshot of snapshots) {
    if (!snapshot || !snapshot.hasData || snapshot.status === 'planned') {
      continue
    }

    const monthKey = getSnapshotMonth(snapshot)

    if (!monthKey) {
      continue
    }

    // Exclude current incomplete month and any future months
    if (currentMonth && monthKey >= currentMonth) {
      continue
    }

    if (!buckets.has(monthKey)) {
      buckets.set(monthKey, {
        cutoffCount: 0,
        expenses: 0,
        income: 0,
        monthKey,
        remainingCash: 0,
        savings: 0,
      })
    }

    const bucket = buckets.get(monthKey)

    bucket.cutoffCount += 1
    bucket.income = round(bucket.income + (Number(snapshot.income) || 0))
    bucket.expenses = round(bucket.expenses + (Number(snapshot.expenses) || 0))
    bucket.savings = round(bucket.savings + (Number(snapshot.savings) || 0))
    bucket.remainingCash = round(
      bucket.remainingCash + (Number(snapshot.remainingCash) || 0),
    )
  }

  return Array.from(buckets.values())
}

export function calculateMonthlyAverage(monthlyBuckets) {
  if (!monthlyBuckets || monthlyBuckets.length === 0) {
    return null
  }

  const monthCount = monthlyBuckets.length

  return Object.fromEntries(
    COMPARED_FIELDS.map((field) => [
      field,
      round(
        monthlyBuckets.reduce((total, bucket) => total + bucket[field], 0) /
          monthCount,
      ),
    ]),
  )
}

export function buildCutoffMetrics(context) {
  const metrics = createEmptyCutoffMetrics()

  if (!context.currentCutoff || !context.current?.hasData) {
    return metrics
  }

  const { current, previous, history } = context
  const dataHistory = history.filter((snapshot) => snapshot.hasData)

  metrics.currentCutoff = toCutoffSummary(current)

  if (previous?.hasData) {
    metrics.previousCutoff = toCutoffSummary(previous)
    metrics.previousCutoffComparison = compareFields(current, previous)
  }

  if (dataHistory.length > 0) {
    const currentMonth =
      getSnapshotMonth(current) || getSnapshotMonth(context.currentCutoff)
    const monthlyBuckets = currentMonth
      ? aggregateMonthlyBuckets(dataHistory, currentMonth)
      : []
    const monthlyAverage = calculateMonthlyAverage(monthlyBuckets)

    if (monthlyAverage) {
      const totalCutoffCount = monthlyBuckets.reduce(
        (sum, bucket) => sum + bucket.cutoffCount,
        0,
      )

      metrics.averageComparison = {
        cutoffCount: totalCutoffCount,
        monthCount: monthlyBuckets.length,
        ...compareFields(current, monthlyAverage),
      }
    }

    const ranked = rankCutoffs([current, ...dataHistory])

    metrics.bestCutoff = toCutoffSummary(ranked[0])
    metrics.worstCutoff = toCutoffSummary(ranked[ranked.length - 1])

    if (dataHistory.length >= MIN_TREND_HISTORY) {
      const cutoffAverage = averageOf(dataHistory)
      const cutoffAverageComparison = compareFields(current, cutoffAverage)

      metrics.trend = {
        direction: cutoffAverageComparison.remainingCash.direction,
        basis: 'remainingCash',
        cutoffsCompared: dataHistory.length + 1,
      }
    }
  }

  return metrics
}

export const cutoffMetricsInternals = {
  aggregateMonthlyBuckets,
  calculateMonthlyAverage,
  getSnapshotMonth,
  rankCutoffs,
}

