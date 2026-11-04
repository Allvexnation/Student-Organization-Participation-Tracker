import { showBannedContactsModal } from '../../components/Modal/Contacts/BannedContactsModal.js';
import { LockedFooter } from '../../components/Layout/Footer.js';

export function BannedContacts() {
    return `
    <a class="skip" href="#main">Skip to content</a>

    <nav id="homepage-navbar" class="bg-white text-gray-900 shadow-lg z-50 transition-colors duration-300">
        <div class="container mx-auto px-4">
            <div class="flex items-center justify-between h-16">
                <div class="flex items-center">
                    <a href="/" class="flex items-center" aria-label="CRT Student Organization Participation Tracker">
                        <img src="/public/crtlogo.png" alt="CRT logo" class="h-10 w-auto">
                        <div class="ml-3">
                            <span id="navbar-title" class="font-bold text-lg hidden md:block text-gray-900">College for Research & Technology</span>
                            <span id="navbar-title-mobile" class="font-bold text-lg md:hidden text-gray-900">CRT</span>
                            <span id="navbar-subtitle" class="text-xs block hidden md:block text-gray-600">Student Organization Participation Tracker</span>
                        </div>
                    </a>
                </div>
                <div class="flex items-center space-x-4">
                    <span id="navbar-login-desktop" class="bg-blue-600 px-4 py-2 rounded-lg text-sm font-semibold hidden md:flex items-center gap-2 text-white" style="pointer-events: none; opacity: 0.7;">
                        <span>Login</span>
                        <i data-lucide="log-in" class="w-4 h-4"></i>
                    </span>
                    <span id="navbar-login-mobile" class="bg-blue-600 p-2 rounded-lg md:hidden text-white" style="pointer-events: none; opacity: 0.7;">
                        <i data-lucide="log-in" class="w-5 h-5"></i>
                    </span>
                    <button id="homepage-hamburger-menu" class="text-gray-900 hover:bg-gray-100 p-2 rounded-lg transition-colors">
                        <svg id="homepage-hamburger-icon" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                        <svg id="homepage-close-icon" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 hidden transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
        <div id="homepage-tab-strip" class="bg-white border-b border-gray-200 w-full overflow-hidden transition-all duration-300 ease-in-out shadow-sm" style="max-height: 0; transition: max-height 0.3s ease-in-out, transform 0.3s ease-in-out, opacity 0.3s ease-in-out, padding 0.3s ease-in-out;">
            <div class="container mx-auto px-2 sm:px-4 flex items-center">
                <button id="homepage-scroll-left" class="flex-shrink-0 p-2.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md transition md:hidden" aria-label="Scroll left">
                    <i data-lucide="chevron-left" class="w-4 h-4"></i>
                </button>

                <div id="homepage-tabs-container" class="flex-1 overflow-x-auto whitespace-nowrap scrollbar-hide py-0.5" style="-ms-overflow-style: none; scrollbar-width: none; overflow-anchor: none; pointer-events: none;">
                    <div class="inline-flex items-center gap-1">
                        <span class="homepage-tab group px-3.5 py-3 text-sm font-medium transition-all duration-200 whitespace-nowrap flex items-center gap-2 rounded-t-md text-gray-600 border-b-2 border-transparent">
                            <i data-lucide="shield-check" class="w-4 h-4 text-gray-400"></i>
                            <span>Admin Login</span>
                        </span>

                        <span class="homepage-tab group px-3.5 py-3 text-sm font-medium transition-all duration-200 whitespace-nowrap flex items-center gap-2 rounded-t-md text-gray-600 border-b-2 border-transparent">
                            <i data-lucide="user-cog" class="w-4 h-4 text-gray-400"></i>
                            <span>Adviser Login</span>
                        </span>

                        <span class="homepage-tab group px-3.5 py-3 text-sm font-medium transition-all duration-200 whitespace-nowrap flex items-center gap-2 rounded-t-md text-gray-600 border-b-2 border-transparent">
                            <i data-lucide="graduation-cap" class="w-4 h-4 text-gray-400"></i>
                            <span>Student Login</span>
                        </span>
                    </div>
                </div>

                <button id="homepage-scroll-right" class="flex-shrink-0 p-2.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md transition md:hidden" aria-label="Scroll right">
                    <i data-lucide="chevron-right" class="w-4 h-4"></i>
                </button>
            </div>
        </div>
    </nav>

    <main id="main">
      <section class="hero" style="min-height: 80vh;">
        <div class="container hero-grid">
          <div class="hero-copy">
            <span class="pill" style="background: var(--blue);">Contact Support</span>
            <h1>
              Ban Appeal<br /><span class="accent" style="color: var(--blue);">Request</span>
            </h1>
            <p class="lead">
              If you believe your ban was unjustified, you can submit an appeal request. Our team will review your case and get back to you.
            </p>
            <div class="hero-actions">
              <button id="submit-appeal-btn" class="btn btn-primary btn-lg">
                Submit Appeal <i data-lucide="send"></i>
              </button>
            </div>
          </div>

          <div class="hero-visual" style="display: flex; align-items: center; justify-content: center;">
            <div style="width: 100%; max-width: 500px;">
              <div style="background: #fff; border: 1px solid var(--line); border-radius: var(--radius); padding: 32px; box-shadow: var(--shadow);">
                <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--ink); margin: 0 0 16px 0;">Appeal Process</h3>
                <div style="display: grid; gap: 16px;">
                  <div style="display: flex; gap: 12px; align-items: flex-start;">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--blue); color: #fff; display: grid; place-items: center; flex-shrink: 0; font-weight: 700;">1</div>
                    <div>
                      <p style="font-weight: 600; color: var(--ink); margin: 0 0 4px 0;">Submit Your Appeal</p>
                      <p style="font-size: 0.9rem; color: var(--muted); margin: 0;">Fill out the appeal form with your details and reason for the appeal.</p>
                    </div>
                  </div>
                  <div style="display: flex; gap: 12px; align-items: flex-start;">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--blue); color: #fff; display: grid; place-items: center; flex-shrink: 0; font-weight: 700;">2</div>
                    <div>
                      <p style="font-weight: 600; color: var(--ink); margin: 0 0 4px 0;">Review Process</p>
                      <p style="font-size: 0.9rem; color: var(--muted); margin: 0;">Our team will review your appeal within 24-48 hours.</p>
                    </div>
                  </div>
                  <div style="display: flex; gap: 12px; align-items: flex-start;">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--blue); color: #fff; display: grid; place-items: center; flex-shrink: 0; font-weight: 700;">3</div>
                    <div>
                      <p style="font-weight: 600; color: var(--ink); margin: 0 0 4px 0;">Response</p>
                      <p style="font-size: 0.9rem; color: var(--muted); margin: 0;">You will receive an email with the decision on your appeal.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    ${LockedFooter()}
    `;
}

