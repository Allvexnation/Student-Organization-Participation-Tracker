export function About() {
    return `
      <section class="section about" id="about">
        <div class="container about-grid">
          <div class="about-copy reveal">
            <span class="pill">About the System</span>
            <h2>Built to make every student organization run smoother</h2>
            <p>
              The CRT Student Organization Participation Tracker replaces
              scattered spreadsheets and paper logs with a single web platform.
              It keeps organizations, members, events, tasks and attendance
              connected, so everyone sees the same up-to-date record.
            </p>
          </div>
          <div class="about-points">
            <article class="point reveal">
              <span class="ico"><i data-lucide="layers"></i></span>
              <div>
                <h3>Organized management</h3>
                <p>
                  Advisers and administrators handle organizations, memberships
                  and events from one dashboard.
                </p>
              </div>
            </article>
            <article class="point reveal">
              <span class="ico"><i data-lucide="trending-up"></i></span>
              <div>
                <h3>Higher participation</h3>
                <p>
                  Students see their tasks, deadlines and attendance, and get
                  notified before things slip.
                </p>
              </div>
            </article>
            <article class="point reveal">
              <span class="ico"><i data-lucide="file-text"></i></span>
              <div>
                <h3>Reliable reports</h3>
                <p>
                  Participation reports are generated from real attendance and
                  task records, not guesswork.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>
    `;
}
