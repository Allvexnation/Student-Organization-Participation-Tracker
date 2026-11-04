import { applyRoutes } from './routes.js';
import { initNav } from './nav.js';
import { initReveal } from './reveal.js';
import { initStats } from './stats.js';
import { initFaq } from './faq.js';
lucide.createIcons();

applyRoutes();
initNav();
initReveal();
initStats();
initFaq();
document.getElementById('year').textContent = new Date().getFullYear();
