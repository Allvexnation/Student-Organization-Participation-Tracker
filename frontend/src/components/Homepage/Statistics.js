import { API_ROUTES } from '../../api/server/api.js';
import { getAnalyticsStats } from '../../api/web/WebAnalytics.js';

export function Statistics(data = null) {
    const stats = data || {
        total_students: 0,
        total_organizations: 0,
        total_events: 0,
        total_tasks: 0,
        total_visits: 0
    };

    return `
      <section class="stats" aria-label="System statistics">
        <div class="container stats-grid">
          <div class="stat reveal">
            <i data-lucide="graduation-cap"></i
            ><strong data-count="${stats.total_students}">0</strong><span>Total Students</span>
          </div>
          <div class="stat reveal">
            <i data-lucide="users"></i><strong data-count="${stats.total_organizations}">0</strong
            ><span>Total Organizations</span>
          </div>
          <div class="stat reveal">
            <i data-lucide="calendar-days"></i
            ><strong data-count="${stats.total_events}">0</strong><span>Total Events</span>
          </div>
          <div class="stat reveal">
            <i data-lucide="clipboard-list"></i
            ><strong data-count="${stats.total_tasks}">0</strong><span>Activities / Tasks</span>
          </div>
          <div class="stat reveal">
            <i data-lucide="eye"></i
            ><strong data-count="${stats.total_visits}">0</strong><span>Total Visits</span>
          </div>
        </div>
      </section>
    `;
}

export async function fetchStatistics() {
    try {
        const [statsResponse, analyticsResponse] = await Promise.all([
            fetch(API_ROUTES.WEB.STATISTICS),
            getAnalyticsStats()
        ]);

        let statsData = {};
        let totalVisits = 0;

        if (statsResponse && statsResponse.ok) {
            statsData = await statsResponse.json();
        }

        if (analyticsResponse && analyticsResponse.stats) {
            totalVisits = analyticsResponse.stats.total_visits || 0;
        }

        return {
            ...statsData,
            total_visits: totalVisits
        };
    } catch (error) {
        console.error('Failed to fetch statistics:', error);
    }
    return null;
}
