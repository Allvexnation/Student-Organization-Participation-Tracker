export function Portals() {
    return `
      <section class="section section-alt" id="portals">
        <div class="container">
          <header class="section-head reveal">
            <span class="pill">Three Dedicated Portals</span>
            <h2>One system for everyone</h2>
            <p>
              Choose your role to see the features available to you and access
              your portal.
            </p>
          </header>
          <div class="portal-grid">
            <article class="portal reveal">
              <div class="portal-top">
                <span class="ico ico-navy"
                  ><i data-lucide="shield-check"></i
                ></span>
                <h3>Administrator Portal</h3>
              </div>
              <ul class="checks">
                <li>Manage students and advisers</li>
                <li>Manage organizations and memberships</li>
                <li>Configure events and registrations</li>
                <li>Monitor system activities and generate reports</li>
              </ul>
              <a class="btn btn-dark" href="/auth/admin/login" data-route="admin" data-auth-route
                >Administrator Login <i data-lucide="arrow-right"></i
              ></a>
            </article>
            <article class="portal reveal">
              <div class="portal-top">
                <span class="ico ico-blue"><i data-lucide="user-cog"></i></span>
                <h3>Adviser Portal</h3>
              </div>
              <ul class="checks">
                <li>Manage associated organizations</li>
                <li>Manage organization students</li>
                <li>Assign tasks with schedules and deadlines</li>
                <li>Monitor task completion</li>
                <li>Record student attendance</li>
                <li>Generate participation reports</li>
              </ul>
              <a
                class="btn btn-primary"
                href="/auth/adviser/login"
                data-route="adviser"
                data-auth-route
                >Adviser Login <i data-lucide="arrow-right"></i
              ></a>
            </article>
            <article class="portal reveal">
              <div class="portal-top">
                <span class="ico ico-navy"
                ><i data-lucide="graduation-cap"></i
              ></span>
                <h3>Student Portal</h3>
              </div>
              <ul class="checks">
                <li>View organization memberships</li>
                <li>Browse and register for events</li>
                <li>View assigned tasks and deadlines</li>
                <li>Track task completion</li>
                <li>Monitor personal attendance records</li>
                <li>Receive notifications</li>
              </ul>
              <a
                class="btn btn-dark"
                href="/auth/student/login"
                data-route="student"
                data-auth-route
                >Student Login <i data-lucide="arrow-right"></i
              ></a>
            </article>
          </div>
        </div>
      </section>
    `;
}
