function escapeAttr(value) {
    return String(value || '').replace(/"/g, '&quot;');
}

function renderChips(chips = []) {
    return chips
        .map((chip) => {
            const variant = chip.variant === 'event' ? 'event' : 'task';
            const pos = variant === 'event' ? 'chip-event float-b' : 'chip-task float-a';
            const ico = variant === 'event' ? 'blue' : 'ok';
            return `
              <div class="chip ${pos}">
                <span class="chip-ico ${ico}"><i data-lucide="${escapeAttr(chip.icon)}"></i></span>
                <div>
                  <b>${chip.title || ''}</b><small>${chip.subtitle || ''}</small>
                </div>
              </div>
            `;
        })
        .join('');
}

function renderDash(dash) {
    if (!dash) return '';

    const stats = (dash.stats || [])
        .map(
            (stat) => `
              <div class="md-stat">
                <small>${stat.label || ''}</small><strong>${stat.value || ''}</strong>
              </div>
            `
        )
        .join('');

    return `
      <div
        class="mini-dash float-c"
        role="img"
        aria-label="${escapeAttr(dash.ariaLabel || dash.title || '')}"
      >
        <div class="md-head">
          <span class="md-dots"><i></i><i></i><i></i></span
          ><b>${dash.title || ''}</b>
        </div>
        <div class="md-row">
          ${stats}
        </div>
      </div>
    `;
}

function renderPhotoVisual({ imageSrc, imageAlt, chips, dash }) {
    return `
      <div class="hero-visual-stage">
        <div class="shape shape-blue"></div>
        <div class="shape shape-yellow"></div>
        <div class="ring ring-1"></div>
        <img
          class="hero-photo"
          src="${escapeAttr(imageSrc)}"
          alt="${escapeAttr(imageAlt)}"
          width="900"
          height="657"
          draggable="false"
          ondragstart="return false"
          oncontextmenu="return false"
          data-protect-media
        />
      </div>
      <div class="hero-floaters">
        ${renderChips(chips)}
        ${renderDash(dash)}
      </div>
    `;
}

export function Hero(options = {}) {
    const {
        id = '',
        className = 'hero hero-home',
        pill = '',
        pillStyle = '',
        titleHtml = '',
        titleId = '',
        lead = '',
        leadId = '',
        actionsHtml = '',
        visualHtml = '',
        visualStyle = '',
        imageSrc = '/public/hero-students.png',
        imageAlt = 'Image of two CRT students',
        chips = [],
        dash = null,
        reveal = false,
    } = options;

    const revealClass = reveal ? ' reveal' : '';
    const sectionId = id ? ` id="${escapeAttr(id)}"` : '';
    const titleAttr = titleId ? ` id="${escapeAttr(titleId)}"` : '';
    const leadAttr = leadId ? ` id="${escapeAttr(leadId)}"` : '';
    const pillAttr = pillStyle ? ` style="${pillStyle}"` : '';
    const visualAttr = visualStyle ? ` style="${visualStyle}"` : '';

    const visual = visualHtml
        ? visualHtml
        : renderPhotoVisual({ imageSrc, imageAlt, chips, dash });

    return `
      <section class="${className}"${sectionId}>
        <div class="container hero-grid">
          <div class="hero-copy">
            <span class="pill${revealClass}"${pillAttr}>${pill}</span>
            <h1${reveal ? ' class="reveal"' : ''}${titleAttr}>
              ${titleHtml}
            </h1>
            <p class="lead${revealClass}"${leadAttr}>
              ${lead}
            </p>
            <div class="hero-actions${revealClass}">
              ${actionsHtml}
            </div>
          </div>

          <div class="hero-visual${revealClass}" aria-hidden="false"${visualAttr}>
            ${visual}
          </div>
        </div>
      </section>
    `;
}

export function HomeHero() {
    return Hero({
        id: 'home',
        reveal: true,
        pill: 'Student Organization Participation Tracker',
        titleHtml: `Manage. <br />Participate. <br /><span class="accent">Achieve.</span>`,
        lead: `A platform for CRT administrators, advisers, and students to
              manage organizations, participate in events, handle tasks, and
              track attendance in one place.`,
        actionsHtml: `
              <a
                href="#portals"
                class="btn btn-primary btn-lg"
                data-route="get-started"
                >Get Started <i data-lucide="arrow-up-right"></i
              ></a>
              <a href="#features" class="btn btn-ghost btn-lg"
                ><span class="play"><i data-lucide="sparkles"></i></span>
                Explore Features</a
              >
        `,
        chips: [
            {
                variant: 'task',
                icon: 'check',
                title: 'Task complete',
                subtitle: 'Vote in OSO Elections.',
            },
            {
                variant: 'event',
                icon: 'calendar-check',
                title: 'Event registered',
                subtitle: 'Palaro 20XX',
            },
        ],
        dash: {
            title: 'Student Portal',
            ariaLabel: 'Dashboard preview showing attendance rate and task progress',
            stats: [
                { label: 'Attendance', value: '96%' },
                { label: 'Tasks done', value: '12/14' },
            ],
        },
    });
}

export function NotFoundHero() {
    return Hero({
        reveal: true,
        pill: 'Page Not Found',
        titleHtml: `Oops! <br /><span class="accent">404 Error</span>`,
        lead: `The page you're looking for doesn't exist or has been moved. Let's get you back on track.`,
        actionsHtml: `
              <a href="/" class="btn btn-primary btn-lg">
                Go to Home <i data-lucide="home"></i>
              </a>
              <a href="/support" class="btn btn-ghost btn-lg">
                <span class="play"><i data-lucide="help-circle"></i></span>
                Contact Support
              </a>
        `,
        chips: [
            {
                variant: 'task',
                icon: 'search-x',
                title: 'Page not found',
                subtitle: 'This URL does not exist.',
            },
            {
                variant: 'event',
                icon: 'home',
                title: '404 Error',
                subtitle: "Let's get you back.",
            },
        ],
        dash: {
            title: 'Need a way back?',
            ariaLabel: 'Helpful links from the 404 page',
            stats: [
                { label: 'Home', value: 'Open' },
                { label: 'Support', value: 'Help' },
            ],
        },
    });
}

export function SupportHero() {
    return Hero({
        reveal: true,
        pill: 'Support Center',
        titleHtml: `We're Here<br /><span class="accent">To Help</span>`,
        lead: `Have questions or found a bug? Contact us or report a problem and we'll get back to you as soon as possible.`,
        actionsHtml: `
              <button type="button" id="support-contact-btn" class="btn btn-primary btn-lg">
                Contact Us <i data-lucide="message-circle"></i>
              </button>
              <button type="button" id="support-report-btn" class="btn btn-ghost btn-lg">
                <span class="play"><i data-lucide="alert-triangle"></i></span>
                Report a Problem
              </button>
        `,
        chips: [
            {
                variant: 'task',
                icon: 'message-circle',
                title: 'Contact us',
                subtitle: 'Questions, feedback, help.',
            },
            {
                variant: 'event',
                icon: 'bug',
                title: 'Report a problem',
                subtitle: 'Share bugs and logs.',
            },
        ],
        dash: {
            title: 'Support Center',
            ariaLabel: 'Support options for contacting the team or reporting a problem',
            stats: [
                { label: 'Contact', value: 'Open' },
                { label: 'Reports', value: 'Ready' },
            ],
        },
    });
}

export function BannedHero() {
    return Hero({
        className: 'hero hero-home hero-banned',
        reveal: true,
        pill: 'Access Restricted',
        pillStyle: 'background: var(--red);',
        titleId: 'banTitle',
        titleHtml: `Account<br /><span class="accent" style="color: var(--red);">Banned</span>`,
        leadId: 'banSubtitle',
        lead: 'Your access to this system has been restricted. Please review the details below.',
        actionsHtml: `
              <button id="contact-support-btn" class="btn btn-primary btn-lg">
                Contact Support <i data-lucide="help-circle"></i>
              </button>
        `,
        visualHtml: `
            <div id="banDetails" class="ban-details">
              <div class="animate-pulse">
                <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div class="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
        `,
    });
}
