# Student Organization Participation Tracker — Frontend

**Version:** 4.0.0  
**Status:** Production-ready SPA  
**Architecture:** Plain JavaScript · ES6 modules · History API routing  

---

## Credits

The frontend is a collaboration. **Jhon Ladines constructed the whole system.** Page layout and visual revamp are led by **Alez Magsuay**. Interactive animation, client security integration, and wiring to the backend are led by **Jhon Ladines**.

| Role | Person | Responsibility |
|------|--------|----------------|
| System architect | **Jhon Ladines** | Constructed the whole system end to end |
| Page revamp | **Alez Magsuay** | Redesign and restructuring of pages, layouts, and visual hierarchy |
| Interactive animation | **Jhon Ladines** | Homepage motion, auth transitions, modal animation, reveal effects |
| Frontend engineering | **Jhon Ladines** and **Alez Magsuay** | SPA routing, components, API clients, dashboards |
| Backend (API, database, security) | **Jhon Ladines** | Documented in `backend/README.md` |

---

## Overview

This is the frontend application for the Student Organization Participation Tracker. It is built using plain JavaScript with ES6 modules, following a Single Page Application (SPA) architecture similar to modern web frameworks like React. Instead of using multiple HTML files, the application dynamically renders pages using JavaScript modules and pathname-based routing.

Version **4.0.0** is a major UI and product release. It keeps every capability from v3.0.0 and adds a redesigned homepage, Google sign-in, audit logs, ban and support flows, web analytics, and shared layout components.

---

## What's New in v4.0.0

1. **Homepage redesign** — Marketing landing page with hero, about, live statistics, features, portals, workflow, how-it-works, technology, FAQ, and call-to-action. **Alez Magsuay** led the page revamp. **Jhon Ladines** implemented interactive animation (reveal, counters, FAQ, auth enter).
2. **Google OAuth** — Sign in with Google for admin, adviser, and student. GSI script loads from `app.js`; ID tokens go to `/api/oauth/google/...`.
3. **Admin platform expansion** — Manage admins, contacts, bans, web analytics, settings tabs, and unified user management. Admin forgot-password with OTP.
4. **Audit logs UI** — Dedicated pages for admin, adviser, and student activity trails.
5. **Public web pages** — `/events`, `/updates`, `/support`, `/banned`, `/banned-contacts` with ban-aware route guards.
6. **Shared layouts** — Reusable `Login`, `ForgotPassword`, dashboard, navbar, and stripbar shells under `src/components/Layout/`.
7. **Client observability and security** — `WebAnalytics.js` visit tracking, `DeviceInfo.js`, `TokenStore.js`, SEO helper, and global ban checks before render.

---

## Tech Stack

- **Language**: Plain JavaScript (ES6+)
- **Architecture**: Single Page Application (SPA)
- **Module System**: ES6 Modules (import/export)
- **Styling**: TailwindCSS (via CDN)
- **Icons**: Lucide Icons (via CDN)
- **Auth**: JWT in local storage / token store, Google Identity Services
- **Deployment**: Vercel (also Netlify / Apache)

---

## Project Architecture

The frontend follows a component-based SPA architecture with ES6 modules for code organization and separation of concerns.

### Directory Structure

