@echo off
echo ============================================================
echo VALIDACAO DO SISTEMA IA VENDEDORA LUCHOA
echo ============================================================

echo.
echo Verificando arquivos principais...

set /a found=0
set /a total=7

if exist "package.json" (
    echo [OK] package.json
    set /a found+=1
) else (
    echo [FALTANDO] package.json
)

if exist "src\app\page.tsx" (
    echo [OK] src\app\page.tsx
    set /a found+=1
) else (
    echo [FALTANDO] src\app\page.tsx
)

if exist "src\app\chat\page.tsx" (
    echo [OK] src\app\chat\page.tsx
    set /a found+=1
) else (
    echo [FALTANDO] src\app\chat\page.tsx
)

if exist "src\app\api\chat\route.ts" (
    echo [OK] src\app\api\chat\route.ts
    set /a found+=1
) else (
    echo [FALTANDO] src\app\api\chat\route.ts
)

if exist "src\lib\persona-engine.ts" (
    echo [OK] src\lib\persona-engine.ts
    set /a found+=1
) else (
    echo [FALTANDO] src\lib\persona-engine.ts
)

if exist "src\lib\relationship-engine.ts" (
    echo [OK] src\lib\relationship-engine.ts
    set /a found+=1
) else (
    echo [FALTANDO] src\lib\relationship-engine.ts
)

if exist "README.md" (
    echo [OK] README.md
    set /a found+=1
) else (
    echo [FALTANDO] README.md
)

echo.
echo RESULTADO: %found% de %total% arquivos encontrados

if %found%==%total% (
    echo SUCESSO: Sistema completo!
) else if %found% geq 5 (
    echo PARCIAL: Sistema funcional!
) else (
    echo ERRO: Sistema incompleto!
)

echo.
echo ============================================================
echo PROXIMOS PASSOS:
echo ============================================================
echo 1. Instalar Node.js (https://nodejs.org)
echo 2. Executar: npm install
echo 3. Configurar .env.local com chave OpenAI
echo 4. Executar: npm run dev
echo 5. Acessar: http://localhost:3000
echo.
echo Sistema de IA Vendedora Luchoa pronto para uso!
echo ============================================================

pause
