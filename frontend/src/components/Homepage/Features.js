export function Features() {
    return `
      <section class="section" id="features">
        <div class="container">
          <header class="section-head reveal">
            <span class="pill">Core Features</span>
            <h2>Everything an organization needs</h2>
            <p>
              Six connected tools that cover the full cycle, from joining an
              organization to being recognized for participation.
            </p>
          </header>
          <div class="card-grid">
            <article class="card feature feature-star reveal">
              <span class="ico"><i data-lucide="list-checks"></i></span>
              <h3>Task Assignment &amp; Monitoring</h3>
              <p>
                Assign tasks with schedules and deadlines, then watch completion
                in real time.
              </p>
              <span class="tag">Main feature</span>
            </article>
            <article class="card feature feature-star reveal">
              <span class="ico"><i data-lucide="user-check"></i></span>
              <h3>Attendance Tracking</h3>
              <p>
                Record Present, Absent or Excused and keep a clean attendance
                history.
              </p>
              <span class="tag">Main feature</span>
            </article>
            <article class="card feature reveal">
              <span class="ico"><i data-lucide="building-2"></i></span>
              <h3>Organization Management</h3>
              <p>
                Create and maintain organizations, officers and advisers in one
                place.
              </p>
            </article>
            <article class="card feature reveal">
              <span class="ico"><i data-lucide="calendar-check"></i></span>
              <h3>Event Management &amp; Registration</h3>
              <p>
                Publish events and let students register online in a few taps.
              </p>
            </article>
            <article class="card feature reveal">
              <span class="ico"><i data-lucide="user-plus"></i></span>
              <h3>Student Membership Management</h3>
              <p>Add, approve and review the members of every organization.</p>
            </article>
            <article class="card feature reveal">
              <span class="ico"><i data-lucide="mail"></i></span>
              <h3>Automated Email Notifications</h3>
              <p>
                Reminders and updates are sent automatically so nobody misses a
                deadline.
              </p>
            </article>
          </div>
        </div>
      </section>
    `;
}
