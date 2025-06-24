// src/utils/loginLogic.ts
/**
 * Login functionality module - extracted for testing coverage
 */

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginState {
  loading: boolean;
  error: string;
}

export interface LoginResult {
  success: boolean;
  error?: string;
}

// Valid credentials for the system
const VALID_CREDENTIALS = {
  email: "choclomancer@gmail.com",
  password: "test123"
};

/**
 * Validates email format
 */
export function validateEmail(email: string): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates password requirements
 */
export function validatePassword(password: string): boolean {
  if (!password) return false;
  return password.length >= 6;
}

/**
 * Validates both email and password
 */
export function validateCredentials(credentials: LoginCredentials): string[] {
  const errors: string[] = [];
  
  if (!validateEmail(credentials.email)) {
    errors.push("Invalid email format");
  }
  
  if (!validatePassword(credentials.password)) {
    errors.push("Password must be at least 6 characters");
  }
  
  return errors;
}

/**
 * Authenticates user credentials
 */
export async function authenticateUser(credentials: LoginCredentials): Promise<LoginResult> {
  // Validate format first
  const validationErrors = validateCredentials(credentials);
  if (validationErrors.length > 0) {
    return {
      success: false,
      error: validationErrors.join(", ")
    };
  }
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Check credentials
  if (credentials.email === VALID_CREDENTIALS.email && 
      credentials.password === VALID_CREDENTIALS.password) {
    return { success: true };
  }
  
  return {
    success: false,
    error: "Invalid credentials"
  };
}

/**
 * Handles login form submission
 */
export async function handleLoginSubmission(
  credentials: LoginCredentials,
  onStateChange: (state: LoginState) => void,
  onSuccess: () => void
): Promise<void> {
  // Set loading state
  onStateChange({ loading: true, error: "" });
  
  try {
    const result = await authenticateUser(credentials);
    
    if (result.success) {
      onStateChange({ loading: false, error: "" });
      onSuccess();
    } else {
      onStateChange({ 
        loading: false, 
        error: result.error || "Login failed" 
      });
    }
  } catch (error) {
    onStateChange({ 
      loading: false, 
      error: error instanceof Error ? error.message : "Login failed" 
    });
  }
}

/**
 * Formats error messages for display
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unexpected error occurred";
}

/**
 * Checks if credentials are empty
 */
export function areCredentialsEmpty(credentials: LoginCredentials): boolean {
  return !credentials.email.trim() || !credentials.password.trim();
}

/**
 * Sanitizes input values
 */
export function sanitizeInput(input: string): string {
  return input.trim().toLowerCase();
}

/**
 * Gets navigation path after successful login
 */
export function getPostLoginPath(userType: string = "default"): string {
  switch (userType) {
    case "admin":
      return "/admin";
    case "user":
    default:
      return "/cards";
  }
}