// src/lib/utils.js
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combines multiple class names and merges Tailwind classes
 * @param {...any} inputs - Class names to combine
 * @returns {string} Combined class names
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a date to a readable string
 * @param {string|Date} date - Date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export function formatDate(date, options = {}) {
  if (!date) return 'N/A'
  
  const d = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(d.getTime())) return 'N/A'
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }
  
  return d.toLocaleDateString('en-US', { ...defaultOptions, ...options })
}

/**
 * Formats a date to a short string (just date)
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDateShort(date) {
  if (!date) return 'N/A'
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return 'N/A'
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Formats a number as currency (KES)
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount) {
  if (amount === undefined || amount === null) return 'KES 0'
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

/**
 * Formats file size in bytes to human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Human readable file size
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return 'N/A'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`
}

/**
 * Truncates text to a specified length
 * @param {string} text - Text to truncate
 * @param {number} length - Maximum length
 * @param {string} suffix - Suffix to add (default: '...')
 * @returns {string} Truncated text
 */
export function truncateText(text, length = 50, suffix = '...') {
  if (!text) return ''
  if (text.length <= length) return text
  return text.substring(0, length) + suffix
}

/**
 * Generates a random string
 * @param {number} length - Length of the string
 * @returns {string} Random string
 */
export function generateRandomString(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Validates an email address
 * @param {string} email - Email to validate
 * @returns {boolean} Whether the email is valid
 */
export function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

/**
 * Validates a phone number (Kenyan format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} Whether the phone number is valid
 */
export function isValidPhone(phone) {
  return /^\+254[0-9]{9}$/.test(phone) || /^0[17][0-9]{8}$/.test(phone)
}

/**
 * Validates password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation results
 */
export function validatePassword(password) {
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*]/.test(password),
    isValid: password.length >= 8 && 
             /[A-Z]/.test(password) && 
             /[a-z]/.test(password) && 
             /[0-9]/.test(password) && 
             /[!@#$%^&*]/.test(password)
  }
}

/**
 * Debounces a function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = 300) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Copies text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>}
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('Failed to copy:', error)
    return false
  }
}

/**
 * Gets a value from localStorage with fallback
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if key doesn't exist
 * @returns {*} Stored value or default
 */
export function getLocalStorage(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error('Error reading from localStorage:', error)
    return defaultValue
  }
}

/**
 * Sets a value in localStorage
 * @param {string} key - Storage key
 * @param {*} value - Value to store
 */
export function setLocalStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error('Error writing to localStorage:', error)
  }
}

/**
 * Removes a value from localStorage
 * @param {string} key - Storage key
 */
export function removeLocalStorage(key) {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error('Error removing from localStorage:', error)
  }
}

/**
 * Checks if the user is authenticated
 * @param {Object} supabase - Supabase client
 * @returns {Promise<boolean>} Whether the user is authenticated
 */
export async function isAuthenticated(supabase) {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return !!session
  } catch (error) {
    console.error('Error checking auth:', error)
    return false
  }
}

/**
 * Gets the current user
 * @param {Object} supabase - Supabase client
 * @returns {Promise<Object|null>} Current user or null
 */
export async function getCurrentUser(supabase) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  } catch (error) {
    console.error('Error getting user:', error)
    return null
  }
}

/**
 * Handles Supabase errors with user-friendly messages
 * @param {Object} error - Supabase error object
 * @returns {string} User-friendly error message
 */
export function handleSupabaseError(error) {
  if (!error) return 'An unknown error occurred'
  
  const message = error.message || error.error_description || ''
  
  if (message.includes('Invalid login credentials')) {
    return 'Invalid email or password'
  }
  if (message.includes('Email not confirmed')) {
    return 'Please verify your email address'
  }
  if (message.includes('already registered')) {
    return 'This email is already registered'
  }
  if (message.includes('permission denied') || message.includes('RLS')) {
    return 'You do not have permission to perform this action'
  }
  if (message.includes('not found')) {
    return 'The requested resource was not found'
  }
  if (message.includes('duplicate key')) {
    return 'This record already exists'
  }
  if (message.includes('violates foreign key')) {
    return 'This record cannot be deleted because it is being used elsewhere'
  }
  if (message.includes('violates not-null constraint')) {
    return 'Please fill in all required fields'
  }
  
  return message
}

/**
 * Sleep for a specified duration
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Capitalizes the first letter of a string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export function capitalizeFirstLetter(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Extracts initials from a name
 * @param {string} name - Full name
 * @returns {string} Initials
 */
export function getInitials(name) {
  if (!name) return ''
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')
}

/**
 * Generates a random color based on a string
 * @param {string} str - String to generate color from
 * @returns {string} Hex color code
 */
export function stringToColor(str) {
  if (!str) return '#111111'
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  let color = '#'
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF
    color += ('00' + value.toString(16)).substr(-2)
  }
  return color
}

/**
 * Generates a random OTP code
 * @param {number} length - Length of the OTP
 * @returns {string} OTP code
 */
export function generateOTP(length = 6) {
  const digits = '0123456789'
  let otp = ''
  for (let i = 0; i < length; i++) {
    otp += digits.charAt(Math.floor(Math.random() * 10))
  }
  return otp
}

/**
 * Gets a URL parameter by name
 * @param {string} name - Parameter name
 * @param {string} url - URL to search (defaults to window.location.href)
 * @returns {string|null} Parameter value or null
 */
export function getUrlParam(name, url = window.location.href) {
  try {
    const params = new URLSearchParams(new URL(url).search)
    return params.get(name)
  } catch (error) {
    console.error('Error getting URL param:', error)
    return null
  }
}

/**
 * Parses a JSON string safely
 * @param {string} json - JSON string to parse
 * @param {*} fallback - Fallback value if parsing fails
 * @returns {*} Parsed value or fallback
 */
export function safeJsonParse(json, fallback = null) {
  try {
    return JSON.parse(json)
  } catch (error) {
    return fallback
  }
}

/**
 * Generates a slug from a string
 * @param {string} text - Text to convert to slug
 * @returns {string} Slug
 */
export function slugify(text) {
  if (!text) return ''
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '')             // Trim - from end of text
}

/**
 * Checks if a value is empty (null, undefined, empty string, empty array, empty object)
 * @param {*} value - Value to check
 * @returns {boolean} Whether the value is empty
 */
export function isEmpty(value) {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}