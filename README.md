# SISVENTAREACT - Sistema de Ventas ERP

Sistema completo de gestión empresarial (ERP) desarrollado con Laravel 11 + React + Inertia.js.

## 🚀 Características Principales

### Módulos Implementados
- ✅ **Dashboard Pro** - Métricas en tiempo real, sparklines, alertas críticas
- ✅ **Punto de Venta (POS)** - Ventas rápidas con gestión de caja
- ✅ **Inventario** - Productos, categorías, marcas, kardex multi-bodega
- ✅ **Compras** - Workflow completo (Pendiente → Completado → Recibido)
- ✅ **Ventas** - Facturación, cotizaciones, devoluciones
- ✅ **Reportes** - Ventas, compras, inventario, kardex
- ✅ **Finanzas** - CxC, CxP, gastos
- ✅ **RRHH** - Empleados, departamentos, puestos
- ✅ **Tesorería** - Cajas, sesiones, cortes
- ✅ **Configuración** - Empresa, impuestos, series

### Tecnologías
- **Backend:** Laravel 11, PHP 8.2
- **Frontend:** React 18, Inertia.js, TailwindCSS
- **Database:** MySQL 8.0
- **Charts:** Recharts
- **Icons:** Heroicons

## 📋 Requisitos

- PHP >= 8.2
- Composer
- Node.js >= 18
- MySQL >= 8.0
- NPM o Yarn

## 🛠️ Instalación

### 1. Clonar el repositorio
```bash
git clone https://github.com/tuusuario/SISVENTAREACT.git
cd SISVENTAREACT/sisteventas
```

### 2. Instalar dependencias PHP
```bash
composer install
```

### 3. Instalar dependencias JavaScript
```bash
npm install
```

### 4. Configurar entorno
```bash
cp .env.example .env
php artisan key:generate
```

### 5. Configurar base de datos
Edita `.env` con tus credenciales:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=sisteventas
DB_USERNAME=tu_usuario
DB_PASSWORD=tu_contraseña
```

### 6. Ejecutar migraciones y seeders
```bash
php artisan migrate --seed
```

### 7. Compilar assets
```bash
# Desarrollo
npm run dev

# Producción
npm run build
```

### 8. Iniciar servidor
```bash
php artisan serve
```

Accede a: `http://localhost:8000`

## 👤 Credenciales por Defecto

```
Email: admin@sistema.com
Password: password
```

## 📁 Estructura del Proyecto

```
sisteventas/
├── app/
│   ├── Http/Controllers/     # Controladores
│   ├── Models/               # Modelos Eloquent
│   └── Services/             # Lógica de negocio
├── database/
│   ├── migrations/           # Migraciones
│   ├── seeders/              # Datos iniciales
│   └── schema_v9.sql         # Schema completo
├── resources/
│   ├── js/
│   │   ├── Components/       # Componentes React
│   │   ├── Layouts/          # Layouts
│   │   └── Pages/            # Páginas Inertia
│   └── css/                  # Estilos
├── routes/
│   ├── web.php               # Rutas web
│   └── api.php               # Rutas API
└── tests/                    # Tests automatizados
```

## 🧪 Testing

```bash
# Ejecutar todos los tests
php artisan test

# Con cobertura
php artisan test --coverage

# Tests específicos
php artisan test --filter DashboardControllerTest
```

## 📊 Características Avanzadas

### Dashboard Pro
- KPIs en tiempo real
- Sparklines de tendencias
- Comparación mes anterior
- Alertas de productos críticos
- Gráficos interactivos

### Gestión de Inventario
- Multi-bodega
- Kardex automático
- Alertas de stock bajo
- Trazabilidad completa

### Punto de Venta
- Interfaz rápida e intuitiva
- Búsqueda de productos
- Descuentos y promociones
- Múltiples métodos de pago
- Impresión de tickets

## 🔒 Seguridad

- ✅ Autenticación Laravel Sanctum
- ✅ Protección CSRF
- ✅ Validación de inputs
- ✅ SQL Injection prevention (Eloquent ORM)
- ✅ XSS protection
- ✅ Soft deletes para auditoría

## 📈 Performance

- ✅ Caché de dashboard (5 min)
- ✅ Eager loading para N+1 queries
- ✅ Assets optimizados
- ✅ Lazy loading de componentes

## 🚀 Deployment

### Producción
```bash
# Optimizar autoloader
composer install --optimize-autoloader --no-dev

# Compilar assets
npm run build

# Cachear configuración
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Ejecutar migraciones
php artisan migrate --force
```

## 📝 Documentación

- [Plan de Testing QA](docs/qa_testing_plan.md)
- [Reporte QA Ejecutivo](docs/qa_executive_report.md)
- [API Documentation](docs/api-documentation.yaml)
- [Setup Sentry](docs/SENTRY_SETUP.md)

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu rama (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es privado y confidencial.

## 👨‍💻 Autor

**Waldemar López**
- GitHub: [@WaldemarLopez](https://github.com/WaldemarLopez)

## 🙏 Agradecimientos

Desarrollado con ❤️ usando las mejores prácticas de desarrollo.

---

**Versión:** 1.0.0  
**Última actualización:** Diciembre 2025
