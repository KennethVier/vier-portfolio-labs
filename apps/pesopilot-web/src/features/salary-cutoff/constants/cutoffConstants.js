export const CUTOFF_TYPES = [
  { value: 'semi_monthly', label: 'Semi-monthly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'custom', label: 'Custom' },
  { value: 'irregular', label: 'Irregular' },
]

export const CUTOFF_STATUSES = [
  { value: 'planned', label: 'Planned' },
  { value: 'active', label: 'Active' },
  { value: 'closed', label: 'Closed' },
]

export const CUTOFF_TYPE_VALUES = CUTOFF_TYPES.map((type) => type.value)
export const CUTOFF_STATUS_VALUES = CUTOFF_STATUSES.map((status) => status.value)
