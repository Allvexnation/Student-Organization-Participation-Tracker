import { initReveal, initStats, initFaq } from '../provider/Animation/HomepageAnimation.js';
import { playAuthPageEnter, bindAuthRouteLinks } from '../provider/Animation/auth/AuthAnimation.js';
import { Navigation, initNavigation } from '../components/Homepage/Navigation.js';
import { Hero } from '../components/Homepage/Hero.js';
import { About } from '../components/Homepage/About.js';
import { Statistics, fetchStatistics } from '../components/Homepage/Statistics.js';
import { Features } from '../components/Homepage/Features.js';
import { Portals } from '../components/Homepage/Portals.js';
import { Workflow } from '../components/Homepage/Workflow.js';
import { HowItWorks } from '../components/Homepage/HowItWorks.js';
import { Technology } from '../components/Homepage/Technology.js';
import { FAQ } from '../components/Homepage/FAQ.js';
import { CallToAction } from '../components/Homepage/CallToAction.js';
import { Footer } from '../components/Homepage/Footer.js';
import { initFooter } from '../components/Layout/Footer.js';

export function HomePage() {
    return `
    <div data-home-page>
    <a class="skip" href="#main">Skip to content</a>

    ${Navigation()}
    
    <main id="main">
      ${Hero()}
      ${About()}
      ${Statistics()}
      ${Features()}
      ${Portals()}
      ${Workflow()}
      ${HowItWorks()}
      ${Technology()}
      ${FAQ()}
      ${CallToAction()}
    </main>

    ${Footer()}
    </div>
    `;
}

export async function initHomePage() {
    playAuthPageEnter();

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    initNavigation();
    initFooter();
    bindAuthRouteLinks();
    initReveal();
    initFaq();

    const statsData = await fetchStatistics();
    if (statsData) {
        const statElements = document.querySelectorAll('[data-count]');
        if (statElements.length >= 5) {
            statElements[0].setAttribute('data-count', statsData.total_students);
            statElements[1].setAttribute('data-count', statsData.total_organizations);
            statElements[2].setAttribute('data-count', statsData.total_events);
            statElements[3].setAttribute('data-count', statsData.total_tasks);
            statElements[4].setAttribute('data-count', statsData.total_visits);
        }
    }

    initStats();
}
