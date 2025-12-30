/**
 * Validation Utilities
 * Provides consistent input validation patterns
 */

/**
 * Email validation regex
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @param {object} options - Validation options
 * @param {number} options.minLength - Minimum length (default: 8)
 * @param {boolean} options.requireUppercase - Require uppercase (default: false)
 * @param {boolean} options.requireLowercase - Require lowercase (default: false)
 * @param {boolean} options.requireNumber - Require number (default: false)
 * @param {boolean} options.requireSpecial - Require special char (default: false)
 * @returns {object} { valid: boolean, errors: string[] }
 */
export function validatePassword(password, options = {}) {
  const {
    minLength = 8,
    requireUppercase = false,
    requireLowercase = false,
    requireNumber = false,
    requireSpecial = false,
  } = options;

  const errors = [];

  if (!password || typeof password !== 'string') {
    return { valid: false, errors: ['Password is required'] };
  }

  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters`);
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (requireNumber && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if string is not empty (after trimming)
 * @param {string} str - String to check
 * @returns {boolean} True if not empty
 */
export function isNotEmpty(str) {
  return str && typeof str === 'string' && str.trim().length > 0;
}

/**
 * Validate required fields
 * @param {object} data - Object with fields to validate
 * @param {string[]} requiredFields - Array of required field names
 * @returns {object} { valid: boolean, errors: object }
 */
export function validateRequired(data, requiredFields) {
  const errors = {};

  requiredFields.forEach((field) => {
    const value = data[field];
    if (!value || (typeof value === 'string' && !value.trim())) {
      errors[field] = `${field} is required`;
    }
  });

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate form data
 * @param {object} formData - Form data to validate
 * @param {object} rules - Validation rules
 * @returns {object} { valid: boolean, errors: object }
 * 
 * @example
 * validateForm(
 *   { email: 'test@example.com', password: '123' },
 *   {
 *     email: { required: true, email: true },
 *     password: { required: true, minLength: 8 }
 *   }
 * )
 */
export function validateForm(formData, rules) {
  const errors = {};

  Object.keys(rules).forEach((field) => {
    const value = formData[field];
    const fieldRules = rules[field];

    // Required check
    if (fieldRules.required && !isNotEmpty(value)) {
      errors[field] = `${field} is required`;
      return;
    }

    // Skip other validations if field is empty and not required
    if (!isNotEmpty(value)) {
      return;
    }

    // Email validation
    if (fieldRules.email && !isValidEmail(value)) {
      errors[field] = `${field} must be a valid email`;
    }

    // Min length
    if (fieldRules.minLength && value.length < fieldRules.minLength) {
      errors[field] = `${field} must be at least ${fieldRules.minLength} characters`;
    }

    // Max length
    if (fieldRules.maxLength && value.length > fieldRules.maxLength) {
      errors[field] = `${field} must be no more than ${fieldRules.maxLength} characters`;
    }

    // Custom validator
    if (fieldRules.validator && typeof fieldRules.validator === 'function') {
      const customError = fieldRules.validator(value, formData);
      if (customError) {
        errors[field] = customError;
      }
    }
  });

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}










