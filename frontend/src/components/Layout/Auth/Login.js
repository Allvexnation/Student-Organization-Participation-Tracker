import { setToken, getToken, removeToken, getUserData, isAuthenticated, initNetworkListener, setUserData, getUserRole } from '../../../utils/jwt.js';
import { showToast, updateToast } from '../../ToastMessage.js';
import { navigate } from '../../../utils/navigation.js';
import { checkBan } from '../../../api/web/Banned.js';
import { getDeviceInfo } from '../../../utils/DeviceInfo.js';
import { initAuthRouteAnimation, navigateAfterLogin, playAuthDominoEnter } from '../../../provider/Animation/auth/AuthAnimation.js';
import { getDefaultProfileSVG } from '../../../static/Profile/DefaultProfile.js';

const ROLES = {
    administrator: {
        label: 'Administrator',
        summary: 'Administrator portal: set up students, advisers, organizations and events.',
    },
    adviser: {
        label: 'Adviser',
        summary: 'Adviser portal: run organizations, assign tasks and record attendance.',
    },
    student: {
        label: 'Student',
        summary: 'Student portal: join events, complete tasks and track your attendance.',
    },
};

const STEP_LABELS = ['Account', 'Password'];
const MESSAGES = {
    usernameRequired: 'Username is required.',
    passwordRequired: 'Password is required.',
};

const prefersReducedMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const icons = () => {
    if (typeof lucide !== 'undefined') lucide.createIcons();
};

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

function chipIndicatorTransform(roleKey) {
    const chipIndex = { administrator: 0, adviser: 1, student: 2 }[roleKey] ?? 0;
    return `translateX(calc(${chipIndex} * (100% + 0.25rem)))`;
}

