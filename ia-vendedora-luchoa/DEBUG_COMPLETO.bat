@echo off
REM ========================================
REM DEBUG COMPLETO - JANELA NUNCA FECHA
REM ========================================

title DEBUG COMPLETO - IA Vendedora Luchoa

REM Configurar para mostrar todos os comandos
echo on

echo.
echo ========================================================================================================
echo                                    DEBUG ULTRA COMPLETO
echo                                    JANELA NUNCA FECHARA
echo ========================================================================================================
echo.

echo [PASSO 1] Verificando diretorio atual...
echo Diretorio atual: %CD%
dir
echo.
echo Pressione qualquer tecla para continuar...
pause >nul

echo.
echo [PASSO 2] Verificando se package.json existe...
if exist "package.json" (
    echo [OK] package.json encontrado
    type package.json | findstr "name"
) else (
    echo [ERRO] package.json NAO encontrado
    echo Listando arquivos no diretorio:
    dir *.json
)
echo.
echo Pressione qualquer tecla para continuar...
pause >nul

echo.
echo [PASSO 3] Verificando Node.js...
echo Testando comando: node --version
node --version
if errorlevel 1 (
    echo [ERRO] Node.js falhou
) else (
    echo [OK] Node.js funcionou
)
echo.
echo Pressione qualquer tecla para continuar...
pause >nul

echo.
echo [PASSO 4] Verificando npm...
echo Testando comando: npm --version
npm --version
if errorlevel 1 (
    echo [ERRO] npm falhou
) else (
    echo [OK] npm funcionou
)
echo.
echo Pressione qualquer tecla para continuar...
pause >nul

echo.
echo [PASSO 5] Verificando scripts do package.json...
if exist "package.json" (
    echo Scripts disponiveis:
    type package.json | findstr "scripts" -A 10
) else (
    echo [ERRO] Nao pode verificar scripts - package.json nao existe
)
echo.
echo Pressione qualquer tecla para continuar...
pause >nul

echo.
echo [PASSO 6] Tentando executar npm run dev...
echo ATENCAO: Vou tentar executar npm run dev agora
echo Se der erro, a janela NAO vai fechar
echo.
echo Executando: npm run dev
npm run dev 2>&1

echo.
echo ========================================================================================================
echo                                    COMANDO TERMINOU
echo ========================================================================================================
echo.
echo Se chegou ate aqui, o comando npm run dev terminou
echo (pode ter dado erro ou sido interrompido)
echo.
echo Pressione qualquer tecla para ver informacoes finais...
pause >nul

echo.
echo [INFORMACOES FINAIS]
echo Diretorio atual: %CD%
echo Data/Hora: %DATE% %TIME%
echo.
echo Pressione qualquer tecla para fechar esta janela...
pause >nul
