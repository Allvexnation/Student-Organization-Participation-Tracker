import { SiteFooter, initFooter } from '../../components/Layout/Footer.js';
import { Navbar, initNavbar } from '../../components/Layout/Navbar/Navbar.js';
import { initReveal, playPageDomino } from '../../provider/Animation/HomepageAnimation.js';
import { bindAuthRouteLinks } from '../../provider/Animation/auth/AuthAnimation.js';
import { getPublicEvents } from '../../api/web/Events.js';

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
    }
}

function formatDate(date) {
    if (!date) return '—';
    const parsed = new Date(`${date}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return escapeHtml(date);
    return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateRange(start, end) {
    if (!start && !end) return '—';
    if (start && end && start === end) return formatDate(start);
    if (start && end) return `${formatDate(start)} – ${formatDate(end)}`;
    return formatDate(start || end);
}

function formatTime(time) {
    if (!time) return '—';
    const parts = String(time).split(':');
    if (parts.length < 2) return escapeHtml(time);
    const date = new Date();
    date.setHours(Number(parts[0]), Number(parts[1]), 0, 0);
    if (Number.isNaN(date.getTime())) return escapeHtml(time);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function eventStatus(event) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = event.event_day_start ? new Date(`${event.event_day_start}T00:00:00`) : null;
    const end = event.event_day_end ? new Date(`${event.event_day_end}T00:00:00`) : start;

    if (start && !Number.isNaN(start.getTime()) && today < start) {
        return { label: 'Upcoming', tone: 'upcoming' };
    }
    if (end && !Number.isNaN(end.getTime()) && today > end) {
        return { label: 'Completed', tone: 'completed' };
    }
    return { label: 'Happening', tone: 'live' };
}

function renderSchedules(schedules) {
    if (!schedules || schedules.length === 0) {
        return `<p class="public-event-empty">No daily schedule posted.</p>`;
    }

    return `
        <ul class="public-event-schedule">
            ${schedules.map((schedule) => `
                <li>
                    <span>${formatDate(schedule.schedule_date || schedule.date)}</span>
                    <strong>${formatTime(schedule.start_time)} – ${formatTime(schedule.end_time)}</strong>
                </li>
            `).join('')}
        </ul>
    `;
}

function renderOrganizations(organizations) {
    if (!organizations || organizations.length === 0) {
        return `<p class="public-event-empty">No organizations listed yet.</p>`;
    }

    return `
        <div class="public-event-orgs">
            ${organizations.map((name) => `<span>${escapeHtml(name)}</span>`).join('')}
        </div>
    `;
}

function renderEventCard(event) {
    const status = eventStatus(event);
    const description = String(event.description || '').trim();
    const descriptionHtml = description
        ? escapeHtml(description).replace(/\n/g, '<br>')
        : 'No description provided.';

    return `
        <article class="public-event-card reveal" data-domino-enter>
            <div class="public-event-card-top">
                <span class="public-event-category">${escapeHtml(event.event_category || 'Event')}</span>
                <span class="public-event-status is-${status.tone}">${status.label}</span>
            </div>
            <h3>${escapeHtml(event.title || 'Untitled event')}</h3>
            <p class="public-event-desc">${descriptionHtml}</p>
            <dl class="public-event-meta">
                <div>
                    <dt><i data-lucide="calendar-range"></i> Event days</dt>
                    <dd>${formatDateRange(event.event_day_start, event.event_day_end)}</dd>
                </div>
                <div>
                    <dt><i data-lucide="map-pin"></i> Venue</dt>
                    <dd>${escapeHtml(event.venue || 'Venue not set')}</dd>
                </div>
            </dl>
            <div class="public-event-block">
                <h4>Daily schedule</h4>
                ${renderSchedules(event.daily_schedules)}
            </div>
            <div class="public-event-block">
                <h4>Registered organizations</h4>
                ${renderOrganizations(event.organizations)}
            </div>
        </article>
    `;
}

function renderEmpty(message, detail) {
    return `
        <div class="public-event-empty-state reveal" data-domino-enter>
            <i data-lucide="calendar-off"></i>
            <p>${escapeHtml(message)}</p>
            <small>${escapeHtml(detail)}</small>
        </div>
    `;
}

export function EventsPage() {
    return `
    <div data-domino-page>
    <a class="skip" href="#main">Skip to content</a>

    ${Navbar('events')}

    <main id="main">
      <section class="public-events" id="event-list">
        <div class="container">
          <div class="public-events-head reveal">
            <div>
              <span class="pill">Event calendar</span>
              <h2>Registered events</h2>
              <p>Open listings from campus events that organizations have already registered for.</p>
            </div>
            <div class="public-events-tools">
              <label class="sr-only" for="public-event-search">Search events</label>
              <input id="public-event-search" type="search" placeholder="Search title, venue, or organization">
              <label class="sr-only" for="public-event-category">Filter by category</label>
              <select id="public-event-category">
                <option value="">All categories</option>
              </select>
            </div>
          </div>
          <div id="public-events-count" class="public-events-count reveal"></div>
          <div id="public-events-grid" class="public-events-grid">
            <div class="public-event-card is-skeleton"></div>
            <div class="public-event-card is-skeleton"></div>
            <div class="public-event-card is-skeleton"></div>
          </div>
        </div>
      </section>
    </main>

    ${SiteFooter()}
    </div>
    `;
}

export async function initEventsPage() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    initNavbar('events');
    initFooter();
    bindAuthRouteLinks();
    initReveal();

    const grid = document.getElementById('public-events-grid');
    const count = document.getElementById('public-events-count');
    const searchInput = document.getElementById('public-event-search');
    const categorySelect = document.getElementById('public-event-category');
    let events = [];

    const paint = (list) => {
        if (!grid) return;

        if (!list.length) {
            grid.innerHTML = renderEmpty(
                events.length ? 'No matching events.' : 'No registered events yet.',
                events.length ? 'Try another search or category.' : 'Events appear here after an organization registers.'
            );
        } else {
            grid.innerHTML = list.map(renderEventCard).join('');
        }

        if (count) {
            count.textContent = `${list.length} event${list.length === 1 ? '' : 's'}`;
        }

        refreshIcons();
        playPageDomino(grid);
    };

    try {
        events = await getPublicEvents();
        const categories = [...new Set(events.map((event) => event.event_category).filter(Boolean))].sort();
        if (categorySelect) {
            categorySelect.innerHTML = '<option value="">All categories</option>' +
                categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join('');
        }

        const applyFilters = () => {
            const query = (searchInput?.value || '').trim().toLowerCase();
            const category = (categorySelect?.value || '').trim();
            const filtered = events.filter((event) => {
                if (category && event.event_category !== category) return false;
                if (!query) return true;
                const haystack = [
                    event.title,
                    event.description,
                    event.venue,
                    event.event_category,
                    ...(event.organizations || [])
                ].join(' ').toLowerCase();
                return haystack.includes(query);
            });
            paint(filtered);
        };

        searchInput?.addEventListener('input', applyFilters);
        categorySelect?.addEventListener('change', applyFilters);
        applyFilters();
    } catch (error) {
        console.error('Failed to load public events:', error);
        if (grid) {
            grid.innerHTML = renderEmpty('Unable to load events.', 'Please try again in a moment.');
            refreshIcons();
            playPageDomino(grid);
        }
    }
}