export function AuthLoginLayout({ formId, forgotPasswordHref, roleKey = 'administrator' }) {
    return `
    <a
      href="#main"
      class="absolute left-3 top-2 z-50 -translate-y-20 rounded-lg px-4 py-2 text-sm text-white focus:translate-y-0"
      style="background-color: #163a63;"
    >Skip to login form</a>

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
              <img
                src="/public/crtlogo.png"
                alt="CRT logo"
                width="44"
                height="44"
                class="h-11 w-11"
              />
            </span>
            <span class="flex flex-col leading-tight">
              <strong class="text-sm font-bold sm:text-lg">College for Research and Technology</strong>
              <small class="text-xs text-white/70">Student Organization Participation Tracker</small>
            </span>
          </a>

          <nav class="relative mt-4 lg:hidden" data-auth-chips data-auth-enter data-auth-lane="aside" data-auth-depth="1" aria-label="Portals">
            <div class="relative grid grid-cols-3 gap-1 rounded-full border border-white/15 bg-white/10 p-1">
              <span
                data-chip-indicator
                class="pointer-events-none absolute top-1 bottom-1 left-1 rounded-full bg-white shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.2,0.7,0.2,1)] motion-reduce:transition-none"
                style="width: calc((100% - 1rem) / 3); transform: ${chipIndicatorTransform(roleKey)};"
              ></span>
              <a
                href="/auth/admin/login"
                data-auth-route
                data-role-card="administrator"
                data-active="${roleKey === 'administrator' ? 'true' : 'false'}"
                ${roleKey === 'administrator' ? 'aria-current="page"' : ''}
                class="relative z-10 flex min-w-0 items-center justify-center gap-1 rounded-full px-1.5 py-2 text-[11px] font-semibold text-white/80 transition-colors duration-300 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 data-[active=true]:text-[#0f1b2d] sm:gap-1.5 sm:px-2 sm:text-xs"
              >
                <i data-lucide="shield-check" class="h-3.5 w-3.5 flex-none"></i>
                <span class="truncate">Admin</span>
              </a>
              <a
                href="/auth/adviser/login"
                data-auth-route
                data-role-card="adviser"
                data-active="${roleKey === 'adviser' ? 'true' : 'false'}"
                ${roleKey === 'adviser' ? 'aria-current="page"' : ''}
                class="relative z-10 flex min-w-0 items-center justify-center gap-1 rounded-full px-1.5 py-2 text-[11px] font-semibold text-white/80 transition-colors duration-300 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 data-[active=true]:text-[#0f1b2d] sm:gap-1.5 sm:px-2 sm:text-xs"
              >
                <i data-lucide="user-cog" class="h-3.5 w-3.5 flex-none"></i>
                <span class="truncate">Adviser</span>
              </a>
              <a
                href="/auth/student/login"
                data-auth-route
                data-role-card="student"
                data-active="${roleKey === 'student' ? 'true' : 'false'}"
                ${roleKey === 'student' ? 'aria-current="page"' : ''}
                class="relative z-10 flex min-w-0 items-center justify-center gap-1 rounded-full px-1.5 py-2 text-[11px] font-semibold text-white/80 transition-colors duration-300 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 data-[active=true]:text-[#0f1b2d] sm:gap-1.5 sm:px-2 sm:text-xs"
              >
                <i data-lucide="graduation-cap" class="h-3.5 w-3.5 flex-none"></i>
                <span class="truncate">Student</span>
              </a>
            </div>
          </nav>

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
              Manage. Participate. Achieve.
            </h2>

            <ul class="mt-6 grid max-w-md grid-cols-3 gap-2" aria-label="Portals">
              <li data-auth-enter data-auth-lane="aside" data-auth-depth="3">
                <a
                  href="/auth/admin/login"
                  data-auth-route
                  data-role-card="administrator"
                  data-active="${roleKey === 'administrator' ? 'true' : 'false'}"
                  ${roleKey === 'administrator' ? 'aria-current="page"' : ''}
                  class="group flex h-full flex-col gap-2 rounded-2xl border border-white/15 bg-white/10 p-2 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/20 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 data-[active=true]:-translate-y-1 data-[active=true]:bg-white data-[active=true]:text-[#0f1b2d] data-[active=true]:hover:bg-white"
                >
                  <span
                    class="grid h-7 w-7 place-items-center rounded-lg bg-white/15 transition-colors duration-300 group-data-[active=true]:bg-[#eaf1ff] group-data-[active=true]:text-[#2563eb]"
                  ><i data-lucide="shield-check" class="h-4 w-4"></i></span>
                  <span class="text-xs font-semibold">Administrator</span>
                </a>
              </li>
              <li data-auth-enter data-auth-lane="aside" data-auth-depth="4">
                <a
                  href="/auth/adviser/login"
                  data-auth-route
                  data-role-card="adviser"
                  data-active="${roleKey === 'adviser' ? 'true' : 'false'}"
                  ${roleKey === 'adviser' ? 'aria-current="page"' : ''}
                  class="group flex h-full flex-col gap-2 rounded-2xl border border-white/15 bg-white/10 p-2 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/20 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 data-[active=true]:-translate-y-1 data-[active=true]:bg-white data-[active=true]:text-[#0f1b2d] data-[active=true]:hover:bg-white"
                >
                  <span
                    class="grid h-7 w-7 place-items-center rounded-lg bg-white/15 transition-colors duration-300 group-data-[active=true]:bg-[#eaf1ff] group-data-[active=true]:text-[#2563eb]"
                  ><i data-lucide="user-cog" class="h-4 w-4"></i></span>
                  <span class="text-xs font-semibold">Adviser</span>
                </a>
              </li>
              <li data-auth-enter data-auth-lane="aside" data-auth-depth="5">
                <a
                  href="/auth/student/login"
                  data-auth-route
                  data-role-card="student"
                  data-active="${roleKey === 'student' ? 'true' : 'false'}"
                  ${roleKey === 'student' ? 'aria-current="page"' : ''}
                  class="group flex h-full flex-col gap-2 rounded-2xl border border-white/15 bg-white/10 p-2 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/20 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 data-[active=true]:-translate-y-1 data-[active=true]:bg-white data-[active=true]:text-[#0f1b2d] data-[active=true]:hover:bg-white"
                >
                  <span
                    class="grid h-7 w-7 place-items-center rounded-lg bg-white/15 transition-colors duration-300 group-data-[active=true]:bg-[#eaf1ff] group-data-[active=true]:text-[#2563eb]"
                  ><i data-lucide="graduation-cap" class="h-4 w-4"></i></span>
                  <span class="text-xs font-semibold">Student</span>
                </a>
              </li>
            </ul>

            <p
              data-role-caption
              data-auth-enter
              data-auth-lane="aside"
              data-auth-depth="6"
              aria-live="polite"
              class="mt-4 min-h-[2.75rem] text-sm"
              style="color: rgba(255, 255, 255, 0.7);"
            >
              Enter your username and we will open the portal that matches your
              role.
            </p>
          </div>
        </div>
      </aside>

      <main
        id="main"
        data-auth-panel
        class="flex flex-col px-5 py-8 sm:px-10 lg:min-h-screen lg:px-[clamp(2rem,6vw,6rem)] lg:py-10"
      >
        <div class="w-full max-w-[560px] mx-auto">
          <a
            href="/"
            data-auth-route
            data-auth-enter
            data-auth-lane="panel"
            data-auth-depth="0"
            class="inline-flex items-center gap-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4"
            style="color: #163a63;"
            onmouseover="this.style.color='#2563eb'"
            onmouseout="this.style.color='#163a63'"
          >
            <i data-lucide="arrow-left" class="h-4 w-4"></i> Back to home
          </a>
        </div>

        <div class="flex flex-1 items-center justify-center py-10">
          <div class="mx-auto w-full max-w-[560px]">
            <div data-progress data-auth-enter data-auth-lane="panel" data-auth-depth="1" class="mb-8">
              <div data-progress-bar class="flex gap-2" aria-hidden="true"></div>
              <p
                data-progress-label
                class="mt-3 text-sm font-medium"
                style="color: #7a889c;"
                aria-live="polite"
              ></p>
            </div>

            <form id="${formId}" novalidate>
              <section data-step aria-labelledby="step-account-title">
                <h1
                  id="step-account-title"
                  data-auth-enter
                  data-auth-lane="panel"
                  data-auth-depth="2"
                  class="text-4xl font-extrabold tracking-tight"
                  style="color: #0f1b2d;"
                >
                  Welcome back
                </h1>
                <p data-auth-enter data-auth-lane="panel" data-auth-depth="3" class="mt-3 max-w-[40ch]">
                  Sign in with your CRT account. We will take you to the portal
                  that matches your role.
                </p>

                <div data-field id="username-field" data-auth-enter data-auth-lane="panel" data-auth-depth="4" class="mt-8">
                  <label for="email" class="mb-2 block text-sm font-semibold" style="color: #0f1b2d;">
                    Email or username
                  </label>
                  <div
                    data-control
                    class="group flex items-center gap-3 rounded-2xl border-2 bg-white px-4 transition-all duration-200 focus-within:border-[#2563eb] data-[invalid=true]:border-[#b91c1c]"
                    style="border-color: #e3e8f0;"
                  >
                    <i data-lucide="user" class="h-5 w-5 flex-none transition-colors" style="color: #7a889c;"></i>
                    <input
                      id="email"
                      name="email"
                      type="text"
                      autocomplete="username"
                      autocapitalize="none"
                      spellcheck="false"
                      placeholder="you@crt.edu.ph"
                      data-autofocus
                      aria-describedby="username-error"
                      class="h-14 w-full min-w-0 bg-transparent text-[0.95rem] outline-none focus:outline-none focus-visible:outline-none"
                      style="color: #0f1b2d; outline: none;"
                    />
                  </div>
                  <p
                    id="username-error"
                    data-error
                    role="alert"
                    class="mt-2 hidden items-start gap-1.5 text-sm font-medium"
                    style="color: #b91c1c;"
                  ></p>
                </div>

                <div data-actions data-auth-enter data-auth-lane="panel" data-auth-depth="5" class="mt-8">
                  <button
                    id="next-button"
                    type="submit"
                    class="inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-full px-7 text-[0.95rem] font-semibold text-white transition duration-200 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-70"
                    style="background-color: #2563eb; box-shadow: 0 8px 20px rgba(37,99,235,0.32);"
                    onmouseover="if(!this.disabled){this.style.backgroundColor='#1d4fd0'; this.style.boxShadow='0 12px 26px rgba(37,99,235,0.4)'}"
                    onmouseout="this.style.backgroundColor='#2563eb'; this.style.boxShadow='0 8px 20px rgba(37,99,235,0.32)'"
                  >
                    <svg
                      data-spinner
                      class="hidden h-5 w-5 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2.5"
                      stroke-linecap="round"
                      aria-hidden="true"
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    <span data-label>Next</span>
                    <span data-icon><i data-lucide="arrow-right" class="h-5 w-5"></i></span>
                  </button>
                </div>

                <p data-auth-enter data-auth-lane="panel" data-auth-depth="6" class="mt-5 text-center text-sm">
                  <a
                    href="${forgotPasswordHref}"
                    data-auth-route
                    class="font-semibold transition hover:underline focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2"
                    style="color: #2563eb;"
                    onmouseover="this.style.color='#1d4fd0'"
                    onmouseout="this.style.color='#2563eb'"
                  >Forgot password?</a>
                </p>
              </section>

              <section data-step hidden aria-labelledby="step-password-title">
                <h1
                  id="step-password-title"
                  data-auth-enter
                  data-auth-lane="panel"
                  data-auth-depth="2"
                  class="text-4xl font-extrabold tracking-tight"
                  style="color: #0f1b2d;"
                >
                  Enter your password
                </h1>

                <div data-auth-enter data-auth-lane="panel" data-auth-depth="3" class="mt-6 flex items-center gap-3 rounded-2xl border bg-white p-3" style="border-color: #e3e8f0;">
                  <span
                    data-account-avatar
                    class="grid h-11 w-11 flex-none place-items-center overflow-hidden rounded-xl"
                    style="background-color: #eaf1ff; color: #2563eb;"
                  >
                    ${getDefaultProfileSVG('100%', '100%')}
                  </span>
                  <div class="min-w-0 flex-1">
                    <p data-account-name class="truncate text-sm font-semibold" style="color: #0f1b2d;"></p>
                    <p data-account-role class="truncate text-xs" style="color: #7a889c;"></p>
                  </div>
                  <span
                    data-role-badge
                    class="hidden flex-none rounded-full px-3 py-1 text-xs font-semibold"
                    style="background-color: #fff3cd; color: #8a6500;"
                  ></span>
                </div>

                <div data-field id="password-field" data-auth-enter data-auth-lane="panel" data-auth-depth="4" class="mt-6">
                  <div class="mb-2 flex items-center justify-between gap-3">
                    <label for="password" class="text-sm font-semibold" style="color: #0f1b2d;">Password</label>
                    <a
                      href="${forgotPasswordHref}"
                      data-auth-route
                      class="text-sm font-semibold transition hover:underline focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2"
                      style="color: #2563eb;"
                      onmouseover="this.style.color='#1d4fd0'"
                      onmouseout="this.style.color='#2563eb'"
                    >Forgot password?</a>
                  </div>
                  <div
                    data-control
                    class="group flex items-center gap-3 rounded-2xl border-2 bg-white pl-4 pr-2 transition-all duration-200 focus-within:border-[#2563eb] data-[invalid=true]:border-[#b91c1c]"
                    style="border-color: #e3e8f0;"
                  >
                    <i data-lucide="lock-keyhole" class="h-5 w-5 flex-none transition-colors" style="color: #7a889c;"></i>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autocomplete="current-password"
                      placeholder="Your password"
                      data-autofocus
                      aria-describedby="password-error"
                      class="h-14 w-full min-w-0 bg-transparent text-[0.95rem] outline-none focus:outline-none focus-visible:outline-none"
                      style="color: #0f1b2d; outline: none;"
                    />
                    <button
                      type="button"
                      data-toggle-password="password"
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
                  <p
                    id="password-error"
                    data-error
                    role="alert"
                    class="mt-2 hidden items-start gap-1.5 text-sm font-medium"
                    style="color: #b91c1c;"
                  ></p>
                </div>

                <div data-actions data-auth-enter data-auth-lane="panel" data-auth-depth="5" class="mt-8 flex gap-3">
                  <button
                    type="button"
                    data-prev
                    class="inline-flex h-14 flex-none items-center justify-center gap-2 rounded-full border-2 bg-white px-6 text-[0.95rem] font-semibold transition duration-200 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-60"
                    style="border-color: #e3e8f0; color: #163a63;"
                    onmouseover="if(!this.disabled){this.style.borderColor='#2563eb'; this.style.color='#2563eb'}"
                    onmouseout="this.style.borderColor='#e3e8f0'; this.style.color='#163a63'"
                  >
                    <i data-lucide="arrow-left" class="h-5 w-5"></i>
                    <span>Back</span>
                  </button>
                  <button
                    id="login-button"
                    type="submit"
                    class="inline-flex h-14 min-w-0 flex-1 items-center justify-center gap-2.5 rounded-full px-7 text-[0.95rem] font-semibold text-white transition duration-200 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-70"
                    style="background-color: #2563eb; box-shadow: 0 8px 20px rgba(37,99,235,0.32);"
                    onmouseover="if(!this.disabled){this.style.backgroundColor='#1d4fd0'; this.style.boxShadow='0 12px 26px rgba(37,99,235,0.4)'}"
                    onmouseout="this.style.backgroundColor='#2563eb'; this.style.boxShadow='0 8px 20px rgba(37,99,235,0.32)'"
                  >
                    <svg
                      data-spinner
                      class="hidden h-5 w-5 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2.5"
                      stroke-linecap="round"
                      aria-hidden="true"
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    <span data-label>Login</span>
                    <span data-icon><i data-lucide="log-in" class="h-5 w-5"></i></span>
                  </button>
                </div>
              </section>
            </form>

            <div class="mt-8" data-auth-enter data-auth-lane="panel" data-auth-depth="7">
              <div class="relative">
                <div class="absolute inset-0 flex items-center">
                  <div class="w-full border-t" style="border-color: #e3e8f0;"></div>
                </div>
                <div class="relative flex justify-center text-sm">
                  <span class="px-3 text-sm font-medium" style="background-color: #f5f7fb; color: #7a889c;">Or continue with</span>
                </div>
              </div>
              <button
                type="button"
                id="googleLoginBtn"
                class="mt-4 inline-flex h-14 w-full items-center justify-center gap-3 rounded-full border-2 bg-white px-7 text-[0.95rem] font-semibold transition duration-200 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-70"
                style="border-color: #e3e8f0; color: #0f1b2d;"
                onmouseover="if(!this.disabled){this.style.borderColor='#2563eb'; this.style.color='#2563eb'}"
                onmouseout="this.style.borderColor='#e3e8f0'; this.style.color='#0f1b2d'"
              >
                <svg class="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Sign in with Google</span>
              </button>
            </div>

            <p data-auth-enter data-auth-lane="panel" data-auth-depth="8" class="mt-8 flex items-start gap-2 text-sm" style="color: #7a889c;">
              <i data-lucide="info" class="mt-0.5 h-4 w-4 flex-none"></i>
              <span>No account yet? Accounts are created by administrators.</span>
            </p>
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

export function initAuthLogin({
    formId,
    role,
    roleKey,
    dashboardPath,
    bodyClass,
    lookupAccount,
    login,
    googleLogin,
    userKey,
}) {
    initNetworkListener();

    document.body.classList.remove('admin-page', 'adviser-page', 'student-page');
    if (bodyClass) document.body.classList.add(bodyClass);

    const form = document.getElementById(formId);
    const progress = document.querySelector('[data-progress]');
    const usernameField = document.getElementById('username-field');
    const passwordField = document.getElementById('password-field');
    const usernameInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const nextButton = document.getElementById('next-button');
    const loginButton = document.getElementById('login-button');
    const accountName = document.querySelector('[data-account-name]');
    const accountRole = document.querySelector('[data-account-role]');
    const accountAvatar = document.querySelector('[data-account-avatar]');
    const roleBadge = document.querySelector('[data-role-badge]');
    const roleCards = document.querySelectorAll('[data-role-card]');
    const roleCaption = document.querySelector('[data-role-caption]');
    const yearEl = document.getElementById('year');
    const defaultCaption = roleCaption?.textContent ?? '';

    let busy = false;

    const stepper = createStepper(form, {
        onChange: (index) => renderProgress(progress, index, STEP_LABELS),
    });

    function highlightPortal(nextRoleKey) {
        roleCards.forEach((card) => {
            const active = card.dataset.roleCard === nextRoleKey;
            card.setAttribute('data-active', String(active));
            if (active) card.setAttribute('aria-current', 'page');
            else card.removeAttribute('aria-current');
        });

        const indicator = document.querySelector('[data-chip-indicator]');
        const chipIndex = { administrator: 0, adviser: 1, student: 2 }[nextRoleKey] ?? 0;
        if (indicator) {
            indicator.style.transform = `translateX(calc(${chipIndex} * (100% + 0.25rem)))`;
        }
    }

    function renderRole(nextRoleKey) {
        const roleInfo = ROLES[nextRoleKey];
        highlightPortal(nextRoleKey || roleKey);
        if (roleCaption) {
            roleCaption.textContent = roleInfo
                ? roleInfo.summary
                : (ROLES[roleKey]?.summary || defaultCaption);
        }
        if (roleBadge) {
            roleBadge.textContent = roleInfo ? roleInfo.label : '';
            roleBadge.classList.toggle('hidden', !roleInfo);
        }
        if (accountRole) {
            accountRole.textContent = roleInfo
                ? `${roleInfo.label} portal`
                : 'Portal is confirmed when you sign in';
        }
    }

    function renderDefaultAvatar() {
        if (!accountAvatar) return;
        accountAvatar.innerHTML = getDefaultProfileSVG('100%', '100%');
    }

    function renderAccountPreview({ name, username, profile_photo }) {
        const displayName = String(name || username || '').trim();
        if (accountName) accountName.textContent = displayName;
        if (!accountAvatar) return;

        const photo = String(profile_photo || '').trim();
        if (!photo || !displayName) {
            renderDefaultAvatar();
            return;
        }

        const img = document.createElement('img');
        img.src = photo;
        img.alt = displayName;
        img.className = 'h-full w-full object-cover';
        img.addEventListener('error', () => {
            if (typeof window.handleProfileImageError === 'function') {
                window.handleProfileImageError(img);
                return;
            }
            renderDefaultAvatar();
        });
        accountAvatar.innerHTML = '';
        accountAvatar.appendChild(img);
    }

    function clearAccountPreview() {
        if (accountName) accountName.textContent = '';
        renderDefaultAvatar();
    }

    async function handleUsername() {
        const value = usernameInput.value.trim();
        const message = value ? '' : MESSAGES.usernameRequired;
        setFieldError(usernameField, message);
        if (message) return usernameInput.focus();

        setLoading(nextButton, true, 'Checking account');

        try {
            const currentBanCheck = await checkBan({});
            if (currentBanCheck && currentBanCheck.banned) {
                setLoading(nextButton, false);
                const reason = currentBanCheck.ban_info?.reason ? `: ${currentBanCheck.ban_info.reason}` : '';
                showToast(`Your account has been banned${reason}`, 'error');
                localStorage.setItem('banInfo', JSON.stringify(currentBanCheck.ban_info));
                setFieldError(usernameField, 'This session is banned from logging in.');
                return;
            }
        } catch (e) {}

        const result = await lookupAccount(value);

        if (result && result.banned) {
            setLoading(nextButton, false);
            const reason = result.ban_info?.reason ? `: ${result.ban_info.reason}` : (result.message ? `: ${result.message}` : '');
            showToast(`Your account has been banned${reason}`, 'error');
            if (result.ban_info) localStorage.setItem('banInfo', JSON.stringify(result.ban_info));
            setFieldError(usernameField, result.message || 'This account is banned from logging in.');
            return;
        }

        if (!result.exists) {
            setLoading(nextButton, false);
            setFieldError(usernameField, result.message || 'Account not found');
            return usernameInput.focus();
        }

        renderRole(roleKey);
        renderAccountPreview(result);
        setLoading(nextButton, false);
        await stepper.go(1);
    }

    async function handleLogin() {
        const message = passwordInput.value ? '' : MESSAGES.passwordRequired;
        setFieldError(passwordField, message);
        if (message) return passwordInput.focus();

        setLoading(loginButton, true, 'Signing in');
        showToast('Logging in...', 'loading');

        try {
            const currentBanCheck = await checkBan({});
            if (currentBanCheck && currentBanCheck.banned) {
                setLoading(loginButton, false);
                const reason = currentBanCheck.ban_info?.reason ? `: ${currentBanCheck.ban_info.reason}` : '';
                updateToast(`Your account has been banned${reason}`, 'error');
                localStorage.setItem('banInfo', JSON.stringify(currentBanCheck.ban_info));
                setFieldError(passwordField, 'You are banned from logging in.');
                return;
            }
        } catch (e) {}

        const result = await login(usernameInput.value.trim(), passwordInput.value);

        if (result && result.banned) {
            setLoading(loginButton, false);
            const reason = result.ban_info?.reason ? `: ${result.ban_info.reason}` : (result.message ? `: ${result.message}` : '');
            updateToast(`Your account has been banned${reason}`, 'error');
            if (result.ban_info) localStorage.setItem('banInfo', JSON.stringify(result.ban_info));
            setFieldError(passwordField, result.message || 'Your account has been banned.');
            return;
        }

        if (result.token) {
            try {
                const targetId = result[userKey]?.id || result.user?.id || result.admin?.id || result.adviser?.id || result.student?.id;
                const banCheck = await checkBan({
                    token: result.token,
                    target_type: role,
                    target_id: targetId
                });
                if (banCheck && banCheck.banned) {
                    setLoading(loginButton, false);
                    const reason = banCheck.ban_info?.reason ? `: ${banCheck.ban_info.reason}` : '';
                    updateToast(`Your account has been banned${reason}`, 'error');
                    localStorage.setItem('banInfo', JSON.stringify(banCheck.ban_info));
                    setFieldError(passwordField, 'Your account has been banned.');
                    return;
                }
            } catch (banError) {
                console.error('Ban check error:', banError);
            }

            setToken(result.token, role);
            if (result[userKey]) setUserData(result[userKey], role);
            renderRole(roleKey);
            updateToast('Login successful! Opening your dashboard...', 'success');
            await navigateAfterLogin(dashboardPath);
        } else {
            setLoading(loginButton, false);
            setFieldError(passwordField, result.message || 'Invalid username or password.');
            updateToast(result.message || 'Login failed', 'error');
            passwordInput.focus();
            passwordInput.select();
        }
    }

    form.addEventListener('submit', async (event) => {
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

    document.querySelectorAll('[data-prev]').forEach((button) =>
        button.addEventListener('click', () => {
            setFieldError(passwordField, '');
            renderRole(null);
            clearAccountPreview();
            stepper.prev();
        }),
    );

    usernameInput.addEventListener('input', () => {
        renderRole(null);
        clearAccountPreview();
    });
    [usernameField, passwordField].forEach(watchField);

    renderProgress(progress, 0, STEP_LABELS);
    highlightPortal(roleKey);
    if (roleCaption && ROLES[roleKey]) roleCaption.textContent = ROLES[roleKey].summary;
    initPasswordToggles();
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
    icons();
    usernameInput.focus();
    initAuthRouteAnimation();

    const googleLoginBtn = document.getElementById('googleLoginBtn');
    if (googleLoginBtn && window.google) {
        googleLoginBtn.addEventListener('click', async () => {
            try {
                const deviceInfo = await getDeviceInfo();

                try {
                    const currentBanCheck = await checkBan({ ip_address: deviceInfo?.ip_address });
                    if (currentBanCheck && currentBanCheck.banned) {
                        const reason = currentBanCheck.ban_info?.reason ? `: ${currentBanCheck.ban_info.reason}` : '';
                        showToast(`Your session has been banned${reason}`, 'error');
                        localStorage.setItem('banInfo', JSON.stringify(currentBanCheck.ban_info));
                        return;
                    }
                } catch (banCheckErr) {}

                const client = window.google.accounts.oauth2.initTokenClient({
                    client_id: window.GOOGLE_CLIENT_ID,
                    scope: 'email profile',
                    callback: async (response) => {
                        if (response.access_token) {
                            googleLoginBtn.disabled = true;
                            googleLoginBtn.querySelector('span').textContent = 'Signing in...';
                            showToast('Signing in with Google...', 'loading');

                            const result = await googleLogin(response.access_token, deviceInfo);

                            if (result && result.banned) {
                                const reason = result.ban_info?.reason ? `: ${result.ban_info.reason}` : (result.message ? `: ${result.message}` : '');
                                updateToast(`Your account has been banned${reason}`, 'error');
                                if (result.ban_info) localStorage.setItem('banInfo', JSON.stringify(result.ban_info));
                                googleLoginBtn.disabled = false;
                                googleLoginBtn.querySelector('span').textContent = 'Sign in with Google';
                                return;
                            }

                            if (result.success) {
                                try {
                                    const targetId = result[userKey]?.id || result.user?.id || result.admin?.id || result.adviser?.id || result.student?.id;
                                    const banCheck = await checkBan({
                                        token: result.token,
                                        target_type: role,
                                        target_id: targetId
                                    });
                                    if (banCheck && banCheck.banned) {
                                        const reason = banCheck.ban_info?.reason ? `: ${banCheck.ban_info.reason}` : '';
                                        updateToast(`Your account has been banned${reason}`, 'error');
                                        localStorage.setItem('banInfo', JSON.stringify(banCheck.ban_info));
                                        googleLoginBtn.disabled = false;
                                        googleLoginBtn.querySelector('span').textContent = 'Sign in with Google';
                                        return;
                                    }
                                } catch (banError) {
                                    console.error('Ban check error:', banError);
                                }

                                setToken(result.token, role);
                                if (result[userKey]) setUserData(result[userKey], role);
                                updateToast('Login successful! Opening your dashboard...', 'success');
                                await navigateAfterLogin(dashboardPath);
                            } else {
                                updateToast(result.message || 'Google login failed', 'error');
                                googleLoginBtn.disabled = false;
                                googleLoginBtn.querySelector('span').textContent = 'Sign in with Google';
                            }
                        }
                    },
                    error_callback: (error) => {
                        if (error.type !== 'popup_closed') {
                            console.error('Google OAuth error:', error);
                            updateToast('Google login failed. Please try again.', 'error');
                        }
                        googleLoginBtn.disabled = false;
                        googleLoginBtn.querySelector('span').textContent = 'Sign in with Google';
                    },
                });

                client.requestAccessToken();
            } catch (error) {
                console.error('Google login initialization error:', error);
                updateToast('Google login not available. Please use email/password.', 'error');
            }
        });
    }

    (async () => {
        const authenticated = await isAuthenticated(role);
        if (!(authenticated && getUserRole(role) === role)) return;

        try {
            const token = getToken(role);
            const userData = getUserData(role);
            const banCheck = await checkBan({
                token: token,
                target_type: role,
                target_id: userData?.id
            });

            if (banCheck && banCheck.banned) {
                removeToken(role);
                localStorage.setItem('banInfo', JSON.stringify(banCheck.ban_info));
                const reason = banCheck.ban_info?.reason ? `: ${banCheck.ban_info.reason}` : '';
                const banType = banCheck.ban_info?.ban_type === 'session' ? 'session' : 'account';
                showToast(`Your ${banType} has been banned${reason}`, 'error');
                return;
            }
        } catch (e) {
            console.error('Ban check in auto-login check failed:', e);
        }

        busy = true;
        form?.querySelectorAll('button, input, a').forEach((el) => {
            el.toggleAttribute('disabled', true);
            el.classList.add('pointer-events-none', 'opacity-70');
        });
        if (googleLoginBtn) googleLoginBtn.disabled = true;

        const portal = ROLES[roleKey]?.label || 'your';
        await showToast(`You're already signed in. Redirecting to the ${portal} dashboard...`, 'info', 1600);
        await navigateAfterLogin(dashboardPath);
    })();
}
