import { test, expect } from '@playwright/test';

// Helper to seed a minimal profile
async function seedProfile(page) {
  await page.addInitScript(() => {
    const temp = {
      id: `e2e-${Date.now()}`,
      name: 'Visitante E2E',
      personalProfile: 'Perfil de teste',
      preferences: [],
      teamAffiliations: [],
      market: 'brasil',
      userType: 'cliente-final',
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem('userProfile', JSON.stringify(temp));
  });
}

test.describe('UI contrast and contextual responses', () => {
  test('Input and bubbles are readable, and fallback is contextual for greeting', async ({ page }) => {
    await seedProfile(page);
    await page.goto('http://localhost:3000/conversa');

    // Wait for welcome message
    await expect(page.locator('.message-ai').first()).toBeVisible();

    // Check input textarea contrast (color vs background)
    const ta = page.locator('textarea[placeholder="Digite sua mensagem..."]');
    await expect(ta).toBeVisible();
    const taStyles = await ta.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { color: cs.color, background: cs.backgroundColor, borderColor: cs.borderColor };
    });
    // Expect non-white text on light bg
    expect(taStyles.color).not.toBe('rgb(255, 255, 255)');

    // Send greeting
    await ta.fill('oi');
    await ta.press('Enter');

    // Wait for at least +2 AI bubbles (progressive)
    const bubbles = page.locator('.message-ai');
    const before = await bubbles.count();
    await expect(async () => {
      const now = await bubbles.count();
      expect(now).toBeGreaterThanOrEqual(before + 2);
    }).toPass({ timeout: 15000 });

    // Get latest AI texts and check for contextual greeting patterns
    const texts = await bubbles.allTextContents();
    const tail = texts.slice(-3).join(' \n ');
    expect(/Oi! Sou o Leandro|Posso te mandar 2–3 lotes|Faz sentido\?/i.test(tail)).toBeTruthy();

    // Check bubble contrast (text not white)
    const lastBubble = bubbles.last();
    const bubbleColor = await lastBubble.evaluate((el) => getComputedStyle(el).color);
    expect(bubbleColor).not.toBe('rgb(255, 255, 255)');
  });

  test('Fallback adapts to price inquiry', async ({ page }) => {
    await seedProfile(page);
    await page.goto('http://localhost:3000/conversa');

    const ta = page.locator('textarea[placeholder="Digite sua mensagem..."]');
    await ta.fill('qual o preço do mármore?');
    await ta.press('Enter');

    const bubbles = page.locator('.message-ai');
    const before = await bubbles.count();
    await expect(async () => {
      const now = await bubbles.count();
      expect(now).toBeGreaterThanOrEqual(before + 2);
    }).toPass({ timeout: 20000 });

    const tailText = (await bubbles.allTextContents()).slice(-3).join(' \n ');
    console.log('DEBUG tailText price inquiry ->', tailText);
    expect(/preço.*lote|lote.*preço|fotos reais/i.test(tailText)).toBeTruthy();
  });
});

