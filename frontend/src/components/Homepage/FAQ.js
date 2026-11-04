export function FAQ() {
    return `
      <section class="section section-alt" id="faq">
        <div class="container faq-wrap">
          <header class="section-head reveal">
            <span class="pill">FAQ</span>
            <h2>Frequently asked questions</h2>
          </header>
          <div class="faq" id="faq-list">
            <div class="faq-item reveal">
              <button class="faq-q" aria-expanded="false">
                <span>How do I get an account?</span><i data-lucide="plus"></i>
              </button>
              <div class="faq-a">
                <p>
                  Accounts are created and managed by the administrator. Once
                  yours is ready, sign in through the portal that matches your
                  role.
                </p>
              </div>
            </div>
            <div class="faq-item reveal">
              <button class="faq-q" aria-expanded="false">
                <span>Where can I see my tasks and deadlines?</span
                ><i data-lucide="plus"></i>
              </button>
              <div class="faq-a">
                <p>
                  All tasks assigned by your adviser are listed in your Student
                  Portal with their schedule, deadline and current status.
                </p>
              </div>
            </div>
            <div class="faq-item reveal">
              <button class="faq-q" aria-expanded="false">
                <span>What happens to a task if I am absent or excused?</span
                ><i data-lucide="plus"></i>
              </button>
              <div class="faq-a">
                <p>
                  When your adviser marks you Absent or Excused, the system
                  evaluates the related task automatically and updates its
                  status in your portal.
                </p>
              </div>
            </div>
            <div class="faq-item reveal">
              <button class="faq-q" aria-expanded="false">
                <span>How can I check my attendance record?</span
                ><i data-lucide="plus"></i>
              </button>
              <div class="faq-a">
                <p>
                  Your personal attendance history is available in the Student
                  Portal and updates as soon as your adviser records it.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
}
