const DATE_PARTS = /^(\d{4})-(\d{2})-(\d{2})$/

function parseIsoDate(value) {
  const match = DATE_PARTS.exec(value)

  if (!match) {
    throw new Error('Invalid reference date')
  }

  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
}

function formatIsoDate(date) {
  return date.toISOString().slice(0, 10)
}

function daysInMonth(year, monthIndex) {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()
}

function addDays(date, days) {
  const nextDate = new Date(date)
  nextDate.setUTCDate(nextDate.getUTCDate() + days)
  return nextDate
}

function addMonths(year, monthIndex, monthOffset) {
  const date = new Date(Date.UTC(year, monthIndex + monthOffset, 1))

  return {
    monthIndex: date.getUTCMonth(),
    year: date.getUTCFullYear(),
  }
}

export function createPaydayDate(year, monthIndex, payday) {
  const clampedDay = Math.min(payday, daysInMonth(year, monthIndex))

  return new Date(Date.UTC(year, monthIndex, clampedDay))
}

function buildMonthlyPaydays(referenceDate, payday) {
  const year = referenceDate.getUTCFullYear()
  const monthIndex = referenceDate.getUTCMonth()

  return [-1, 0, 1, 2].map((offset) => {
    const month = addMonths(year, monthIndex, offset)
    return createPaydayDate(month.year, month.monthIndex, payday)
  })
}

function buildSemiMonthlyPaydays(referenceDate, payday1, payday2) {
  const year = referenceDate.getUTCFullYear()
  const monthIndex = referenceDate.getUTCMonth()
  const uniqueTimestamps = new Set()

  return [-1, 0, 1, 2]
    .flatMap((offset) => {
      const month = addMonths(year, monthIndex, offset)

      return [
        createPaydayDate(month.year, month.monthIndex, payday1),
        createPaydayDate(month.year, month.monthIndex, payday2),
      ]
    })
    .filter((date) => {
      const timestamp = date.getTime()

      if (uniqueTimestamps.has(timestamp)) {
        return false
      }

      uniqueTimestamps.add(timestamp)
      return true
    })
    .sort((firstDate, secondDate) => firstDate.getTime() - secondDate.getTime())
}

function findCurrentCycle(paydays, referenceDate) {
  const referenceTimestamp = referenceDate.getTime()
  let startIndex = -1

  for (let index = 0; index < paydays.length; index += 1) {
    if (paydays[index].getTime() <= referenceTimestamp) {
      startIndex = index
    }
  }

  if (startIndex < 0 || !paydays[startIndex + 1]) {
    throw new Error('Unable to generate salary cutoff cycle')
  }

  return {
    startDate: formatIsoDate(paydays[startIndex]),
    endDate: formatIsoDate(addDays(paydays[startIndex + 1], -1)),
  }
}

export function generateMonthlyCycle({ payday1, referenceDate }) {
  const parsedReferenceDate = parseIsoDate(referenceDate)

  return findCurrentCycle(
    buildMonthlyPaydays(parsedReferenceDate, payday1),
    parsedReferenceDate,
  )
}

export function generateSemiMonthlyCycle({ payday1, payday2, referenceDate }) {
  const parsedReferenceDate = parseIsoDate(referenceDate)

  return findCurrentCycle(
    buildSemiMonthlyPaydays(parsedReferenceDate, payday1, payday2),
    parsedReferenceDate,
  )
}

export function generateNextMonthlyCycle({ payday1, referenceDate }) {
  const currentCycle = generateMonthlyCycle({ payday1, referenceDate })

  return generateMonthlyCycle({
    payday1,
    referenceDate: formatIsoDate(addDays(parseIsoDate(currentCycle.endDate), 1)),
  })
}

export function generateNextSemiMonthlyCycle({ payday1, payday2, referenceDate }) {
  const currentCycle = generateSemiMonthlyCycle({ payday1, payday2, referenceDate })

  return generateSemiMonthlyCycle({
    payday1,
    payday2,
    referenceDate: formatIsoDate(addDays(parseIsoDate(currentCycle.endDate), 1)),
  })
}

export function generateSalaryCutoffCycle({
  payday1,
  payday2,
  referenceDate,
  type,
}) {
  if (type === 'monthly') {
    return generateMonthlyCycle({ payday1, referenceDate })
  }

  if (type === 'semi_monthly') {
    return generateSemiMonthlyCycle({ payday1, payday2, referenceDate })
  }

  throw new Error('Unsupported generated cutoff type')
}
