# Student Organization Participation Tracker - Backend API

**Version: 2.1**

## Overview

This is the backend API for the Student Organization Participation Tracker. It is built using plain PHP with Object-Oriented Programming (OOP) principles, following a Model-View-Controller (MVC) architecture. The API provides RESTful endpoints for managing student organization data, including administrators, advisers, students, organizations, events, roles, and participation tracking.

## Tech Stack

- **Language**: Plain PHP (PHP 8.0+)
- **Database**: MySQL
- **Database Management**: DBeaver
- **Database Hosting**: Aiven MySQL
- **Application Hosting**: Render
- **Architecture**: Object-Oriented Programming (OOP)
- **API Style**: RESTful API
- **Authentication**: JWT (JSON Web Tokens)

## Project Architecture

The backend follows a clean OOP architecture with separation of concerns:

### Directory Structure

```
backend/
├── config/
│   ├── db.php              # Database configuration and connection
│   ├── env.php             # Environment configuration loader
│   └── jwt.php             # JWT token generation and validation
├── controller/
│   ├── AdminController.php # Admin-related API endpoints
│   ├── AdviserController.php # Adviser-related API endpoints
│   ├── StudentsController.php # Student-related API endpoints
│   ├── OrganizationsController.php # Organization-related API endpoints
│   ├── EventsController.php # Event-related API endpoints
│   ├── EventRegistrationsController.php # Event registration endpoints
│   ├── OrganizationMembershipsController.php # Org membership endpoints
│   ├── RoleController.php # Role management endpoints
│   └── OrgMembershipsController.php # Legacy org membership endpoints
├── model/
│   ├── AdminModel.php      # Admin data model and business logic
│   ├── AdviserModel.php    # Adviser data model and business logic
│   ├── StudentsModel.php   # Student data model and business logic
│   ├── OrganizationsModel.php # Organization data model
│   ├── EventsModel.php     # Event data model
│   ├── EventRegistrationsModel.php # Event registration model
│   ├── OrganizationMembershipsModel.php # Org membership model
│   ├── RoleModel.php       # Role data model
│   └── OrgMembershipsModel.php # Legacy org membership model
├── migrations/
│   ├── Migration.php       # Base migration class
│   ├── Migrator.php        # Migration runner
│   ├── 2026_01_01_000001_create_admins_table.php
│   ├── 2026_01_01_000002_create_advisers_table.php
│   ├── 2026_01_01_000003_create_roles_table.php
│   ├── 2026_01_01_000004_create_students_table.php
│   ├── 2026_01_01_000005_create_organizations_table.php
│   ├── 2026_01_01_000006_create_organization_memberships_table.php
│   ├── 2026_01_01_000007_create_events_table.php
│   ├── 2026_01_01_000008_create_event_registrations_table.php
│   ├── 2026_01_01_000011_add_role_id_to_organization_memberships_table.php
│   ├── 2026_01_01_000012_add_role_id_to_students_table.php
│   ├── 2026_01_01_000012_drop_position_from_organization_memberships_table.php
│   └── 2026_01_01_000013_alter_organizations_table_adviser_id.php
├── routes/
│   ├── AdminRoutes.php     # Admin routing configuration
│   ├── AdviserRoutes.php   # Adviser routing configuration
│   ├── StudentsRoutes.php  # Student routing configuration
│   ├── OrganizationsRoutes.php # Organization routing configuration
│   ├── EventsRoutes.php    # Event routing configuration
│   ├── EventRegistrationsRoutes.php # Event registration routing
│   ├── OrganizationMembershipsRoutes.php # Org membership routing
│   └── RoleRoutes.php      # Role routing configuration
├── view/
│   └── web.php             # Web view for API root
├── utils/                  # Utility functions (empty)
├── .htaccess               # Apache URL rewriting configuration
├── index.php               # API entry point and routing
├── migrate.php             # Migration execution script
├── AdminSeeder.php         # Database seeder for admins
├── Dockerfile              # Docker configuration for deployment
├── render.yaml             # Render deployment configuration
├── .dockerignore           # Docker ignore rules
├── .env.example            # Example environment variables
├── .env                    # Environment variables (not committed)
└── favicon.ico             # API favicon
```

### Architecture Components

#### 1. **Models** (`model/`)
- Handle data access and business logic
- Interact directly with the database
- Encapsulate data validation and manipulation
- Examples: `AdminModel`, `AdviserModel`, `StudentsModel`, `OrganizationsModel`, `EventsModel`, `EventRegistrationsModel`, `OrganizationMembershipsModel`, `RoleModel`

#### 2. **Controllers** (`controller/`)
- Handle HTTP requests and responses
- Coordinate between models and API responses
- Implement routing logic
- Return JSON responses
- Examples: `AdminController`, `AdviserController`, `StudentsController`, `OrganizationsController`, `EventsController`, `EventRegistrationsController`, `OrganizationMembershipsController`, `RoleController`

#### 3. **Routes** (`routes/`)
- Define API endpoint patterns and HTTP methods
- Map URLs to controller methods
- Handle request routing logic
- Examples: `AdminRoutes`, `AdviserRoutes`, `StudentsRoutes`, `OrganizationsRoutes`, `EventsRoutes`, `EventRegistrationsRoutes`, `OrganizationMembershipsRoutes`, `RoleRoutes`

#### 4. **Configuration** (`config/`)
- Database connection settings (`db.php`)
- Environment configuration loader (`env.php`)
- JWT token generation and validation (`jwt.php`)
- Connection pooling and management

#### 5. **Migrations** (`migrations/`)
- Database schema version control
- Automated database structure updates
- Base `Migration` class for creating new migrations
- `Migrator` for running migrations
- Individual migration files for each table change

## API Endpoints

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/login` | Admin login and JWT token generation |
| POST | `/api/admin/register` | Register new admin |
| GET | `/api/admin` | Get all admins |
| GET | `/api/admin/{id}` | Get admin by ID |
| PUT | `/api/admin/{id}` | Update admin |
| DELETE | `/api/admin/{id}` | Delete admin |

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

## Configuration

### Environment Variables

Create a `.env` file in the backend root directory based on `.env.example`:

```env
DB_HOST=localhost
DB_NAME=student_org_tracker
DB_USER=root
DB_PASS=
JWT_SECRET=your-secret-key-here
JWT_ALGORITHM=HS256
```

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

The project includes a custom script to run the PHP development server:

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

## Development Guidelines

### OOP Principles

- **Encapsulation**: Keep properties private, use getters/setters
- **Inheritance**: Extend base classes for shared functionality
- **Polymorphism**: Use interfaces and abstract classes where appropriate
- **Single Responsibility**: Each class should have one reason to change

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

## Security Considerations

- Use prepared statements to prevent SQL injection
- Implement JWT authentication for protected endpoints
- Validate all input data
- Use HTTPS in production
- Keep dependencies updated
- Never commit sensitive credentials (use .env files)
- Set strong JWT_SECRET in production
- Implement CORS properly for frontend-backend communication
- Sanitize user inputs to prevent XSS attacks

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
