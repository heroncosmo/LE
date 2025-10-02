@echo off
REM ========================================
REM IA VENDEDORA LUCHOA - INICIAR SERVIDOR
REM Duplo clique para iniciar!
REM ========================================

title IA Vendedora Luchoa - Inicializador

color 0A
echo.
echo  ██╗ █████╗     ██╗   ██╗███████╗███╗   ██╗██████╗ ███████╗██████╗  ██████╗ ██████╗  █████╗ 
echo  ██║██╔══██╗    ██║   ██║██╔════╝████╗  ██║██╔══██╗██╔════╝██╔══██╗██╔═══██╗██╔══██╗██╔══██╗
echo  ██║███████║    ██║   ██║█████╗  ██╔██╗ ██║██║  ██║█████╗  ██║  ██║██║   ██║██████╔╝███████║
echo  ██║██╔══██║    ╚██╗ ██╔╝██╔══╝  ██║╚██╗██║██║  ██║██╔══╝  ██║  ██║██║   ██║██╔══██╗██╔══██║
echo  ██║██║  ██║     ╚████╔╝ ███████╗██║ ╚████║██████╔╝███████╗██████╔╝╚██████╔╝██║  ██║██║  ██║
echo  ╚═╝╚═╝  ╚═╝      ╚═══╝  ╚══════╝╚═╝  ╚═══╝╚═════╝ ╚══════╝╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝
echo.
echo                                    LUCHOA REVESTIMENTOS NATURAIS
echo                                         Leandro Uchoa - IA
echo.
echo ========================================================================================================
echo.

REM Definir caminho completo do Python
set PYTHON_EXE=C:\Users\Windows\AppData\Local\Programs\Python\Python311\python.exe

REM Verificar dependências
echo [1/4] Verificando Python...
if exist "%PYTHON_EXE%" (
    echo [OK] Python encontrado!
    "%PYTHON_EXE%" --version
) else (
    color 0C
    echo [ERRO] Python nao encontrado em: %PYTHON_EXE%
    echo.
    echo Instale Python 3.7+ em: https://www.python.org/downloads/
    echo Ou execute: INSTALAR_PYTHON.bat
    echo.
    pause
    exit /b 1
)

echo.
echo [2/4] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    color 0C
    echo [ERRO] Node.js nao encontrado!
    echo.
    echo Instale Node.js em: https://nodejs.org/
    echo.
    pause
    exit /b 1
)
node --version
echo [OK] Node.js encontrado!

echo.
echo [3/4] Verificando npm...
npm --version >nul 2>&1
if errorlevel 1 (
    color 0C
    echo [ERRO] npm nao encontrado!
    echo.
    pause
    exit /b 1
)
npm --version
echo [OK] npm encontrado!

echo.
echo [4/4] Iniciando servidor...
echo.
echo ========================================================================================================
echo  SERVIDOR INICIANDO...
echo  
echo  Acesse: http://localhost:3000
echo  
echo  Pressione Ctrl+C para parar o servidor
echo ========================================================================================================
echo.

REM Executar o servidor Python com caminho completo
"%PYTHON_EXE%" server.py

REM Pausa final
echo.
color 0E
echo ========================================================================================================
echo  SERVIDOR PARADO
echo ========================================================================================================
pause
