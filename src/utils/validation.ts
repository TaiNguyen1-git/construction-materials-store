// Validate email
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number
export const validatePhoneNumber = (phone: string): boolean => {
  // Vietnamese phone number pattern
  const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

// Validate password
export const validatePassword = (password: string): boolean => {
  // At least 6 characters
  return password.length >= 6;
};

// Validate required field
export const validateRequired = (value: string): boolean => {
  return value.trim().length > 0;
};

// Validate minimum length
export const validateMinLength = (value: string, minLength: number): boolean => {
  return value.length >= minLength;
};

// Validate maximum length
export const validateMaxLength = (value: string, maxLength: number): boolean => {
  return value.length <= maxLength;
};

// Validate number
export const validateNumber = (value: string): boolean => {
  return !isNaN(Number(value)) && !isNaN(parseFloat(value));
};

// Validate positive number
export const validatePositiveNumber = (value: string): boolean => {
  const num = parseFloat(value);
  return !isNaN(num) && num > 0;
};

// Validate integer
export const validateInteger = (value: string): boolean => {
  return Number.isInteger(Number(value));
};

// Validate URL
export const validateURL = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch (_) {
    return false;
  }
};

// Validate date
export const validateDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return date.toString() !== 'Invalid Date';
};

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Validate form fields
export const validateForm = (fields: Record<string, any>, rules: Record<string, Function[]>): ValidationResult => {
  const errors: string[] = [];
  
  for (const fieldName in rules) {
    const fieldValue = fields[fieldName];
    const fieldRules = rules[fieldName];
    
    for (const rule of fieldRules) {
      if (!rule(fieldValue)) {
        errors.push(`${fieldName} is invalid`);
        break;
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};