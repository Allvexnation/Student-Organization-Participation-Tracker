import { CODE_LENGTH, MIN_PASSWORD } from "./config.js";

export const MESSAGES = {
  usernameRequired: "Username is required.",
  passwordRequired: "Password is required.",
  invalidCredentials: "Invalid username or password.",
  invalidEmail: "Please enter a valid email.",
  passwordMismatch: "Passwords do not match.",
  recoverySuccess: "Password updated successfully.",
  codeRequired: `Enter the ${CODE_LENGTH}-digit code from your email.`,
  codeInvalid: "That code is incorrect or has expired.",
  passwordShort: `Password must be at least ${MIN_PASSWORD} characters.`,
  passwordWeak: "Password must include letters and numbers.",
  noRole: "This account has no portal assigned. Contact your administrator.",
  network:
    "We could not reach the server. Check your connection and try again.",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateUsername = (value) =>
  value.trim() ? "" : MESSAGES.usernameRequired;

export const validatePassword = (value) =>
  value ? "" : MESSAGES.passwordRequired;

export const validateEmail = (value) =>
  EMAIL_PATTERN.test(value.trim()) ? "" : MESSAGES.invalidEmail;

export const validateCode = (value) =>
  value.length === CODE_LENGTH && /^\d+$/.test(value)
    ? ""
    : MESSAGES.codeRequired;

export function validateNewPassword(value) {
  if (!value) return MESSAGES.passwordRequired;
  if (value.length < MIN_PASSWORD) return MESSAGES.passwordShort;
  if (!/[a-z]/i.test(value) || !/\d/.test(value)) return MESSAGES.passwordWeak;
  return "";
}

export const validateConfirm = (password, confirm) =>
  password === confirm ? "" : MESSAGES.passwordMismatch;
