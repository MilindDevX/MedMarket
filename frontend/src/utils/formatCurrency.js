/**
 * Format a number as Indian Rupees with exactly 2 decimal places.
 * Uses the browser's Intl API so separators are locale-aware.
 *
 * @param {number|string} amount
 * @returns {string}  e.g. "₹1,234.50"
 */
export function formatCurrency(amount) {
  const n = Number(amount);
  if (isNaN(n)) return '₹0.00';
  return '₹' + n.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
