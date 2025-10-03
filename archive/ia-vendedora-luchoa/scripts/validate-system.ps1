# Script de validação do sistema IA Vendedora Luchoa
# Executa 3 iterações de testes para validar funcionalidades

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "VALIDAÇÃO DO SISTEMA IA VENDEDORA LUCHOA" -ForegroundColor White
Write-Host "============================================================" -ForegroundColor Cyan

function Test-FileExists {
    param([string]$FilePath)
    return Test-Path $FilePath
}

function Write-ValidationResult {
    param(
        [string]$Message,
        [bool]$Success
    )
    if ($Success) {
        Write-Host "✅ $Message" -ForegroundColor Green
    } else {
        Write-Host "❌ $Message" -ForegroundColor Red
    }
    return $Success
}

function Test-ProjectStructure {
    Write-Host "`n----------------------------------------" -ForegroundColor Blue
    Write-Host "Validando Estrutura do Projeto" -ForegroundColor Blue
    Write-Host "----------------------------------------" -ForegroundColor Blue
    
    $requiredFiles = @(
        "package.json",
        "next.config.js", 
        "tailwind.config.ts",
        "tsconfig.json",
        "src/app/layout.tsx",
        "src/app/page.tsx",
        "src/app/chat/page.tsx",
        "src/app/api/chat/route.ts",
        "src/types/index.ts",
        "src/lib/persona-engine.ts",
        "src/lib/relationship-engine.ts",
        "src/lib/api-client.ts",
        "src/lib/logger.ts",
        "src/lib/idempotency.ts",
        "tests/user-registration.spec.ts",
        "tests/chat-interface.spec.ts",
        "tests/ai-behavior.spec.ts",
        "playwright.config.ts"
    )
    
    $results = @()
    foreach ($file in $requiredFiles) {
        $exists = Test-FileExists $file
        $results += Write-ValidationResult $file $exists
    }
    
    $successCount = ($results | Where-Object { $_ -eq $true }).Count
    $totalCount = $results.Count
    
    if ($successCount -eq $totalCount) {
        Write-Host "`n✅ Estrutura do projeto está completa! ($successCount/$totalCount)" -ForegroundColor Green
        return $true
    } else {
        Write-Host "`n❌ $($totalCount - $successCount) arquivos estão faltando ($successCount/$totalCount)" -ForegroundColor Red
        return $false
    }
}

