@echo off
REM ========================================
REM IA Vendedora Luchoa - Inicializador
REM ========================================

title IA Vendedora Luchoa - Servidor

echo.
echo ========================================
echo   IA VENDEDORA LUCHOA - SERVIDOR
echo ========================================
echo.

REM Verificar se Python está instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Python nao encontrado!
    echo.
    echo Por favor, instale Python 3.7+ em:
    echo https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)

echo [INFO] Python encontrado
python --version

REM Verificar se Node.js está instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js nao encontrado!
    echo.
    echo Por favor, instale Node.js em:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [INFO] Node.js encontrado
node --version

REM Verificar se npm está instalado
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] npm nao encontrado!
    echo.
    echo npm geralmente vem com Node.js
    echo Reinstale Node.js se necessario
    echo.
    pause
    exit /b 1
)

echo [INFO] npm encontrado
npm --version

echo.
echo [INFO] Iniciando servidor...
echo [INFO] Pressione Ctrl+C para parar
echo.

REM Executar o servidor Python
python server.py

REM Se chegou aqui, o servidor parou
echo.
echo [INFO] Servidor parado
pause
