export function initFaq() {
  const items = document.querySelectorAll('.faq-item');

  items.forEach((item) => {
    const question = item.querySelector('.faq-q');

    question.addEventListener('click', () => {
      const wasOpen = item.classList.contains('open');
      items.forEach((other) => {
        other.classList.remove('open');
        other.querySelector('.faq-q').setAttribute('aria-expanded', false);
      });
      if (!wasOpen) {
        item.classList.add('open');
        question.setAttribute('aria-expanded', true);
      }
    });
  });
}
