import { test, expect } from '@playwright/test';

test.describe('Frases assinatura e micro-compromissos', () => {
  test.skip(({ browserName }) => browserName === 'webkit', 'Skip WebKit/Mobile Safari por comportamento de redirect.');

  const PHRASE_REGEX = /(Faz sentido pra você\?|Quer que eu te (envie|mande) as fotos reais agora|Posso te mandar 2–3 lotes|Deixa eu separar algo que eu cuidaria como se fosse pra mim)/i;

  for (let i = 1; i <= 3; i++) {
    test(`run #${i}`, async ({ page }) => {
      // Seed confiável no localStorage → navegação direta ao chat
      await page.goto('http://localhost:3000');
      await page.evaluate(() => {
        const profile = {
          id: `e2e-${Date.now()}`,
          name: 'Teste Frases',
          personalProfile: 'Cliente final testando frases assinatura.',
          preferences: [],
          teamAffiliations: [],
          market: 'brasil',
          userType: 'cliente-final',
          createdAt: new Date(),
        } as any;
        localStorage.setItem('userProfile', JSON.stringify(profile));
      });
      await page.goto('http://localhost:3000/conversa');
      await expect(page).toHaveURL(/\/conversa$/);
      await expect(page.getByRole('heading', { name: 'Leandro Uchoa' })).toBeVisible({ timeout: 20000 });

      const input = page.getByPlaceholder('Digite sua mensagem...');
      await input.fill('Quanto custa um mármore branco? Quero entender preço e o que muda com padrão de lote.');
      await input.press('Enter');

      const aiBubbles = page.locator('.message-ai');
      const initial = await aiBubbles.count();

      await page.waitForTimeout(15000);
      const count = await aiBubbles.count();
      expect(count).toBeGreaterThanOrEqual(initial + 1);

      const lastN = Math.min(5, count);
      let found = false;
      for (let idx = count - lastN; idx < count; idx++) {
        const text = await aiBubbles.nth(idx).innerText();
        if (PHRASE_REGEX.test(text)) { found = true; break; }
      }
      if (!found) {
        for (let idx = 0; idx < count; idx++) {
          const text = await aiBubbles.nth(idx).innerText();
          if (PHRASE_REGEX.test(text)) { found = true; break; }
        }
      }
      expect(found).toBeTruthy();
    });
  }
});

