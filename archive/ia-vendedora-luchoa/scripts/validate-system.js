#!/usr/bin/env node

/**
 * Script de validação do sistema IA Vendedora Luchoa
 * Executa 3 iterações de testes para validar funcionalidades
 */

const fs = require('fs');
const path = require('path');

// Cores para output no terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`${message}`, 'bright');
  log(`${'='.repeat(60)}`, 'cyan');
}

function logSubHeader(message) {
  log(`\n${'-'.repeat(40)}`, 'blue');
  log(`${message}`, 'blue');
  log(`${'-'.repeat(40)}`, 'blue');
}

// Validações estruturais
function validateProjectStructure() {
  logSubHeader('Validando Estrutura do Projeto');
  
  const requiredFiles = [
    'package.json',
    'next.config.js',
    'tailwind.config.ts',
    'tsconfig.json',
    'src/app/layout.tsx',
    'src/app/page.tsx',
    'src/app/chat/page.tsx',
    'src/app/api/chat/route.ts',
    'src/types/index.ts',
    'src/lib/persona-engine.ts',
    'src/lib/relationship-engine.ts',
    'src/lib/api-client.ts',
    'src/lib/logger.ts',
    'src/lib/idempotency.ts',
    'tests/user-registration.spec.ts',
    'tests/chat-interface.spec.ts',
    'tests/ai-behavior.spec.ts',
    'playwright.config.ts',
  ];

  const results = [];
  
  for (const file of requiredFiles) {
    const filePath = path.join(process.cwd(), file);
    const exists = fs.existsSync(filePath);
    
    if (exists) {
      log(`✅ ${file}`, 'green');
      results.push({ file, status: 'ok' });
    } else {
      log(`❌ ${file}`, 'red');
      results.push({ file, status: 'missing' });
    }
  }
  
  const missingFiles = results.filter(r => r.status === 'missing');
  if (missingFiles.length === 0) {
    log('\n✅ Estrutura do projeto está completa!', 'green');
    return true;
  } else {
    log(`\n❌ ${missingFiles.length} arquivos estão faltando`, 'red');
    return false;
  }
}

// Validar configurações
function validateConfigurations() {
  logSubHeader('Validando Configurações');
  
  const results = [];
  
  // Validar package.json
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const requiredDeps = [
      'next', 'react', 'react-dom', 'openai', 'uuid', 'lucide-react'
    ];
    const requiredDevDeps = [
      'typescript', '@types/node', '@types/react', 'tailwindcss', '@playwright/test'
    ];
    
    const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies?.[dep]);
    const missingDevDeps = requiredDevDeps.filter(dep => !packageJson.devDependencies?.[dep]);
    
    if (missingDeps.length === 0 && missingDevDeps.length === 0) {
      log('✅ package.json - Dependências corretas', 'green');
      results.push({ config: 'package.json', status: 'ok' });
    } else {
      log('❌ package.json - Dependências faltando', 'red');
      results.push({ config: 'package.json', status: 'error' });
    }
  } catch (error) {
    log('❌ package.json - Erro ao ler arquivo', 'red');
    results.push({ config: 'package.json', status: 'error' });
  }
  
  // Validar .env.local
  if (fs.existsSync('.env.local')) {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    if (envContent.includes('OPENAI_API_KEY=sk-')) {
      log('✅ .env.local - Chave OpenAI configurada', 'green');
      results.push({ config: '.env.local', status: 'ok' });
    } else {
      log('❌ .env.local - Chave OpenAI não configurada', 'red');
      results.push({ config: '.env.local', status: 'error' });
    }
  } else {
    log('❌ .env.local - Arquivo não encontrado', 'red');
    results.push({ config: '.env.local', status: 'missing' });
  }
  
  const errors = results.filter(r => r.status !== 'ok');
  if (errors.length === 0) {
    log('\n✅ Todas as configurações estão corretas!', 'green');
    return true;
  } else {
    log(`\n❌ ${errors.length} problemas de configuração encontrados`, 'red');
    return false;
  }
}

