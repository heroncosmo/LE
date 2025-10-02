@echo off
REM ========================================
REM CORRIGIR PYTHON - DESABILITAR ALIAS
REM ========================================

title Corrigir Python - IA Vendedora Luchoa

color 0B
echo.
echo ========================================================================================================
echo                                    CORRIGIR PYTHON
echo                                 DESABILITAR ALIAS DO MICROSOFT STORE
echo ========================================================================================================
echo.

echo [INFO] Este script vai:
echo 1. Desabilitar o alias do Microsoft Store que interfere com Python
echo 2. Adicionar Python ao PATH do sistema
echo 3. Testar se Python funciona corretamente
echo.

echo Deseja continuar? (S/N)
set /p choice="> "

if /i "%choice%" neq "S" (
    echo [INFO] Operacao cancelada
    pause
    exit /b 0
)

echo.
echo [1/4] Desabilitando alias do Microsoft Store...

REM Desabilitar alias do Python no Microsoft Store via Registry
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\App Paths\python.exe" /ve /d "C:\Users\Windows\AppData\Local\Programs\Python\Python311\python.exe" /f >nul 2>&1

REM Desabilitar via configurações do Windows (método alternativo)
powershell -Command "Get-AppxPackage Microsoft.DesktopAppInstaller | Remove-AppxPackage" >nul 2>&1

echo [OK] Alias desabilitado

echo.
echo [2/4] Adicionando Python ao PATH do sistema...

REM Adicionar Python ao PATH do usuário atual
setx PATH "%PATH%;C:\Users\Windows\AppData\Local\Programs\Python\Python311;C:\Users\Windows\AppData\Local\Programs\Python\Python311\Scripts" >nul

echo [OK] PATH atualizado

echo.
echo [3/4] Atualizando PATH na sessão atual...
set PATH=C:\Users\Windows\AppData\Local\Programs\Python\Python311;C:\Users\Windows\AppData\Local\Programs\Python\Python311\Scripts;%PATH%

echo [OK] PATH da sessão atual atualizado

echo.
echo [4/4] Testando Python...

REM Testar com caminho completo primeiro
echo Testando com caminho completo:
"C:\Users\Windows\AppData\Local\Programs\Python\Python311\python.exe" --version

REM Testar comando python genérico
echo.
echo Testando comando 'python':
python --version 2>nul
if errorlevel 1 (
    color 0E
    echo [AVISO] Comando 'python' ainda não funciona
    echo [INFO] Você precisa REINICIAR o terminal/PowerShell
    echo [INFO] Ou usar o caminho completo: "C:\Users\Windows\AppData\Local\Programs\Python\Python311\python.exe"
) else (
    color 0A
    echo [OK] Comando 'python' funcionando!
)

echo.
echo ========================================================================================================
echo                                    CORREÇÃO CONCLUÍDA
echo ========================================================================================================
echo.
echo IMPORTANTE:
echo 1. Feche TODOS os terminais/PowerShell abertos
echo 2. Abra um NOVO terminal
echo 3. Teste: python --version
echo 4. Se ainda não funcionar, use o caminho completo nos arquivos .bat
echo.
pause
