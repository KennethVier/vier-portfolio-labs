export const formatPrice = (price) => new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0
}).format(price || 0);

export const titleCase = (value, fallback = 'Featured') => (
  value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : fallback
);