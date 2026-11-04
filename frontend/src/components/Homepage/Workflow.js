export function Workflow() {
    return `
      <section class="section" id="workflow">
        <div class="container">
          <header class="section-head reveal">
            <span class="pill">Task &amp; Attendance Workflow</span>
            <h2>How tasks and attendance work together</h2>
            <p>
              Advisers assign tasks and record attendance, while the system
              automatically checks task completion.
            </p>
          </header>

          <ol class="wf-steps reveal">
            <li>
              <span>1</span><b>Adviser assigns a task</b
              ><small
                >Picks the students, then sets a schedule and deadline</small
              >
            </li>
            <li>
              <span>2</span><b>Adviser records attendance</b
              ><small>Present, Absent or Excused</small>
            </li>
            <li>
              <span>3</span><b>System evaluates the task</b
              ><small>Absent or Excused is handled automatically</small>
            </li>
            <li>
              <span>4</span><b>Student Portal updates</b
              ><small>Status and attendance appear instantly</small>
            </li>
          </ol>

          <div class="wf-demo reveal">
            <div class="wf-panel">
              <div class="wf-label">
                <i data-lucide="user-cog"></i> Automatic task evaluation
              </div>
              <p class="wf-q">
                When the adviser records attendance, the system evaluates the
                related task automatically:
              </p>
              <div class="wf-rule">
                <div class="wf-rule-top">
                  <b>Present</b><i data-lucide="arrow-right"></i
                  ><span class="badge b-pending">Pending</span>
                </div>
                <small
                  >The task stays Pending until the adviser marks it
                  Complete.</small
                >
              </div>
              <div class="wf-rule">
                <div class="wf-rule-top">
                  <b>Absent</b><i data-lucide="arrow-right"></i
                  ><span class="badge b-notcomplete">Not Complete</span>
                </div>
                <small>The task is marked Not Complete automatically.</small>
              </div>
              <div class="wf-rule">
                <div class="wf-rule-top">
                  <b>Excused</b><i data-lucide="arrow-right"></i
                  ><span class="badge b-incomplete">Incomplete</span>
                </div>
                <small
                  >The task is marked Incomplete automatically and can still be
                  finished later.</small
                >
              </div>
            </div>

            <div class="wf-arrow" aria-hidden="true">
              <i data-lucide="arrow-right"></i>
            </div>

            <div class="wf-panel">
              <div class="wf-label">
                <i data-lucide="graduation-cap"></i> Student Portal
              </div>
              <div class="wf-task">
                <div>
                  <b>Cast vote for OSO election.</b
                  ><small
                    ><i data-lucide="calendar"></i> MM-DD-YYYY · Attendance:
                    Present</small
                  >
                </div>
                <span class="badge b-complete">Complete</span>
              </div>
              <div class="wf-task">
                <div>
                  <b>Participate in clean up drive.</b
                  ><small
                    ><i data-lucide="calendar"></i> MM-DD-YYYY · Attendance:
                    Absent</small
                  >
                </div>
                <span class="badge b-notcomplete">Not Complete</span>
              </div>
              <div class="wf-task">
                <div>
                  <b>Attend mass.</b
                  ><small
                    ><i data-lucide="calendar"></i> MM-DD-YYYY · Attendance:
                    Excused</small
                  >
                </div>
                <span class="badge b-incomplete">Incomplete</span>
              </div>
              <div class="wf-task">
                <div>
                  <b>Join general assembly.</b
                  ><small
                    ><i data-lucide="calendar"></i> MM-DD-YYYY · Attendance: Not
                    yet recorded</small
                  >
                </div>
                <span class="badge b-pending">Pending</span>
              </div>
              <div class="wf-mail sent">
                <i data-lucide="mail"></i
                ><span
                  >An email notification is sent when a record changes</span
                >
              </div>
            </div>
          </div>

          <ul class="legend reveal" aria-label="Task statuses">
            <li>
              <span class="badge b-pending">Pending</span> Assigned, waiting to
              be evaluated
            </li>
            <li>
              <span class="badge b-complete">Complete</span> Student finished
              the task
            </li>
            <li>
              <span class="badge b-incomplete">Incomplete</span> Started or
              excused, can still be finished
            </li>
            <li>
              <span class="badge b-notcomplete">Not Complete</span> Not done,
              for example when absent
            </li>
          </ul>
        </div>
      </section>
    `;
}
