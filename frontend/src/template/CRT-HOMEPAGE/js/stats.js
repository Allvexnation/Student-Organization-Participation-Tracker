function countUp(element) {
  const target = Number(element.dataset.count);
  const steps = 60;
  let step = 0;

  const timer = setInterval(() => {
    step++;
    const value = Math.round((target * step) / steps);
    element.textContent = value.toLocaleString();
    if (step === steps) clearInterval(timer);
  }, 25);
}

export function initStats() {
  const numbers = document.querySelectorAll('[data-count]');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        countUp(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });

  numbers.forEach((number) => observer.observe(number));
}
