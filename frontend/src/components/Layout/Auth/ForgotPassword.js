import { showToast, updateToast } from '../../ToastMessage.js';
import { PasswordValidator } from '../../../validator/PasswordValidator.js';
import { initAuthRouteAnimation, playAuthDominoEnter } from '../../../provider/Animation/auth/AuthAnimation.js';

const CODE_LENGTH = 6;
const RESEND_SECONDS = 60;
const MIN_PASSWORD = 8;
const STEP_LABELS = ['Email', 'Verify', 'New password'];
const FINAL_STEP = 3;

const MESSAGES = {
    usernameRequired: 'Username or email is required.',
    codeRequired: `Enter the ${CODE_LENGTH}-digit code from your email.`,
    codeInvalid: 'That code is incorrect or has expired.',
    passwordRequired: 'Password is required.',
    passwordShort: `Password must be at least ${MIN_PASSWORD} characters.`,
    passwordMismatch: 'Passwords do not match.',
    network: 'We could not reach the server. Check your connection and try again.',
};

const prefersReducedMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const icons = () => {
    if (typeof lucide !== 'undefined') lucide.createIcons();
};

function censorEmail(value) {
    const email = String(value || '').trim();
    const at = email.indexOf('@');
    if (at < 1) {
        if (email.length <= 2) return email;
        return `${email[0]}***${email.slice(-1)}`;
    }
    const local = email.slice(0, at);
    const domain = email.slice(at);
    const visible = local.slice(0, Math.min(2, local.length));
    return `${visible}***${domain}`;
}

function setFieldError(field, message) {
    const error = field.querySelector('[data-error]');
    const control = field.querySelector('[data-control]');
    const inputs = field.querySelectorAll('input');

    if (!message) {
        error.textContent = '';
        error.classList.add('hidden');
        error.classList.remove('flex');
        control?.removeAttribute('data-invalid');
        inputs.forEach((input) => input.removeAttribute('aria-invalid'));
        return;
    }

    error.innerHTML =
        '<i data-lucide="circle-alert" class="mt-0.5 h-4 w-4 flex-none"></i><span></span>';
    error.lastElementChild.textContent = message;
    error.classList.remove('hidden');
    error.classList.add('flex');
    control?.setAttribute('data-invalid', 'true');
    inputs.forEach((input) => input.setAttribute('aria-invalid', 'true'));
    icons();

    if (!prefersReducedMotion()) {
        (control ?? field).animate(
            [
                { transform: 'translateX(0)' },
                { transform: 'translateX(-6px)' },
                { transform: 'translateX(6px)' },
                { transform: 'translateX(-3px)' },
                { transform: 'translateX(0)' },
            ],
            { duration: 300, easing: 'ease-out' },
        );
    }
}

function watchField(field) {
    field.addEventListener('input', () => setFieldError(field, ''));
}

function setLoading(button, loading, text) {
    const label = button.querySelector('[data-label]');
    const spinner = button.querySelector('[data-spinner]');
    const icon = button.querySelector('[data-icon]');
    const group = button.closest('[data-actions]');

    if (!button.dataset.idleLabel) button.dataset.idleLabel = label.textContent;

    group?.querySelectorAll('button, a').forEach((el) => {
        if (el === button) return;
        el.toggleAttribute('disabled', loading);
        el.classList.toggle('pointer-events-none', loading);
        el.classList.toggle('opacity-60', loading);
    });

    button.disabled = loading;
    button.setAttribute('aria-busy', String(loading));
    spinner?.classList.toggle('hidden', !loading);
    icon?.classList.toggle('hidden', loading);
    label.textContent = loading ? (text ?? button.dataset.idleLabel) : button.dataset.idleLabel;
}

function initPasswordToggles() {
    document.querySelectorAll('[data-toggle-password]').forEach((button) => {
        const input = document.getElementById(button.dataset.togglePassword);
        const eye = button.querySelector('[data-eye]');
        const eyeOff = button.querySelector('[data-eye-off]');

        button.addEventListener('click', () => {
            const show = input.type === 'password';
            input.type = show ? 'text' : 'password';
            button.setAttribute('aria-pressed', String(show));
            button.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
            eye.classList.toggle('hidden', show);
            eyeOff.classList.toggle('hidden', !show);
            input.focus();
        });
    });
}

function renderProgress(container, index, labels) {
    const bar = container.querySelector('[data-progress-bar]');
    const text = container.querySelector('[data-progress-label]');

    if (bar.children.length !== labels.length) {
        bar.innerHTML = labels
            .map(
                () =>
                    '<span class="h-1.5 flex-1 rounded-full transition-colors duration-500" style="background-color: #e3e8f0;"></span>',
            )
            .join('');
    }

    [...bar.children].forEach((segment, i) => {
        segment.style.backgroundColor = i <= index ? '#2563eb' : '#e3e8f0';
    });
    text.textContent = `Step ${index + 1} of ${labels.length}: ${labels[index]}`;
}

