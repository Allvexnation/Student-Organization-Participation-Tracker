# Student Organization Participation Tracker — Backend API

**Version:** 4.0.0  
**Status:** Production-ready REST API  
**Architecture:** Plain PHP · OOP · MVC  

---

## Credits

The backend of this system was **designed, implemented, and secured by Jhon Ladines**.

| Role | Person | Responsibility |
|------|--------|----------------|
| System architect | **Jhon Ladines** | Constructed the whole system end to end |
| Backend engineering | **Jhon Ladines** | API, controllers, models, routes, CLI, email, caching |
| Database integration | **Jhon Ladines** | Schema design, migrations, seeding, MySQL on Aiven |
| Security | **Jhon Ladines** | JWT sessions, OTP, OAuth, bans, audit logs, input validation, CORS |

Frontend credits (pages and animation) are documented in `frontend/README.md`.

---

## Overview

This is the backend API for the Student Organization Participation Tracker. It is built using plain PHP with Object-Oriented Programming (OOP) principles, following a Model-View-Controller (MVC) architecture. The API provides RESTful endpoints for managing student organization data, including administrators, advisers, students, organizations, events, roles, participation tracking, attendance, tasks, audit logs, bans, support contacts, web analytics, and Google OAuth.

Version **4.0.0** is a major platform release. It keeps every capability from v3.0.0 and adds authentication, security, observability, and public-web APIs used by the redesigned frontend.

---

## What's New in v4.0.0

This major update focuses on **security, accountability, and public-facing services**.

1. **Google OAuth** — Sign-in with Google for admin, adviser, and student accounts. Tokens are verified server-side; sessions record `auth_type` (`password` or `google`).
2. **Audit logging** — Separate audit trails for admins, advisers, and students. Each change stores actor, table, record, field diffs, IP, and device metadata.
3. **Ban and appeal system** — Session, account, and IP bans (permanent or temporary). Public appeal flow with admin review, replies, and email history.
4. **Support contacts and reports** — Public contact and report forms with status workflow, admin replies, and email history tables.
5. **Web analytics and public statistics** — Visit tracking, active sessions, route/date filters, and homepage counters (students, organizations, events, tasks, visits).
6. **Hardened sessions** — Inactive session archive, logout / logout-all, device fingerprinting, admin OTP recovery, and admin account status.
7. **Task lifecycle upgrades** — New statuses (`not_completed`, `not_finished`, `overdue`), voiding with reason, `marked_by` / `marked_at`, and `day_number` on daily schedules.
8. **Event model cleanup** — `organization_id` removed from `events`; organizations stay linked through `event_organizations`. Public event listing at `/api/web/events`.

---

## Tech Stack

- **Language**: Plain PHP (PHP 8.0+)
- **Database**: MySQL
- **Database Management**: DBeaver
- **Database Hosting**: Aiven MySQL
- **Application Hosting**: Render
- **Architecture**: Object-Oriented Programming (OOP)
- **API Style**: RESTful API
- **Authentication**: JWT (JSON Web Tokens), email OTP, Google OAuth 2.0
- **Email**: SMTP (Brevo / configurable)
- **Media** (optional): Cloudinary
- **Caching**: SQLite-backed cache service

---

## Project Architecture

The backend follows a clean OOP architecture with separation of concerns.

### Directory Structure

