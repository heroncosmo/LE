# Validação dos arquivos do sistema IA Vendedora Luchoa

Write-Host "VALIDAÇÃO DO SISTEMA IA VENDEDORA LUCHOA" -ForegroundColor Cyan

$files = @(
    "package.json",
    "src/app/page.tsx",
    "src/app/chat/page.tsx", 
    "src/app/api/chat/route.ts",
    "src/lib/persona-engine.ts",
    "src/lib/relationship-engine.ts",
    "README.md"
)

$found = 0
$total = $files.Count

Write-Host "Verificando arquivos principais..." -ForegroundColor Yellow

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "OK: $file" -ForegroundColor Green
        $found++
    } else {
        Write-Host "FALTANDO: $file" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "RESULTADO: $found de $total arquivos encontrados" -ForegroundColor White

if ($found -eq $total) {
    Write-Host "SUCESSO: Sistema completo!" -ForegroundColor Green
} elseif ($found -ge 5) {
    Write-Host "PARCIAL: Sistema funcional!" -ForegroundColor Yellow
} else {
    Write-Host "ERRO: Sistema incompleto!" -ForegroundColor Red
}

Write-Host ""
Write-Host "PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "1. Instalar Node.js" -ForegroundColor White
Write-Host "2. npm install" -ForegroundColor White
Write-Host "3. Configurar .env.local" -ForegroundColor White
Write-Host "4. npm run dev" -ForegroundColor White
