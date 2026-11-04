import { prefersReducedMotion } from "./ui.js";

export function createStepper(form, { onChange } = {}) {
  const steps = [...form.querySelectorAll("[data-step]")];
  let index = Math.max(
    0,
    steps.findIndex((step) => !step.hidden),
  );
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
        { opacity: 1, transform: "translateX(0)" },
        { opacity: 0, transform: `translateX(${-28 * direction}px)` },
      ],
      { duration: duration() * 0.65, easing: "ease-in" },
    ).finished;

    from.hidden = true;
    target.hidden = false;
    onChange?.(index, direction);

    target.animate(
      [
        { opacity: 0, transform: `translateX(${28 * direction}px)` },
        { opacity: 1, transform: "translateX(0)" },
      ],
      { duration: duration(), easing: "cubic-bezier(0.2, 0.7, 0.2, 1)" },
    );

    target.querySelector("[data-autofocus]")?.focus({ preventScroll: true });
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