```
backend/
├── cache/
│   ├── data/               # Cache data storage (SQLite)
│   └── CacheService.php    # Caching service with SQLite backend
├── commands/
│   ├── cmd.php             # CLI command interface with interactive menu
│   ├── components/         # CLI components (header, loading, etc.)
│   ├── config/             # CLI configuration
│   └── controller/         # CLI controllers (migrate, serve, admin, web)
├── config/
│   ├── cors.php            # CORS configuration
│   ├── db.php              # Database configuration and connection
│   ├── env.php             # Environment configuration loader
│   ├── jwt.php             # JWT token generation and validation
│   ├── mailer.php          # Email configuration
│   └── oauth.php           # Google OAuth configuration
├── controller/
│   ├── AdminController.php
│   ├── AdviserController.php
│   ├── OAuthController.php
│   ├── SessionController.php
│   ├── EventsController.php
│   ├── EventOrganizationsController.php
│   ├── EventRegistrationsController.php
│   ├── MemberTasksController.php
│   ├── OrganizationsController.php
│   ├── OrganizationMembershipsController.php
│   ├── OrgMembershipsController.php
│   ├── RoleController.php
│   ├── StudentsController.php
│   ├── Adviser/
│   │   ├── AdviserEventsController.php
│   │   ├── AdviserOrganizationController.php
│   │   └── AttendanceController.php
│   ├── AuditLogs/
│   │   ├── AuditLogsController.php
│   │   ├── AdviserAuditLogsController.php
│   │   └── StudentAuditLogsController.php
│   ├── Contacts/
│   │   └── ContactsController.php
│   ├── Students/
│   │   ├── EventTaskController.php
│   │   ├── StudentController.php
│   │   └── AttendanceController.php
│   └── web/
│       ├── BannedController.php
│       ├── StatisticsController.php
│       ├── UpdatesController.php
│       └── WebAnalyticsController.php
├── migrations/             # Schema version control (001–060+)
├── model/
│   ├── AdminModel.php
│   ├── AdminOtpModel.php
│   ├── AdviserModel.php
│   ├── AdviserOtpModel.php
│   ├── SessionModel.php
│   ├── EventsModel.php
│   ├── MemberTasksModel.php
│   ├── Adviser/
│   ├── AuditLogs/
│   ├── Contacts/
│   ├── Students/
│   └── web/
│       ├── BannedModel.php
│       ├── UpdatesModel.php
│       └── WebAnalyticsModel.php
├── routes/
│   ├── AdminRoutes.php
│   ├── AdviserAuthRoutes.php
│   ├── AdviserRoutes.php
│   ├── OAuthRoutes.php
│   ├── SessionRoutes.php
│   ├── EventsRoutes.php
│   ├── Adviser/
│   ├── AuditLogs/
│   ├── Contacts/
│   ├── Students/
│   └── web/
│       ├── BannedRoutes.php
│       ├── StatisticsRoutes.php
│       ├── UpdatesRoutes.php
│       └── WebAnalyticsRoutes.php
├── seeders/
│   └── AdminSeeder.php
├── services/
│   └── EmailService.php
├── template/
│   ├── AdminEmail.php
│   ├── AdviserEmail.php
│   ├── ContactsEmail.php
│   ├── StudentEmail.php
│   └── Updates/Files/
├── utils/
├── validator/
│   ├── AdminCrudValidator.php
│   ├── AdviserCrudValidator.php
│   ├── AdviserValidator.php
│   ├── MembershipValidator.php
│   ├── OrganizationMembershipCrudValidator.php
│   ├── OrganizationValidator.php
│   └── StudentCrudValidator.php
├── view/
│   └── web.php
├── .htaccess
├── .dockerignore
├── .env                    # Not committed
├── .env.example
├── .gitignore
├── cli.bat
├── Dockerfile
├── favicon.ico
├── index.php               # API entry point and routing
├── migrate.php
└── render.yaml
```

### Architecture Components

#### 1. Models (`model/`)

- Handle data access and business logic
- Interact directly with the database
- Encapsulate data validation and manipulation
- Examples: `AdminModel`, `AdviserModel`, `StudentsModel`, `OrganizationsModel`, `EventsModel`, `EventRegistrationsModel`, `OrganizationMembershipsModel`, `RoleModel`, `AuditLogsModel`, `BannedModel`, `ContactsModel`, `WebAnalyticsModel`, `AdminOtpModel`, `SessionModel`

#### 2. Controllers (`controller/`)

- Handle HTTP requests and responses
- Coordinate between models and API responses
- Implement routing logic
- Return JSON responses
- Examples: `AdminController`, `AdviserController`, `OAuthController`, `StudentsController`, `OrganizationsController`, `EventsController`, `EventRegistrationsController`, `OrganizationMembershipsController`, `RoleController`, `BannedController`, `ContactsController`, `WebAnalyticsController`

#### 3. Routes (`routes/`)

- Define API endpoint patterns and HTTP methods
- Map URLs to controller methods
- Handle request routing logic
- Examples: `AdminRoutes`, `OAuthRoutes`, `AuditLogsRoutes`, `BannedRoutes`, `ContactsRoutes`, `WebAnalyticsRoutes`, `StatisticsRoutes`

#### 4. Configuration (`config/`)

- Database connection settings (`db.php`)
- Environment configuration loader (`env.php`)
- JWT token generation and validation (`jwt.php`)
- Google OAuth settings (`oauth.php`)
- CORS and mailer configuration
- Connection pooling and management

#### 5. Migrations (`migrations/`)

- Database schema version control
- Automated database structure updates
- Base `Migration` class for creating new migrations
- `Migrator` for running migrations
- Individual migration files for each table change

---

## API Endpoints

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/login` | Admin login and JWT token generation |
| POST | `/api/admin/lookup` | Look up admin account before login |
| POST | `/api/admin/logout` | End current admin session |
| POST | `/api/admin/forgot-password` | Request admin password reset OTP |
| POST | `/api/admin/verify-otp` | Verify admin OTP |
| POST | `/api/admin/reset-password` | Reset admin password |
| GET | `/api/admin/profile` | Get authenticated admin profile |
| PUT | `/api/admin/profile` | Update authenticated admin profile |
| GET | `/api/admin/dashboard/counts` | Dashboard aggregate counts |
| POST | `/api/admin/register` | Register new admin (legacy) |
| GET | `/api/admin` | Get all admins (legacy) |
| GET | `/api/admin/{id}` | Get admin by ID (legacy) |
| PUT | `/api/admin/{id}` | Update admin (legacy) |
| DELETE | `/api/admin/{id}` | Delete admin (legacy) |
| GET | `/api/admin/admins` | List admins (CRUD) |
| GET | `/api/admin/admins/{id}` | Get admin by ID |
| POST | `/api/admin/admins` | Create admin |
| PUT | `/api/admin/admins/{id}` | Update admin |
| DELETE | `/api/admin/admins/{id}` | Delete admin |

### Google OAuth Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/oauth/google/config` | Public Google client configuration |
| POST | `/api/oauth/google/login` | Admin Google sign-in (ID token) |
| POST | `/api/oauth/google/adviser/login` | Adviser Google sign-in |
| POST | `/api/oauth/google/student/login` | Student Google sign-in |

