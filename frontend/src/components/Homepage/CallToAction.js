export function CallToAction() {
    return `
      <section class="cta" id="contact">
        <div class="container cta-inner reveal">
          <div>
            <h2>Ready to get started?</h2>
            <p>Choose your portal and sign in.</p>
          </div>
          <div class="cta-actions">
            <a class="btn btn-light" href="/auth/admin/login" data-route="admin" data-auth-route
              ><i data-lucide="shield-check"></i> Administrator</a
            >
            <a
              class="btn btn-light"
              href="/auth/adviser/login"
              data-route="adviser"
              data-auth-route
              ><i data-lucide="user-cog"></i> Adviser</a
            >
            <a
              class="btn btn-accent"
              href="/auth/student/login"
              data-route="student"
              data-auth-route
              ><i data-lucide="graduation-cap"></i> Student</a
            >
          </div>
        </div>
      </section>
    `;
}
