const ROUTES = {
  login: 'login.php',
  'get-started': '#portals',
  admin: 'admin/login.php',
  adviser: 'adviser/login.php',
  student: 'student/login.php',
};

export function applyRoutes() {
  const links = document.querySelectorAll('[data-route]');
  links.forEach((link) => {
    link.href = ROUTES[link.dataset.route];
  });
}