### Adviser Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/advisers` | Get all advisers |
| GET | `/api/admin/advisers/{id}` | Get adviser by ID |
| POST | `/api/admin/advisers` | Create new adviser |
| PUT | `/api/admin/advisers/{id}` | Update adviser |
| DELETE | `/api/admin/advisers/{id}` | Delete adviser |

### Student Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/students` | Get all students |
| GET | `/api/admin/students/{id}` | Get student by ID |
| POST | `/api/admin/students` | Create new student |
| PUT | `/api/admin/students/{id}` | Update student |
| DELETE | `/api/admin/students/{id}` | Delete student |

### Organization Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/organizations` | Get all organizations |
| GET | `/api/admin/organizations/{id}` | Get organization by ID |
| POST | `/api/admin/organizations` | Create new organization |
| PUT | `/api/admin/organizations/{id}` | Update organization |
| DELETE | `/api/admin/organizations/{id}` | Delete organization |

### Event Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/web/events` | Public event listing |
| GET | `/api/admin/events` | Get all events |
| GET | `/api/admin/events/{id}` | Get event by ID |
| POST | `/api/admin/events` | Create new event |
| PUT | `/api/admin/events/{id}` | Update event |
| DELETE | `/api/admin/events/{id}` | Delete event |

### Event Registration Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/event-registrations` | Get all event registrations |
| GET | `/api/admin/event-registrations/{id}` | Get event registration by ID |
| POST | `/api/admin/event-registrations` | Create new event registration |
| PUT | `/api/admin/event-registrations/{id}` | Update event registration |
| DELETE | `/api/admin/event-registrations/{id}` | Delete event registration |

### Organization Membership Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/organization-memberships` | Get all organization memberships |
| GET | `/api/admin/organization-memberships/{id}` | Get organization membership by ID |
| POST | `/api/admin/organization-memberships` | Create new organization membership |
| PUT | `/api/admin/organization-memberships/{id}` | Update organization membership |
| DELETE | `/api/admin/organization-memberships/{id}` | Delete organization membership |

### Role Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/roles` | Get all roles |
| GET | `/api/admin/roles/{id}` | Get role by ID |
| POST | `/api/admin/roles` | Create new role |
| PUT | `/api/admin/roles/{id}` | Update role |
| DELETE | `/api/admin/roles/{id}` | Delete role |

### Event Organizations Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/event-organizations` | Get all event-organization relationships |
| GET | `/api/admin/event-organizations/{id}` | Get event-organization by ID |
| POST | `/api/admin/event-organizations` | Create new event-organization relationship |
| PUT | `/api/admin/event-organizations/{id}` | Update event-organization relationship |
| DELETE | `/api/admin/event-organizations/{id}` | Delete event-organization relationship |

### Member Tasks Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/member-tasks` | Get all member tasks |
| GET | `/api/admin/member-tasks/{id}` | Get member task by ID |
| POST | `/api/admin/member-tasks` | Create new member task |
| PUT | `/api/admin/member-tasks/{id}` | Update member task |
| DELETE | `/api/admin/member-tasks/{id}` | Delete member task |

### Session Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/session/validate` | Validate current session token |
| POST | `/api/session/restore` | Restore a session |
| POST | `/api/session/logout` | Logout current session |
| POST | `/api/session/logout-all` | Logout all sessions for the user |
| POST | `/api/sessions` | Create new session (legacy) |
| GET | `/api/sessions/{id}` | Get session by ID (legacy) |
| DELETE | `/api/sessions/{id}` | Delete session (legacy) |

### Updates Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/web/updates` | Get all updates |
| GET | `/api/web/updates/active` | Get active updates |
| GET | `/api/web/updates/{id}` | Get update by ID |
| POST | `/api/web/updates` | Create new update |
| PUT | `/api/web/updates/{id}` | Update update |
| DELETE | `/api/web/updates/{id}` | Delete update |
| GET | `/api/web/updates/download/{filename}` | Download update asset file |
| GET | `/api/web/updates/{id}/download-asset` | Download asset file by update ID |