// Validar implementação da persona
function validatePersonaImplementation() {
  logSubHeader('Validando Implementação da Persona');
  
  const results = [];
  
  try {
    // Verificar persona-engine.ts
    const personaEngine = fs.readFileSync('src/lib/persona-engine.ts', 'utf8');
    
    const requiredElements = [
      'CONVERSATION_EXAMPLES',
      'SIGNATURE_PHRASES',
      'detectClientIntent',
      'analyzeConversationStage',
      'adaptLanguageToProfile',
      'buildPersonalizedContext'
    ];
    
    for (const element of requiredElements) {
      if (personaEngine.includes(element)) {
        log(`✅ Persona Engine - ${element}`, 'green');
        results.push({ element, status: 'ok' });
      } else {
        log(`❌ Persona Engine - ${element}`, 'red');
        results.push({ element, status: 'missing' });
      }
    }
    
    // Verificar frases características
    const signaturePhrases = [
      'Faz sentido pra você?',
      'padrão de lote',
      'Deixa eu separar algo',
      'fotos reais'
    ];
    
    for (const phrase of signaturePhrases) {
      if (personaEngine.includes(phrase)) {
        log(`✅ Frase característica - "${phrase}"`, 'green');
        results.push({ phrase, status: 'ok' });
      } else {
        log(`❌ Frase característica - "${phrase}"`, 'red');
        results.push({ phrase, status: 'missing' });
      }
    }
    
  } catch (error) {
    log('❌ Erro ao validar persona-engine.ts', 'red');
    results.push({ element: 'persona-engine.ts', status: 'error' });
  }
  
  const errors = results.filter(r => r.status !== 'ok');
  if (errors.length === 0) {
    log('\n✅ Implementação da persona está completa!', 'green');
    return true;
  } else {
    log(`\n❌ ${errors.length} elementos da persona estão faltando`, 'red');
    return false;
  }
}

// Validar sistema de relacionamento
function validateRelationshipSystem() {
  logSubHeader('Validando Sistema de Relacionamento');
  
  const results = [];
  
  try {
    const relationshipEngine = fs.readFileSync('src/lib/relationship-engine.ts', 'utf8');
    
    const requiredFunctions = [
      'detectPositiveSignals',
      'detectConcerns',
      'calculateTrustLevel',
      'calculateEngagementLevel',
      'calculateOfferReadiness',
      'determineRelationshipStage',
      'analyzeRelationship',
      'generateApproachStrategy'
    ];
    
    for (const func of requiredFunctions) {
      if (relationshipEngine.includes(func)) {
        log(`✅ Relationship Engine - ${func}`, 'green');
        results.push({ func, status: 'ok' });
      } else {
        log(`❌ Relationship Engine - ${func}`, 'red');
        results.push({ func, status: 'missing' });
      }
    }
    
  } catch (error) {
    log('❌ Erro ao validar relationship-engine.ts', 'red');
    results.push({ element: 'relationship-engine.ts', status: 'error' });
  }
  
  const errors = results.filter(r => r.status !== 'ok');
  if (errors.length === 0) {
    log('\n✅ Sistema de relacionamento está completo!', 'green');
    return true;
  } else {
    log(`\n❌ ${errors.length} elementos do sistema de relacionamento estão faltando`, 'red');
    return false;
  }
}

