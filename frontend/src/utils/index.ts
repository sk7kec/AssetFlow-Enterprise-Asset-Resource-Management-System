import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import dayjs from 'dayjs';

/**
 * Merges Tailwind CSS classes with clsx and tailwind-merge.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a currency value.
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Formats a date string using Day.js.
 */
export function formatDate(date: string | Date | null | undefined, formatStr = 'MMM DD, YYYY'): string {
  if (!date) return '-';
  return dayjs(date).format(formatStr);
}

/**
 * Formats a date and time string.
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  return dayjs(date).format('MMM DD, YYYY hh:mm A');
}

/**
 * Formats file size in bytes to a human-readable string.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Parses Axios API error into a friendly user-facing message.
 */
export function parseApiError(error: any): string {
  if (!error) return 'An unknown error occurred';
  
  if (typeof error === 'string') return error;

  // Axios response error
  if (error.response?.data) {
    const data = error.response.data;
    if (typeof data.detail === 'string') {
      return data.detail;
    }
    if (Array.isArray(data.detail)) {
      // Extract only the human-readable msg, strip FastAPI 'Value error, ' prefix
      return data.detail
        .map((err: any) => {
          const msg: string = typeof err.msg === 'string' ? err.msg : String(err.msg);
          return msg.replace(/^Value error,\s*/i, '');
        })
        .join('. ');
    }
    if (data.message) {
      return data.message;
    }
  }

  // Network/Connection error
  if (error.message) {
    return error.message;
  }

  return 'An error occurred while communicating with the server';
}

/**
 * Generates an avatar placeholder text from name.
 */
export function getInitials(name: string): string {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
