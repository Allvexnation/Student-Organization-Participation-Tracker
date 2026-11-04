import { ROLES } from "./config.js"; // mock
import { MESSAGES, validatePassword, validateUsername } from "./validators.js";
import { login, lookupRole } from "./api.js";
import { createStepper } from "./stepper.js";
import {
  icons,
  initPasswordToggles,
  prefersReducedMotion,
  renderProgress,
  setFieldError,
  setLoading,
  toast,
  watchField,
} from "./ui.js";

const DEFAULT_CAPTION =
  document.querySelector("[data-role-caption]")?.textContent ?? "";
const STEP_LABELS = ["Account", "Password"];

const form = document.getElementById("login-form");
const progress = document.querySelector("[data-progress]");
const usernameField = document.getElementById("username-field");
const passwordField = document.getElementById("password-field");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const nextButton = document.getElementById("next-button");
const loginButton = document.getElementById("login-button");
const accountName = document.querySelector("[data-account-name]");
const accountRole = document.querySelector("[data-account-role]");
const roleBadge = document.querySelector("[data-role-badge]");
const roleCards = document.querySelectorAll("[data-role-card]");
const roleCaption = document.querySelector("[data-role-caption]");

let busy = false;

async function leaveToDashboard(destination) {
  const shell = document.querySelector("[data-auth-shell]") ?? document.body;
  if (!prefersReducedMotion()) {
    try {
      await shell.animate(
        [
          { opacity: 1, transform: "translate3d(0, 0, 0) scale(1)" },
          { opacity: 0, transform: "translate3d(0, -18px, 0) scale(0.97)" },
        ],
        {
          duration: 480,
          easing: "cubic-bezier(0.4, 0, 0.2, 1)",
          fill: "forwards",
        },
      ).finished;
    } catch {
      // Continue even if the leave animation is interrupted.
    }
  }

  if (!destination) return;
  window.location.assign(destination);
}

const stepper = createStepper(form, {
  onChange: (index) => renderProgress(progress, index, STEP_LABELS),
});

function renderRole(roleKey) {
  const role = ROLES[roleKey];
  roleCards.forEach((card) =>
    card.setAttribute("data-active", String(card.dataset.roleCard === roleKey)),
  );
  if (roleCaption)
    roleCaption.textContent = role ? role.summary : DEFAULT_CAPTION;
  roleBadge.textContent = role ? role.label : "";
  roleBadge.classList.toggle("hidden", !role);
  accountRole.textContent = role
    ? `${role.label} portal`
    : "Portal is confirmed when you sign in";
}

async function handleUsername() {
  const message = validateUsername(usernameInput.value);
  setFieldError(usernameField, message);
  if (message) return usernameInput.focus();

  const username = usernameInput.value.trim();
  setLoading(nextButton, true, "Checking account");
  try {
    const { role } = await lookupRole(username);
    renderRole(role);
    accountName.textContent = username;
    setLoading(nextButton, false);
    await stepper.go(1);
  } catch {
    setLoading(nextButton, false);
    toast({
      type: "error",
      title: "Connection problem",
      message: MESSAGES.network,
    });
  }
}

async function handleLogin() {
  const message = validatePassword(passwordInput.value);
  setFieldError(passwordField, message);
  if (message) return passwordInput.focus();

  setLoading(loginButton, true, "Signing in");
  try {
    const result = await login({
      username: usernameInput.value.trim(),
      password: passwordInput.value,
    });
    const role = ROLES[result.role];

    if (!role) {
      toast({
        type: "error",
        title: "Sign in blocked",
        message: MESSAGES.noRole,
      });
      return;
    }

    renderRole(result.role);
    const destination = result.redirect ?? role.redirect;

    toast({
      type: "success",
      title: `Signed in as ${role.label}`,
      message: destination ? "Opening your dashboard." : "Log in successful.",
    });

    await leaveToDashboard(destination);
  } catch (error) {
    if (error.status === 401 || error.status === 403) {
      setFieldError(passwordField, MESSAGES.invalidCredentials);
      passwordInput.focus();
      passwordInput.select();
    } else {
      toast({
        type: "error",
        title: "Connection problem",
        message: MESSAGES.network,
      });
    }
  } finally {
    setLoading(loginButton, false);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (busy) return;
  busy = true;
  try {
    if (stepper.index === 0) await handleUsername();
    else await handleLogin();
  } finally {
    busy = false;
  }
});

document.querySelectorAll("[data-prev]").forEach((button) =>
  button.addEventListener("click", () => {
    setFieldError(passwordField, "");
    stepper.prev();
  }),
);

usernameInput.addEventListener("input", () => renderRole(null));
[usernameField, passwordField].forEach(watchField);

renderProgress(progress, 0, STEP_LABELS);
initPasswordToggles();
document.getElementById("year").textContent = new Date().getFullYear();
icons();
usernameInput.focus();