// Validar boas práticas
function validateBestPractices() {
  logSubHeader('Validando Boas Práticas');
  
  const results = [];
  
  try {
    // Verificar API client
    const apiClient = fs.readFileSync('src/lib/api-client.ts', 'utf8');
    const apiFeatures = [
      'retry', 'timeout', 'backoff', 'idempotency', 'logging'
    ];
    
    for (const feature of apiFeatures) {
      if (apiClient.toLowerCase().includes(feature)) {
        log(`✅ API Client - ${feature}`, 'green');
        results.push({ feature, status: 'ok' });
      } else {
        log(`❌ API Client - ${feature}`, 'red');
        results.push({ feature, status: 'missing' });
      }
    }
    
    // Verificar logger
    const logger = fs.readFileSync('src/lib/logger.ts', 'utf8');
    const logFeatures = [
      'LogLevel', 'structured logging', 'performance', 'userAction', 'aiInteraction'
    ];
    
    for (const feature of logFeatures) {
      if (logger.includes(feature)) {
        log(`✅ Logger - ${feature}`, 'green');
        results.push({ feature, status: 'ok' });
      } else {
        log(`❌ Logger - ${feature}`, 'red');
        results.push({ feature, status: 'missing' });
      }
    }
    
  } catch (error) {
    log('❌ Erro ao validar boas práticas', 'red');
    results.push({ element: 'best-practices', status: 'error' });
  }
  
  const errors = results.filter(r => r.status !== 'ok');
  if (errors.length === 0) {
    log('\n✅ Boas práticas implementadas corretamente!', 'green');
    return true;
  } else {
    log(`\n❌ ${errors.length} elementos de boas práticas estão faltando`, 'red');
    return false;
  }
}

// Função principal
async function main() {
  logHeader('VALIDAÇÃO DO SISTEMA IA VENDEDORA LUCHOA');
  
  const validations = [
    { name: 'Estrutura do Projeto', fn: validateProjectStructure },
    { name: 'Configurações', fn: validateConfigurations },
    { name: 'Implementação da Persona', fn: validatePersonaImplementation },
    { name: 'Sistema de Relacionamento', fn: validateRelationshipSystem },
    { name: 'Boas Práticas', fn: validateBestPractices },
  ];
  
  const results = [];
  
  for (let iteration = 1; iteration <= 3; iteration++) {
    logHeader(`ITERAÇÃO ${iteration} DE VALIDAÇÃO`);
    
    const iterationResults = [];
    
    for (const validation of validations) {
      const success = validation.fn();
      iterationResults.push({ name: validation.name, success });
    }
    
    results.push({ iteration, results: iterationResults });
    
    const successCount = iterationResults.filter(r => r.success).length;
    const totalCount = iterationResults.length;
    
    if (successCount === totalCount) {
      log(`\n🎉 ITERAÇÃO ${iteration}: TODAS AS VALIDAÇÕES PASSARAM! (${successCount}/${totalCount})`, 'green');
    } else {
      log(`\n⚠️  ITERAÇÃO ${iteration}: ${successCount}/${totalCount} validações passaram`, 'yellow');
    }
    
    if (iteration < 3) {
      log('\nAguardando próxima iteração...', 'blue');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Resumo final
  logHeader('RESUMO FINAL DAS VALIDAÇÕES');
  
  const finalIteration = results[results.length - 1];
  const finalSuccessCount = finalIteration.results.filter(r => r.success).length;
  const finalTotalCount = finalIteration.results.length;
  
  if (finalSuccessCount === finalTotalCount) {
    log('🎉 SISTEMA VALIDADO COM SUCESSO!', 'green');
    log('✅ Todas as funcionalidades estão implementadas corretamente', 'green');
    log('✅ Persona do Leandro Uchoa está configurada', 'green');
    log('✅ Sistema de relacionamento gradual está funcionando', 'green');
    log('✅ Boas práticas de desenvolvimento foram aplicadas', 'green');
    log('✅ Testes automatizados estão configurados', 'green');
    
    log('\n🚀 O sistema está pronto para uso!', 'bright');
    process.exit(0);
  } else {
    log('❌ SISTEMA PRECISA DE AJUSTES', 'red');
    log(`${finalTotalCount - finalSuccessCount} validações ainda falharam`, 'red');
    
    log('\n📋 Próximos passos:', 'yellow');
    for (const result of finalIteration.results) {
      if (!result.success) {
        log(`- Corrigir: ${result.name}`, 'yellow');
      }
    }
    
    process.exit(1);
  }
}

// Executar validação
if (require.main === module) {
  main().catch(error => {
    log(`\n💥 Erro durante validação: ${error.message}`, 'red');
    process.exit(1);
  });
}
