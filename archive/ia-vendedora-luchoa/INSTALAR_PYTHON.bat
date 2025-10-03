@echo off
REM ========================================
REM INSTALAR PYTHON AUTOMATICAMENTE
REM ========================================

title Instalar Python - IA Vendedora Luchoa

color 0B
echo.
echo ========================================================================================================
echo                                    INSTALADOR AUTOMATICO DO PYTHON
echo                                         IA Vendedora Luchoa
echo ========================================================================================================
echo.

echo [INFO] Este script vai baixar e instalar Python automaticamente
echo [INFO] Versao: Python 3.11 (Recomendada)
echo.
echo Deseja continuar? (S/N)
set /p choice="> "

if /i "%choice%" neq "S" (
    echo [INFO] Instalacao cancelada
    pause
    exit /b 0
)

echo.
echo [1/3] Baixando Python 3.11...
echo [INFO] Aguarde, isso pode demorar alguns minutos...

REM Criar pasta temporaria
if not exist "%TEMP%\luchoa-python" mkdir "%TEMP%\luchoa-python"
cd /d "%TEMP%\luchoa-python"

REM Baixar Python usando PowerShell
powershell -Command "& {Invoke-WebRequest -Uri 'https://www.python.org/ftp/python/3.11.9/python-3.11.9-amd64.exe' -OutFile 'python-installer.exe'}"

if not exist "python-installer.exe" (
    color 0C
    echo [ERRO] Falha ao baixar Python
    echo [INFO] Baixe manualmente em: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo [OK] Python baixado com sucesso!

echo.
echo [2/3] Instalando Python...
echo [INFO] Instalacao silenciosa com pip e PATH automaticos

REM Instalar Python silenciosamente
python-installer.exe /quiet InstallAllUsers=1 PrependPath=1 Include_pip=1

REM Aguardar instalacao
timeout /t 30 /nobreak >nul

echo [OK] Python instalado!

echo.
echo [3/3] Verificando instalacao...

REM Atualizar PATH na sessao atual
set PATH=C:\Program Files\Python311;C:\Program Files\Python311\Scripts;%PATH%
set PATH=C:\Users\%USERNAME%\AppData\Local\Programs\Python\Python311;C:\Users\%USERNAME%\AppData\Local\Programs\Python\Python311\Scripts;%PATH%

REM Verificar se Python foi instalado
python --version >nul 2>&1
if errorlevel 1 (
    color 0E
    echo [AVISO] Python instalado, mas precisa reiniciar o terminal
    echo [INFO] Feche este terminal e abra um novo
    echo [INFO] Depois execute: INICIAR_SERVIDOR.bat
) else (
    color 0A
    echo [OK] Python instalado e funcionando!
    python --version
    echo.
    echo [INFO] Agora voce pode usar: INICIAR_SERVIDOR.bat
)

echo.
echo ========================================================================================================
echo                                    INSTALACAO CONCLUIDA
echo ========================================================================================================

REM Limpar arquivos temporarios
cd /d "%TEMP%"
if exist "%TEMP%\luchoa-python" rmdir /s /q "%TEMP%\luchoa-python"

pause
