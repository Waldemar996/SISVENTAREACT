
# Implementation Summary: Authentication & Roles

## Overview
We have successfully implemented the Authentication and Role-Based Access Control (RBAC) system for the ERP backend. The system is built on Laravel's native authentication but customized to use `SysUsuario` and providing JSON-based login/logout endpoints.

## Features Implemented

1.  **Database Structure**
    -   **`sys_usuarios`**: The primary user table, replacing the default `users` table.
    -   **Infrastructure Tables**: Fixed and migrated strict schemas for `sessions`, `cache`, `failed_jobs`, `password_resets`, and `personal_access_tokens`.
    -   **Seeders**: Populated initial data including a `superadmin` user.

2.  **Authentication**
    -   **Model**: `App\Models\RRHH\SysUsuario` is configured as the `Authenticatable` user model.
    -   **Controller**: `AuthController` handles `custom-login` and `custom-logout`.
    -   **Flexible Login**: Users can log in with either `username` or `email`.
    -   **Driver**: configured to use `session` driver (database storage).

3.  **Role-Based Access Control (RBAC)**
    -   **Middleware**: `CheckRole` (`role`) middleware allows restricting routes to specific roles (e.g., `role:superadmin,admin`).
    -   **Implementation**: `SysUsuario` has a `rol` column used for checking permissions.

## Key Files Created/Modified
-   `app/Models/RRHH/SysUsuario.php`: Auth model.
-   `app/Http/Controllers/AuthController.php`: Login logic.
-   `app/Http/Middleware/CheckRole.php`: RBAC logic.
-   `routes/web.php`: Custom auth routes.
-   `config/auth.php`: Auth guards and providers configuration.
-   `database/migrations/*`: All schema definitions.
-   `database/seeders/CoreDataSeeder.php`: Initial data.

## Usage Guide

### Login
**POST** `/custom-login`
-   **Body**: `{"username": "admin", "password": "password123"}`
-   **Response**: JSON with user info and redirect path.

### Protecting Routes
Use the `role` middleware in your route definitions:
```php
Route::get('/admin-dashboard', function () { ... })->middleware(['auth', 'role:superadmin']);
```

## Current State
-   All migrations have been applied (`migrate:fresh`).
-   Database is seeded with initial data.
-   Authentication is verified and functional.
-   CSRF protection is enabled (ensure your frontend handles CSRF cookies or tokens).

## Next Steps
-   Begin developing the React frontend.
-   Implement API endpoints for the various ERP modules (Logistics, Finance, etc.).
