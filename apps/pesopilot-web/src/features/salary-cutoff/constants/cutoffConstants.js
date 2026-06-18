export const CUTOFF_TYPES = [
  { value: 'semi_monthly', label: 'Semi-monthly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'custom', label: 'Custom' },
]

export const LEGACY_CUTOFF_TYPES = [
  { value: 'weekly', label: 'Weekly (Legacy)' },
  { value: 'irregular', label: 'Irregular (Legacy)' },
]

export const CUTOFF_STATUSES = [
  { value: 'planned', label: 'Planned' },
  { value: 'active', label: 'Active' },
  { value: 'closed', label: 'Closed' },
]

export const CUTOFF_TYPE_VALUES = CUTOFF_TYPES.map((type) => type.value)
export const CUTOFF_STATUS_VALUES = CUTOFF_STATUSES.map((status) => status.value)

export function getCutoffTypeLabel(type) {
  return [...CUTOFF_TYPES, ...LEGACY_CUTOFF_TYPES].find(
    (cutoffType) => cutoffType.value === type,
  )?.label ?? type
}
