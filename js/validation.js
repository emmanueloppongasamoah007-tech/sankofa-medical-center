/* ============================================================
   validation.js — Shared Form Validation Logic
   Hospital Booking System
   ============================================================ */

/**
 * Validates an email address format.
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  // Standard email regex check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates a phone number.
 * Accepts formats: +1234567890, 0244123456, (055) 123-4567, etc.
 * Must be between 7 and 15 digits.
 * @param {string} phone
 * @returns {boolean}
 */
function isValidPhone(phone) {
  // Remove spaces, dashes, parentheses before checking
  const cleaned = phone.replace(/[\s\-().+]/g, '');
  return /^\d{7,15}$/.test(cleaned);
}

/**
 * Checks that a date string is not in the past (compared to today).
 * @param {string} dateStr — YYYY-MM-DD
 * @returns {boolean}
 */
function isDateNotInPast(dateStr) {
  if (!dateStr) return false;
  const selected = new Date(dateStr);
  const today = new Date();
  // Zero out time component so today is allowed
  today.setHours(0, 0, 0, 0);
  return selected >= today;
}

/**
 * Checks that a date is not a Sunday (index 0).
 * @param {string} dateStr
 * @returns {boolean}
 */
function isNotSunday(dateStr) {
  const d = new Date(dateStr);
  return d.getDay() !== 0;
}

/**
 * Shows an inline error message for a field.
 * Adds the "error" class to the input and makes the error span visible.
 * @param {HTMLElement} input
 * @param {HTMLElement} errorEl
 * @param {string} message
 */
function showError(input, errorEl, message) {
  input.classList.add('error');
  errorEl.textContent = message;
  errorEl.classList.add('visible');
}

/**
 * Clears an inline error message for a field.
 * @param {HTMLElement} input
 * @param {HTMLElement} errorEl
 */
function clearError(input, errorEl) {
  input.classList.remove('error');
  errorEl.classList.remove('visible');
}

/**
 * Validates a single form field on-the-fly (blur/change events).
 * @param {HTMLElement} input
 * @param {HTMLElement} errorEl
 * @param {object} options — { required, type, customMessage }
 * @returns {boolean}
 */
function validateField(input, errorEl, options = {}) {
  const value = input.value.trim();

  // Required check
  if (options.required && value === '') {
    showError(input, errorEl, options.emptyMessage || 'This field is required.');
    return false;
  }

  // Email format check
  if (options.type === 'email' && value !== '' && !isValidEmail(value)) {
    showError(input, errorEl, 'Please enter a valid email address.');
    return false;
  }

  // Phone format check
  if (options.type === 'phone' && value !== '' && !isValidPhone(value)) {
    showError(input, errorEl, 'Please enter a valid phone number (7–15 digits).');
    return false;
  }

  // Date not in the past
  if (options.type === 'date' && value !== '') {
    if (!isDateNotInPast(value)) {
      showError(input, errorEl, 'Please select today or a future date.');
      return false;
    }
    if (!isNotSunday(value)) {
      showError(input, errorEl, 'We are closed on Sundays. Please choose another day.');
      return false;
    }
  }

  // Minimum length
  if (options.minLength && value.length < options.minLength) {
    showError(input, errorEl, `Must be at least ${options.minLength} characters.`);
    return false;
  }

  // All passed — clear the error
  clearError(input, errorEl);
  return true;
}

/**
 * Attaches real-time validation (blur + input) to a field.
 * @param {HTMLElement} input
 * @param {HTMLElement} errorEl
 * @param {object} options
 */
function attachLiveValidation(input, errorEl, options = {}) {
  // Validate when user leaves the field
  input.addEventListener('blur', () => validateField(input, errorEl, options));

  // Clear error immediately when user starts typing again
  input.addEventListener('input', () => {
    if (input.classList.contains('error')) {
      clearError(input, errorEl);
    }
  });
}

/**
 * Generates a short random reference code for booking confirmations.
 * Format: HB-XXXXXX (uppercase alphanumeric)
 * @returns {string}
 */
function generateRef() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let ref = 'HB-';
  for (let i = 0; i < 6; i++) {
    ref += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return ref;
}

/**
 * Formats a date string (YYYY-MM-DD) into a user-friendly display.
 * e.g. "2026-03-15" → "March 15, 2026"
 * @param {string} dateStr
 * @returns {string}
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

/**
 * Formats a time string (HH:MM) into 12-hour format.
 * e.g. "14:30" → "2:30 PM"
 * @param {string} timeStr
 * @returns {string}
 */
function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

// Expose helpers globally so other scripts can use them
window.Validators = {
  isValidEmail,
  isValidPhone,
  isDateNotInPast,
  isNotSunday,
  showError,
  clearError,
  validateField,
  attachLiveValidation,
  generateRef,
  formatDate,
  formatTime,
};
