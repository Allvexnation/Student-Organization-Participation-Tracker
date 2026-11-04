import { CRTLogo } from '../../static/logo/CRTLogo.js';

const HOME_LINKS = [
    { href: '#home', label: 'Home' },
    { href: '#about', label: 'About' },
    { href: '#features', label: 'Features' },
    { href: '#how-it-works', label: 'How It Works' },
    { href: '/events', label: 'Events' },
    { href: '#faq', label: 'FAQ' },
];

const SITE_LINKS = [
    { href: '/', label: 'Home' },
    { href: '/events', label: 'Events' },
    { href: '/auth/admin/login', label: 'Admin Login' },
    { href: '/auth/adviser/login', label: 'Adviser Login' },
    { href: '/auth/student/login', label: 'Student Login' },
    { href: '/support', label: 'Support' },
];

function renderNav(links, locked = false) {
    if (locked) {
        return links
            .map((link) => `<li><span>${link.label}</span></li>`)
            .join('');
    }

    return links
        .map((link) => {
            const authAttr = String(link.href || '').startsWith('/auth/') ? ' data-auth-route' : '';
            return `<li><a href="${link.href}"${authAttr}>${link.label}</a></li>`;
        })
        .join('');
}

export function Footer(options = {}) {
    const {
        id = 'contact',
        homeHref = '/',
        links = SITE_LINKS,
        locked = false,
    } = options;

    const footerId = id ? ` id="${id}"` : '';
    const navStyle = locked ? ' style="pointer-events: none;"' : '';

    return `
    <footer class="footer"${footerId}>
      <div class="container footer-grid">
        <div class="f-brand">
          <a href="${homeHref}" class="brand brand-light"
            >${CRTLogo({ className: '', alt: 'CRT logo', size: 'md' })}<span class="brand-text"
              ><strong>College for Research and Technology</strong
              ><small>Student Organization Participation Tracker</small></span
          ></a>
          <p>
            A web-based platform for managing student organizations, monitoring
            participation, organizing events, assigning tasks and tracking
            attendance.
          </p>
        </div>
        <div>
          <h4>Navigate</h4>
          <ul${navStyle}>
            ${renderNav(links, locked)}
          </ul>
        </div>
        <div>
          <h4>Contact</h4>
          <ul class="contact">
            <li>
              <i data-lucide="map-pin"></i>
              <span
                >College for Research and Technology, San Jose Campus<br />Sanchez
                St., Brgy. Crisanto Sanchez, San Jose City, Nueva Ecija</span
              >
            </li>
            <li>
              <i data-lucide="phone"></i><span>803-3630</span> /
              <a href="tel:+639913759823">0991 375 9823</a>
            </li>
            <li>
              <i data-lucide="globe"></i>
              <a
                href="https://web.facebook.com/CRTsanjose1988"
                target="_blank"
                rel="noopener"
                >facebook.com/CRTsanjose1988</a
              >
            </li>
          </ul>
        </div>
      </div>
      <div class="container copyright">
        <span
          >&copy; <span id="year">2026</span> College for Research and
          Technology. All rights reserved.</span
        >
        <span>CRT Student Organization Participation Tracker</span>
      </div>
    </footer>
    `;
}

export function HomeFooter() {
    return Footer({
        homeHref: '#home',
        links: [
            ...HOME_LINKS,
            { href: '/auth/admin/login', label: 'Admin Login' },
            { href: '/auth/adviser/login', label: 'Adviser Login' },
            { href: '/auth/student/login', label: 'Student Login' },
        ],
    });
}

export function SiteFooter() {
    return Footer({
        homeHref: '/',
        links: SITE_LINKS,
    });
}

export function initFooter() {
    const yearElement = document.getElementById('year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

    document.querySelectorAll('footer a[href^="/"]').forEach((link) => {
        if (link.dataset.siteRouteBound === 'true') return;

        const href = link.getAttribute('href') || '';
        if (href.startsWith('/auth/') || link.hasAttribute('data-auth-route')) return;

        link.dataset.siteRouteBound = 'true';
        link.addEventListener('click', (event) => {
            if (event.defaultPrevented || event.button !== 0) return;
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            if (link.target && link.target !== '_self') return;

            event.preventDefault();
            if (window.appNavigate) {
                window.appNavigate(href);
            } else {
                window.location.href = href;
            }
        });
    });
}

export function LockedFooter() {
    return Footer({
        id: 'contact',
        homeHref: '/',
        links: HOME_LINKS.map(({ label }) => ({ href: '#', label })),
        locked: true,
    });
}
