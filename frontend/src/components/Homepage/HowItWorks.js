export function HowItWorks() {
    return `
      <section class="section section-alt" id="how-it-works">
        <div class="container">
          <header class="section-head reveal">
            <span class="pill">How It Works</span>
            <h2>A closer look at each role</h2>
          </header>
          <ol class="steps">
            <li class="step reveal">
              <span class="num">1</span
              ><span class="ico ico-navy"
                ><i data-lucide="settings-2"></i
              ></span>
              <h3>Administrators configure</h3>
              <p>
                Sets up students, advisers, organizations, events and
                registrations.
              </p>
            </li>
            <li class="step reveal">
              <span class="num">2</span
              ><span class="ico ico-blue"
                ><i data-lucide="clipboard-check"></i
              ></span>
              <h3>Advisers manage</h3>
              <p>Runs organizations, assigns tasks and records attendance.</p>
            </li>
            <li class="step reveal">
              <span class="num">3</span
              ><span class="ico ico-navy"><i data-lucide="rocket"></i></span>
              <h3>Students participate</h3>
              <p>
                Joins events, completes tasks and monitors personal records.
              </p>
            </li>
          </ol>
        </div>
      </section>
    `;
}
