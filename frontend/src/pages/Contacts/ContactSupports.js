import { SupportHero } from '../../components/Layout/Hero.js';
import { SiteFooter, initFooter } from '../../components/Layout/Footer.js';
import { Navbar, initNavbar } from '../../components/Layout/Navbar/Navbar.js';
import { showContactSupportModal } from '../../components/Modal/Contacts/ContactSupportModal.js';
import { initReveal } from '../../provider/Animation/HomepageAnimation.js';
import { bindAuthRouteLinks } from '../../provider/Animation/auth/AuthAnimation.js';

export function ContactSupports() {
    return `
    <div data-domino-page>
    <a class="skip" href="#main">Skip to content</a>

    ${Navbar('support')}

    <main id="main">
      ${SupportHero()}
    </main>

    ${SiteFooter()}
    </div>
    `;
}

export function initContactSupports() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    initNavbar('support');
    initFooter();
    bindAuthRouteLinks();
    initReveal();

    document.getElementById('support-contact-btn')?.addEventListener('click', () => {
        showContactSupportModal('contact');
    });

    document.getElementById('support-report-btn')?.addEventListener('click', () => {
        showContactSupportModal('report');
    });
}