```
frontend/
├── cache/
│   └── CacheService.js
├── public/
│   ├── CRT.jpg
│   ├── Overview1.jpg
│   ├── Overview2.jpg
│   ├── hero-students.png
│   └── favicon.ico
├── src/
│   ├── api/
│   │   ├── admin/
│   │   │   ├── Admin/ManageAdmins.js
│   │   │   ├── AdminAuth/
│   │   │   ├── AdminForgotPassword.js
│   │   │   ├── AdminLogin.js
│   │   │   ├── AdminProfile.js
│   │   │   ├── Dashboard/
│   │   │   ├── EventOrganizations/
│   │   │   ├── EventRegistrations/
│   │   │   ├── Events/
│   │   │   ├── OrgMemberships/
│   │   │   ├── Organizations/
│   │   │   ├── Students/
│   │   │   ├── Tasks/
│   │   │   ├── adviser/
│   │   │   └── roles/
│   │   ├── adviser/
│   │   ├── students/
│   │   ├── auth/
│   │   │   └── GoogleAuth.js
│   │   ├── AuditLogs/
│   │   │   ├── AuditLogs.js
│   │   │   ├── AdviserAuditLogs.js
│   │   │   └── StudentAuditLogs.js
│   │   ├── Contacts/
│   │   │   └── Contacts.js
│   │   ├── server/
│   │   │   └── api.js
│   │   └── web/
│   │       ├── Banned.js
│   │       ├── Events.js
│   │       ├── Updates.js
│   │       └── WebAnalytics.js
│   ├── components/
│   │   ├── Homepage/          # Landing sections (revamp)
│   │   ├── Layout/            # Shared login, dashboard, admin shells
│   │   ├── Modal/
│   │   │   ├── ManageAdminsModal.js
│   │   │   ├── ManageBannedModal.js
│   │   │   ├── Contacts/
│   │   │   ├── Adviser/
│   │   │   └── Updates/
│   │   ├── Navbar/
│   │   ├── Stripbar/
│   │   ├── CrudMenu.js
│   │   ├── Dialog/
│   │   ├── SkeletonLoading.js
│   │   ├── ToastMessage.js
│   │   └── buttons/
│   ├── middleware/
│   ├── pages/
│   │   ├── 404/
│   │   ├── HomePage.js
│   │   ├── Events/Events.js
│   │   ├── AuditLogs/
│   │   ├── Contacts/
│   │   ├── web/
│   │   ├── admin/
│   │   │   ├── AdminForgotPassword.js
│   │   │   ├── Admins/
│   │   │   ├── Banned/
│   │   │   ├── Contacts/
│   │   │   └── WebAnalytics/
│   │   ├── adviser/
│   │   └── students/
│   ├── provider/
│   │   ├── Animation/         # Interactive animation (Jhon Ladines)
│   │   ├── ModalAnimation.js
│   │   └── theme/
│   ├── utils/
│   │   ├── Routes.js
│   │   ├── jwt.js
│   │   ├── TokenStore.js
│   │   ├── DeviceInfo.js
│   │   ├── WebAnalytics.js
│   │   ├── seo.js
│   │   ├── modal.js
│   │   ├── navigation.js
│   │   └── steps.js
│   └── static/
├── .config/
├── .gitignore
├── .htaccess
├── _headers
├── index.html
├── index.css
├── app.js
├── main.js
├── netlify.toml
├── start.js
└── vercel.json
```

### Architecture Components

#### 1. Single HTML Entry Point (`index.html`)

- Contains only the basic HTML structure
- Includes CDN links for TailwindCSS, Lucide icons, and utility libraries
- Has a single `<div id="root"></div>` where all pages are rendered
- Loads the main JavaScript module

#### 1.1. URL Rewriting (`.htaccess`)

- Uses Apache `.htaccess` for clean URL rewriting
- Removes `index.html` from URLs for a cleaner appearance
- Enables proper SPA routing without hash fragments
- Example: `/admin/dashboard` instead of `/index.html#/admin/dashboard`

#### 2. App Component (`app.js`)

- Loads global CSS and Google OAuth
- Delegates pathname routing to `src/utils/Routes.js`
- Uses History API (`popstate`) so navigation does not reload the page
- Exposes `window.appNavigate(path)`
- Includes route guards (authentication, role, ban checks)

#### 3. Pages (`src/pages/`)

- Each page is a JavaScript module that exports:
  - A component function that returns HTML string
  - An initialization function for event listeners and dynamic behavior
- Pages are rendered dynamically based on the current pathname

#### 4. Components (`src/components/`)

- Reusable UI components
- Can be composed within pages
- Follow functional component pattern
- Homepage sections live in `src/components/Homepage/`
- Shared shells live in `src/components/Layout/`

#### 5. API Layer (`src/api/`)

- Centralized API communication
- Handles HTTP requests to backend
- Manages authentication headers
- Provides typed methods for different endpoints
- Route constants are defined in `src/api/server/api.js`

#### 6. Utilities (`src/utils/`)

- Helper functions for common tasks
- JWT token management and `TokenStore`
- Device fingerprinting for sessions and bans
- Web analytics tracking
- Data validation and formatting
- SEO title/meta helpers

---

## Routing System

The application uses pathname-based routing with History API, which allows navigation without page reloads.

### Available Routes

