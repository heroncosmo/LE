import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

async function waitAssistantIncrement(page) {
  const before = await page.locator('[data-testid="assistant-message"]').count();
  await page.waitForFunction((prev) => {
    return document.querySelectorAll('[data-testid="assistant-message"]').length > prev;
  }, before, { timeout: 60_000 });
}

test.describe('Tom autêntico WhatsApp (Leandro)', () => {
  test.setTimeout(240_000);

  const markersPT = [
    'ó','olha','fechou','fechado','beleza','fala','fala pra mim','opa','ok',
    'pra voce ter uma nocao','pra você ter uma noção','tá?','ta?','tá bom','ta bom','tranquilo','firmeza','combinado','show','rapidinho'
  ];
  const contractions = ['tô','to ','pra ',' cê ',' ce ',' vamo',' tá ',' ta '];

  test('Arquiteto BR – abertura e 2 respostas com tom humano', async ({ page }) => {
    await page.goto(BASE_URL);

    // Perfil BR
    await page.waitForSelector('#profile-screen');
    await page.selectOption('#persona', { label: 'Arquiteto BR' });
    await page.fill('#clientName', 'Rodrigo');
    await page.fill('#context', 'Primeiro contato; prefere materiais claros.');

    // Iniciar conversa
    await page.click('#start');
    await page.waitForSelector('#chat-screen');
    await waitAssistantIncrement(page);

    // Coletar 3 primeiras mensagens do assistente
    let msgs = await page.$$eval('[data-testid="assistant-message"]', ns => ns.map(n => n.textContent || ''));

    // Enviar pings humanos para obter 2–3 respostas
    await page.fill('#msgInput', 'Tudo certo. E por aí?');
    await page.click('#sendBtn');
    await waitAssistantIncrement(page);
    await page.fill('#msgInput', 'Beleza. Me conta mais.');
    await page.click('#sendBtn');
    await waitAssistantIncrement(page);
    await page.fill('#msgInput', 'Show. E timing, como cê tá?');
    await page.click('#sendBtn');
    await waitAssistantIncrement(page);

    msgs = await page.$$eval('[data-testid="assistant-message"]', ns => ns.map(n => n.textContent || ''));
    // Amplia a janela para 5 mensagens do assistente
    const windowText = (msgs.slice(0,5).join(' ')).toLowerCase();
    const nameCount = (windowText.match(/rodrigo/g) || []).length;
    expect(nameCount).toBeGreaterThanOrEqual(1);

    // Marcadores de oralidade (pelo menos 1)
    expect(markersPT.some(k => windowText.includes(k))).toBeTruthy();

    // Contrações típicas (pelo menos 1)
    expect(contractions.some(k => windowText.includes(k))).toBeTruthy();

    // Sinais de ação concreta OU micro-compromisso leve (pelo menos 1)
    const action = [
      'vou separar','posso separar','vou te mandar','te mando','vou mandar','vou te enviar','posso te enviar',
      'fala pra mim quando','me fala quando','me diz quando','combina quando'
    ];
    const micro = ['faz sentido','quer que eu','posso separar','posso te enviar','te mando','beleza','fechou','combinado','que tal','bora','vamos fazer assim','te envio'];
    expect(action.some(k => windowText.includes(k)) || micro.some(k => windowText.includes(k))).toBeTruthy();
  });
});

