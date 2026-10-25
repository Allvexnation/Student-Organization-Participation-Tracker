# Student Organization Participation Tracker - Frontend

**Version: 2.0**

## Overview

This is the frontend application for the Student Organization Participation Tracker. It is built using plain JavaScript with ES6 modules, following a Single Page Application (SPA) architecture similar to modern web frameworks like React. Instead of using multiple HTML files, the application dynamically renders pages using JavaScript modules and hash-based routing.

## Tech Stack

- **Language**: Plain JavaScript (ES6+)
- **Architecture**: Single Page Application (SPA)
- **Module System**: ES6 Modules (import/export)
- **Styling**: TailwindCSS (via CDN)
- **Icons**: Lucide Icons (via CDN)

- **Development Server**: Live Server Extension (VS Code)
- **Deployment**: Vercel

## Project Architecture

The frontend follows a component-based SPA architecture with ES6 modules for code organization and separation of concerns.

### Directory Structure

```
frontend/
├── public/
│   ├── banner.png           # Application banner image
│   ├── crtlogo.png          # Logo image
│   └── favicon.ico          # Favicon
├── src/
│   ├── api/                 # API communication layer
│   │   ├── admin/           # Admin API modules
│   │   │   ├── AdminAuth/   # Admin authentication API
│   │   │   ├── AdminLogin.js # Admin login API
│   │   │   ├── AdminProfile.js # Admin profile API
│   │   │   ├── EventRegistrations/ # Event registration API
│   │   │   ├── Events/      # Events API
│   │   │   ├── OrgMemberships/ # Organization memberships API
│   │   │   ├── Organizations/ # Organizations API
│   │   │   ├── Students/    # Students API
│   │   │   ├── adviser/     # Adviser API
│   │   │   └── roles/       # Roles API
│   │   └── server/         # Server configuration
│   ├── components/          # Reusable UI components
│   │   ├── CrudMenu.js      # CRUD menu component
│   │   ├── Dialog/          # Dialog components
│   │   ├── Modal/           # Modal components
│   │   ├── Navbar/          # Navigation bar components
│   │   ├── SkeletonLoading.js # Loading skeleton component
│   │   ├── Stripbar/        # Strip bar components
│   │   ├── ToastMessage.js  # Toast notification component
│   │   └── buttons/         # Button components
│   ├── pages/               # Page components (routes)
│   │   ├── HomePage.js      # Home page
│   │   └── admin/           # Admin pages
│   │       ├── AdminLogin.js # Admin login page
│   │       ├── AdminDashboard.js # Admin dashboard
│   │       ├── AdminProfile.js # Admin profile page
│   │       ├── Adviser/     # Adviser management pages
│   │       ├── EventRegistrations/ # Event registration pages
│   │       ├── Events/      # Event management pages
│   │       ├── OrgMemeberships/ # Organization membership pages
│   │       ├── Organizations/ # Organization management pages
│   │       ├── Students/    # Student management pages
│   │       └── roles/       # Role management pages
│   ├── provider/            # State management/context
│   │   ├── Animation/       # Animation providers
│   │   ├── ModalAnimation.js # Modal animation provider
│   │   └── theme/           # Theme providers
│   ├── utils/               # Utility functions
│   │   ├── jwt.js           # JWT token handling
│   │   ├── modal.js         # Modal utilities
│   │   └── steps.js         # Step utilities
│   └── static/              # Static assets
├── index.html               # Single HTML entry point
├── index.css                # Global styles
├── app.js                   # Main app component with routing
├── main.js                  # Application entry point
└── vercel.json              # Vercel deployment configuration
```

### Architecture Components

#### 1. **Single HTML Entry Point** (`index.html`)
- Contains only the basic HTML structure
- Includes CDN links for TailwindCSS, Lucide icons, and utility libraries
- Has a single `<div id="root"></div>` where all pages are rendered
- Loads the main JavaScript module

#### 2. **App Component** (`app.js`)
- Implements hash-based routing (similar to React Router)
- Manages route-to-component mapping
- Handles page rendering dynamically
- Includes route guards (e.g., authentication checks)
- Initializes page-specific functions after rendering

#### 3. **Pages** (`src/pages/`)
- Each page is a JavaScript module that exports:
  - A component function that returns HTML string
  - An initialization function for event listeners and dynamic behavior
- Pages are rendered dynamically based on the current hash route

#### 4. **Components** (`src/components/`)
- Reusable UI components
- Can be composed within pages
- Follow functional component pattern

#### 5. **API Layer** (`src/api/`)
- Centralized API communication
- Handles HTTP requests to backend
- Manages authentication headers
- Provides typed methods for different endpoints

#### 6. **Utilities** (`src/utils/`)
- Helper functions for common tasks
- JWT token management
- Data validation and formatting

## Routing System

The application uses hash-based routing, which allows navigation without page reloads:

### Available Routes

