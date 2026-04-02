/**
 * Utility functions for formatting numbers, currency and dates
 * Centralized to ensure consistency across the platform
 */

/**
 * Format a number as VND currency
 * @param amount The value to format
 * @param showCurrency Whether to show the currency symbol (₫)
 */
export const formatCurrency = (amount: number | string, showCurrency = true): string => {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(value)) return '0' + (showCurrency ? '₫' : '');

  return new Intl.NumberFormat('vi-VN', {
    style: showCurrency ? 'currency' : 'decimal',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value).replace(/\s/g, '');
};

/**
 * Format a number with thousands separators (Vietnamese locale)
 * @param value The value to format
 */
export const formatNumber = (value: number | string): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';
  
  return new Intl.NumberFormat('vi-VN').format(num);
};

/**
 * Format a date to Vietnamese locale (DD/MM/YYYY)
 * @param date Input date
 */
export const formatDate = (date: Date | string | number): string => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
};

/**
 * Format a date with time to Vietnamese locale (HH:mm DD/MM/YYYY)
 * @param date Input date
 */
export const formatDateTime = (date: Date | string | number): string => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
};
