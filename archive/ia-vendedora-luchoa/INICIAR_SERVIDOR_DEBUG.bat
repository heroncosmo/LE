@echo off
REM ========================================
REM IA VENDEDORA LUCHOA - DEBUG VERSION
REM ========================================

title IA Vendedora Luchoa - Debug

color 0E
echo.
echo ========================================================================================================
echo                                    IA VENDEDORA LUCHOA - DEBUG
echo                                         DIAGNOSTICO COMPLETO
echo ========================================================================================================
echo.

echo [DEBUG] Verificando caminhos do Python...
echo.

REM Verificar se Python existe no caminho especifico
echo [1] Testando Python no caminho completo...
if exist "C:\Users\Windows\AppData\Local\Programs\Python\Python311\python.exe" (
    echo [OK] Python encontrado em: C:\Users\Windows\AppData\Local\Programs\Python\Python311\python.exe
    "C:\Users\Windows\AppData\Local\Programs\Python\Python311\python.exe" --version
) else (
    echo [ERRO] Python NAO encontrado em: C:\Users\Windows\AppData\Local\Programs\Python\Python311\python.exe
)

echo.
echo [2] Testando comando 'python' generico...
python --version 2>nul
if errorlevel 1 (
    echo [ERRO] Comando 'python' nao funciona (alias do Microsoft Store interferindo)
) else (
    echo [OK] Comando 'python' funciona
)

echo.
echo [3] Verificando onde esta o comando python...
where python 2>nul
if errorlevel 1 (
    echo [INFO] Comando 'where python' nao encontrou nada
) else (
    echo [INFO] Comando 'where python' encontrou o acima
)

echo.
echo [4] Verificando Node.js...
node --version 2>nul
if errorlevel 1 (
    echo [ERRO] Node.js nao encontrado
) else (
    echo [OK] Node.js encontrado:
    node --version
)

echo.
echo [5] Verificando npm...
npm --version 2>nul
if errorlevel 1 (
    echo [ERRO] npm nao encontrado
) else (
    echo [OK] npm encontrado:
    npm --version
)

echo.
echo [6] Verificando se server.py existe...
if exist "server.py" (
    echo [OK] server.py encontrado
) else (
    echo [ERRO] server.py NAO encontrado no diretorio atual
    echo [INFO] Diretorio atual: %CD%
)

echo.
echo [7] Testando server.py com caminho completo do Python...
if exist "server.py" (
    if exist "C:\Users\Windows\AppData\Local\Programs\Python\Python311\python.exe" (
        echo [INFO] Tentando executar server.py...
        echo [INFO] Pressione Ctrl+C para parar se der erro
        echo.
        "C:\Users\Windows\AppData\Local\Programs\Python\Python311\python.exe" server.py
    ) else (
        echo [ERRO] Nao pode testar server.py - Python nao encontrado
    )
) else (
    echo [ERRO] Nao pode testar server.py - arquivo nao encontrado
)

echo.
echo ========================================================================================================
echo                                    DEBUG CONCLUIDO
echo ========================================================================================================
pause
