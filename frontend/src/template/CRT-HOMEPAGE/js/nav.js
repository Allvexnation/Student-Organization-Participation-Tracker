export function initNav() {
  const header = document.querySelector('.site-header');
  const menuButton = document.getElementById('menu-toggle');
  const menu = document.getElementById('nav-links');
  const links = menu.querySelectorAll('a[href^="#"]');
  menuButton.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', isOpen);
  });
  links.forEach((link) => {
    link.addEventListener('click', () => {
      menu.classList.remove('open');
      menuButton.setAttribute('aria-expanded', false);
    });
  });
  const sectionIds = ['home', 'about', 'features', 'how-it-works', 'contact'];

  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 10);

    let current = 'home';
    sectionIds.forEach((id) => {
      const section = document.getElementById(id);
      if (window.scrollY >= section.offsetTop - 150) current = id;
    });

    links.forEach((link) => {
      link.classList.toggle('is-active', link.getAttribute('href') === '#' + current);
    });
  });
}
