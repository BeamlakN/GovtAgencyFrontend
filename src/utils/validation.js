// Centralized validation utilities for the entire system

// Common regex patterns
export const PATTERNS = {
  // Name patterns - No spaces at start/end, single spaces between words
  NAME: /^[a-zA-Z]+(?:[ '-][a-zA-Z]+)*$/,
  FULL_NAME: /^[a-zA-Z]+(?:[ '-][a-zA-Z]+)*$/,
  
  // Email pattern - No spaces
  EMAIL: /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/,
  
  // Password pattern (at least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char)
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d\s])[^\s]{8,}$/,
  
  // Phone patterns
  ETHIOPIA_PHONE: /^(09|07)[0-9]{8}$/,
  
  // FIN/ID pattern - No spaces
  ETHIOPIAN_FIN: /^[A-Za-z0-9]{8,12}$/,
  
  // Numeric patterns
  NUMERIC: /^\d+$/,
  DECIMAL: /^\d+(\.\d{1,2})?$/,
  
  // Title patterns - No leading/trailing spaces
  TITLE: /^[a-zA-Z0-9][a-zA-Z0-9\s\-',.!?]{2,198}[a-zA-Z0-9]$/,
  
  // No spaces allowed
  NO_SPACES: /^\S+$/,
  
  // Alphanumeric only
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
};

// Helper functions
const hasNoSpaces = (value) => !/\s/.test(value);
const hasNoLeadingTrailingSpaces = (value) => !/^\s|\s$/.test(value);
const hasNoConsecutiveSpaces = (value) => !/\s{2,}/.test(value);

// Main validation function
export const validateField = (field, value, rules, confirmValue = null) => {
  const fieldRules = rules[field];
  if (!fieldRules) return "";
  
  // Required check
  if (fieldRules.required && (!value || value.toString().trim() === "")) {
    return fieldRules.required.message;
  }
  
  // Skip other validations if value is empty and not required
  if (!value || value.toString().trim() === "") {
    return "";
  }
  
  const stringValue = value.toString();
  const trimmedValue = stringValue.trim();
  
  // No spaces check
  if (fieldRules.noSpaces && !hasNoSpaces(stringValue)) {
    return "This field cannot contain spaces";
  }
  
  // No leading/trailing spaces check
  if (fieldRules.noLeadingTrailingSpaces && !hasNoLeadingTrailingSpaces(stringValue)) {
    return "This field cannot start or end with spaces";
  }
  
  // No consecutive spaces check
  if (fieldRules.noConsecutiveSpaces && !hasNoConsecutiveSpaces(stringValue)) {
    return "This field cannot contain consecutive spaces";
  }
  
  // Min length check
  if (fieldRules.minLength && trimmedValue.length < fieldRules.minLength.value) {
    return fieldRules.minLength.message;
  }
  
  // Max length check
  if (fieldRules.maxLength && trimmedValue.length > fieldRules.maxLength.value) {
    return fieldRules.maxLength.message;
  }
  
  // Pattern check
  if (fieldRules.pattern && !fieldRules.pattern.value.test(trimmedValue)) {
    return fieldRules.pattern.message;
  }
  
  // Confirm password match
  if (field === "confirmPassword" && value !== confirmValue) {
    return "Passwords do not match";
  }
  
  // Min value check for numbers
  if (fieldRules.min && parseFloat(value) < fieldRules.min.value) {
    return fieldRules.min.message;
  }
  
  return "";
};

// Validate entire form
export const validateForm = (data, rules, confirmPassword = null) => {
  const errors = {};
  
  Object.keys(rules).forEach((field) => {
    const error = validateField(field, data[field], rules, confirmPassword);
    if (error) {
      errors[field] = error;
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Password strength calculator
export const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: "", color: "" };
  
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/(?=.*[a-z])/.test(password)) score++;
  if (/(?=.*[A-Z])/.test(password)) score++;
  if (/(?=.*\d)/.test(password)) score++;
  if (/(?=.*[^a-zA-Z\d\s])/.test(password)) score++;
  
  if (score <= 2) return { score, label: "Weak", color: "text-red-500" };
  if (score <= 4) return { score, label: "Medium", color: "text-yellow-500" };
  return { score, label: "Strong", color: "text-green-500" };
};

// Password requirements checklist
export const getPasswordRequirements = (password) => {
  return {
    minLength: password && password.length >= 8,
    hasLowercase: /(?=.*[a-z])/.test(password),
    hasUppercase: /(?=.*[A-Z])/.test(password),
    hasNumber: /(?=.*\d)/.test(password),
    hasSpecialChar: /(?=.*[^a-zA-Z\d\s])/.test(password),
    noSpaces: password && !/\s/.test(password),
  };
};

// Validation rules for different components
export const VALIDATION_RULES = {
  // Staff Create Modal
  staffCreate: {
    name: {
      required: { value: true, message: "Full name is required" },
      minLength: { value: 3, message: "Name must be at least 3 characters" },
      maxLength: { value: 100, message: "Name must not exceed 100 characters" },
      pattern: { value: PATTERNS.NAME, message: "Name can only contain letters and single spaces" },
      noConsecutiveSpaces: { value: true },
      noLeadingTrailingSpaces: { value: true },
    },
    email: {
      required: { value: true, message: "Email address is required" },
      pattern: { value: PATTERNS.EMAIL, message: "Please enter a valid email address" },
      noSpaces: { value: true },
    },
    password: {
      required: { value: true, message: "Password is required" },
      minLength: { value: 8, message: "Password must be at least 8 characters" },
      maxLength: { value: 64, message: "Password must not exceed 64 characters" },
      pattern: { value: PATTERNS.PASSWORD, message: "Password must contain uppercase, lowercase, number, and special character" },
      noSpaces: { value: true },
    },
  },
  
  // Staff Edit Modal
  staffEdit: {
    name: {
      required: { value: true, message: "Full name is required" },
      minLength: { value: 3, message: "Name must be at least 3 characters" },
      maxLength: { value: 100, message: "Name must not exceed 100 characters" },
      pattern: { value: PATTERNS.NAME, message: "Name can only contain letters and single spaces" },
      noConsecutiveSpaces: { value: true },
      noLeadingTrailingSpaces: { value: true },
    },
  },
  
  // Announcement Create/Edit Modal
  announcement: {
    title: {
      required: { value: true, message: "Title is required" },
      minLength: { value: 3, message: "Title must be at least 3 characters" },
      maxLength: { value: 200, message: "Title must not exceed 200 characters" },
      pattern: { value: PATTERNS.TITLE, message: "Title cannot start or end with spaces" },
      noConsecutiveSpaces: { value: true },
    },
    content: {
      required: { value: true, message: "Content is required" },
      minLength: { value: 10, message: "Content must be at least 10 characters" },
      maxLength: { value: 5000, message: "Content must not exceed 5000 characters" },
    },
  },
  
  // Service Create/Edit Modal
  service: {
    name: {
      required: { value: true, message: "Service name is required" },
      minLength: { value: 3, message: "Service name must be at least 3 characters" },
      maxLength: { value: 150, message: "Service name must not exceed 150 characters" },
    },
    fee: {
      required: { value: true, message: "Base fee is required" },
      pattern: { value: PATTERNS.DECIMAL, message: "Please enter a valid amount" },
      min: { value: 0, message: "Fee cannot be negative" },
    },
    description: {
      required: { value: true, message: "Description is required" },
      minLength: { value: 20, message: "Description must be at least 20 characters" },
      maxLength: { value: 1000, message: "Description must not exceed 1000 characters" },
    },
  },
  
  // Change Password Modal
  changePassword: {
    currentPassword: {
      required: { value: true, message: "Current password is required" },
    },
    newPassword: {
      required: { value: true, message: "New password is required" },
      minLength: { value: 8, message: "Password must be at least 8 characters" },
      maxLength: { value: 64, message: "Password must not exceed 64 characters" },
      pattern: { value: PATTERNS.PASSWORD, message: "Password must contain uppercase, lowercase, number, and special character" },
      noSpaces: { value: true },
    },
  },
  
  // Edit Profile Modal
  editProfile: {
    name: {
      required: { value: true, message: "Full name is required" },
      minLength: { value: 3, message: "Name must be at least 3 characters" },
      maxLength: { value: 100, message: "Name must not exceed 100 characters" },
      pattern: { value: PATTERNS.NAME, message: "Name can only contain letters and single spaces" },
      noConsecutiveSpaces: { value: true },
      noLeadingTrailingSpaces: { value: true },
    },
    email: {
      required: { value: true, message: "Email address is required" },
      pattern: { value: PATTERNS.EMAIL, message: "Please enter a valid email address" },
      noSpaces: { value: true },
    },
  },
};

// Helper function to get rules for a specific component
export const getValidationRules = (componentName) => {
  return VALIDATION_RULES[componentName] || {};
};