### Attendance Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/adviser/attendance` | Get all attendance records (adviser) |
| GET | `/api/adviser/attendance/{id}` | Get attendance by ID (adviser) |
| POST | `/api/adviser/attendance` | Create attendance record (adviser) |
| PUT | `/api/adviser/attendance/{id}` | Update attendance record (adviser) |
| DELETE | `/api/adviser/attendance/{id}` | Delete attendance record (adviser) |
| GET | `/api/student/attendance` | Get student attendance records |
| GET | `/api/student/attendance/{id}` | Get attendance by ID (student) |
| POST | `/api/student/attendance` | Create attendance record (student) |
| PUT | `/api/student/attendance/{id}` | Update attendance record (student) |

### Adviser Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/adviser/login` | Adviser login with OTP |
| POST | `/api/adviser/lookup` | Look up adviser account |
| POST | `/api/adviser/logout` | Adviser logout |
| POST | `/api/adviser/send-otp` | Send OTP to adviser email |
| POST | `/api/adviser/verify-otp` | Verify OTP for adviser |
| POST | `/api/adviser/forgot-password` | Request password reset |
| POST | `/api/adviser/reset-password` | Reset adviser password |
| GET | `/api/adviser/verify` | Verify adviser session |
| GET | `/api/adviser/profile` | Get adviser profile |
| PUT | `/api/adviser/profile` | Update adviser profile |

### Student Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/student/login` | Student login with OTP |
| POST | `/api/student/lookup` | Look up student account |
| POST | `/api/student/logout` | Student logout |
| POST | `/api/student/send-otp` | Send OTP to student email |
| POST | `/api/student/verify-otp` | Verify OTP for student |
| POST | `/api/student/forgot-password` | Request password reset |
| POST | `/api/student/reset-password` | Reset student password |
| GET | `/api/student/verify` | Verify student session |
| GET | `/api/student/profile` | Get student profile |
| PUT | `/api/student/profile` | Update student profile |

### Audit Log Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/audit-logs/log` | Record an admin-side audit event |
| GET | `/api/audit-logs` | List admin audit logs |
| GET | `/api/audit-logs/{id}` | Get audit log by ID |
| GET | `/api/audit-logs/user/{id}/{type}` | Logs for a user and type |
| GET | `/api/audit-logs/record/{table}/{id}` | Logs for a table record |
| DELETE | `/api/audit-logs/{id}` | Delete one audit log |
| DELETE | `/api/audit-logs/cleanup` | Delete old audit logs |
| POST | `/api/adviser-audit-logs/log` | Record an adviser audit event |
| GET | `/api/adviser-audit-logs` | List adviser audit logs |
| GET | `/api/adviser-audit-logs/{id}` | Get adviser audit log by ID |
| GET | `/api/adviser-audit-logs/user/{id}/{type}` | Adviser logs by user |
| GET | `/api/adviser-audit-logs/record/{table}/{id}` | Adviser logs by record |
| DELETE | `/api/adviser-audit-logs/{id}` | Delete adviser audit log |
| DELETE | `/api/adviser-audit-logs/cleanup` | Cleanup adviser audit logs |
| POST | `/api/student-audit-logs/log` | Record a student audit event |
| GET | `/api/student-audit-logs` | List student audit logs |
| GET | `/api/student-audit-logs/{id}` | Get student audit log by ID |
| GET | `/api/student-audit-logs/user/{id}/{type}` | Student logs by user |
| GET | `/api/student-audit-logs/record/{table}/{id}` | Student logs by record |
| DELETE | `/api/student-audit-logs/{id}` | Delete student audit log |
| DELETE | `/api/student-audit-logs/cleanup` | Cleanup student audit logs |

### Ban Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/web/ban` | Create a ban (session, overall, or IP) |
| POST | `/api/web/ban/check` | Check if the current context is banned |
| POST | `/api/web/ban/check-overall` | Check account-level ban |
| POST | `/api/web/ban/info` | Get ban details for the current context |
| GET | `/api/web/ban/sessions` | List sessions available for banning |
| GET | `/api/web/ban/all` | List all bans |
| POST | `/api/web/ban/cleanup` | Deactivate expired bans |
| POST | `/api/web/ban/deactivate/{id}` | Deactivate a ban |
| POST | `/api/web/ban/activate/{id}` | Reactivate a ban |
| DELETE | `/api/web/ban/delete/{id}` | Permanently delete a ban |

### Contacts, Appeals, and Reports