export function initBannedContacts() {

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    const yearElement = document.getElementById('year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

    const hamburgerMenu = document.getElementById('homepage-hamburger-menu');
    const hamburgerIcon = document.getElementById('homepage-hamburger-icon');
    const closeIcon = document.getElementById('homepage-close-icon');
    const tabStrip = document.getElementById('homepage-tab-strip');
    const navbar = document.getElementById('homepage-navbar');
    const navbarTitle = document.getElementById('navbar-title');
    const navbarTitleMobile = document.getElementById('navbar-title-mobile');
    const navbarSubtitle = document.getElementById('navbar-subtitle');

    const updateNavbarColors = (isExpanded) => {
        if (isExpanded) {
            navbar.classList.remove('bg-white', 'text-gray-900');
            navbar.classList.add('bg-blue-700', 'text-white');
            navbarTitle.classList.remove('text-gray-900');
            navbarTitle.classList.add('text-white');
            navbarTitleMobile.classList.remove('text-gray-900');
            navbarTitleMobile.classList.add('text-white');
            navbarSubtitle.classList.remove('text-gray-600');
            navbarSubtitle.classList.add('text-blue-200');
            hamburgerMenu.classList.remove('text-gray-900', 'hover:bg-gray-100');
            hamburgerMenu.classList.add('text-white', 'hover:bg-blue-600');
        } else {
            navbar.classList.remove('bg-blue-700', 'text-white');
            navbar.classList.add('bg-white', 'text-gray-900');
            navbarTitle.classList.remove('text-white');
            navbarTitle.classList.add('text-gray-900');
            navbarTitleMobile.classList.remove('text-white');
            navbarTitleMobile.classList.add('text-gray-900');
            navbarSubtitle.classList.remove('text-blue-200');
            navbarSubtitle.classList.add('text-gray-600');
            hamburgerMenu.classList.remove('text-white', 'hover:bg-blue-600');
            hamburgerMenu.classList.add('text-gray-900', 'hover:bg-gray-100');
        }
    };

    if (hamburgerMenu && tabStrip) {
        const stripBarState = localStorage.getItem('homepageStripBarState') || 'collapsed';
        
        if (stripBarState === 'expanded') {
            tabStrip.style.maxHeight = tabStrip.scrollHeight + 'px';
            hamburgerIcon.classList.add('hidden');
            closeIcon.classList.remove('hidden');
            updateNavbarColors(true);
        } else {
            tabStrip.style.maxHeight = '0px';
            hamburgerIcon.classList.remove('hidden');
            closeIcon.classList.add('hidden');
            updateNavbarColors(false);
        }

        hamburgerMenu.addEventListener('click', () => {
            const isExpanded = tabStrip.style.maxHeight !== '0px' && tabStrip.style.maxHeight !== '';
            
            if (isExpanded) {
                tabStrip.style.maxHeight = '0px';
                hamburgerIcon.classList.remove('hidden');
                closeIcon.classList.add('hidden');
                localStorage.setItem('homepageStripBarState', 'collapsed');
                updateNavbarColors(false);
            } else {
                tabStrip.style.maxHeight = tabStrip.scrollHeight + 'px';
                hamburgerIcon.classList.add('hidden');
                closeIcon.classList.remove('hidden');
                localStorage.setItem('homepageStripBarState', 'expanded');
                updateNavbarColors(true);
            }
        });
    }

    const scrollLeft = document.getElementById('homepage-scroll-left');
    const scrollRight = document.getElementById('homepage-scroll-right');
    const tabsContainer = document.getElementById('homepage-tabs-container');

    if (scrollLeft && scrollRight && tabsContainer) {
        scrollLeft.addEventListener('click', () => {
            tabsContainer.scrollBy({ left: -200, behavior: 'smooth' });
        });

        scrollRight.addEventListener('click', () => {
            tabsContainer.scrollBy({ left: 200, behavior: 'smooth' });
        });
    }

    const submitAppealBtn = document.getElementById('submit-appeal-btn');
    if (submitAppealBtn) {
        submitAppealBtn.addEventListener('click', () => {
            showBannedContactsModal();
        });
    }
}
