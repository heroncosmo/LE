@echo off
REM ========================================
REM IA VENDEDORA LUCHOA - VERSAO SIMPLES
REM Funciona diretamente com npm
REM ========================================

title IA Vendedora Luchoa - Servidor Simples

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
echo                                        VERSAO SIMPLES (NPM)
echo.
echo ========================================================================================================
echo.

REM Verificar se Node.js está instalado
echo [1/2] Verificando Node.js...
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
echo [2/2] Verificando npm...
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
echo ========================================================================================================
echo  INICIANDO SERVIDOR NEXT.JS...
echo  
echo  Acesse: http://localhost:3000
echo  
echo  Pressione Ctrl+C para parar o servidor
echo ========================================================================================================
echo.

REM Adicionar Node.js ao PATH se necessário
set PATH=C:\Program Files\nodejs;C:\Program Files (x86)\nodejs;%PATH%

REM Executar npm run dev diretamente
npm run dev

REM Pausa final
echo.
color 0E
echo ========================================================================================================
echo  SERVIDOR PARADO
echo ========================================================================================================
pause
