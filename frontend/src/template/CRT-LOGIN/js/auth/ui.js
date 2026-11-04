export const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const icons = () => window.lucide?.createIcons();

export function setFieldError(field, message) {
  const error = field.querySelector("[data-error]");
  const control = field.querySelector("[data-control]");
  const inputs = field.querySelectorAll("input");

  if (!message) {
    error.textContent = "";
    error.classList.add("hidden");
    error.classList.remove("flex");
    control?.removeAttribute("data-invalid");
    inputs.forEach((input) => input.removeAttribute("aria-invalid"));
    return;
  }

  error.innerHTML =
    '<i data-lucide="circle-alert" class="mt-0.5 h-4 w-4 flex-none"></i><span></span>';
  error.lastElementChild.textContent = message;
  error.classList.remove("hidden");
  error.classList.add("flex");
  control?.setAttribute("data-invalid", "true");
  inputs.forEach((input) => input.setAttribute("aria-invalid", "true"));
  icons();

  if (!prefersReducedMotion()) {
    (control ?? field).animate(
      [
        { transform: "translateX(0)" },
        { transform: "translateX(-6px)" },
        { transform: "translateX(6px)" },
        { transform: "translateX(-3px)" },
        { transform: "translateX(0)" },
      ],
      { duration: 300, easing: "ease-out" },
    );
  }
}

export function watchField(field) {
  field.addEventListener("input", () => setFieldError(field, ""));
}

export function setLoading(button, loading, text) {
  const label = button.querySelector("[data-label]");
  const spinner = button.querySelector("[data-spinner]");
  const icon = button.querySelector("[data-icon]");
  const group = button.closest("[data-actions]");

  if (!button.dataset.idleLabel) button.dataset.idleLabel = label.textContent;

  group?.querySelectorAll("button, a").forEach((el) => {
    if (el === button) return;
    el.toggleAttribute("disabled", loading);
    el.classList.toggle("pointer-events-none", loading);
    el.classList.toggle("opacity-60", loading);
  });

  button.disabled = loading;
  button.setAttribute("aria-busy", String(loading));
  spinner?.classList.toggle("hidden", !loading);
  icon?.classList.toggle("hidden", loading);
  label.textContent = loading
    ? (text ?? button.dataset.idleLabel)
    : button.dataset.idleLabel;
}

export function initPasswordToggles() {
  document.querySelectorAll("[data-toggle-password]").forEach((button) => {
    const input = document.getElementById(button.dataset.togglePassword);
    const eye = button.querySelector("[data-eye]");
    const eyeOff = button.querySelector("[data-eye-off]");

    button.addEventListener("click", () => {
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      button.setAttribute("aria-pressed", String(show));
      button.setAttribute(
        "aria-label",
        show ? "Hide password" : "Show password",
      );
      eye.classList.toggle("hidden", show);
      eyeOff.classList.toggle("hidden", !show);
      input.focus();
    });
  });
}

export function renderProgress(container, index, labels) {
  const bar = container.querySelector("[data-progress-bar]");
  const text = container.querySelector("[data-progress-label]");

  if (bar.children.length !== labels.length) {
    bar.innerHTML = labels
      .map(
        () =>
          '<span class="h-1.5 flex-1 rounded-full bg-line transition-colors duration-500"></span>',
      )
      .join("");
  }

  [...bar.children].forEach((segment, i) => {
    segment.classList.toggle("bg-blue", i <= index);
    segment.classList.toggle("bg-line", i > index);
  });
  text.textContent = `Step ${index + 1} of ${labels.length}: ${labels[index]}`;
}

const TOAST_STYLES = {
  success: {
    icon: "circle-check",
    accent: "border-success",
    tint: "bg-[#d9f5e8] text-success",
  },
  error: {
    icon: "circle-alert",
    accent: "border-danger",
    tint: "bg-[#fde2e2] text-danger",
  },
  info: { icon: "info", accent: "border-blue", tint: "bg-blue-50 text-blue" },
};

let toastHost;

function getToastHost() {
  if (toastHost) return toastHost;
  toastHost = document.createElement("div");
  toastHost.className =
    "pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col gap-3 sm:inset-x-auto sm:bottom-auto sm:right-6 sm:top-6 sm:w-[380px]";
  document.body.append(toastHost);
  return toastHost;
}

export function toast({ type = "info", title, message, duration = 5000 }) {
  const style = TOAST_STYLES[type];
  const el = document.createElement("div");
  el.setAttribute("role", type === "error" ? "alert" : "status");
  el.className = `pointer-events-auto flex items-start gap-3 rounded-2xl border-l-4 ${style.accent} bg-white p-4 shadow-lift-lg`;
  el.innerHTML = `
    <span class="grid h-9 w-9 flex-none place-items-center rounded-xl ${style.tint}"><i data-lucide="${style.icon}" class="h-5 w-5"></i></span>
    <div class="min-w-0 flex-1"><p class="text-sm font-semibold text-ink"></p><p class="mt-0.5 text-sm text-body"></p></div>
    <button type="button" aria-label="Dismiss notification" class="grid h-8 w-8 flex-none place-items-center rounded-lg text-muted transition hover:bg-surface hover:text-ink"><i data-lucide="x" class="h-4 w-4"></i></button>`;

  const [titleEl, messageEl] = el.querySelectorAll("p");
  titleEl.textContent = title;
  if (message) messageEl.textContent = message;
  else messageEl.remove();

  const dismiss = () => {
    if (!el.isConnected) return;
    const done = () => el.remove();
    if (prefersReducedMotion()) return done();
    el.animate(
      [{ opacity: 1 }, { opacity: 0, transform: "translateY(-8px)" }],
      { duration: 180, fill: "forwards" },
    ).onfinish = done;
  };

  el.querySelector("button").addEventListener("click", dismiss);
  getToastHost().append(el);
  icons();

  if (!prefersReducedMotion()) {
    el.animate(
      [
        { opacity: 0, transform: "translateY(-10px)" },
        { opacity: 1, transform: "none" },
      ],
      {
        duration: 260,
        easing: "cubic-bezier(0.2, 0.7, 0.2, 1)",
      },
    );
  }
  setTimeout(dismiss, duration);
}