function createStepper(form, { onChange } = {}) {
    const steps = [...form.querySelectorAll('[data-step]')];
    let index = Math.max(0, steps.findIndex((step) => !step.hidden));
    let moving = false;

    steps.forEach((step, i) => {
        step.hidden = i !== index;
    });

    const duration = () => (prefersReducedMotion() ? 0 : 240);

    async function go(to) {
        if (moving || to === index || to < 0 || to >= steps.length) return;
        moving = true;

        const direction = to > index ? 1 : -1;
        const from = steps[index];
        const target = steps[to];
        index = to;

        await from.animate(
            [
                { opacity: 1, transform: 'translateX(0)' },
                { opacity: 0, transform: `translateX(${-28 * direction}px)` },
            ],
            { duration: duration() * 0.65, easing: 'ease-in' },
        ).finished;

        from.hidden = true;
        target.hidden = false;
        onChange?.(index, direction);

        if (!playAuthDominoEnter(target) && duration()) {
            target.animate(
                [
                    { opacity: 0, transform: `translateX(${28 * direction}px)` },
                    { opacity: 1, transform: 'translateX(0)' },
                ],
                { duration: duration(), easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' },
            );
        }

        target.querySelector('[data-autofocus]')?.focus({ preventScroll: true });
        moving = false;
    }

    return {
        go,
        steps,
        get index() {
            return index;
        },
        next: () => go(index + 1),
        prev: () => go(index - 1),
    };
}

const btnPrimary =
    'inline-flex h-14 min-w-0 flex-1 items-center justify-center gap-2.5 rounded-full px-7 text-[0.95rem] font-semibold text-white transition duration-200 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-70';
const btnPrimaryStyle =
    "background-color: #2563eb; box-shadow: 0 8px 20px rgba(37,99,235,0.32);";
const btnPrimaryOver =
    "if(!this.disabled){this.style.backgroundColor='#1d4fd0'; this.style.boxShadow='0 12px 26px rgba(37,99,235,0.4)'}";
const btnPrimaryOut =
    "this.style.backgroundColor='#2563eb'; this.style.boxShadow='0 8px 20px rgba(37,99,235,0.32)'";
const btnSecondary =
    'inline-flex h-14 flex-none items-center justify-center gap-2 rounded-full border-2 bg-white px-6 text-[0.95rem] font-semibold transition duration-200 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-60';
const fieldControl =
    'group flex items-center gap-3 rounded-2xl border-2 bg-white pl-4 pr-2 transition-all duration-200 focus-within:border-[#2563eb] data-[invalid=true]:border-[#b91c1c]';

export function AuthForgotPasswordLayout({ formId, loginHref }) {
    return `
    <a
      href="#main"
      class="absolute left-3 top-2 z-50 -translate-y-20 rounded-lg px-4 py-2 text-sm text-white focus:translate-y-0"
      style="background-color: #163a63;"
    >Skip to form</a>

    <div data-auth-shell class="grid min-h-screen overflow-x-hidden lg:grid-cols-[5fr_6fr]" style="background-color: #f5f7fb; color: #46546a; font-family: Poppins, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;">
      <aside class="relative lg:sticky lg:top-0 lg:h-screen">
        <div
          data-auth-bg
          data-auth-lane="bg"
          data-auth-depth="0"
          class="absolute inset-0 hidden lg:block lg:[clip-path:polygon(0_0,100%_0,90%_100%,0_100%)]"
          style="background-color: #facc15;"
        ></div>

        <div
          data-auth-bg
          data-auth-lane="bg"
          data-auth-depth="1"
          class="relative flex h-full flex-col overflow-hidden rounded-b-[2rem] px-5 py-5 text-white sm:px-10 lg:rounded-none lg:px-12 lg:py-10 lg:[clip-path:polygon(0_0,98.5%_0,88.5%_100%,0_100%)]"
          style="background-color: #00377A;"
        >
          <div
            data-auth-bg
            data-auth-lane="bg"
            data-auth-depth="2"
            class="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:36px_36px] [mask-image:linear-gradient(to_bottom,#000,transparent_85%)]"
          ></div>

          <a href="/" data-auth-route data-auth-enter data-auth-lane="aside" data-auth-depth="0" class="relative flex items-center gap-3" aria-label="CRT home">
            <span class="grid h-12 w-12 flex-none place-items-center rounded-full bg-white p-0.5">
              <img src="/public/crtlogo.png" alt="CRT logo" width="44" height="44" class="h-11 w-11" />
            </span>
            <span class="flex flex-col leading-tight">
              <strong class="text-sm font-bold sm:text-lg">College for Research and Technology</strong>
              <small class="text-xs text-white/70">Student Organization Participation Tracker</small>
            </span>
          </a>

          <div class="relative mt-6 hidden min-h-[160px] flex-1 lg:block">
            <div
              data-auth-bg
              data-auth-lane="bg"
              data-auth-depth="3"
              class="absolute left-[10%] top-[10%] h-[58%] w-[40%] rounded-[2rem] ring-1 ring-white/10"
              style="background: linear-gradient(to bottom right, #2563eb, #0f2c4c);"
            ></div>
            <div
              data-auth-bg
              data-auth-lane="bg"
              data-auth-depth="4"
              class="absolute right-[8%] top-[26%] h-[46%] w-[22%] rounded-[1.6rem]"
              style="background: linear-gradient(to bottom, #ffd93a, #f5b900);"
            ></div>
            <div
              data-auth-bg
              data-auth-lane="bg"
              data-auth-depth="5"
              class="absolute inset-x-[6%] bottom-[8%] top-0 rounded-full border border-white/15"
            ></div>
            <div
              data-auth-enter
              data-auth-lane="aside"
              data-auth-depth="1"
              class="absolute inset-0"
            >
              <img
                data-auth-fade
                data-auth-lane="aside"
                data-auth-depth="1"
                src="/public/hero-students.png"
                alt="Two CRT students"
                width="1200"
                height="876"
                class="absolute bottom-0 left-1/2 h-full w-auto max-w-none -translate-x-1/2 object-contain object-bottom drop-shadow-2xl [mask-image:linear-gradient(to_bottom,#000_74%,transparent_99%)]"
                style="max-width: none;"
              />
            </div>
          </div>

          <div class="relative mt-6 hidden lg:block" data-auth-aside>
            <h2 data-auth-enter data-auth-lane="aside" data-auth-depth="2" class="text-3xl font-extrabold leading-tight tracking-tight" style="color: #ffffff;">
              Back in four steps.
            </h2>

            <ol class="mt-5 grid max-w-lg grid-cols-1 gap-2 sm:grid-cols-2" aria-label="Recovery steps">
              <li
                data-auth-enter
                data-auth-lane="aside"
                data-auth-depth="3"
                data-recovery-step
                data-state="active"
                class="group flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-3.5 transition-all duration-300 data-[state=active]:-translate-y-1 data-[state=active]:bg-white data-[state=done]:bg-white/15"
              >
                <span class="grid h-9 w-9 flex-none place-items-center rounded-xl bg-white/15 text-xs font-semibold text-white/70 transition-colors duration-300 group-data-[state=active]:bg-[#eaf1ff] group-data-[state=active]:text-[#2563eb] group-data-[state=done]:bg-[#d9f5e8] group-data-[state=done]:text-[#0b7a4b]">
                  <span data-num>1</span>
                  <span data-check class="hidden"><i data-lucide="check" class="h-4 w-4"></i></span>
                </span>
                <span class="min-w-0 leading-tight">
                  <b class="block text-sm font-semibold text-white/70 transition-colors group-data-[state=active]:text-[#0f1b2d] group-data-[state=done]:text-white">Enter your email</b>
                  <small class="text-[10px] text-white/50 group-data-[state=active]:text-[#7a889c]">The one registered to your account</small>
                </span>
              </li>

              <li
                data-auth-enter
                data-auth-lane="aside"
                data-auth-depth="4"
                data-recovery-step
                data-state="todo"
                class="group flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-3.5 transition-all duration-300 data-[state=active]:-translate-y-1 data-[state=active]:bg-white data-[state=done]:bg-white/15"
              >
                <span class="grid h-9 w-9 flex-none place-items-center rounded-xl bg-white/15 text-xs font-semibold text-white/70 transition-colors duration-300 group-data-[state=active]:bg-[#eaf1ff] group-data-[state=active]:text-[#2563eb] group-data-[state=done]:bg-[#d9f5e8] group-data-[state=done]:text-[#0b7a4b]">
                  <span data-num>2</span>
                  <span data-check class="hidden"><i data-lucide="check" class="h-4 w-4"></i></span>
                </span>
                <span class="min-w-0 leading-tight">
                  <b class="block text-sm font-semibold text-white/70 transition-colors group-data-[state=active]:text-[#0f1b2d] group-data-[state=done]:text-white">Verify your account</b>
                  <small class="text-[10px] text-white/50 group-data-[state=active]:text-[#7a889c]">Use the code we email you</small>
                </span>
              </li>

              <li
                data-auth-enter
                data-auth-lane="aside"
                data-auth-depth="5"
                data-recovery-step
                data-state="todo"
                class="group flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-3.5 transition-all duration-300 data-[state=active]:-translate-y-1 data-[state=active]:bg-white data-[state=done]:bg-white/15"
              >
                <span class="grid h-9 w-9 flex-none place-items-center rounded-xl bg-white/15 text-xs font-semibold text-white/70 transition-colors duration-300 group-data-[state=active]:bg-[#eaf1ff] group-data-[state=active]:text-[#2563eb] group-data-[state=done]:bg-[#d9f5e8] group-data-[state=done]:text-[#0b7a4b]">
                  <span data-num>3</span>
                  <span data-check class="hidden"><i data-lucide="check" class="h-4 w-4"></i></span>
                </span>
                <span class="min-w-0 leading-tight">
                  <b class="block text-sm font-semibold text-white/70 transition-colors group-data-[state=active]:text-[#0f1b2d] group-data-[state=done]:text-white">Set a new password</b>
                  <small class="text-[10px] text-white/50 group-data-[state=active]:text-[#7a889c]">Enter it twice to confirm</small>
                </span>
              </li>

              <li
                data-auth-enter
                data-auth-lane="aside"
                data-auth-depth="6"
                data-recovery-step
                data-state="todo"
                class="group flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-3.5 transition-all duration-300 data-[state=active]:-translate-y-1 data-[state=active]:bg-white data-[state=done]:bg-white/15"
              >
                <span class="grid h-9 w-9 flex-none place-items-center rounded-xl bg-white/15 text-xs font-semibold text-white/70 transition-colors duration-300 group-data-[state=active]:bg-[#eaf1ff] group-data-[state=active]:text-[#2563eb] group-data-[state=done]:bg-[#d9f5e8] group-data-[state=done]:text-[#0b7a4b]">
                  <span data-num>4</span>
                  <span data-check class="hidden"><i data-lucide="check" class="h-4 w-4"></i></span>
                </span>
                <span class="min-w-0 leading-tight">
                  <b class="block text-sm font-semibold text-white/70 transition-colors group-data-[state=active]:text-[#0f1b2d] group-data-[state=done]:text-white">Return to login</b>
                  <small class="text-[10px] text-white/50 group-data-[state=active]:text-[#7a889c]">Sign in with your new password</small>
                </span>
              </li>
            </ol>
          </div>
        </div>
      </aside>

      <main id="main" data-auth-panel class="flex flex-col px-5 py-8 sm:px-10 lg:min-h-screen lg:px-[clamp(2rem,6vw,6rem)] lg:py-10">
        <div class="mx-auto w-full max-w-[560px]">
          <a
            href="${loginHref}"
            data-auth-route
            data-auth-enter
            data-auth-lane="panel"
            data-auth-depth="0"
            class="inline-flex items-center gap-2 text-sm font-semibold transition hover:underline focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4"
            style="color: #163a63;"
            onmouseover="this.style.color='#2563eb'"
            onmouseout="this.style.color='#163a63'"
          >
            <i data-lucide="arrow-left" class="h-4 w-4"></i>
            Back to Login
          </a>
        </div>

        <div class="flex flex-1 items-center justify-center py-10">
          <div class="mx-auto w-full max-w-[560px]">
            <div data-progress data-auth-enter data-auth-lane="panel" data-auth-depth="1" class="mb-8">
              <div data-progress-bar class="flex gap-2" aria-hidden="true"></div>
              <p data-progress-label class="mt-3 text-sm font-medium" style="color: #7a889c;" aria-live="polite"></p>
            </div>

            <form id="${formId}" novalidate>
              <section data-step aria-labelledby="step-email-title">
                <h1 id="step-email-title" data-auth-enter data-auth-lane="panel" data-auth-depth="2" class="text-4xl font-extrabold tracking-tight" style="color: #0f1b2d;">
                  Forgot Password
                </h1>
                <p data-auth-enter data-auth-lane="panel" data-auth-depth="3" class="mt-3 max-w-[42ch]">
                  Enter the username or email registered to your account. We will send you a
                  verification code.
                </p>

                <div data-field id="email-field" data-auth-enter data-auth-lane="panel" data-auth-depth="4" class="mt-8">
                  <label for="usernameOrEmail" class="mb-2 block text-sm font-semibold" style="color: #0f1b2d;">
                    Username or email
                  </label>
                  <div data-control class="${fieldControl} px-4 pr-4" style="border-color: #e3e8f0;">
                    <i data-lucide="mail" class="h-5 w-5 flex-none transition-colors" style="color: #7a889c;"></i>
                    <input
                      id="usernameOrEmail"
                      name="usernameOrEmail"
                      type="text"
                      autocomplete="username"
                      autocapitalize="none"
                      spellcheck="false"
                      placeholder="you@crt.edu.ph"
                      data-autofocus
                      aria-describedby="email-error"
                      class="h-14 w-full min-w-0 bg-transparent text-[0.95rem] outline-none focus:outline-none focus-visible:outline-none"
                      style="color: #0f1b2d; outline: none;"
                    />
                  </div>
                  <p id="email-error" data-error role="alert" class="mt-2 hidden items-start gap-1.5 text-sm font-medium" style="color: #b91c1c;"></p>
                </div>

                <div data-actions data-auth-enter data-auth-lane="panel" data-auth-depth="5" class="mt-8">
                  <button
                    id="send-button"
                    type="submit"
                    class="${btnPrimary} w-full"
                    style="${btnPrimaryStyle}"
                    onmouseover="${btnPrimaryOver}"
                    onmouseout="${btnPrimaryOut}"
                  >
                    <svg data-spinner class="hidden h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    <span data-label>Send Reset Link</span>
                    <span data-icon><i data-lucide="send" class="h-5 w-5"></i></span>
                  </button>
                </div>
              </section>

              <section data-step hidden aria-labelledby="step-verify-title">
                <h1 id="step-verify-title" data-auth-enter data-auth-lane="panel" data-auth-depth="2" class="text-4xl font-extrabold tracking-tight" style="color: #0f1b2d;">
                  Check your email
                </h1>
                <p data-auth-enter data-auth-lane="panel" data-auth-depth="3" class="mt-3 max-w-[45ch]">
                  We sent a 6-digit code to
                  <b data-email-label class="break-all font-semibold" style="color: #2563eb;"></b>.
                  Enter the code to verify your account.
                </p>

                <div data-field id="code-field" data-auth-enter data-auth-lane="panel" data-auth-depth="4" class="mt-6">
                  <label id="code-label" class="mb-2 block text-sm font-semibold" style="color: #0f1b2d;">
                    Verification code
                  </label>
                  <div
                    data-control
                    data-otp
                    role="group"
                    aria-labelledby="code-label"
                    aria-describedby="code-error"
                    class="group grid grid-cols-6 gap-2 sm:gap-3"
                  ></div>
                  <p id="code-error" data-error role="alert" class="mt-2 hidden items-start gap-1.5 text-sm font-medium" style="color: #b91c1c;"></p>
                </div>

                <p data-auth-enter data-auth-lane="panel" data-auth-depth="5" class="mt-4 text-sm">
                  Did not get it?
                  <button
                    type="button"
                    data-resend
                    disabled
                    class="font-semibold hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:no-underline"
                    style="color: #2563eb;"
                  >Resend code</button>
                </p>

                <div data-actions data-auth-enter data-auth-lane="panel" data-auth-depth="6" class="mt-8 flex gap-3">
                  <button
                    type="button"
                    data-prev
                    class="${btnSecondary}"
                    style="border-color: #e3e8f0; color: #163a63;"
                    onmouseover="if(!this.disabled){this.style.borderColor='#2563eb'; this.style.color='#2563eb'}"
                    onmouseout="this.style.borderColor='#e3e8f0'; this.style.color='#163a63'"
                  >
                    <i data-lucide="arrow-left" class="h-5 w-5"></i>
                    <span>Back</span>
                  </button>
                  <button
                    id="verify-button"
                    type="submit"
                    class="${btnPrimary}"
                    style="${btnPrimaryStyle}"
                    onmouseover="${btnPrimaryOver}"
                    onmouseout="${btnPrimaryOut}"
                  >
                    <svg data-spinner class="hidden h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    <span data-label>Verify account</span>
                    <span data-icon><i data-lucide="shield-check" class="h-5 w-5"></i></span>
                  </button>
                </div>
              </section>

              <section data-step hidden aria-labelledby="step-password-title">
                <h1 id="step-password-title" data-auth-enter data-auth-lane="panel" data-auth-depth="2" class="text-4xl font-extrabold tracking-tight" style="color: #0f1b2d;">
                  Set a new password
                </h1>
                <p data-auth-enter data-auth-lane="panel" data-auth-depth="3" class="mt-3 max-w-[42ch]">
                  Use at least 8 characters, with letters and numbers.
                </p>

                <div data-field id="new-password-field" data-auth-enter data-auth-lane="panel" data-auth-depth="4" class="mt-8">
                  <label for="new-password" class="mb-2 block text-sm font-semibold" style="color: #0f1b2d;">New password</label>
                  <div data-control class="${fieldControl}" style="border-color: #e3e8f0;">
                    <i data-lucide="lock-keyhole" class="h-5 w-5 flex-none transition-colors" style="color: #7a889c;"></i>
                    <input
                      id="new-password"
                      name="password"
                      type="password"
                      autocomplete="new-password"
                      placeholder="New password"
                      data-autofocus
                      aria-describedby="new-password-error"
                      class="h-14 w-full min-w-0 bg-transparent text-[0.95rem] outline-none focus:outline-none focus-visible:outline-none"
                      style="color: #0f1b2d; outline: none;"
                    />
                    <button
                      type="button"
                      data-toggle-password="new-password"
                      aria-label="Show password"
                      aria-pressed="false"
                      class="grid h-10 w-10 flex-none place-items-center rounded-xl transition focus-visible:outline focus-visible:outline-[3px]"
                      style="color: #7a889c;"
                      onmouseover="this.style.backgroundColor='#f5f7fb'; this.style.color='#2563eb'"
                      onmouseout="this.style.backgroundColor='transparent'; this.style.color='#7a889c'"
                    >
                      <span data-eye><i data-lucide="eye" class="h-5 w-5"></i></span>
                      <span data-eye-off class="hidden"><i data-lucide="eye-off" class="h-5 w-5"></i></span>
                    </button>
                  </div>
                  <p id="new-password-error" data-error role="alert" class="mt-2 hidden items-start gap-1.5 text-sm font-medium" style="color: #b91c1c;"></p>

                  <div class="mt-3 flex items-center gap-3" aria-hidden="true">
                    <div class="grid flex-1 grid-cols-4 gap-1.5">
                      <span data-strength-seg class="h-1.5 rounded-full transition-colors duration-300" style="background-color: #e3e8f0;"></span>
                      <span data-strength-seg class="h-1.5 rounded-full transition-colors duration-300" style="background-color: #e3e8f0;"></span>
                      <span data-strength-seg class="h-1.5 rounded-full transition-colors duration-300" style="background-color: #e3e8f0;"></span>
                      <span data-strength-seg class="h-1.5 rounded-full transition-colors duration-300" style="background-color: #e3e8f0;"></span>
                    </div>
                    <span data-strength-label class="w-12 text-right text-xs font-semibold" style="color: #7a889c;"></span>
                  </div>
                </div>

                <div data-field id="confirm-password-field" data-auth-enter data-auth-lane="panel" data-auth-depth="5" class="mt-5">
                  <label for="confirm-password" class="mb-2 block text-sm font-semibold" style="color: #0f1b2d;">Confirm password</label>
                  <div data-control class="${fieldControl}" style="border-color: #e3e8f0;">
                    <i data-lucide="lock-keyhole" class="h-5 w-5 flex-none transition-colors" style="color: #7a889c;"></i>
                    <input
                      id="confirm-password"
                      name="confirm_password"
                      type="password"
                      autocomplete="new-password"
                      placeholder="Repeat new password"
                      aria-describedby="confirm-password-error"
                      class="h-14 w-full min-w-0 bg-transparent text-[0.95rem] outline-none focus:outline-none focus-visible:outline-none"
                      style="color: #0f1b2d; outline: none;"
                    />
                    <button
                      type="button"
                      data-toggle-password="confirm-password"
                      aria-label="Show password"
                      aria-pressed="false"
                      class="grid h-10 w-10 flex-none place-items-center rounded-xl transition focus-visible:outline focus-visible:outline-[3px]"
                      style="color: #7a889c;"
                      onmouseover="this.style.backgroundColor='#f5f7fb'; this.style.color='#2563eb'"
                      onmouseout="this.style.backgroundColor='transparent'; this.style.color='#7a889c'"
                    >
                      <span data-eye><i data-lucide="eye" class="h-5 w-5"></i></span>
                      <span data-eye-off class="hidden"><i data-lucide="eye-off" class="h-5 w-5"></i></span>
                    </button>
                  </div>
                  <p id="confirm-password-error" data-error role="alert" class="mt-2 hidden items-start gap-1.5 text-sm font-medium" style="color: #b91c1c;"></p>
                </div>

                <div data-actions data-auth-enter data-auth-lane="panel" data-auth-depth="6" class="mt-8 flex gap-3">
                  <button
                    type="button"
                    data-prev
                    class="${btnSecondary}"
                    style="border-color: #e3e8f0; color: #163a63;"
                    onmouseover="if(!this.disabled){this.style.borderColor='#2563eb'; this.style.color='#2563eb'}"
                    onmouseout="this.style.borderColor='#e3e8f0'; this.style.color='#163a63'"
                  >
                    <i data-lucide="arrow-left" class="h-5 w-5"></i>
                    <span>Back</span>
                  </button>
                  <button
                    id="update-button"
                    type="submit"
                    class="${btnPrimary}"
                    style="${btnPrimaryStyle}"
                    onmouseover="${btnPrimaryOver}"
                    onmouseout="${btnPrimaryOut}"
                  >
                    <svg data-spinner class="hidden h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    <span data-label>Update password</span>
                    <span data-icon><i data-lucide="key-round" class="h-5 w-5"></i></span>
                  </button>
                </div>
              </section>

              <section data-step hidden aria-labelledby="step-done-title">
                <span data-auth-enter data-auth-lane="panel" data-auth-depth="2" class="grid h-16 w-16 place-items-center rounded-2xl" style="background-color: #d9f5e8; color: #0b7a4b;">
                  <i data-lucide="circle-check" class="h-8 w-8"></i>
                </span>
                <h1 id="step-done-title" data-auth-enter data-auth-lane="panel" data-auth-depth="3" class="mt-6 text-4xl font-extrabold tracking-tight" style="color: #0f1b2d;">
                  Password updated successfully.
                </h1>
                <p data-auth-enter data-auth-lane="panel" data-auth-depth="4" class="mt-3 max-w-[42ch]">
                  Sign in with your new password to open your portal.
                </p>
                <div data-auth-enter data-auth-lane="panel" data-auth-depth="5" class="mt-8">
                  <a
                    href="${loginHref}"
                    data-auth-route
                    class="inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-full px-7 text-[0.95rem] font-semibold text-white transition duration-200 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2"
                    style="${btnPrimaryStyle}"
                    onmouseover="${btnPrimaryOver}"
                    onmouseout="${btnPrimaryOut}"
                  >
                    <i data-lucide="log-in" class="h-5 w-5"></i>
                    <span>Back to Login</span>
                  </a>
                </div>
              </section>
            </form>
          </div>
        </div>

        <p data-auth-enter data-auth-lane="panel" data-auth-depth="9" class="text-center text-xs" style="color: #7a889c;">
          &copy; <span id="year">2026</span> College for Research and
          Technology. All rights reserved.
        </p>
      </main>
    </div>
    `;
}

export function initAuthForgotPassword({
    formId,
    bodyClass,
    sendReset,
    verifyOtp,
    resetPassword,
    userIdKey,
}) {
    document.body.classList.remove('admin-page', 'adviser-page', 'student-page');
    if (bodyClass) document.body.classList.add(bodyClass);

    const form = document.getElementById(formId);
    const progress = document.querySelector('[data-progress]');
    const emailField = document.getElementById('email-field');
    const codeField = document.getElementById('code-field');
    const passwordField = document.getElementById('new-password-field');
    const confirmField = document.getElementById('confirm-password-field');
    const emailInput = document.getElementById('usernameOrEmail');
    const passwordInput = document.getElementById('new-password');
    const confirmInput = document.getElementById('confirm-password');
    const sendButton = document.getElementById('send-button');
    const verifyButton = document.getElementById('verify-button');
    const updateButton = document.getElementById('update-button');
    const resendButton = document.querySelector('[data-resend]');
    const emailLabel = document.querySelector('[data-email-label]');
    const recoverySteps = document.querySelectorAll('[data-recovery-step]');
    const strengthSegments = document.querySelectorAll('[data-strength-seg]');
    const strengthLabel = document.querySelector('[data-strength-label]');
    const yearEl = document.getElementById('year');

    const state = { account: '', userId: null, verifiedCode: '' };
    let busy = false;
    let cooldownTimer;

    const stepper = createStepper(form, { onChange: handleStepChange });

    function handleStepChange(index) {
        progress.classList.toggle('hidden', index === FINAL_STEP);
        if (index < FINAL_STEP) renderProgress(progress, index, STEP_LABELS);

        recoverySteps.forEach((item, i) => {
            const status = i < index ? 'done' : i === index ? 'active' : 'todo';
            item.dataset.state = status;
            item.querySelector('[data-num]')?.classList.toggle('hidden', status === 'done');
            item.querySelector('[data-check]')?.classList.toggle('hidden', status !== 'done');
        });
        icons();
    }

    function initOtp(group) {
        group.innerHTML = Array.from(
            { length: CODE_LENGTH },
            (_, i) =>
                `<input type="text" inputmode="numeric" maxlength="1" ${
                    i === 0
                        ? 'autocomplete="one-time-code" data-autofocus'
                        : 'autocomplete="off"'
                } aria-label="Digit ${i + 1} of ${CODE_LENGTH}" class="h-14 w-full min-w-0 rounded-xl border-2 bg-white text-center text-xl font-semibold outline-none focus:outline-none focus-visible:outline-none transition duration-200 focus:border-[#2563eb] group-data-[invalid=true]:border-[#b91c1c]" style="border-color: #e3e8f0; color: #0f1b2d; outline: none;" />`,
        ).join('');

        const cells = [...group.querySelectorAll('input')];

        cells.forEach((cell, i) => {
            cell.addEventListener('input', () => {
                cell.value = cell.value.replace(/\D/g, '').slice(-1);
                setFieldError(codeField, '');
                if (cell.value && i < cells.length - 1) cells[i + 1].focus();
            });
            cell.addEventListener('keydown', (event) => {
                if (event.key === 'Backspace' && !cell.value && i > 0) {
                    cells[i - 1].value = '';
                    cells[i - 1].focus();
                }
                if (event.key === 'ArrowLeft' && i > 0) cells[i - 1].focus();
                if (event.key === 'ArrowRight' && i < cells.length - 1) cells[i + 1].focus();
            });
            cell.addEventListener('paste', (event) => {
                event.preventDefault();
                const digits = event.clipboardData
                    .getData('text')
                    .replace(/\D/g, '')
                    .slice(0, cells.length);
                [...digits].forEach((digit, j) => {
                    cells[j].value = digit;
                });
                cells[Math.min(digits.length, cells.length - 1)].focus();
                setFieldError(codeField, '');
            });
            cell.addEventListener('focus', () => cell.select());
        });

        return {
            value: () => cells.map((cell) => cell.value).join(''),
            clear: () => cells.forEach((cell) => (cell.value = '')),
        };
    }

    const otp = initOtp(document.querySelector('[data-otp]'));

    function startCooldown() {
        let left = RESEND_SECONDS;
        clearInterval(cooldownTimer);
        const tick = () => {
            resendButton.textContent = left > 0 ? `Resend in ${left}s` : 'Resend code';
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

    const STRENGTH_COLORS = ['#e3e8f0', '#b91c1c', '#facc15', '#2563eb', '#0b7a4b'];
    const STRENGTH_TEXT = ['', 'Weak', 'Fair', 'Good', 'Strong'];

    function renderStrength() {
        const score = passwordInput.value ? scoreStrength(passwordInput.value) : 0;
        strengthSegments.forEach((segment, i) => {
            segment.style.backgroundColor = i < score ? STRENGTH_COLORS[score] : STRENGTH_COLORS[0];
        });
        strengthLabel.textContent = STRENGTH_TEXT[score];
    }

    async function handleEmail() {
        const account = emailInput.value.trim();
        const message = account ? '' : MESSAGES.usernameRequired;
        setFieldError(emailField, message);
        if (message) return emailInput.focus();

        setLoading(sendButton, true, 'Sending');
        showToast('Sending verification code...', 'loading');

        const result = await sendReset(account);

        if (result[userIdKey]) {
            if (account !== state.account) {
                otp.clear();
                state.verifiedCode = '';
            }
            state.account = account;
            state.userId = result[userIdKey];
            emailLabel.textContent = censorEmail(result.email || account);
            startCooldown();
            setLoading(sendButton, false);
            updateToast(`OTP sent successfully to ${censorEmail(result.email || account)}!`, 'success');
            await stepper.go(1);
        } else {
            setLoading(sendButton, false);
            updateToast(result.message || MESSAGES.network, 'error');
            setFieldError(emailField, result.message || MESSAGES.network);
        }
    }

    async function handleVerify() {
        const code = otp.value();
        const message =
            code.length === CODE_LENGTH && /^\d+$/.test(code) ? '' : MESSAGES.codeRequired;
        setFieldError(codeField, message);
        if (message) return codeField.querySelector('input')?.focus();

        if (code === state.verifiedCode) return stepper.go(2);

        setLoading(verifyButton, true, 'Verifying');
        showToast('Verifying OTP...', 'loading');

        const result = await verifyOtp(state.userId, code);

        if (result.message === 'OTP verified successfully') {
            state.verifiedCode = code;
            setLoading(verifyButton, false);
            updateToast('OTP verified successfully!', 'success');
            await stepper.go(2);
        } else {
            setLoading(verifyButton, false);
            setFieldError(codeField, result.message || MESSAGES.codeInvalid);
            updateToast(result.message || MESSAGES.codeInvalid, 'error');
            otp.clear();
            codeField.querySelector('input')?.focus();
        }
    }

    async function handleUpdate() {
        const validation = PasswordValidator.validate(passwordInput.value, confirmInput.value);
        if (!validation.isValid) {
            if (!passwordInput.value || passwordInput.value.length < MIN_PASSWORD) {
                setFieldError(
                    passwordField,
                    !passwordInput.value ? MESSAGES.passwordRequired : MESSAGES.passwordShort,
                );
                setFieldError(confirmField, '');
                return passwordInput.focus();
            }
            setFieldError(passwordField, '');
            setFieldError(confirmField, validation.message || MESSAGES.passwordMismatch);
            return confirmInput.focus();
        }

        setFieldError(passwordField, '');
        setFieldError(confirmField, '');
        setLoading(updateButton, true, 'Updating');
        showToast('Resetting password...', 'loading');

        const result = await resetPassword(state.userId, passwordInput.value);

        if (result.message === 'Password reset successfully') {
            passwordInput.value = '';
            confirmInput.value = '';
            setLoading(updateButton, false);
            updateToast('Password reset successfully!', 'success');
            await stepper.go(FINAL_STEP);
        } else {
            setLoading(updateButton, false);
            updateToast(result.message || MESSAGES.network, 'error');
        }
    }

    form.addEventListener('submit', async (event) => {
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

    document.querySelectorAll('[data-prev]').forEach((button) =>
        button.addEventListener('click', () => stepper.prev()),
    );

    resendButton.addEventListener('click', async () => {
        resendButton.disabled = true;
        showToast('Resending code...', 'loading');
        const result = await sendReset(state.account);
        if (result[userIdKey]) {
            state.userId = result[userIdKey];
            otp.clear();
            state.verifiedCode = '';
            startCooldown();
            updateToast(`New code sent to ${censorEmail(result.email || state.account)}.`, 'success');
        } else {
            resendButton.disabled = false;
            updateToast(result.message || MESSAGES.network, 'error');
        }
    });

    passwordInput.addEventListener('input', renderStrength);
    passwordInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !confirmInput.value) {
            event.preventDefault();
            confirmInput.focus();
        }
    });

    [emailField, codeField, passwordField, confirmField].forEach(watchField);

    handleStepChange(0);
    initPasswordToggles();
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
    icons();
    emailInput.focus();
    initAuthRouteAnimation();
}