Base path: `/api/contacts`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/contacts/appeal` | Submit a ban appeal |
| GET | `/api/contacts` | List all appeals |
| GET | `/api/contacts/{id}` | Get appeal by ID |
| PUT | `/api/contacts/status` | Update appeal status |
| POST | `/api/contacts/reply` | Reply to an appeal by email |
| POST | `/api/contacts/contact` | Submit a support contact form |
| GET | `/api/contacts/support` | List support contacts |
| GET | `/api/contacts/support/{id}` | Get support contact by ID |
| PUT | `/api/contacts/support/status` | Update support contact status |
| POST | `/api/contacts/support/reply` | Reply to a support contact |
| POST | `/api/contacts/report` | Submit a support report |
| GET | `/api/contacts/reports` | List reports |
| GET | `/api/contacts/reports/{id}` | Get report by ID |
| PUT | `/api/contacts/reports/status` | Update report status |
| POST | `/api/contacts/reports/reply` | Reply to a report |

### Web Analytics and Statistics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/web/statistics` | Public homepage statistics |
| GET | `/api/web/analytics` | List analytics records |
| GET | `/api/web/analytics/stats` | Aggregated analytics stats |
| GET | `/api/web/analytics/active-sessions` | Currently active tracked sessions |
| GET | `/api/web/analytics/route/{route}` | Analytics filtered by route |
| GET | `/api/web/analytics/date/{start}/{end}` | Analytics filtered by date range |
| GET | `/api/web/analytics/{id}` | Get one analytics record |
| POST | `/api/web/analytics/track` | Track a page visit |
| POST | `/api/web/analytics/update-active` | Heartbeat / active flag |
| POST | `/api/web/analytics/update-url` | Update current URL for a session |
| DELETE | `/api/web/analytics/{id}` | Delete an analytics record |

---

## Database Setup

### Local Development with DBeaver

