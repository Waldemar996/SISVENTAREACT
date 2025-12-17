# Sistema de Ventas Enterprise (ERP)

Bienvenido a **SISVENTA Enterprise**, un sistema de gestión empresarial completo (ERP) construido con arquitectura limpia, diseño orientado al dominio (DDD) y tecnologías modernas.

## 🚀 Tecnologías

*   **Backend**: Laravel 10 (PHP 8.2+)
*   **Frontend**: React + Inertia.js (Vite)
*   **Base de Datos**: MySQL 8.0 / MariaDB
*   **Estilos**: TailwindCSS
*   **Arquitectura**: Clean Architecture + CQRS + Event Driven

## 📋 Requisitos del Sistema

*   PHP >= 8.1
*   Composer
*   Node.js >= 18.0
*   MySQL / MariaDB
*   Servidor Web (Nginx recomendado para producción)

## 🛠️ Instalación (Producción)

1.  **Clonar Repositorio**
    ```bash
    git clone https://github.com/Waldemar996/SISVENTAREACT.git
    cd sisteventas
    ```

2.  **Configurar Entorno**
    ```bash
    cp .env.example .env
    # Configurar DB_DATABASE, DB_USERNAME, DB_PASSWORD en .env
    ```

3.  **Instalar Dependencias**
    ```bash
    composer install --optimize-autoloader --no-dev
    npm install
    ```

4.  **Base de Datos y Semillas**
    ```bash
    php artisan migrate
    php artisan db:seed --class=CoreDataSeeder
    # Esto crea el usuario admin y catálogos base.
    ```

5.  **Compilar Frontend**
    ```bash
    npm run build
    ```

6.  **Optimizar Backend**
    ```bash
    php artisan key:generate
    php artisan config:cache
    php artisan view:cache
    php artisan storage:link
    ```

## ▶️ Ejecución

### Modo Local (Desarrollo)
```bash
# Terminal 1
php artisan serve

# Terminal 2
npm run dev
```

### Modo Producción (Windows/Linux)
Si usas `php artisan serve` en producción (no recomendado para alta carga pero funcional):
```bash
php artisan serve --host=0.0.0.0 --port=8000
```
Accede a: `http://localhost:8000`

## 🔑 Credenciales Iniciales

*   **Usuario**: `admin`
*   **Contraseña**: `password123`

## 🏗️ Módulos Activos

1.  **Logística (Inventario)**: Gestión de Bodegas, Traslados y Kardex en tiempo real.
2.  **Operaciones (Ventas/Compras)**: Facturación con validación estricta de stock y auditoría.
3.  **Tesoreria**: Control de Cajas y Sesiones.
4.  **Reportes**: Dashboards de rendimiento y exportación PDF.
5.  **Seguridad**: Gestión de Usuarios, Roles y Auditoría de Sistema.

---
**Desarrollado con ❤️ para máxima eficiencia empresarial.**
