export function isCurrentCutoffRecord(record, currentCutoff) {
  return Boolean(
    currentCutoff?.id &&
      record?.cutoffId &&
      String(record.cutoffId) === String(currentCutoff.id),
  )
}

export function filterRecordsByCurrentCutoff(records = [], currentCutoff = null) {
  return records.filter((record) => isCurrentCutoffRecord(record, currentCutoff))
}
