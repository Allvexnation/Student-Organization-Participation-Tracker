import {
  CODE_LENGTH,
  MIN_PASSWORD,
  MOCK,
  RESEND_SECONDS,
  USE_MOCK,
} from "./config.js";
import {
  MESSAGES,
  validateCode,
  validateConfirm,
  validateEmail,
  validateNewPassword,
} from "./validators.js";
import { resetPassword, sendResetLink, verifyCode } from "./api.js";
import { createStepper } from "./stepper.js";
import {
  icons,
  initPasswordToggles,
  renderProgress,
  setFieldError,
  setLoading,
  toast,
  watchField,
} from "./ui.js";

const STEP_LABELS = ["Email", "Verify", "New password"];
const FINAL_STEP = 3;

const form = document.getElementById("forgot-form");
const progress = document.querySelector("[data-progress]");
const emailField = document.getElementById("email-field");
const codeField = document.getElementById("code-field");
const passwordField = document.getElementById("new-password-field");
const confirmField = document.getElementById("confirm-password-field");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("new-password");
const confirmInput = document.getElementById("confirm-password");
const sendButton = document.getElementById("send-button");
const verifyButton = document.getElementById("verify-button");
const updateButton = document.getElementById("update-button");
const resendButton = document.querySelector("[data-resend]");
const emailLabel = document.querySelector("[data-email-label]");
const recoverySteps = document.querySelectorAll("[data-recovery-step]");
const placeholder = document.querySelector("[data-brevo-placeholder]");
const strengthSegments = document.querySelectorAll("[data-strength-seg]");
const strengthLabel = document.querySelector("[data-strength-label]");

const state = { email: "", verifiedCode: "" };
let busy = false;
let cooldownTimer;

const stepper = createStepper(form, { onChange: handleStepChange });

function handleStepChange(index) {
  progress.classList.toggle("hidden", index === FINAL_STEP);
  if (index < FINAL_STEP) renderProgress(progress, index, STEP_LABELS);

  recoverySteps.forEach((item, i) => {
    const status = i < index ? "done" : i === index ? "active" : "todo";
    item.dataset.state = status;
    item
      .querySelector("[data-num]")
      .classList.toggle("hidden", status === "done");
    item
      .querySelector("[data-check]")
      .classList.toggle("hidden", status !== "done");
  });
}

function initOtp(group) {
  group.innerHTML = Array.from(
    { length: CODE_LENGTH },
    (_, i) =>
      `<input type="text" inputmode="numeric" maxlength="1" ${i === 0 ? 'autocomplete="one-time-code" data-autofocus' : 'autocomplete="off"'} aria-label="Digit ${i + 1} of ${CODE_LENGTH}" class="h-14 w-full min-w-0 rounded-xl border-2 border-line bg-white text-center text-xl font-semibold text-ink outline-none transition duration-200 focus:border-blue focus:ring-4 focus:ring-blue/15 group-data-[invalid=true]:border-danger group-data-[invalid=true]:ring-4 group-data-[invalid=true]:ring-danger/10" />`,
  ).join("");

  const cells = [...group.querySelectorAll("input")];

  cells.forEach((cell, i) => {
    cell.addEventListener("input", () => {
      cell.value = cell.value.replace(/\D/g, "").slice(-1);
      if (cell.value && i < cells.length - 1) cells[i + 1].focus();
    });
    cell.addEventListener("keydown", (event) => {
      if (event.key === "Backspace" && !cell.value && i > 0) {
        cells[i - 1].value = "";
        cells[i - 1].focus();
      }
      if (event.key === "ArrowLeft" && i > 0) cells[i - 1].focus();
      if (event.key === "ArrowRight" && i < cells.length - 1)
        cells[i + 1].focus();
    });
    cell.addEventListener("paste", (event) => {
      event.preventDefault();
      const digits = event.clipboardData
        .getData("text")
        .replace(/\D/g, "")
        .slice(0, cells.length);
      [...digits].forEach((digit, j) => {
        cells[j].value = digit;
      });
      cells[Math.min(digits.length, cells.length - 1)].focus();
      setFieldError(codeField, "");
    });
    cell.addEventListener("focus", () => cell.select());
  });

  return {
    value: () => cells.map((cell) => cell.value).join(""),
    clear: () => cells.forEach((cell) => (cell.value = "")),
  };
}

const otp = initOtp(document.querySelector("[data-otp]"));

function startCooldown() {
  let left = RESEND_SECONDS;
  clearInterval(cooldownTimer);
  const tick = () => {
    resendButton.textContent = left > 0 ? `Resend in ${left}s` : "Resend code";
    resendButton.disabled = left > 0;
    if (left-- <= 0) clearInterval(cooldownTimer);
  };
  tick();
  cooldownTimer = setInterval(tick, 1000);
}

