import { NotFoundHero } from '../../components/Layout/Hero.js';
import { SiteFooter, initFooter } from '../../components/Layout/Footer.js';
import { Navbar, initNavbar } from '../../components/Layout/Navbar/Navbar.js';
import { initReveal } from '../../provider/Animation/HomepageAnimation.js';
import { bindAuthRouteLinks } from '../../provider/Animation/auth/AuthAnimation.js';
import { protectPageMedia } from '../../utils/protectMedia.js';

export function NotFoundPage() {
    return `
    <div data-domino-page>
    <a class="skip" href="#main">Skip to content</a>

    ${Navbar('notfound')}

    <main id="main">

      ${NotFoundHero()}
    </main>

    ${SiteFooter()}
    </div>
    `;
}

export function initNotFoundPage() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    initNavbar('notfound');
    initFooter();
    protectPageMedia();
    bindAuthRouteLinks();
    initReveal();
}
