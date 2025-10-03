@echo off
REM ========================================
REM INICIAR SEGURO - NUNCA FECHA SEM AVISO
REM ========================================

title IA Vendedora Luchoa - Iniciar Seguro

color 0A
echo.
echo ========================================================================================================
echo                                    IA VENDEDORA LUCHOA
echo                                    MODO SEGURO (NUNCA FECHA)
echo ========================================================================================================
echo.

REM Ir para o diretorio correto se nao estiver
if not exist "package.json" (
    echo [INFO] package.json nao encontrado no diretorio atual
    echo [INFO] Tentando ir para subdiretorio ia-vendedora-luchoa...
    if exist "ia-vendedora-luchoa\package.json" (
        cd ia-vendedora-luchoa
        echo [OK] Mudou para diretorio: %CD%
    ) else (
        echo [ERRO] Nao encontrou package.json em lugar nenhum
        echo [INFO] Diretorio atual: %CD%
        echo [INFO] Arquivos no diretorio:
        dir
        echo.
        echo Pressione qualquer tecla para continuar mesmo assim...
        pause >nul
    )
)

echo.
echo [1/3] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    color 0C
    echo [ERRO] Node.js nao encontrado!
    echo.
    echo Instale Node.js em: https://nodejs.org/
    echo.
    echo Pressione qualquer tecla para fechar...
    pause >nul
    exit /b 1
) else (
    echo [OK] Node.js encontrado:
    node --version
)

echo.
echo [2/3] Verificando npm...
npm --version >nul 2>&1
if errorlevel 1 (
    color 0C
    echo [ERRO] npm nao encontrado!
    echo.
    echo Pressione qualquer tecla para fechar...
    pause >nul
    exit /b 1
) else (
    echo [OK] npm encontrado:
    npm --version
)

echo.
echo [3/3] Verificando package.json...
if exist "package.json" (
    echo [OK] package.json encontrado
    echo [INFO] Scripts disponiveis:
    type package.json | findstr "dev"
) else (
    color 0C
    echo [ERRO] package.json nao encontrado!
    echo [INFO] Diretorio atual: %CD%
    echo [INFO] Arquivos no diretorio:
    dir
    echo.
    echo Pressione qualquer tecla para fechar...
    pause >nul
    exit /b 1
)

echo.
echo ========================================================================================================
echo  INICIANDO SERVIDOR...
echo  
echo  Se tudo der certo, acesse: http://localhost:3000
echo  
echo  Para parar o servidor: Pressione Ctrl+C
echo  
echo  ATENCAO: Se der erro, esta janela NAO vai fechar automaticamente
echo ========================================================================================================
echo.

REM Executar npm run dev e capturar erros
npm run dev 2>&1

REM Se chegou aqui, o servidor parou (normal ou erro)
echo.
color 0E
echo ========================================================================================================
echo  SERVIDOR PAROU
echo ========================================================================================================
echo.
echo O servidor Next.js parou de executar.
echo Isso pode ser normal (voce pressionou Ctrl+C) ou pode ter dado erro.
echo.
echo Pressione qualquer tecla para fechar esta janela...
pause >nul
