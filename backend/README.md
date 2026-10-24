# Student Organization Participation Tracker - Backend API

## Overview

This is the backend API for the Student Organization Participation Tracker. It is built using plain PHP with Object-Oriented Programming (OOP) principles, following a Model-View-Controller (MVC) architecture. The API provides RESTful endpoints for managing student organization data, including administrators, advisers, and participation tracking.

## Tech Stack

- **Language**: Plain PHP (PHP 8.0+)
- **Database**: MySQL
- **Database Management**: DBeaver
- **Database Hosting**: Aiven MySQL
- **Application Hosting**: Render
- **Architecture**: Object-Oriented Programming (OOP)
- **API Style**: RESTful API

## Project Architecture

The backend follows a clean OOP architecture with separation of concerns:

### Directory Structure

```
backend/
├── config/
│   └── db.php              # Database configuration and connection
├── controller/
│   ├── AdminController.php # Admin-related API endpoints
│   └── AdviserController.php # Adviser-related API endpoints
├── model/
│   ├── AdminModel.php      # Admin data model and business logic
│   └── AdviserModel.php    # Adviser data model and business logic
├── migrations/
│   ├── Migration.php       # Base migration class
│   ├── Migrator.php        # Migration runner
│   └── 2026_01_01_000001_create_admins_table.php # Database migrations
├── .htaccess               # Apache URL rewriting configuration
├── index.php               # API entry point and routing
├── migrate.php             # Migration execution script
├── AdminSeeder.php         # Database seeder for admins
├── Dockerfile              # Docker configuration for deployment
├── render.yaml             # Render deployment configuration
└── .dockerignore           # Docker ignore rules
```

### Architecture Components

#### 1. **Models** (`model/`)
- Handle data access and business logic
- Interact directly with the database
- Encapsulate data validation and manipulation
- Examples: `AdminModel`, `AdviserModel`

#### 2. **Controllers** (`controller/`)
- Handle HTTP requests and responses
- Coordinate between models and API responses
- Implement routing logic
- Return JSON responses
- Examples: `AdminController`, `AdviserController`

#### 3. **Configuration** (`config/`)
- Database connection settings
- Environment-specific configurations
- Connection pooling and management

#### 4. **Migrations** (`migrations/`)
- Database schema version control
- Automated database structure updates
- Base `Migration` class for creating new migrations
- `Migrator` for running migrations

## API Endpoints

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin` | Get all admins |
| GET | `/api/admin/{id}` | Get admin by ID |
| POST | `/api/admin` | Create new admin |
| PUT | `/api/admin/{id}` | Update admin |
| DELETE | `/api/admin/{id}` | Delete admin |

### Adviser Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/adviser` | Get all advisers |
| GET | `/api/adviser/{id}` | Get adviser by ID |
| POST | `/api/adviser` | Create new adviser |
| PUT | `/api/adviser/{id}` | Update adviser |
| DELETE | `/api/adviser/{id}` | Delete adviser |

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

### Database Configuration (`config/db.php`)

Update the database configuration with your credentials:

```php
<?php
class Database {
    private $host = "localhost";  // Aiven host for production
    private $db_name = "student_org_tracker";
    private $username = "root";  // Aiven username for production
    private $password = "";      // Aiven password for production
    private $conn;

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

For Aiven MySQL, update with:
- Host: Aiven MySQL endpoint
- Username: Aiven service username
- Password: Aiven service password
- SSL configuration (if required)

## Deployment

### Local Development

1. **Prerequisites**
   - PHP 8.0 or higher installed
   - MySQL server running locally
   - Apache or Nginx web server

2. **Setup**
   ```bash
   # Clone the repository
   git clone [repository-url]
   cd backend

   # Configure database
   cp config/db.php.example config/db.php
   # Edit config/db.php with your credentials

   # Run migrations
   php migrate.php

   # Seed database
   php AdminSeeder.php
   ```

3. **Run Local Server**
   ```bash
   php -S localhost:8000
   ```

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
   DB_PASSWORD=[aiven-password]
   DB_PORT=3306
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
# Get all admins
curl -X GET https://your-app.onrender.com/api/admin

# Create new admin
curl -X POST https://your-app.onrender.com/api/admin \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"secure123"}'

# Update admin
curl -X PUT https://your-app.onrender.com/api/admin/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe"}'
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

### Code Style

- Follow PSR-12 coding standards
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

### Adding New Features

1. Create/update migration in `migrations/`
2. Create/update model in `model/`
3. Create/update controller in `controller/`
4. Add routes in `index.php`
5. Test endpoints thoroughly

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
- Implement authentication and authorization
- Validate all input data
- Use HTTPS in production
- Keep dependencies updated
- Never commit sensitive credentials

## License

[Your License Here]

## Support

For issues and questions, please contact the development team.