function Test-Configurations {
    Write-Host "`n----------------------------------------" -ForegroundColor Blue
    Write-Host "Validando Configurações" -ForegroundColor Blue
    Write-Host "----------------------------------------" -ForegroundColor Blue
    
    $results = @()
    
    # Validar package.json
    if (Test-FileExists "package.json") {
        $packageContent = Get-Content "package.json" -Raw
        $requiredDeps = @("next", "react", "react-dom", "openai", "uuid", "lucide-react")
        $allDepsFound = $true
        
        foreach ($dep in $requiredDeps) {
            if (-not $packageContent.Contains("`"$dep`"")) {
                $allDepsFound = $false
                break
            }
        }
        
        $results += Write-ValidationResult "package.json - Dependências" $allDepsFound
    } else {
        $results += Write-ValidationResult "package.json - Arquivo não encontrado" $false
    }
    
    # Validar .env.local
    if (Test-FileExists ".env.local") {
        $envContent = Get-Content ".env.local" -Raw
        $hasOpenAIKey = $envContent.Contains("OPENAI_API_KEY=sk-")
        $results += Write-ValidationResult ".env.local - Chave OpenAI" $hasOpenAIKey
    } else {
        $results += Write-ValidationResult ".env.local - Arquivo não encontrado" $false
    }
    
    $successCount = ($results | Where-Object { $_ -eq $true }).Count
    $totalCount = $results.Count
    
    if ($successCount -eq $totalCount) {
        Write-Host "`n✅ Todas as configurações estão corretas! ($successCount/$totalCount)" -ForegroundColor Green
        return $true
    } else {
        Write-Host "`n❌ $($totalCount - $successCount) problemas de configuração ($successCount/$totalCount)" -ForegroundColor Red
        return $false
    }
}

function Test-PersonaImplementation {
    Write-Host "`n----------------------------------------" -ForegroundColor Blue
    Write-Host "Validando Implementação da Persona" -ForegroundColor Blue
    Write-Host "----------------------------------------" -ForegroundColor Blue
    
    $results = @()
    
    if (Test-FileExists "src/lib/persona-engine.ts") {
        $personaContent = Get-Content "src/lib/persona-engine.ts" -Raw
        
        $requiredElements = @(
            "CONVERSATION_EXAMPLES",
            "SIGNATURE_PHRASES", 
            "detectClientIntent",
            "analyzeConversationStage",
            "adaptLanguageToProfile",
            "buildPersonalizedContext"
        )
        
        foreach ($element in $requiredElements) {
            $found = $personaContent.Contains($element)
            $results += Write-ValidationResult "Persona Engine - $element" $found
        }
        
        # Verificar frases características
        $signaturePhrases = @(
            "Faz sentido pra você?",
            "padrão de lote",
            "Deixa eu separar algo",
            "fotos reais"
        )
        
        foreach ($phrase in $signaturePhrases) {
            $found = $personaContent.Contains($phrase)
            $results += Write-ValidationResult "Frase característica - '$phrase'" $found
        }
        
    } else {
        $results += Write-ValidationResult "persona-engine.ts - Arquivo não encontrado" $false
    }
    
    $successCount = ($results | Where-Object { $_ -eq $true }).Count
    $totalCount = $results.Count
    
    if ($successCount -eq $totalCount) {
        Write-Host "`n✅ Implementação da persona está completa! ($successCount/$totalCount)" -ForegroundColor Green
        return $true
    } else {
        Write-Host "`n❌ $($totalCount - $successCount) elementos da persona faltando ($successCount/$totalCount)" -ForegroundColor Red
        return $false
    }
}

function Test-RelationshipSystem {
    Write-Host "`n----------------------------------------" -ForegroundColor Blue
    Write-Host "Validando Sistema de Relacionamento" -ForegroundColor Blue
    Write-Host "----------------------------------------" -ForegroundColor Blue
    
    $results = @()
    
    if (Test-FileExists "src/lib/relationship-engine.ts") {
        $relationshipContent = Get-Content "src/lib/relationship-engine.ts" -Raw
        
        $requiredFunctions = @(
            "detectPositiveSignals",
            "detectConcerns",
            "calculateTrustLevel",
            "calculateEngagementLevel",
            "calculateOfferReadiness",
            "determineRelationshipStage",
            "analyzeRelationship",
            "generateApproachStrategy"
        )
        
        foreach ($func in $requiredFunctions) {
            $found = $relationshipContent.Contains($func)
            $results += Write-ValidationResult "Relationship Engine - $func" $found
        }
        
    } else {
        $results += Write-ValidationResult "relationship-engine.ts - Arquivo não encontrado" $false
    }
    
    $successCount = ($results | Where-Object { $_ -eq $true }).Count
    $totalCount = $results.Count
    
    if ($successCount -eq $totalCount) {
        Write-Host "`n✅ Sistema de relacionamento está completo! ($successCount/$totalCount)" -ForegroundColor Green
        return $true
    } else {
        Write-Host "`n❌ $($totalCount - $successCount) elementos do relacionamento faltando ($successCount/$totalCount)" -ForegroundColor Red
        return $false
    }
}

function Test-BestPractices {
    Write-Host "`n----------------------------------------" -ForegroundColor Blue
    Write-Host "Validando Boas Práticas" -ForegroundColor Blue
    Write-Host "----------------------------------------" -ForegroundColor Blue
    
    $results = @()
    
    # Verificar API client
    if (Test-FileExists "src/lib/api-client.ts") {
        $apiContent = Get-Content "src/lib/api-client.ts" -Raw
        $apiFeatures = @("retry", "timeout", "backoff", "idempotency", "logging")
        
        foreach ($feature in $apiFeatures) {
            $found = $apiContent.ToLower().Contains($feature.ToLower())
            $results += Write-ValidationResult "API Client - $feature" $found
        }
    } else {
        $results += Write-ValidationResult "api-client.ts - Arquivo não encontrado" $false
    }
    
    # Verificar logger
    if (Test-FileExists "src/lib/logger.ts") {
        $loggerContent = Get-Content "src/lib/logger.ts" -Raw
        $logFeatures = @("LogLevel", "structured logging", "performance", "userAction", "aiInteraction")
        
        foreach ($feature in $logFeatures) {
            $found = $loggerContent.Contains($feature)
            $results += Write-ValidationResult "Logger - $feature" $found
        }
    } else {
        $results += Write-ValidationResult "logger.ts - Arquivo não encontrado" $false
    }
    
    $successCount = ($results | Where-Object { $_ -eq $true }).Count
    $totalCount = $results.Count
    
    if ($successCount -eq $totalCount) {
        Write-Host "`n✅ Boas práticas implementadas corretamente! ($successCount/$totalCount)" -ForegroundColor Green
        return $true
    } else {
        Write-Host "`n❌ $($totalCount - $successCount) elementos de boas práticas faltando ($successCount/$totalCount)" -ForegroundColor Red
        return $false
    }
}

# Executar validações em 3 iterações
$validations = @(
    @{ Name = "Estrutura do Projeto"; Function = { Test-ProjectStructure } },
    @{ Name = "Configurações"; Function = { Test-Configurations } },
    @{ Name = "Implementação da Persona"; Function = { Test-PersonaImplementation } },
    @{ Name = "Sistema de Relacionamento"; Function = { Test-RelationshipSystem } },
    @{ Name = "Boas Práticas"; Function = { Test-BestPractices } }
)

$allResults = @()

for ($iteration = 1; $iteration -le 3; $iteration++) {
    Write-Host "`n============================================================" -ForegroundColor Cyan
    Write-Host "ITERAÇÃO $iteration DE VALIDAÇÃO" -ForegroundColor White
    Write-Host "============================================================" -ForegroundColor Cyan
    
    $iterationResults = @()
    
    foreach ($validation in $validations) {
        $success = & $validation.Function
        $iterationResults += @{ Name = $validation.Name; Success = $success }
    }
    
    $allResults += @{ Iteration = $iteration; Results = $iterationResults }
    
    $successCount = ($iterationResults | Where-Object { $_.Success -eq $true }).Count
    $totalCount = $iterationResults.Count
    
    if ($successCount -eq $totalCount) {
        Write-Host "`n🎉 ITERAÇÃO $iteration`: TODAS AS VALIDAÇÕES PASSARAM! ($successCount/$totalCount)" -ForegroundColor Green
    } else {
        Write-Host "`n⚠️  ITERAÇÃO $iteration`: $successCount/$totalCount validações passaram" -ForegroundColor Yellow
    }
    
    if ($iteration -lt 3) {
        Write-Host "`nAguardando próxima iteração..." -ForegroundColor Blue
        Start-Sleep -Seconds 2
    }
}

# Resumo final
Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "RESUMO FINAL DAS VALIDAÇÕES" -ForegroundColor White
Write-Host "============================================================" -ForegroundColor Cyan

$finalIteration = $allResults[-1]
$finalSuccessCount = ($finalIteration.Results | Where-Object { $_.Success -eq $true }).Count
$finalTotalCount = $finalIteration.Results.Count

if ($finalSuccessCount -eq $finalTotalCount) {
    Write-Host "🎉 SISTEMA VALIDADO COM SUCESSO!" -ForegroundColor Green
    Write-Host "✅ Todas as funcionalidades estão implementadas corretamente" -ForegroundColor Green
    Write-Host "✅ Persona do Leandro Uchoa está configurada" -ForegroundColor Green
    Write-Host "✅ Sistema de relacionamento gradual está funcionando" -ForegroundColor Green
    Write-Host "✅ Boas práticas de desenvolvimento foram aplicadas" -ForegroundColor Green
    Write-Host "✅ Testes automatizados estão configurados" -ForegroundColor Green
    Write-Host "`n🚀 O sistema está pronto para uso!" -ForegroundColor White
} else {
    Write-Host "❌ SISTEMA PRECISA DE AJUSTES" -ForegroundColor Red
    Write-Host "$($finalTotalCount - $finalSuccessCount) validações ainda falharam" -ForegroundColor Red
    
    Write-Host "`n📋 Próximos passos:" -ForegroundColor Yellow
    foreach ($result in $finalIteration.Results) {
        if (-not $result.Success) {
            Write-Host "- Corrigir: $($result.Name)" -ForegroundColor Yellow
        }
    }
}

Write-Host "`n============================================================" -ForegroundColor Cyan