| Route Hash | Page Component | Description |
|------------|----------------|-------------|
| `''` (empty) | HomePage | Landing page |
| `#admin-login` | AdminLogin | Admin login page |
| `#admin-dashboard` | AdminDashboard | Admin dashboard (protected) |
| `#edit-admin-profile` | AdminProfile | Admin profile editing (protected) |
| `#manage-adviser` | ManageAdviser | Adviser management (protected) |
| `#manage-roles` | ManageRoles | Role management (protected) |
| `#manage-students` | ManageStudents | Student management (protected) |
| `#manage-organizations` | ManageOrganizations | Organization management (protected) |
| `#manage-events` | ManageEvents | Event management (protected) |
| `#manage-event-registrations` | ManageEventRegist | Event registration management (protected) |
| `#manage-org-memberships` | ManageOrgMemberships | Organization membership management (protected) |

### Route Guards

The application includes route protection logic:
- If user is authenticated and tries to access `#admin-login`, they are redirected to `#admin-dashboard`
- Additional guards can be added in `app.js`

### Navigation

Navigate between pages using JavaScript:
```javascript
// Navigate to admin dashboard
window.location.hash = '#admin-dashboard';

// Navigate to home
window.location.hash = '';
```

## Development Setup

### Prerequisites

- Modern web browser (Chrome, Firefox, Edge, Safari)
- VS Code (recommended)
- Live Server Extension for VS Code

### Installation

1. **Install VS Code**
   - Download from [https://code.visualstudio.com](https://code.visualstudio.com)

2. **Install Live Server Extension**
   - Open VS Code
   - Go to Extensions (Ctrl+Shift+X)
   - Search for "Live Server"
   - Install the extension by Ritwick Dey

3. **Clone the Repository**
   ```bash
   git clone [repository-url]
   cd frontend
   ```

### Running the Application

1. **Open Project in VS Code**
   - File → Open Folder
   - Select the `frontend` directory

2. **Start Live Server**
   - Right-click on `index.html`
   - Select "Open with Live Server"
   - Or press Alt+L, then Alt+O (Windows/Linux)
   - Or click "Go Live" in the bottom right status bar

3. **Access the Application**
   - The application will open in your default browser
   - Typically at `http://127.0.0.1:5500` or `http://localhost:5500`

### Development Workflow

1. **Make Code Changes**
   - Edit JavaScript modules in `src/`
   - Changes are automatically reflected (Live Server auto-reloads)

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

2. **Add Route** in `app.js`:
   ```javascript
   import { NewPage, initNewPage } from './src/pages/admin/NewPage.js';

   // In constructor
   this.routes = {
       // ... existing routes
       '#new-page': NewPage
   };
   this.initFunctions = {
       // ... existing functions
       '#new-page': initNewPage
   };
   ```

3. **Navigate to Page**:
   ```javascript
   window.location.hash = '#new-page';
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

## API Integration

### API Configuration

API calls are organized in `src/api/admin/` with separate modules for each resource:

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
    window.location.hash = '#admin-login';
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
- **Modal**: Modal dialog components with animations
- **Dialog**: Dialog components for confirmations
- **Navbar**: Navigation bar components (AdminNavbar, etc.)
- **SkeletonLoading**: Loading skeleton for async operations
- **Stripbar**: Strip bar components
- **ToastMessage**: Toast notification component for feedback
- **Buttons**: Reusable button components

### Animations

Animation providers in `src/provider/Animation/` and `src/provider/ModalAnimation.js` provide:
- Modal open/close animations
- Fade in/out effects
- Slide animations
- Custom animation configurations

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

Set environment variables in Vercel dashboard or in `src/api/server/server.js`:
```javascript
export const server = 'https://your-backend.onrender.com';
```

For local development, update the server URL to point to your local backend:
```javascript
export const server = 'http://localhost:8000';
```

## Browser Compatibility

- Modern browsers with ES6 module support
- Chrome 61+
- Firefox 60+
- Safari 11+
- Edge 16+

## Troubleshooting

### Common Issues

1. **Live Server Not Working**
   - Ensure Live Server extension is installed
   - Right-click on `index.html` to start
   - Check VS Code output for errors

2. **Module Import Errors**
   - Ensure all imports include `.js` extension
   - Check file paths are correct
   - Use relative paths starting with `./` or `../`

3. **CORS Errors**
   - Backend must allow CORS from frontend domain
   - Check backend CORS configuration

4. **Routing Not Working**
   - Ensure hash-based routing is used
   - Check `app.js` route configuration
   - Verify hash changes in browser URL

5. **API Connection Issues**
   - Check server URL in `src/api/server/server.js`
   - Verify backend is running
   - Check browser Network tab for failed requests
   - Ensure CORS is configured on backend

6. **JWT Token Issues**
   - Check token is stored in localStorage
   - Verify token is not expired
   - Check Authorization header format: `Bearer {token}`

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

### File Naming

- Use PascalCase for components: `HomePage.js`
- Use camelCase for utilities: `jwt.js`
- Use kebab-case for assets: `banner.png`

## Security Considerations

- Never store sensitive data in localStorage
- Validate all user inputs
- Sanitize HTML to prevent XSS
- Use HTTPS in production
- Implement proper authentication
- Handle errors gracefully

## License

[Your License Here]

## Support

For issues and questions, please contact the development team.
