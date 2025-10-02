import { test, expect } from '@playwright/test';

test.describe('AI Behavior and Persona', () => {
  test.beforeEach(async ({ page }) => {
    // Setup usuário para testes
    await page.goto('/');
    await page.fill('input[id="name"]', 'Carlos Marmorista');
    await page.fill('textarea[id="personalProfile"]', 'Marmorista com 15 anos de experiência no mercado brasileiro');
    await page.selectOption('select[id="userType"]', 'marmorista');
    await page.selectOption('select[id="market"]', 'brasil');
    await page.click('button[type="submit"]');
    await page.waitForURL('/chat');
  });

  test('should respond with Leandro persona characteristics', async ({ page }) => {
    // Mock resposta que deve conter características da persona
    await page.route('/api/chat', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Entendi, Carlos! Me fala: qual padrão você está comparando? Porque na mesma pedreira você pode ter blocos que geram chapas a R$ 900/m² e outros do mesmo material a R$ 1.600/m², dependendo do desenho, uniformidade e qualidade de polimento. Faz sentido pra você?',
          nextStage: 'calibracao',
          detectedIntent: 'price_inquiry',
          confidence: 0.95
        })
      });
    });

    const messageInput = page.locator('textarea[placeholder*="Digite sua mensagem"]');
    await messageInput.fill('O preço tá alto em relação ao outro fornecedor');
    await messageInput.press('Enter');

    // Verificar frases características da persona
    await expect(page.locator('text=Faz sentido pra você?')).toBeVisible();
    await expect(page.locator('text=padrão de lote')).toBeVisible();
    await expect(page.locator('text=R$ 900/m²')).toBeVisible();
  });

  test('should adapt language to user market (Brasil)', async ({ page }) => {
    await page.route('/api/chat', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Perfeito! Estamos falando de quantos m² aproximadamente? E qual seria o prazo ideal para você receber o material?',
          nextStage: 'demonstracao',
          confidence: 0.9
        })
      });
    });

    const messageInput = page.locator('textarea[placeholder*="Digite sua mensagem"]');
    await messageInput.fill('Preciso de material para um projeto');
    await messageInput.press('Enter');

    // Verificar uso de m² (mercado brasileiro)
    await expect(page.locator('text=m²')).toBeVisible();
    // Não deve aparecer sqft
    await expect(page.locator('text=sqft')).not.toBeVisible();
  });

  test('should detect price objection and respond appropriately', async ({ page }) => {
    await page.route('/api/chat', async route => {
      const requestBody = await route.request().postDataJSON();
      
      // Verificar se a API detectou corretamente a intenção
      expect(requestBody.message).toContain('caro');
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Normal, Carlos. Mas deixa eu te perguntar: baseado em qual material/lote ficou caro? Se eu igualasse o preço do comparativo, qual você escolheria? Por quê?',
          detectedIntent: 'price_inquiry',
          relationshipMetrics: {
            trustLevel: 45,
            readinessToReceiveOffers: 30
          },
          confidence: 0.92
        })
      });
    });

    const messageInput = page.locator('textarea[placeholder*="Digite sua mensagem"]');
    await messageInput.fill('Achei meio caro esse material');
    await messageInput.press('Enter');

    // Verificar resposta específica para objeção de preço
    await expect(page.locator('text=baseado em qual material')).toBeVisible();
    await expect(page.locator('text=qual você escolheria')).toBeVisible();
  });

  test('should show relationship progression', async ({ page }) => {
    // Simular múltiplas interações para construir relacionamento
    const interactions = [
      {
        user: 'Oi, tudo bem?',
        ai: 'Oi Carlos! Tudo ótimo, obrigado! Como você está? Como tem sido o mercado por aí nas últimas semanas?'
      },
      {
        user: 'O mercado está bem movimentado, muitos projetos residenciais',
        ai: 'Que bom ouvir isso! Projetos residenciais são sempre interessantes. Que tipo de materiais têm saído melhor na sua região?'
      },
      {
        user: 'Mármores brancos e quartzitos claros estão em alta',
        ai: 'Perfeito! Esses materiais realmente fazem sucesso. Deixa eu separar alguns lotes premium que temos disponíveis. Quer que eu te envie as fotos reais agora?'
      }
    ];

    for (let i = 0; i < interactions.length; i++) {
      await page.route('/api/chat', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: interactions[i].ai,
            relationshipMetrics: {
              trustLevel: 30 + (i * 20),
              engagementLevel: 40 + (i * 15),
              readinessToReceiveOffers: 20 + (i * 25),
              relationshipStage: i === 0 ? 'inicial' : i === 1 ? 'desenvolvimento' : 'confianca'
            },
            confidence: 0.9
          })
        });
      });

      const messageInput = page.locator('textarea[placeholder*="Digite sua mensagem"]');
      await messageInput.fill(interactions[i].user);
      await messageInput.press('Enter');

      await expect(page.locator(`text=${interactions[i].ai.substring(0, 20)}`)).toBeVisible();
      
      // Na última interação, deve estar pronto para ofertas
      if (i === interactions.length - 1) {
        await expect(page.locator('text=fotos reais')).toBeVisible();
      }
    }
  });

  test('should handle different user types appropriately', async ({ page }) => {
    // Testar resposta específica para marmorista
    await page.route('/api/chat', async route => {
      const requestBody = await route.request().postDataJSON();
      
      // Verificar se o perfil do usuário foi enviado corretamente
      expect(requestBody.userProfile.userType).toBe('marmorista');
      expect(requestBody.userProfile.market).toBe('brasil');
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Entendi, Carlos! Como marmorista experiente, você sabe que o diferencial está no padrão do lote. Isso te dá margem melhor com o cliente final. Quer que eu separe alguns lotes que estão girando bem?',
          confidence: 0.9
        })
      });
    });

    const messageInput = page.locator('textarea[placeholder*="Digite sua mensagem"]');
    await messageInput.fill('Estou procurando materiais que tenham boa saída');
    await messageInput.press('Enter');

    // Verificar linguagem específica para marmorista
    await expect(page.locator('text=margem melhor')).toBeVisible();
    await expect(page.locator('text=girando bem')).toBeVisible();
  });

  test('should use signature phrases appropriately', async ({ page }) => {
    const signaturePhrases = [
      'Faz sentido pra você?',
      'Não é só o nome da pedra; é o lote que muda tudo',
      'Deixa eu separar algo que eu cuidaria como se fosse pra mim',
      'Quer que eu te envie as fotos reais agora?'
    ];

    // Testar diferentes cenários que devem triggerar frases características
    for (const phrase of signaturePhrases) {
      await page.route('/api/chat', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: `Entendi perfeitamente! ${phrase} E alinhamos os próximos passos?`,
            confidence: 0.9
          })
        });
      });

      const messageInput = page.locator('textarea[placeholder*="Digite sua mensagem"]');
      await messageInput.fill('Me explica melhor sobre os materiais');
      await messageInput.press('Enter');

      await expect(page.locator(`text=${phrase}`)).toBeVisible();
      
      // Limpar para próximo teste
      await page.reload();
      await page.waitForLoadState('networkidle');
    }
  });

  test('should maintain conversation context', async ({ page }) => {
    // Primeira mensagem estabelecendo contexto
    await page.route('/api/chat', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Projeto residencial, que interessante! Quantos banheiros você está planejando? E qual é o perfil do cliente?',
          confidence: 0.9
        })
      });
    });

    let messageInput = page.locator('textarea[placeholder*="Digite sua mensagem"]');
    await messageInput.fill('Tenho um projeto residencial com 3 banheiros');
    await messageInput.press('Enter');

    // Segunda mensagem que deve referenciar o contexto anterior
    await page.route('/api/chat', async route => {
      const requestBody = await route.request().postDataJSON();
      
      // Verificar se o histórico da conversa foi enviado
      expect(requestBody.conversationHistory).toBeDefined();
      expect(requestBody.conversationHistory.length).toBeGreaterThan(0);
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Perfeito! Para esses 3 banheiros de alto padrão, eu recomendaria lotes com uniformidade superior. Quer que eu separe algumas opções de mármores brancos premium?',
          confidence: 0.95
        })
      });
    });

    messageInput = page.locator('textarea[placeholder*="Digite sua mensagem"]');
    await messageInput.fill('É um cliente de alto padrão, quer o melhor');
    await messageInput.press('Enter');

    // Verificar que a resposta faz referência ao contexto (3 banheiros)
    await expect(page.locator('text=3 banheiros')).toBeVisible();
    await expect(page.locator('text=alto padrão')).toBeVisible();
  });

  test('should handle conversation stages progression', async ({ page }) => {
    const stages = [
      { stage: 'abertura', message: 'Oi, como vai?', expectedResponse: 'Como tem sido o mercado' },
      { stage: 'exploracao', message: 'Preciso de materiais', expectedResponse: 'Que tipo de projeto' },
      { stage: 'calibracao', message: 'É para banheiros', expectedResponse: 'qual é o uso final' },
      { stage: 'demonstracao', message: 'Quero ver opções', expectedResponse: 'fotos reais' },
      { stage: 'compromisso', message: 'Gostei, qual o preço?', expectedResponse: 'padrão de lote' }
    ];

    for (let i = 0; i < stages.length; i++) {
      await page.route('/api/chat', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: `Resposta para estágio ${stages[i].stage}. ${stages[i].expectedResponse} que você mencionou.`,
            currentStage: stages[i].stage,
            nextStage: i < stages.length - 1 ? stages[i + 1].stage : 'followup',
            confidence: 0.9
          })
        });
      });

      const messageInput = page.locator('textarea[placeholder*="Digite sua mensagem"]');
      await messageInput.fill(stages[i].message);
      await messageInput.press('Enter');

      await expect(page.locator(`text=${stages[i].expectedResponse}`)).toBeVisible();
    }
  });
});
