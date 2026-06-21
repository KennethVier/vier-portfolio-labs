export const INBOX_STATUS = {
  approved: 'APPROVED',
  pending: 'PENDING',
  rejected: 'REJECTED',
}

export const INBOX_STATUS_OPTIONS = Object.values(INBOX_STATUS)

export const EMPTY_INBOX_FILTERS = {
  categoryId: '',
  endDate: '',
  search: '',
  startDate: '',
  status: '',
}

export const INBOX_SOURCE_LABELS = {
  manual_ai_input: 'AI Expense Input',
  manual_input: 'Manual Input',
  receipt_scan: 'Receipt Scan',
  sms_parse: 'SMS Parse',
  email_parse: 'Email Parse',
}
