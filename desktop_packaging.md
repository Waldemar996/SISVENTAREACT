# Guía de Empaquetado para Escritorio (Desktop Packaging)

Transformar una aplicación Web (Laravel + React) en un programa de escritorio "instalar y usar" es posible. Aquí te explico las dos mejores estrategias.

## ESTRATEGIA 1: El "Bundle" Portátil (Recomendada para empezar)
Esta es la forma más rápida. Consiste en una carpeta que contiene todo un "mini servidor" portátil que el cliente solo tiene que copiar y ejecutar, sin instalar nada.

### ¿Qué necesitas?
1.  **USBWebserver** o **Laragon Portable**: Son entornos que traen PHP, MySQL y Apache/Nginx en una carpeta, sin instalación.
2.  **Tu Código**: La carpeta del proyecto.
3.  **Un Script de Inicio**: Un archivo `.bat` o `.exe` que levanta todo invisiblemente y abre el navegador.

### Paso a Paso (Flujo Manual)
1.  Descarga **Laragon Portable** (o XAMPP Portable).
2.  Coloca tu proyecto dentro de la carpeta `www` de Laragon.
3.  Configura el MySQL de Laragon para que tenga tu base de datos y usuario.
4.  Crea un archivo `INICIAR_SISTEMA.bat` en la raíz de la carpeta portátil:
    ```batch
    @echo off
    echo Iniciando Servidores...
    start /min bin\mysql\bin\mysqld.exe --defaults-file=bin\mysql\my.ini
    start /min bin\php\php.exe artisan serve --port=8080
    timeout 5
    start http://localhost:8080
    echo Sistema Corriendo. No cerrar esta ventana.
    ```
5.  **Entregar al Cliente**: Comprimes toda la carpeta Laragon en un `.zip`. El cliente lo descomprime y hace doble clic en `INICIAR_SISTEMA.bat`. ¡Listo!

---

## ESTRATEGIA 2: NativePHP (La forma Profesional)
**NativePHP** es una herramienta oficial para Laravel que convierte tu app en una aplicación real de Windows (`.exe` instalable), Mac o Linux.

### Ventajas
*   Se siente como un programa nativo (sin ventana negra de consola).
*   Tiene icono propio en la barra de tareas.
*   Puede interactuar con el sistema (notificaciones, archivos).

### Cómo funciona
Usa **Electron** internamente para "envolver" tu Laravel. Incluye su propio binario de PHP y base de datos (SQLite es nativo, para MySQL necesitas incluir el servicio).

### Instalación (Resumen)
1.  Instalar en tu proyecto:
    ```bash
    composer require nativephp/electron
    php artisan native:install
    ```
2.  Construir el ejecutable:
    ```bash
    php artisan native:build
    ```
    Esto generará un instalador real en la carpeta `dist/`.

---

## Recomendación para SISVENTA
Dado que usas **MySQL**, el **Método 1 (Bundle Portátil)** es más estable para empezar, ya que empaquetar un servidor MySQL completo dentro de un `.exe` de NativePHP es complejo (NativePHP prefiere SQLite que es un archivo simple).

### Plan de Acción (Método Bundle)
1.  Prepara una carpeta "SISVENTA_PORTABLE".
2.  Mete dentro los ejecutables de PHP y MySQL (puedes sacarlos de tu XAMPP actual).
3.  Mete tu código fuente ya compilado (`npm run build`).
4.  Crea el script `.bat` lanzador.
5.  Usa un programa como **Inno Setup** (gratis) para crear un instalador `.exe` que simplemente descomprima esa carpeta y cree el acceso directo en el escritorio.

¿Te gustaría que cree el archivo `.bat` de ejemplo para probar este concepto ahora mismo?