function scoreStrength(value) {
  return [
    value.length >= MIN_PASSWORD,
    /[a-z]/.test(value) && /[A-Z]/.test(value),
    /\d/.test(value),
    /[^A-Za-z0-9]/.test(value),
  ].filter(Boolean).length;
}

const STRENGTH_COLORS = [
  "bg-line",
  "bg-danger",
  "bg-yellow",
  "bg-blue",
  "bg-success",
];
const STRENGTH_TEXT = ["", "Weak", "Fair", "Good", "Strong"];

function renderStrength() {
  const score = passwordInput.value ? scoreStrength(passwordInput.value) : 0;
  strengthSegments.forEach((segment, i) => {
    segment.classList.remove(...STRENGTH_COLORS);
    segment.classList.add(i < score ? STRENGTH_COLORS[score] : "bg-line");
  });
  strengthLabel.textContent = STRENGTH_TEXT[score];
}

async function handleEmail() {
  const message = validateEmail(emailInput.value);
  setFieldError(emailField, message);
  if (message) return emailInput.focus();

  const email = emailInput.value.trim();
  setLoading(sendButton, true, "Sending");
  try {
    await sendResetLink(email);
    if (email !== state.email) {
      otp.clear();
      state.verifiedCode = "";
    }
    state.email = email;
    emailLabel.textContent = email;
    startCooldown();
    toast({
      type: "success",
      title: "Reset link sent",
      message: `Check ${email} for your code.`,
    });
    setLoading(sendButton, false);
    await stepper.go(1);
  } catch {
    setLoading(sendButton, false);
    toast({
      type: "error",
      title: "Could not send email",
      message: MESSAGES.network,
    });
  }
}

async function handleVerify() {
  const code = otp.value();
  const message = validateCode(code);
  setFieldError(codeField, message);
  if (message) return codeField.querySelector("input").focus();

  if (code === state.verifiedCode) return stepper.go(2);

  setLoading(verifyButton, true, "Verifying");
  try {
    await verifyCode({ email: state.email, code });
    state.verifiedCode = code;
    setLoading(verifyButton, false);
    await stepper.go(2);
  } catch (error) {
    setLoading(verifyButton, false);
    if (error.status === 422 || error.status === 400)
      setFieldError(codeField, MESSAGES.codeInvalid);
    else
      toast({
        type: "error",
        title: "Connection problem",
        message: MESSAGES.network,
      });
  }
}

async function handleUpdate() {
  const passwordMessage = validateNewPassword(passwordInput.value);
  const confirmMessage = passwordMessage
    ? ""
    : validateConfirm(passwordInput.value, confirmInput.value);
  setFieldError(passwordField, passwordMessage);
  setFieldError(confirmField, confirmMessage);
  if (passwordMessage) return passwordInput.focus();
  if (confirmMessage) return confirmInput.focus();

  setLoading(updateButton, true, "Updating");
  try {
    await resetPassword({
      email: state.email,
      code: state.verifiedCode,
      password: passwordInput.value,
    });
    passwordInput.value = "";
    confirmInput.value = "";
    setLoading(updateButton, false);
    await stepper.go(FINAL_STEP);
    toast({ type: "success", title: MESSAGES.recoverySuccess });
  } catch {
    setLoading(updateButton, false);
    toast({
      type: "error",
      title: "Could not update password",
      message: MESSAGES.network,
    });
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (busy) return;
  busy = true;
  try {
    const handlers = [handleEmail, handleVerify, handleUpdate];
    await handlers[stepper.index]?.();
  } finally {
    busy = false;
  }
});

document
  .querySelectorAll("[data-prev]")
  .forEach((button) => button.addEventListener("click", () => stepper.prev()));

resendButton.addEventListener("click", async () => {
  resendButton.disabled = true;
  try {
    await sendResetLink(state.email);
    otp.clear();
    state.verifiedCode = "";
    startCooldown();
    toast({
      type: "success",
      title: "New code sent",
      message: `Check ${state.email}.`,
    });
  } catch {
    resendButton.disabled = false;
    toast({
      type: "error",
      title: "Could not send email",
      message: MESSAGES.network,
    });
  }
});

passwordInput.addEventListener("input", renderStrength);
passwordInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !confirmInput.value) {
    event.preventDefault();
    confirmInput.focus();
  }
});

[emailField, codeField, passwordField, confirmField].forEach(watchField);

if (USE_MOCK) {
  placeholder.classList.remove("hidden");
  placeholder.querySelector("[data-demo-code]").textContent = MOCK.code;
}

handleStepChange(0);
initPasswordToggles();
document.getElementById("year").textContent = new Date().getFullYear();
icons();
emailInput.focus();
