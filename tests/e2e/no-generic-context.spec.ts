import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

async function waitAssistantIncrement(page) {
  const before = await page.locator('[data-testid="assistant-message"]').count();
  await page.waitForFunction((prev) => {
    return document.querySelectorAll('[data-testid="assistant-message"]').length > prev;
  }, before, { timeout: 60_000 });
}

test.describe('Proibição de frases genéricas de contexto', () => {
  test.setTimeout(240_000);

  const banned = [
    'prefere me contar seu contexto',
    'quer me contar seu contexto',
    'prefere seguir assim',
    'quer seguir assim',
    'prefere me contar um pouco do seu contexto',
    'prefere me contar o seu contexto',
    'preferem me contar seu contexto'
  ];

  test('Arquiteto BR – não repete pergunta genérica', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForSelector('#profile-screen');
    await page.selectOption('#persona', { label: 'Arquiteto BR' });
    await page.fill('#clientName', 'Rodrigo');
    await page.fill('#context', 'Primeiro contato; prefere materiais claros.');

    await page.click('#start');
    await page.waitForSelector('#chat-screen');
    await waitAssistantIncrement(page);

    for (let i = 0; i < 4; i++){
      const msgs = await page.$$eval('[data-testid="assistant-message"]', ns => ns.map(n => (n.textContent||'').toLowerCase()));
      const all = msgs.join(' \n ');
      expect(banned.some(b => all.includes(b))).toBeFalsy();
      await page.fill('#msgInput', i === 0 ? 'Tudo certo por aqui.' : 'Tranquilo, segue.');
      await page.click('#sendBtn');
      await waitAssistantIncrement(page);
    }
  });
});

