@echo off
TITLE SISVENTA Enterprise Launcher
COLOR 0A
CLS

ECHO ======================================================
ECHO         INICIANDO SISVENTA ENTERPRISE
ECHO ======================================================
ECHO.
ECHO [1/3] Verificando entorno...
ECHO.

REM Este script asume que php.exe y mysql estan en el PATH o en carpetas relativas.
REM En un entorno portatil real, usarias rutas relativas como: bin\php\php.exe

ECHO [2/3] Iniciando Servidor Web...
START /MIN "SISVENTA_SERVER" php artisan serve --port=8080

ECHO [3/3] Abriendo Navegador...
TIMEOUT /T 3 /NOBREAK > NUL
START http://localhost:8080

ECHO.
ECHO ======================================================
ECHO   SISTEMA CORRIENDO EN SEGUNDO PLANO
ECHO   NO CIERRES ESTA VENTANA NEGRA SI QUIERES
ECHO   MANTENER EL SERVIDOR ACTIVO.
ECHO ======================================================
ECHO.
ECHO Presiona cualquier tecla para detener el servidor...
PAUSE > NUL

TASKKILL /FI "WINDOWTITLE eq SISVENTA_SERVER*" /T /F > NUL
ECHO Servidor Detenido.
EXIT
