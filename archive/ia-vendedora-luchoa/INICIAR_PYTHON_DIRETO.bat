@echo off
REM ========================================
REM INICIAR COM PYTHON DIRETO
REM Usa caminho completo, não depende do PATH
REM ========================================

title IA Vendedora Luchoa - Python Direto

color 0A
echo.
echo  ██╗ █████╗     ██╗   ██╗███████╗███╗   ██║██████╗ ███████╗██████╗  ██████╗ ██████╗  █████╗ 
echo  ██║██╔══██╗    ██║   ██║██╔════╝████╗  ██║██╔══██╗██╔════╝██╔══██╗██╔═══██╗██╔══██╗██╔══██╗
echo  ██║███████║    ██║   ██║█████╗  ██╔██╗ ██║██║  ██║█████╗  ██║  ██║██║   ██║██████╔╝███████║
echo  ██║██╔══██║    ╚██╗ ██╔╝██╔══╝  ██║╚██╗██║██║  ██║██╔══╝  ██║  ██║██║   ██║██╔══██╗██╔══██║
echo  ██║██║  ██║     ╚████╔╝ ███████╗██║ ╚████║██████╔╝███████╗██████╔╝╚██████╔╝██║  ██║██║  ██║
echo  ╚═╝╚═╝  ╚═╝      ╚═══╝  ╚══════╝╚═╝  ╚═══╝╚═════╝ ╚══════╝╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝
echo.
echo                                    LUCHOA REVESTIMENTOS NATURAIS
echo                                         Leandro Uchoa - IA
echo                                      PYTHON DIRETO (SEM PATH)
echo.
echo ========================================================================================================
echo.

REM Definir caminhos completos
set PYTHON_EXE=C:\Users\Windows\AppData\Local\Programs\Python\Python311\python.exe
set PIP_EXE=C:\Users\Windows\AppData\Local\Programs\Python\Python311\Scripts\pip.exe

echo [1/4] Verificando Python...
if exist "%PYTHON_EXE%" (
    echo [OK] Python encontrado!
    "%PYTHON_EXE%" --version
) else (
    color 0C
    echo [ERRO] Python nao encontrado em: %PYTHON_EXE%
    echo.
    echo Execute primeiro: INSTALAR_PYTHON.bat
    echo.
    pause
    exit /b 1
)

echo.
echo [2/4] Verificando dependências Python...
echo Instalando/atualizando requests...
"%PIP_EXE%" install requests >nul 2>&1
if errorlevel 1 (
    echo [AVISO] Erro ao instalar requests, tentando continuar...
) else (
    echo [OK] Dependências Python OK
)

echo.
echo [3/4] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    color 0C
    echo [ERRO] Node.js nao encontrado!
    echo.
    echo Instale Node.js em: https://nodejs.org/
    echo.
    pause
    exit /b 1
) else (
    echo [OK] Node.js encontrado:
    node --version
)

echo.
echo [4/4] Verificando npm...
npm --version >nul 2>&1
if errorlevel 1 (
    color 0C
    echo [ERRO] npm nao encontrado!
    echo.
    pause
    exit /b 1
) else (
    echo [OK] npm encontrado:
    npm --version
)

echo.
echo ========================================================================================================
echo  INICIANDO SERVIDOR PYTHON...
echo  
echo  O servidor Python vai iniciar o Next.js automaticamente
echo  Acesse: http://localhost:3000
echo  
echo  Pressione Ctrl+C para parar o servidor
echo ========================================================================================================
echo.

REM Executar server.py com caminho completo do Python
"%PYTHON_EXE%" server.py

REM Se chegou aqui, o servidor parou
echo.
color 0E
echo ========================================================================================================
echo  SERVIDOR PARADO
echo ========================================================================================================
echo.
echo O servidor parou de executar.
echo.
pause
