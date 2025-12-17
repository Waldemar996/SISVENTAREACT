# Guía de Configuración y Personalización

Esta guía te explica dónde cambiar los datos clave del sistema, como la base de datos, el nombre del negocio y el logo.

## 1. Configuración Principal (.env)
El archivo `.env` en la raíz del proyecto es el centro de control. Aquí se definen las credenciales y el nombre de la app.

### Cambiar Base de Datos
Busca estas líneas y edítalas con tus credenciales de MySQL:
```ini
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=sisventa_db  <-- Nombre de tu base de datos
DB_USERNAME=root         <-- Usuario MySQL
DB_PASSWORD=             <-- Contraseña MySQL
```

### Cambiar Nombre del Sistema
Este nombre aparece en los correos y en la barra de título.
```ini
APP_NAME="SISVENTA Enterprise"
```

## 2. Personalización Visual

### Cambiar Logo
El logo del sistema se encuentra en:
`public/images/logo.png`

Para cambiarlo:
1.  Prepara tu imagen en formato PNG (preferiblemente fondo transparente).
2.  Nómbrala `logo.png`.
3.  Reemplaza el archivo existente en `public/images/`.
4.  Si quieres cambiar el **Favicon** (icono del navegador), reemplaza `public/favicon.ico`.

### Cambiar Icono del Bat (Acceso Directo)
Windows no permite cambiar el icono de un archivo `.bat` directamente, pero puedes crear un Acceso Directo:
1.  Haz clic derecho en `run_portable.bat` -> "Crear acceso directo".
2.  Haz clic derecho en el acceso directo creado -> "Propiedades".
3.  Pestaña "Acceso directo" -> Botón "Cambiar icono...".
4.  Selecciona tu archivo de icono (`.ico`). ¡Ahora se verá profesional!

## 3. Datos de la Empresa (Facturación)
Los datos que aparecen en los reportes PDF y tickets (Nombre, Dirección, RUT) se gestionan **dentro del sistema**:
1.  Inicia sesión como Admin.
2.  Ve a `Configuración` -> `Datos de Empresa`.
3.  Edita los campos y guarda.

## 4. Usuarios y Permisos
No necesitas tocar código para esto.
1.  Ve a `Seguridad` -> `Usuarios`.
2.  Crea nuevos cajeros o administradores.
3.  Los roles definen qué pueden hacer (ej. un Cajero no puede anular ventas).

---
**Nota**: Después de hacer cambios en `.env`, si estás en producción, ejecuta:
```bash
php artisan config:clear
php artisan config:cache
```
Para aplicar los cambios.