| Route Path | Page Component | Description |
|------------|----------------|-------------|
| `/` | HomePage | Redesigned landing page |
| `/events` | EventsPage | Public events |
| `/updates` | UpdatesPage | Product updates |
| `/support` | ContactSupports | Public support contact |
| `/banned` | Banned | Ban notice |
| `/banned-contacts` | BannedContacts | Ban appeal form |
| `/auth/admin/login` | AdminLogin | Admin login (password + Google) |
| `/auth/admin/forgot-password` | AdminForgotPassword | Admin OTP password reset |
| `/admin/dashboard` | AdminDashboard | Admin dashboard (protected) |
| `/admin/profile` | AdminProfile | Admin profile editing (protected) |
| `/admin/settings` | AdminSettings | Settings hub (protected) |
| `/admin/audit-logs` | AdminSettings | Settings / audit tab |
| `/admin/banned` | AdminSettings | Settings / bans tab (restricted) |
| `/admin/analytics` | AdminSettings | Settings / analytics tab (restricted) |
| `/audit-logs` | AuditLogs | Admin audit log viewer |
| `/admin/users` | ManageUsers | Unified user management |
| `/admin/admins` | ManageAdmins | Admin accounts (restricted) |
| `/admin/adviser` | ManageAdviser | Adviser management (protected) |
| `/admin/roles` | ManageRoles | Role management (protected) |
| `/admin/students` | ManageStudents | Student management (protected) |
| `/admin/organizations` | AdminOrganizations | Organization management (protected) |
| `/admin/events` | AdminEvents | Event management (protected) |
| `/admin/event-registrations` | ManageEventRegist | Event registration management (protected) |
| `/admin/org-memberships` | ManageOrgMemberships | Organization membership management (protected) |
| `/admin/contacts` | ManageContacts | Appeals, support, and reports |
| `/auth/adviser/login` | AdviserLogin | Adviser login page |
| `/auth/adviser/forgot-password` | AdviserForgotPassword | Adviser forgot password page |
| `/adviser/dashboard` | AdviserDashboard | Adviser dashboard (protected) |
| `/adviser/profile` | AdviserProfile | Adviser profile editing (protected) |
| `/adviser/organization` | AdviserOrganization | Adviser organization workspace |
| `/adviser/events` | AdviserEvents | Adviser events and tasks |
| `/adviser/attendance` | AdviserAttendance | Adviser attendance management (protected) |
| `/adviser/audit-logs` | AdviserAuditLogs | Adviser activity trail |
| `/auth/student/login` | StudentLogin | Student login page |
| `/auth/student/forgot-password` | StudentForgotPassword | Student forgot password page |
| `/student/dashboard` | StudentDashboard | Student dashboard (protected) |
| `/student/profile` | StudentProfile | Student profile editing (protected) |
| `/student/tasks` | StudentTask | Student task management (protected) |
| `/student/attendance` | StudentAttendance | Student attendance management (protected) |
| `/student/audit-logs` | StudentAuditLogs | Student activity trail |

### Route Guards

The application includes route protection logic in `src/utils/Routes.js`:

- If a user is authenticated and tries to access `/auth/admin/login`, `/auth/adviser/login`, or `/auth/student/login`, they are redirected to the matching dashboard
- Ban checks run before render (except on `/banned` and `404`); banned visitors are sent to `/banned`
- `/admin/admins`, `/admin/banned`, and `/admin/analytics` are restricted and redirect unauthorized users to `/404`
- Additional guards can be added in `Routes.js`

### Navigation

Navigate between pages using JavaScript:

```javascript
// Navigate to admin dashboard
window.appNavigate('/admin/dashboard');

// Navigate to home
window.appNavigate('/');
```

---

## Development Setup

### Prerequisites

- Modern web browser (Chrome, Firefox, Edge, Safari)
- VS Code (recommended)
- Node.js (required for running the project)

#### Installing Node.js

If Node.js is not installed on your system:

1. Download Node.js v24.22.1 from: https://nodejs.org/dist/v24.22.1/node-v24.22.1-x64.msi
2. Run the installer and follow the installation wizard
3. After installation, verify Node.js is installed by running in terminal or PowerShell:
   ```bash
   node -v
   ```

### Installation