1. **Install DBeaver**
   - Download from [https://dbeaver.io](https://dbeaver.io)
   - Install and launch DBeaver

2. **Configure Local MySQL Connection**
   - Create a new database connection in DBeaver
   - Select MySQL as the database type
   - Configure connection details:
     ```
     Host: localhost
     Port: 3306
     Database: student_org_tracker
     Username: root
     Password: [your_password]
     ```

3. **Create Database**
   ```sql
   CREATE DATABASE student_org_tracker;
   USE student_org_tracker;
   ```

### Production with Aiven MySQL

1. **Create Aiven Account**
   - Sign up at [https://aiven.io](https://aiven.io)
   - Create a new project

2. **Create MySQL Service**
   - Select MySQL from available services
   - Choose appropriate plan (free tier available for development)
   - Configure service name and region
   - Deploy the service

3. **Get Connection Details**
   - Navigate to your MySQL service in Aiven console
   - Copy connection details:
     - Host
     - Port
     - Database name
     - Username
     - Password
     - SSL Certificate (if required)

4. **Configure DBeaver for Aiven**
   - Create new connection in DBeaver
   - Use Aiven connection details
   - Enable SSL if required by Aiven
   - Test connection

### Database Migrations

Run migrations to create database tables:

```bash
# From backend directory
php migrate.php
```

### Database Seeding

Seed initial admin data:

```bash
php AdminSeeder.php
```

### v4 schema highlights

New and updated tables introduced in this major version:

| Area | Migrations / tables |
|------|---------------------|
| Audit | `audit_logs`, `adviser_audit_logs`, `student_audit_logs` |
| Auth | `admin_otps`, admin `status`, session `auth_type` |
| Sessions | `inactive_sessions` |
| Enforcement | `bans`, `ban_appeals`, `appeal_email_history` |
| Support | `support_contacts`, `support_reports`, contact/report email history |
| Analytics | `web_analytics` (`active`, `url`) |
| Tasks | status/voiding fields, `day_number` on `task_daily_schedules` |
| Events | `organization_id` removed from `events` (use `event_organizations`) |

### CLI Commands

The backend includes a powerful CLI tool for common development tasks.

#### Interactive Mode

Run the interactive menu:

```bash
php commands/cmd.php
```

The interactive menu provides options for:

- Starting development server
- Creating controllers, models, migrations, routes, and bundles
- Running migrations and seeders
- Migration status and rollback
- Database summary
- Environment switching
- Cache management
- XAMPP control (start/stop)
- Web management
- Viewing README documentation

#### Command Line Mode

```bash
# Run migrations
php commands/cmd.php migrate

# Rollback migrations (optional steps)
php commands/cmd.php rollback [steps]

# Reset all migrations
php commands/cmd.php reset

# Check migration status
php commands/cmd.php status

# Run seeders
php commands/cmd.php seed

# Start development server
php commands/cmd.php serve [host] [port]

# Switch environment
php commands/cmd.php switch

# Cache management
php commands/cmd.php cache

# View credits
php commands/cmd.php credits

# View help
php commands/cmd.php help
```

---

## Configuration

### Environment Variables

Create a `.env` file in the backend root directory based on `.env.example`:

```env
DB_CONNECTION=Development
CORS_CONNECTION=Development
JWT_CONNECTION=Development
MAILER_CONNECTION=Development
CLOUDINARY_CONNECTION=Development

DEV_DB_HOST=127.0.0.1
DEV_DB_USERNAME=root
DEV_DB_PASSWORD=
DEV_DB_DATABASE=student_organization_tracker
DEV_DB_PORT=3306

PROD_DB_HOST=
PROD_DB_USERNAME=
PROD_DB_PASSWORD=
PROD_DB_DATABASE=
PROD_DB_PORT=

DEV_ALLOWED_ORIGINS=http://localhost:3000
PROD_ALLOWED_ORIGINS=

DEV_JWT_SECRET_KEY=
DEV_JWT_ALGORITHM=HS256
DEV_JWT_TOKEN_EXPIRY=3153600000

PROD_JWT_SECRET_KEY=
PROD_JWT_ALGORITHM=HS256
PROD_JWT_TOKEN_EXPIRY=3153600000

DEV_SMTP_HOST=smtp-relay.brevo.com
DEV_SMTP_PORT=465
DEV_SMTP_USERNAME=sample-email@gmail.com
DEV_SMTP_PASSWORD=
DEV_SMTP_FROM_EMAIL=sample-email@gmail.com
DEV_SMTP_FROM_NAME=Student Organization Tracker
DEV_SMTP_USE_TLS=true

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/admin/google/callback
GOOGLE_TOKENINFO_URL=https://www.googleapis.com/oauth2/v3/tokeninfo
GOOGLE_GSI_SCRIPT_URL=https://accounts.google.com/gsi/client
```

Legacy single-environment keys still documented for older setups:

```env
DB_HOST=localhost
DB_NAME=student_org_tracker
DB_USER=root
DB_PASS=
JWT_SECRET=your-secret-key-here
JWT_ALGORITHM=HS256
```

Never commit real secrets. Keep Google client secrets and JWT keys only in `.env` or the host dashboard.

### Database Configuration (`config/db.php`)

The database configuration uses environment variables loaded via `config/env.php`:

```php
<?php
require_once __DIR__ . '/env.php';

class Database {
    private $host;
    private $db_name;
    private $username;
    private $password;
    private $conn;

    public function __construct() {
        $this->host = getenv('DB_HOST') ?: 'localhost';
        $this->db_name = getenv('DB_NAME') ?: 'student_org_tracker';
        $this->username = getenv('DB_USER') ?: 'root';
        $this->password = getenv('DB_PASS') ?: '';
    }

    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name,
                $this->username,
                $this->password
            );
            $this->conn->exec("set names utf8");
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch(PDOException $exception) {
            echo "Connection error: " . $exception->getMessage();
        }
        return $this->conn;
    }
}
?>
```

For Aiven MySQL, update `.env` with:

- DB_HOST: Aiven MySQL endpoint
- DB_USER: Aiven service username
- DB_PASS: Aiven service password
- SSL configuration (if required)

### JWT Configuration (`config/jwt.php`)

JWT configuration for authentication:

```php
<?php
require_once __DIR__ . '/env.php';

class JWT {
    private $secret;
    private $algorithm;

    public function __construct() {
        $this->secret = getenv('JWT_SECRET') ?: 'default-secret-key';
        $this->algorithm = getenv('JWT_ALGORITHM') ?: 'HS256';
    }

    public function generate($payload) {
        // JWT generation logic
        $header = json_encode(['typ' => 'JWT', 'alg' => $this->algorithm]);
        $payload = json_encode($payload);
        // ... encoding logic
    }

    public function verify($token) {
        // JWT verification logic
        // ... verification logic
    }
}
?>
```

### Google OAuth (`config/oauth.php`)

`OAuthConfig` reads `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, redirect URI, tokeninfo URL, and the GSI script URL. Google sign-in is enabled only when both client ID and secret are present. The controller verifies ID tokens before issuing JWT sessions.

---

## Deployment

### Local Development

1. **Prerequisites**
   - PHP 8.0 or higher installed (XAMPP recommended for Windows)
   - MySQL server running locally
   - Node.js (required for running the project)
   - Apache or Nginx web server (optional, PHP built-in server works for development)

#### Installing PHP (XAMPP)

If PHP is not installed on your system, XAMPP is recommended for Windows:

1. Download XAMPP from: https://www.apachefriends.org/download.html
2. Run the installer and follow the installation wizard
3. Start Apache and MySQL from XAMPP Control Panel
4. PHP will be available via XAMPP installation

#### Installing Node.js

If Node.js is not installed on your system:

1. Download Node.js v24.22.1 from: https://nodejs.org/dist/v24.22.1/node-v24.22.1-x64.msi
2. Run the installer and follow the installation wizard
3. After installation, verify Node.js is installed by running in terminal or PowerShell:
   ```bash
   node -v
   ```

2. **Setup**
   ```bash
   # Clone the repository
   git clone [repository-url]
   cd backend

   # Create environment file
   cp .env.example .env
   # Edit .env with your credentials

   # Run migrations
   php migrate.php

   # Seed database
   php AdminSeeder.php
   ```

3. **Run Local Server**

#### Quick Start (Recommended)

The project uses "Run Devs by Jhon Ladines" to run the PHP development server:

1. **Navigate to the backend directory**
   ```bash
   cd path/to/Student-Organization-Participation-Tracker/backend
   ```

2. **Run the PHP development server**
   ```bash
   npx php-run-devs
   ```

   This command will:
   - Start the PHP built-in server
   - Run on port 8000 by default
   - Enable API access at `http://localhost:8000`

#### Alternative Method (Manual PHP Server)

```bash
php -S localhost:8000
```

4. **Test API**
   - Open browser to `http://localhost:8000` to see API root
   - Test endpoints at `http://localhost:8000/api/admin`

### Deployment to Render

1. **Prepare for Render**
   - Ensure `render.yaml` is configured
   - Update environment variables in Render dashboard
   - Verify `Dockerfile` is present

2. **Environment Variables (Render)**
   Set these in your Render dashboard:
   ```
   DB_HOST=[aiven-mysql-host]
   DB_NAME=student_org_tracker
   DB_USER=[aiven-username]
   DB_PASS=[aiven-password]
   JWT_SECRET=[your-jwt-secret-key]
   JWT_ALGORITHM=HS256
   GOOGLE_CLIENT_ID=[your-google-client-id]
   GOOGLE_CLIENT_SECRET=[your-google-client-secret]
   ```

3. **Deploy via Render**
   - Connect your GitHub repository to Render
   - Select "Web Service" as service type
   - Configure build settings:
     - Runtime: Docker
     - Dockerfile path: `./Dockerfile`
   - Deploy

4. **Post-Deployment**
   - Run migrations on production database
   - Seed initial data if needed
   - Test API endpoints

### Docker Deployment

The project includes a `Dockerfile` for containerization:

```dockerfile
FROM php:8.0-apache

# Install PDO MySQL extension
RUN docker-php-ext-install pdo pdo_mysql

# Enable Apache mod_rewrite
RUN a2enmod rewrite

# Copy application files
COPY . /var/www/html/

# Set permissions
RUN chown -R www-data:www-data /var/www/html/

# Expose port 80
EXPOSE 80
```

Build and run with Docker:

```bash
docker build -t student-org-api .
docker run -p 8080:80 -e DB_HOST=[host] -e DB_NAME=[name] -e DB_USER=[user] -e DB_PASSWORD=[pass] student-org-api
```

---

## API Usage Examples

### Using cURL

```bash
# Admin Login
curl -X POST https://crtsopt.onrender.com/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'

# Get all admins (requires JWT token)
curl -X GET https://crtsopt.onrender.com/api/admin \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get all students
curl -X GET https://crtsopt.onrender.com/api/admin/students \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Create new student
curl -X POST https://crtsopt.onrender.com/api/admin/students \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name":"John Doe","email":"john@example.com","student_id":"STU001"}'

# Get all organizations
curl -X GET https://crtsopt.onrender.com/api/admin/organizations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Create new event
curl -X POST https://crtsopt.onrender.com/api/admin/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"title":"Annual Meeting","date":"2026-01-15","location":"Main Hall"}'

# Public statistics (homepage)
curl -X GET https://crtsopt.onrender.com/api/web/statistics

# Google OAuth config
curl -X GET https://crtsopt.onrender.com/api/oauth/google/config

# Ban check
curl -X POST https://crtsopt.onrender.com/api/web/ban/check \
  -H "Content-Type: application/json" \
  -d '{"ip_address":"127.0.0.1"}'
```

### Response Format

All API responses return JSON:

```json
{
  "status": "success",
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "created_at": "2026-01-01 12:00:00"
  }
}
```

Error responses:

```json
{
  "status": "error",
  "message": "Admin not found"
}
```

---

## Development Guidelines

### OOP Principles

- **Encapsulation**: Keep properties private, use getters/setters
- **Inheritance**: Extend base classes for shared functionality
- **Polymorphism**: Use interfaces and abstract classes where appropriate
- **Single Responsibility**: Each class should have one reason to change

### New Features in v4.0.0

- **Google OAuth 2.0**
  - Admin, adviser, and student Google login
  - Server-side ID token verification
  - `auth_type` stored on sessions and inactive sessions
- **Admin account lifecycle**
  - Admin CRUD with `AdminCrudValidator`
  - Admin status (`active` / inactive)
  - Admin OTP table and forgot-password email (`AdminEmail.php`)
- **Audit logging**
  - Three isolated log stores (admin, adviser, student)
  - Field-level old/new values
  - Device, browser, OS, IP, and screen metadata
  - Cleanup endpoints for old records
- **Ban and enforcement**
  - Ban types: session, overall account, IP
  - Permanent or temporary duration with expiry cleanup
  - Ban appeals with status workflow and email history
- **Support desk**
  - Contact and report submissions
  - Admin replies via `ContactsEmail.php`
  - Separate email history tables
- **Observability**
  - Web analytics tracking, active sessions, route and date filters
  - Public statistics for the marketing homepage
  - Public events listing
- **Session security**
  - Validate / restore / logout / logout-all
  - Inactive session archive with device fingerprint and geo fields
- **Tasks and events**
  - Voiding, overdue, and not-finished statuses
  - Daily schedule `day_number` and backfill migration
  - Events no longer store `organization_id` directly

### New Features in v3.0.0

- **CLI Command System**: Powerful command-line interface for development tasks
  - Interactive menu with 20+ options for common operations
  - Commands for migrations, seeding, server management
  - Bundle creation (controller + model + route)
  - Database summary and status checking
  - Environment switching between local and production
  - Cache management with flush and stats
  - XAMPP control (start/stop Apache and MySQL)
  - Web management interface
  - Built-in README viewer
- **Cache Service**: High-performance caching system
  - SQLite-based persistent cache storage
  - In-memory cache layer for faster access
  - TTL (Time To Live) support with configurable expiration
  - Cache operations: get, set, remember, forget, flush
  - Prefix-based cache invalidation
  - Cache statistics and monitoring
- **Updates Management System**: Comprehensive version update tracking
  - Updates table with version, name, branch, and readme content
  - GitHub branch link integration
  - Asset file management and download
  - Active/inactive update status
  - Closable types (closable, not_closable, show_once)
  - Web API for update management
- **Attendance Tracking System**: Complete attendance management
  - Daily attendance tracking with AM/PM sessions
  - Time in/out recording for multiple sessions
  - Break time tracking (break out/in)
  - Absence management with excused/unexcused status
  - Excuse reason and session tracking
  - Marked by tracking (student/adviser)
  - Duration calculation in minutes
  - Unique constraint per student-event-date
  - Foreign key relationships with students, advisers, events, organizations
- **Data Validation Layer**: Comprehensive validation classes
  - AdviserCrudValidator for adviser CRUD operations
  - AdviserValidator for adviser-specific validation
  - MembershipValidator for membership validation
  - OrganizationMembershipCrudValidator for org membership CRUD
  - OrganizationValidator for organization validation
  - StudentCrudValidator for student CRUD validation
- **Enhanced Session Management**: Improved session tracking
  - Device information tracking (user agent, platform)
  - IP address logging
  - No-expire option for persistent sessions
  - Enhanced session metadata
- **Web Controllers and Routes**: Dedicated web endpoints
  - UpdatesController for update management
  - UpdatesRoutes for web routing
  - Asset download functionality
  - Template system for update files
- **New Database Migrations**: 8 new migrations for v3.0.0
  - Updates table creation
  - Attendance table creation
  - Session device info enhancement
  - Updates table enhancements (branch, assets, github links)
  - Session no-expire update
- **Template System**: Organized template structure
  - Updates template directory with file storage
  - Support for README content and asset files
  - Template file management for downloads
- **Code Organization Improvements**
  - Dedicated seeders directory
  - Validator directory for validation logic
  - Web sub-directories for controllers, models, and routes
  - Cache service with data directory
  - Commands directory with components and controllers

### Bug Fixes in v2.1

- Fixed responsiveness issues across all management pages for better mobile and tablet support
- Fixed multiple fetch request bugs that caused duplicate API calls
- Fixed slow fetch performance by optimizing API response handling
- Improved error handling for failed API requests

### Code Style

- Follow PSR-12 coding standards
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

### Adding New Features

1. Create/update migration in `migrations/`
2. Run migrations: `php migrate.php`
3. Create/update model in `model/`
4. Create/update controller in `controller/`
5. Create/update routes in `routes/`
6. Add route handler in `index.php`
7. Test endpoints thoroughly

---

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check credentials in `config/db.php`
   - Verify MySQL server is running
   - Ensure database exists

2. **Migration Errors**
   - Check migration file syntax
   - Verify database permissions
   - Run migrations in order

3. **Render Deployment Issues**
   - Check environment variables
   - Review build logs
   - Verify Dockerfile configuration

4. **Aiven Connection Issues**
   - Verify SSL configuration
   - Check firewall settings
   - Ensure Aiven service is running

5. **Google OAuth Failures**
   - Confirm `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
   - Verify the frontend origin is listed in Google Cloud Console
   - Confirm ID tokens are posted to `/api/oauth/google/.../login`

6. **Ban Checks Always Redirect**
   - Confirm the client IP and session ID sent to `/api/web/ban/check`
   - Deactivate expired bans with `/api/web/ban/cleanup`

---

## Security Considerations

- Use prepared statements to prevent SQL injection
- Implement JWT authentication for protected endpoints
- Verify Google ID tokens on the server, never trust the client alone
- Record `auth_type` so password and OAuth sessions can be distinguished
- Validate all input data (`AdminCrudValidator` and existing validators)
- Use HTTPS in production
- Keep dependencies updated
- Never commit sensitive credentials (use `.env` files)
- Set strong `JWT_SECRET` / `DEV_JWT_SECRET_KEY` in production
- Implement CORS properly for frontend-backend communication
- Sanitize user inputs to prevent XSS attacks
- Enforce bans at session, account, and IP layers
- Keep audit logs for accountability; restrict cleanup to authorized admins
- Archive inactive sessions instead of leaving stale tokens active

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
