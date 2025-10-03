# ========================================
# IA Vendedora Luchoa - PowerShell Script
# ========================================

Write-Host ""
Write-Host "========================================================================================================" -ForegroundColor Green
Write-Host "                                    IA VENDEDORA LUCHOA" -ForegroundColor Green
Write-Host "                                 SCRIPT POWERSHELL DIRETO" -ForegroundColor Green
Write-Host "========================================================================================================" -ForegroundColor Green
Write-Host ""

# Definir caminhos
$pythonExe = "C:\Users\Windows\AppData\Local\Programs\Python\Python311\python.exe"
$serverScript = "server.py"

# Verificar se estamos no diretório correto
if (-not (Test-Path "package.json")) {
    Write-Host "[INFO] Mudando para diretório ia-vendedora-luchoa..." -ForegroundColor Yellow
    if (Test-Path "ia-vendedora-luchoa\package.json") {
        Set-Location "ia-vendedora-luchoa"
        Write-Host "[OK] Diretório alterado para: $(Get-Location)" -ForegroundColor Green
    } else {
        Write-Host "[ERRO] Não encontrou package.json" -ForegroundColor Red
        Write-Host "Diretório atual: $(Get-Location)" -ForegroundColor Yellow
        Read-Host "Pressione Enter para continuar"
        exit 1
    }
}

# Verificar Python
Write-Host "[1/3] Verificando Python..." -ForegroundColor Cyan
if (Test-Path $pythonExe) {
    Write-Host "[OK] Python encontrado!" -ForegroundColor Green
    & $pythonExe --version
} else {
    Write-Host "[ERRO] Python não encontrado em: $pythonExe" -ForegroundColor Red
    Write-Host "Execute: INSTALAR_PYTHON.bat" -ForegroundColor Yellow
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Verificar Node.js
Write-Host ""
Write-Host "[2/3] Verificando Node.js..." -ForegroundColor Cyan
try {
    $nodeVersion = node --version
    Write-Host "[OK] Node.js encontrado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERRO] Node.js não encontrado!" -ForegroundColor Red
    Write-Host "Instale em: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Verificar npm
Write-Host ""
Write-Host "[3/3] Verificando npm..." -ForegroundColor Cyan
try {
    $npmVersion = npm --version
    Write-Host "[OK] npm encontrado: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERRO] npm não encontrado!" -ForegroundColor Red
    Read-Host "Pressione Enter para sair"
    exit 1
}

Write-Host ""
Write-Host "========================================================================================================" -ForegroundColor Green
Write-Host "  INICIANDO SERVIDOR..." -ForegroundColor Green
Write-Host ""
Write-Host "  Acesse: http://localhost:3000" -ForegroundColor Yellow
Write-Host "  Pressione Ctrl+C para parar" -ForegroundColor Yellow
Write-Host "========================================================================================================" -ForegroundColor Green
Write-Host ""

# Executar servidor Python
try {
    & $pythonExe $serverScript
} catch {
    Write-Host ""
    Write-Host "[ERRO] Falha ao executar servidor Python:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Tentando iniciar apenas com npm..." -ForegroundColor Yellow
    npm run dev
}

Write-Host ""
Write-Host "========================================================================================================" -ForegroundColor Yellow
Write-Host "  SERVIDOR PARADO" -ForegroundColor Yellow
Write-Host "========================================================================================================" -ForegroundColor Yellow
Read-Host "Pressione Enter para sair"
