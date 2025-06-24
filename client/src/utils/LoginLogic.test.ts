// src/utils/loginLogic.test.ts
import { assertEquals, assertRejects } from "@std/assert";
import {
  validateEmail,
  validatePassword,
  validateCredentials,
  authenticateUser,
  handleLoginSubmission,
  formatErrorMessage,
  areCredentialsEmpty,
  sanitizeInput,
  getPostLoginPath,
  type LoginCredentials,
  type LoginState
} from "./LoginLogic.ts";

Deno.test("validateEmail - valid emails", () => {
  assertEquals(validateEmail("choclomancer@gmail.com"), true);
  assertEquals(validateEmail("test@example.com"), true);
  assertEquals(validateEmail("user.name@domain.co.uk"), true);
  assertEquals(validateEmail("123@test.org"), true);
});

Deno.test("validateEmail - invalid emails", () => {
  assertEquals(validateEmail(""), false);
  assertEquals(validateEmail("invalid-email"), false);
  assertEquals(validateEmail("@gmail.com"), false);
  assertEquals(validateEmail("test@"), false);
  assertEquals(validateEmail("test.com"), false);
  assertEquals(validateEmail("test@@gmail.com"), false);
});

Deno.test("validatePassword - valid passwords", () => {
  assertEquals(validatePassword("test123"), true);
  assertEquals(validatePassword("password"), true);
  assertEquals(validatePassword("123456"), true);
  assertEquals(validatePassword("abcdefg"), true);
});

Deno.test("validatePassword - invalid passwords", () => {
  assertEquals(validatePassword(""), false);
  assertEquals(validatePassword("12345"), false);
  assertEquals(validatePassword("abc"), false);
  assertEquals(validatePassword("a"), false);
});

Deno.test("validateCredentials - valid credentials", () => {
  const validCreds: LoginCredentials = {
    email: "choclomancer@gmail.com",
    password: "test123"
  };
  
  const errors = validateCredentials(validCreds);
  assertEquals(errors.length, 0);
});

Deno.test("validateCredentials - invalid email", () => {
  const invalidEmailCreds: LoginCredentials = {
    email: "invalid-email",
    password: "test123"
  };
  
  const errors = validateCredentials(invalidEmailCreds);
  assertEquals(errors.length, 1);
  assertEquals(errors[0], "Invalid email format");
});

Deno.test("validateCredentials - invalid password", () => {
  const invalidPasswordCreds: LoginCredentials = {
    email: "test@example.com",
    password: "123"
  };
  
  const errors = validateCredentials(invalidPasswordCreds);
  assertEquals(errors.length, 1);
  assertEquals(errors[0], "Password must be at least 6 characters");
});

Deno.test("validateCredentials - both invalid", () => {
  const invalidCreds: LoginCredentials = {
    email: "invalid",
    password: "123"
  };
  
  const errors = validateCredentials(invalidCreds);
  assertEquals(errors.length, 2);
  assertEquals(errors[0], "Invalid email format");
  assertEquals(errors[1], "Password must be at least 6 characters");
});

Deno.test("authenticateUser - valid credentials", async () => {
  const validCreds: LoginCredentials = {
    email: "choclomancer@gmail.com",
    password: "test123"
  };
  
  const result = await authenticateUser(validCreds);
  assertEquals(result.success, true);
  assertEquals(result.error, undefined);
});

Deno.test("authenticateUser - invalid credentials", async () => {
  const invalidCreds: LoginCredentials = {
    email: "wrong@example.com",
    password: "wrongpass"
  };
  
  const result = await authenticateUser(invalidCreds);
  assertEquals(result.success, false);
  assertEquals(result.error, "Invalid credentials");
});

Deno.test("authenticateUser - invalid format", async () => {
  const invalidFormatCreds: LoginCredentials = {
    email: "invalid-email",
    password: "123"
  };
  
  const result = await authenticateUser(invalidFormatCreds);
  assertEquals(result.success, false);
  assertEquals(result.error, "Invalid email format, Password must be at least 6 characters");
});

Deno.test("handleLoginSubmission - successful login", async () => {
  const validCreds: LoginCredentials = {
    email: "choclomancer@gmail.com",
    password: "test123"
  };
  
  let currentState: LoginState = { loading: false, error: "" };
  let successCalled = false;
  
  const onStateChange = (state: LoginState) => {
    currentState = state;
  };
  
  const onSuccess = () => {
    successCalled = true;
  };
  
  await handleLoginSubmission(validCreds, onStateChange, onSuccess);
  
  assertEquals(currentState.loading, false);
  assertEquals(currentState.error, "");
  assertEquals(successCalled, true);
});

Deno.test("handleLoginSubmission - failed login", async () => {
  const invalidCreds: LoginCredentials = {
    email: "wrong@example.com",
    password: "wrongpass"
  };
  
  let currentState: LoginState = { loading: false, error: "" };
  let successCalled = false;
  
  const onStateChange = (state: LoginState) => {
    currentState = state;
  };
  
  const onSuccess = () => {
    successCalled = true;
  };
  
  await handleLoginSubmission(invalidCreds, onStateChange, onSuccess);
  
  assertEquals(currentState.loading, false);
  assertEquals(currentState.error, "Invalid credentials");
  assertEquals(successCalled, false);
});

Deno.test("formatErrorMessage - Error object", () => {
  const error = new Error("Network error");
  assertEquals(formatErrorMessage(error), "Network error");
});

Deno.test("formatErrorMessage - string error", () => {
  assertEquals(formatErrorMessage("String error"), "String error");
});

Deno.test("formatErrorMessage - unknown error", () => {
  assertEquals(formatErrorMessage(null), "An unexpected error occurred");
  assertEquals(formatErrorMessage(undefined), "An unexpected error occurred");
  assertEquals(formatErrorMessage(123), "An unexpected error occurred");
});

Deno.test("areCredentialsEmpty - empty credentials", () => {
  assertEquals(areCredentialsEmpty({ email: "", password: "" }), true);
  assertEquals(areCredentialsEmpty({ email: "  ", password: "  " }), true);
  assertEquals(areCredentialsEmpty({ email: "", password: "test" }), true);
  assertEquals(areCredentialsEmpty({ email: "test@example.com", password: "" }), true);
});

Deno.test("areCredentialsEmpty - non-empty credentials", () => {
  assertEquals(areCredentialsEmpty({ email: "test@example.com", password: "test123" }), false);
  assertEquals(areCredentialsEmpty({ email: "a", password: "b" }), false);
});

Deno.test("sanitizeInput - trims and lowercases", () => {
  assertEquals(sanitizeInput("  TEST@EXAMPLE.COM  "), "test@example.com");
  assertEquals(sanitizeInput("Password123"), "password123");
  assertEquals(sanitizeInput(""), "");
  assertEquals(sanitizeInput("   "), "");
});

Deno.test("getPostLoginPath - different user types", () => {
  assertEquals(getPostLoginPath("admin"), "/admin");
  assertEquals(getPostLoginPath("user"), "/cards");
  assertEquals(getPostLoginPath("default"), "/cards");
  assertEquals(getPostLoginPath(), "/cards");
  assertEquals(getPostLoginPath("unknown"), "/cards");
});