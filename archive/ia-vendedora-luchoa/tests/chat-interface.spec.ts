import { test, expect } from '@playwright/test';

test.describe('Chat Interface', () => {
  test.beforeEach(async ({ page }) => {
    // Simular usuário registrado
    await page.goto('/');
    
    // Preencher e submeter formulário de registro
    await page.fill('input[id="name"]', 'Test User');
    await page.fill('textarea[id="personalProfile"]', 'Test profile for automated testing');
    await page.selectOption('select[id="userType"]', 'marmorista');
    await page.selectOption('select[id="market"]', 'brasil');
    
    await page.click('button[type="submit"]');
    await page.waitForURL('/chat');
  });

  test('should display chat interface correctly', async ({ page }) => {
    // Verificar elementos do header
    await expect(page.locator('h1:has-text("Leandro Uchoa")')).toBeVisible();
    await expect(page.locator('text=Luchoa Revestimentos Naturais')).toBeVisible();
    await expect(page.locator('text=Test User')).toBeVisible();
    
    // Verificar área de mensagens
    await expect(page.locator('.chat-container')).toBeVisible();
    
    // Verificar área de input
    await expect(page.locator('textarea[placeholder*="Digite sua mensagem"]')).toBeVisible();
    await expect(page.locator('button[type="button"]').last()).toBeVisible(); // Send button
  });

  test('should show welcome message from Leandro', async ({ page }) => {
    // Verificar se a mensagem de boas-vindas aparece
    await expect(page.locator('text=Bom dia! Tudo bem?')).toBeVisible();
    await expect(page.locator('text=Leandro Uchoa')).toBeVisible();
    await expect(page.locator('text=Como tem sido o mercado')).toBeVisible();
  });

  test('should send and receive messages', async ({ page }) => {
    // Mock da API response
    await page.route('/api/chat', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Entendi! Que tipo de projeto você tem em mente?',
          nextStage: 'exploracao',
          currentStage: 'abertura',
          detectedIntent: 'project_discussion',
          confidence: 0.9
        })
      });
    });

    const messageInput = page.locator('textarea[placeholder*="Digite sua mensagem"]');
    const sendButton = page.locator('button').last();

    // Enviar mensagem
    await messageInput.fill('Estou trabalhando em um projeto residencial');
    await sendButton.click();

    // Verificar que a mensagem do usuário aparece
    await expect(page.locator('text=Estou trabalhando em um projeto residencial')).toBeVisible();

    // Verificar que a resposta da IA aparece
    await expect(page.locator('text=Entendi! Que tipo de projeto você tem em mente?')).toBeVisible();

    // Verificar que o input foi limpo
    await expect(messageInput).toHaveValue('');
  });

  test('should send message with Enter key', async ({ page }) => {
    await page.route('/api/chat', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Perfeito! Me conte mais sobre isso.',
          nextStage: 'exploracao',
          currentStage: 'abertura',
          confidence: 0.9
        })
      });
    });

    const messageInput = page.locator('textarea[placeholder*="Digite sua mensagem"]');

    await messageInput.fill('Preciso de mármores para banheiro');
    await messageInput.press('Enter');

    await expect(page.locator('text=Preciso de mármores para banheiro')).toBeVisible();
    await expect(page.locator('text=Perfeito! Me conte mais sobre isso.')).toBeVisible();
  });

  test('should show typing indicator', async ({ page }) => {
    // Mock com delay para ver o typing indicator
    await page.route('/api/chat', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Resposta após delay',
          nextStage: 'exploracao',
          confidence: 0.9
        })
      });
    });

    const messageInput = page.locator('textarea[placeholder*="Digite sua mensagem"]');
    await messageInput.fill('Teste typing indicator');
    await messageInput.press('Enter');

    // Verificar que o typing indicator aparece
    await expect(page.locator('.typing-indicator')).toBeVisible();
    await expect(page.locator('.typing-dot')).toHaveCount(3);

    // Aguardar resposta e verificar que o typing indicator desaparece
    await expect(page.locator('text=Resposta após delay')).toBeVisible();
    await expect(page.locator('.typing-indicator')).not.toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock de erro da API
    await page.route('/api/chat', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Internal server error'
        })
      });
    });

    const messageInput = page.locator('textarea[placeholder*="Digite sua mensagem"]');
    await messageInput.fill('Mensagem que vai dar erro');
    await messageInput.press('Enter');

    // Verificar mensagem de erro amigável
    await expect(page.locator('text=Desculpe, tive um problema técnico')).toBeVisible();
  });

  test('should disable input during message sending', async ({ page }) => {
    await page.route('/api/chat', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Resposta',
          confidence: 0.9
        })
      });
    });

    const messageInput = page.locator('textarea[placeholder*="Digite sua mensagem"]');
    const sendButton = page.locator('button').last();

    await messageInput.fill('Teste disable');
    await sendButton.click();

    // Verificar que input e botão ficam desabilitados
    await expect(messageInput).toBeDisabled();
    await expect(sendButton).toBeDisabled();

    // Aguardar resposta e verificar que voltam a ficar habilitados
    await expect(page.locator('text=Resposta')).toBeVisible();
    await expect(messageInput).toBeEnabled();
    await expect(sendButton).toBeEnabled();
  });

  test('should format message timestamps correctly', async ({ page }) => {
    await page.route('/api/chat', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Resposta com timestamp',
          confidence: 0.9
        })
      });
    });

    const messageInput = page.locator('textarea[placeholder*="Digite sua mensagem"]');
    await messageInput.fill('Teste timestamp');
    await messageInput.press('Enter');

    // Verificar que timestamps aparecem no formato correto (HH:MM)
    const timestampRegex = /\d{2}:\d{2}/;
    const timestamps = page.locator('span:has-text(/\\d{2}:\\d{2}/)');
    
    await expect(timestamps.first()).toBeVisible();
    const timestampText = await timestamps.first().textContent();
    expect(timestampText).toMatch(timestampRegex);
  });

  test('should navigate back to registration', async ({ page }) => {
    const backButton = page.locator('button').first(); // Arrow left button
    
    await backButton.click();
    await expect(page).toHaveURL('/');
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Verificar que elementos são visíveis em mobile
    await expect(page.locator('h1:has-text("Leandro Uchoa")')).toBeVisible();
    await expect(page.locator('.chat-container')).toBeVisible();
    await expect(page.locator('textarea[placeholder*="Digite sua mensagem"]')).toBeVisible();

    // Verificar que o chat ocupa a altura correta
    const chatContainer = page.locator('.chat-container');
    const boundingBox = await chatContainer.boundingBox();
    expect(boundingBox?.height).toBeGreaterThan(300);
  });

  test('should auto-scroll to latest message', async ({ page }) => {
    // Enviar várias mensagens para testar scroll
    await page.route('/api/chat', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Resposta automática para teste de scroll',
          confidence: 0.9
        })
      });
    });

    const messageInput = page.locator('textarea[placeholder*="Digite sua mensagem"]');

    // Enviar múltiplas mensagens
    for (let i = 1; i <= 5; i++) {
      await messageInput.fill(`Mensagem ${i} para teste de scroll`);
      await messageInput.press('Enter');
      await page.waitForTimeout(500); // Aguardar resposta
    }

    // Verificar que a última mensagem está visível
    await expect(page.locator('text=Mensagem 5 para teste de scroll')).toBeVisible();
  });
});
