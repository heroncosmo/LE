import { test, expect } from '@playwright/test';

// Helper: wait for a condition with polling
async function waitFor<T>(fn: () => Promise<T>, predicate: (v: T) => boolean, timeoutMs = 8000, intervalMs = 200) {
  const start = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const v = await fn();
    if (predicate(v)) return v;
    if (Date.now() - start > timeoutMs) throw new Error('Timeout waiting for condition');
    await new Promise(r => setTimeout(r, intervalMs));
  }
}

test.describe('Chat progressivo (estilo WhatsApp)', () => {
  test.skip(({ browserName }) => browserName === 'webkit', 'Skip WebKit/Mobile Safari por comportamento divergente de redirect/loading.');
  for (let i = 1; i <= 3; i++) {
    test(`resposta progressiva com múltiplas bolhas - run #${i}`, async ({ page }) => {
      // 1) Seed confiável no localStorage → navegação direta ao chat
      page.on('console', msg => console.log('BROWSER:', msg.type(), msg.text()));
      page.on('pageerror', err => console.log('PAGEERROR:', err.message));
      await page.goto('http://localhost:3000');
      await page.evaluate(() => {
        const profile = {
          id: `e2e-${Date.now()}`,
          name: 'Teste Progressivo',
          personalProfile: 'Cliente final testando mensagens progressivas.',
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
      const stored = await page.evaluate(() => localStorage.getItem('userProfile'));
      console.log('DEBUG userProfile=', stored);
      await expect(page.getByRole('heading', { name: 'Leandro Uchoa' })).toBeVisible({ timeout: 20000 });

      // 2) Mensagem do usuário
      const input = page.getByPlaceholder('Digite sua mensagem...');
      await input.fill('Quanto custa um mármore branco? Quero entender as diferenças.');
      await input.press('Enter');

      // 3) Contagem inicial de bolhas da IA (já inclui a mensagem de boas-vindas)
      const aiBubbles = page.locator('.message-ai');
      const beforeCount = await aiBubbles.count();

      // 4) Deve aparecer indicador de digitando em algum momento
      const typingIndicator = page.locator('.typing-indicator');
      await expect(typingIndicator).toBeVisible({ timeout: 5000 });

      // 5) Esperar pelo menos +2 novas bolhas da IA dentro do prazo
      await waitFor(async () => await aiBubbles.count(), (c) => c >= beforeCount + 2, 15000, 300);

      // 6) Indicador deve sumir ao final
      await expect(typingIndicator).toBeHidden({ timeout: 6000 });

      // 7) Validar tamanho das últimas bolhas (curtas)
      const afterCount = await aiBubbles.count();
      const lastN = Math.min(3, afterCount); // validar últimas até 3 bolhas
      for (let idx = afterCount - lastN; idx < afterCount; idx++) {
        const text = await aiBubbles.nth(idx).innerText();
        expect(text.length).toBeLessThanOrEqual(220); // tolerância
      }
    });
  }
});