1. **Install VS Code**
   - Download from [https://code.visualstudio.com](https://code.visualstudio.com)

2. **Clone the Repository**
   ```bash
   git clone [repository-url]
   cd frontend
   ```

### Running the Application

#### Quick Start (Required)

The project uses "Run Devs by Jhon Ladines" to run the development server.

1. **Navigate to the frontend directory**
   ```bash
   cd path/to/Student-Organization-Participation-Tracker/frontend
   ```

2. **Run the development server**
   ```bash
   npx run-devs
   ```

   This command will:
   - Start the development server
   - Open the application in your default browser
   - Enable hot-reloading for code changes

**Important Notes:**

- Do not open `index.html` directly from file explorer — ES6 modules require a proper server
- The `npx run-devs` command (Run Devs by Jhon Ladines) is the only supported way to run the application

### Development Workflow

1. **Make Code Changes**
   - Edit JavaScript modules in `src/`
   - Changes are automatically reflected (the dev server auto-reloads)

2. **Debugging**
   - Use browser DevTools (F12)
   - Check Console for errors
   - Use debugger statements in code
   - Network tab for API calls

3. **ES6 Modules**
   - All JavaScript files use ES6 module syntax
   - Import: `import { something } from './file.js'`
   - Export: `export function something() {}`
   - Note: Module imports must include `.js` extension

---

## Component Development

### Creating a New Page

1. **Create Page Module** in `src/pages/` or `src/pages/admin/`:
   ```javascript
   // src/pages/admin/NewPage.js
   export function NewPage() {
       return `
           <div class="container">
               <h1>New Page</h1>
               <p>This is a new page</p>
           </div>
       `;
   }

   export function initNewPage() {
       console.log('New page initialized');
       // Add event listeners here
   }
   ```

2. **Add Route** in `src/utils/Routes.js`:
   ```javascript
   import { NewPage, initNewPage } from './src/pages/admin/NewPage.js';

   export const routes = {
       // ... existing routes
       '/admin/new-page': NewPage
   };

   export const initFunctions = {
       // ... existing functions
       '/admin/new-page': initNewPage
   };
   ```

3. **Navigate to Page**:
   ```javascript
   window.appNavigate('/admin/new-page');
   ```

### Creating a New API Module

1. **Create API Module** in `src/api/admin/`:
   ```javascript
   // src/api/admin/NewResource/NewResourceApi.js
   import { server } from '../server/server.js';

   export const NewResourceApi = {
       getAll: async () => {
           const response = await fetch(`${server}/api/admin/new-resource`, {
               method: 'GET',
               headers: {
                   'Content-Type': 'application/json',
                   'Authorization': `Bearer ${localStorage.getItem('token')}`
               }
           });
           return response.json();
       },
       
       create: async (data) => {
           const response = await fetch(`${server}/api/admin/new-resource`, {
               method: 'POST',
               headers: {
                   'Content-Type': 'application/json',
                   'Authorization': `Bearer ${localStorage.getItem('token')}`
               },
               body: JSON.stringify(data)
           });
           return response.json();
       },
       
       update: async (id, data) => {
           const response = await fetch(`${server}/api/admin/new-resource/${id}`, {
               method: 'PUT',
               headers: {
                   'Content-Type': 'application/json',
                   'Authorization': `Bearer ${localStorage.getItem('token')}`
               },
               body: JSON.stringify(data)
           });
           return response.json();
       },
       
       delete: async (id) => {
           const response = await fetch(`${server}/api/admin/new-resource/${id}`, {
               method: 'DELETE',
               headers: {
                   'Content-Type': 'application/json',
                   'Authorization': `Bearer ${localStorage.getItem('token')}`
               }
           });
           return response.json();
       }
   };
   ```

2. **Use API in Page**:
   ```javascript
   import { NewResourceApi } from '../../api/admin/NewResource/NewResourceApi.js';

   export function ManageNewResource() {
       // Use NewResourceApi methods
   }
   ```

### Creating a Reusable Component

1. **Create Component Module** in `src/components/`:
   ```javascript
   // src/components/Button.js
   export function Button({ text, onClick, variant = 'primary' }) {
       const variants = {
           primary: 'bg-blue-500 hover:bg-blue-600',
           secondary: 'bg-gray-500 hover:bg-gray-600'
       };
       
       return `
           <button class="${variants[variant]} text-white px-4 py-2 rounded">
               ${text}
           </button>
       `;
   }
   ```

2. **Use Component in Page**:
   ```javascript
   import { Button } from '../components/Button.js';

   export function MyPage() {
       return `
           <div>
               ${Button({ text: 'Click Me', onClick: 'handleClick()' })}
           </div>
       `;
   }
   ```

---

## API Integration

### API Configuration

API calls are organized in `src/api/` with separate modules for each resource. Canonical URLs live in `src/api/server/api.js`.

```javascript
// Example: src/api/admin/Students/StudentsApi.js
import { server } from '../server/server.js';

export const StudentsApi = {
    getAll: async () => {
        const response = await fetch(`${server}/api/admin/students`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.json();
    },
    
    create: async (data) => {
        const response = await fetch(`${server}/api/admin/students`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(data)
        });
        return response.json();
    },
    
    update: async (id, data) => {
        const response = await fetch(`${server}/api/admin/students/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(data)
        });
        return response.json();
    },
    
    delete: async (id) => {
        const response = await fetch(`${server}/api/admin/students/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.json();
    }
};
```

### Making API Calls

```javascript
import { StudentsApi } from '../api/admin/Students/StudentsApi.js';

// GET all students
const students = await StudentsApi.getAll();

// POST create student
const newStudent = await StudentsApi.create({
    name: 'John Doe',
    email: 'john@example.com',
    student_id: 'STU001'
});

// PUT update student
const updatedStudent = await StudentsApi.update(1, {
    name: 'Jane Doe'
});

// DELETE student
await StudentsApi.delete(1);
```

### v4 API modules

| Module | Purpose |
|--------|---------|
| `src/api/auth/GoogleAuth.js` | Google login for admin, adviser, student |
| `src/api/admin/AdminForgotPassword.js` | Admin OTP reset |
| `src/api/admin/Admin/ManageAdmins.js` | Admin CRUD |
| `src/api/AuditLogs/*` | Admin, adviser, and student audit logs |
| `src/api/Contacts/Contacts.js` | Appeals, support contacts, reports |
| `src/api/web/Banned.js` | Ban check, list, activate/deactivate |
| `src/api/web/Events.js` | Public events |
| `src/api/web/WebAnalytics.js` | Visit tracking and admin analytics |

---

## State Management

### Local Storage

The application uses localStorage for persistent data:

```javascript
// Store data
localStorage.setItem('token', 'your-jwt-token');
localStorage.setItem('user', JSON.stringify(userData));

// Retrieve data
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));

// Remove data
localStorage.removeItem('token');
localStorage.clear();
```

`src/utils/TokenStore.js` wraps token persistence so password and Google sessions share one access pattern.

### JWT Authentication

JWT tokens are managed in `src/utils/jwt.js`:

```javascript
export function setToken(token) {
    localStorage.setItem('token', token);
}

export function getToken() {
    return localStorage.getItem('token');
}

export function isAuthenticated() {
    return !!getToken();
}

export function logout() {
    localStorage.removeItem('token');
    window.appNavigate('/auth/admin/login');
}

export function getAdminData() {
    const adminData = localStorage.getItem('adminData');
    return adminData ? JSON.parse(adminData) : null;
}

export function setAdminData(data) {
    localStorage.setItem('adminData', JSON.stringify(data));
}
```

### Modal Utilities

Modal utilities in `src/utils/modal.js` provide helper functions for modal management:

```javascript
export function openModal(modalId) {
    // Open modal logic
}

export function closeModal(modalId) {
    // Close modal logic
}

export function toggleModal(modalId) {
    // Toggle modal logic
}
```

### Step Utilities

Step utilities in `src/utils/steps.js` provide step-by-step form management:

```javascript
export function nextStep(currentStep, totalSteps) {
    // Move to next step
}

export function prevStep(currentStep) {
    // Move to previous step
}

export function validateStep(stepData) {
    // Validate current step
}
```

### Device info and analytics

- `DeviceInfo.js` collects browser, OS, screen, and fingerprint data for login, sessions, bans, and audit logs
- `WebAnalytics.js` sends page views and heartbeats to `/api/web/analytics`

---

## Styling

### TailwindCSS

The application uses TailwindCSS via CDN for styling:

- Utility-first CSS framework
- Responsive design utilities
- Dark mode support
- Custom configurations possible

### Custom Styles

Additional styles can be added in `index.css`:

```css
/* Custom styles */
.custom-class {
    /* your styles */
}
```

### Icons

Lucide Icons are used for UI icons:

```javascript
// Icons are rendered as SVG
// Use in HTML strings
lucide.createIcons();
```

### Components

The application includes several reusable components:

- **CrudMenu**: CRUD operation menu component
- **Modal**: Modal dialog components with animations (`ManageAdminsModal`, `ManageBannedModal`, contact modals, adviser and updates modals)
- **Dialog**: Dialog components for confirmations
- **Navbar**: Navigation bar components (`AdminNavbar`, `AdviserNavbar`, `StudentNavbar`, `HomepageNavbar`, `UpdatesNavbar`)
- **SkeletonLoading**: Loading skeleton for async operations
- **Stripbar**: Strip bar components including `HomepageStripbar` and shared tab helpers
- **ToastMessage**: Toast notification component for feedback
- **Buttons**: Reusable button components
- **Layout**: Shared `Login`, `ForgotPassword`, `Dashboard`, admin settings/events/organizations shells
- **Homepage**: Hero, About, Statistics, Features, Portals, Workflow, HowItWorks, Technology, FAQ, CallToAction, Footer, Navigation

### Animations

Animation providers in `src/provider/Animation/` and `src/provider/ModalAnimation.js` provide:

- Modal open/close animations
- Fade in/out effects
- Slide animations
- Homepage reveal, statistic counters, and FAQ accordion (`HomepageAnimation.js`)
- Auth page enter transitions (`auth/AuthAnimation.js`)
- Custom animation configurations

Interactive animation throughout the SPA is implemented by **Jhon Ladines**. Page structure and visual revamp of those screens are led by **Alez Magsuay**.

---

## Homepage (v4)

`HomePage.js` composes public sections and loads live counts from `/api/web/statistics`:

1. Navigation  
2. Hero  
3. About  
4. Statistics (students, organizations, events, tasks, visits)  
5. Features  
6. Portals (admin / adviser / student)  
7. Workflow  
8. How it works  
9. Technology  
10. FAQ  
11. Call to action  
12. Footer  

---

## Deployment

### Vercel Deployment

1. **Prepare for Deployment**
   - Ensure `vercel.json` is configured
   - Test the application locally

2. **Deploy via Vercel**
   - Install Vercel CLI: `npm i -g vercel`
   - Run: `vercel`
   - Follow the prompts
   - Or connect GitHub repository to Vercel

3. **vercel.json Configuration**
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```

### Environment Variables

Set environment variables in Vercel dashboard or in `src/api/server/server.js` / `src/api/server/api.js`:

```javascript
export const server = 'https://your-backend.onrender.com';
```

For local development, update the server URL to point to your local backend:

```javascript
export const server = 'http://localhost:8000';
```

Google client ID is served from `GET /api/oauth/google/config`. Do not hard-code secrets in the frontend.

---

## Browser Compatibility

- Modern browsers with ES6 module support
- Chrome 61+
- Firefox 60+
- Safari 11+
- Edge 16+

---

## Troubleshooting

### Common Issues

2. **Module Import Errors**
   - Ensure all imports include `.js` extension
   - Check file paths are correct
   - Use relative paths starting with `./` or `../`

3. **CORS Errors**
   - Backend must allow CORS from frontend domain
   - Check backend CORS configuration

4. **Routing Not Working**
   - Pathname routing uses History API (not hash routing)
   - Check `src/utils/Routes.js` route configuration
   - Confirm the host rewrites unknown paths to `index.html` (`vercel.json`, `netlify.toml`, or `.htaccess`)

5. **API Connection Issues**
   - Check server URL in `src/api/server/api.js` (or `server.js`)
   - Verify backend is running
   - Check browser Network tab for failed requests
   - Ensure CORS is configured on backend

6. **JWT Token Issues**
   - Check token is stored in localStorage / TokenStore
   - Verify token is not expired
   - Check Authorization header format: `Bearer {token}`

7. **Google Sign-In Does Not Appear**
   - Confirm `loadGoogleOAuth()` runs from `app.js`
   - Confirm backend Google config is enabled
   - Authorized JavaScript origins must include the frontend URL

8. **Redirected to `/banned`**
   - Ban checks run on every navigation
   - Use `/banned-contacts` to submit an appeal

---

## Development Guidelines

### Code Style

- Use ES6+ features (arrow functions, template literals, destructuring)
- Follow functional programming patterns
- Keep functions pure when possible
- Use meaningful variable names
- Add comments for complex logic

### Best Practices

- **Modularization**: Keep modules focused and small
- **Reusability**: Create reusable components
- **Performance**: Minimize DOM manipulations
- **Security**: Validate all inputs, sanitize HTML
- **Accessibility**: Use semantic HTML, ARIA labels

### New Features in v4.0.0

- **Homepage and public web**
  - Section-based landing page with live statistics
  - Public events page
  - Support and ban-appeal pages
  - Homepage navbar and stripbar
- **Google OAuth UI**
  - GSI client bootstrap
  - Admin, adviser, and student Google login helpers
- **Admin operations**
  - Manage admins
  - Manage banned accounts/sessions/IPs
  - Manage contacts (appeals, support, reports)
  - Web analytics dashboard
  - Admin forgot password
  - Settings hub with restricted tabs
- **Accountability**
  - Admin, adviser, and student audit log pages
- **Shared layout system**
  - Layout login and forgot-password templates
  - Dashboard, admin events, admin organizations, manage users
- **Client utilities**
  - TokenStore, DeviceInfo, WebAnalytics, seo
  - Route-level ban enforcement
- **Animation**
  - Homepage reveal, counters, FAQ
  - Auth page enter animations
  - Existing modal animation retained

### New Features in v3.0.0

- **Attendance Management System**: Complete attendance tracking for advisers and students
  - Adviser attendance management with full CRUD operations
  - Student attendance self-service tracking
  - AM/PM session time tracking (time in/out)
  - Break time tracking (break out/in)
  - Absence management with excused/unexcused status
  - Excuse reason and session tracking
  - Duration calculation in minutes
  - Real-time attendance status updates
  - Attendance history and reporting
- **Updates Management System**: Version update tracking and notifications
  - Updates modal for displaying version information
  - Active/inactive update status
  - Closable types (closable, not_closable, show_once)
  - GitHub branch link integration
  - Asset file download functionality
  - README content display for each update
  - Web API integration for update management
- **Cache Service**: Frontend caching for improved performance
  - In-memory cache for API responses
  - Configurable TTL (Time To Live)
  - Cache invalidation support
  - Reduced API calls for frequently accessed data
- **Enhanced API Structure**: Improved API organization
  - Dedicated web API module for updates
  - Separate attendance API modules for advisers and students
  - Dashboard API modules for better organization
  - Improved server configuration with API routes
- **New Pages and Components**:
  - Adviser attendance page with comprehensive tracking
  - Student attendance page with self-service features
  - Updates modal component for version notifications
  - Adviser-specific modal components
- **Deployment Configuration**: Multiple platform support
  - Vercel deployment configuration
  - Netlify deployment configuration
  - Custom headers for Netlify
  - Apache .htaccess for clean URLs
- **Improved Asset Management**:
  - Updated public assets (CRT.jpg, Overview images)
  - Better organization of static assets
  - Favicon for browser tab branding
- **Code Organization Improvements**:
  - Cache service directory
  - Web API subdirectory
  - Attendance subdirectories in API and pages
  - Updates modal subdirectory
  - Configuration directory (.config)

### Bug Fixes in v2.1.0

- Fixed responsiveness issues across all management pages for better mobile and tablet support
- Fixed multiple fetch request bugs that caused duplicate API calls
- Fixed slow fetch performance by optimizing API response handling
- Improved error handling for failed API requests

### File Naming

- Use PascalCase for components: `HomePage.js`
- Use camelCase for utilities: `jwt.js`
- Use kebab-case for assets: `banner.png`

---

## Security Considerations

- Never store sensitive data in localStorage (no Google client secrets)
- Validate all user inputs
- Sanitize HTML to prevent XSS
- Use HTTPS in production
- Implement proper authentication
- Handle errors gracefully
- Send device info only to trusted backend endpoints
- Honor ban redirects; do not disable the `/banned` guard in production

---

## License

MIT License

Copyright (c) 2026 Jhon Ladines

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
