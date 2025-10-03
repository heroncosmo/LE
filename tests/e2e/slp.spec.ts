import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

async function waitAssistantIncrement(page) {
  const before = await page.locator('[data-testid="assistant-message"]').count();
  await page.waitForFunction((prev) => {
    return document.querySelectorAll('[data-testid="assistant-message"]').length > prev;
  }, before, { timeout: 60_000 });
}

function wordCount(s: string){
  return (s || '').trim().split(/\s+/).filter(Boolean).length;
}

function hasForbiddenEarly(text: string){
  const hay = (text||'').toLowerCase();
  const forbid = ['foto', 'fotos', 'preço', 'preco', 'catálogo', 'catalogo', 'container', 'orçamento', 'orcamento'];
  return forbid.some(k => hay.includes(k));
}

function tooManyQuestions(text: string){
  const qs = (text.match(/\?/g) || []).length;
  return qs > 2; // no máximo 1–2 perguntas
}

test.describe('SLP – 3 conversas completas (8–10 turnos)', () => {
  test.setTimeout(300_000);

  const cases = [
    { name: 'Arquiteto BR', client: 'Rodrigo', context: 'Primeiro contato; prefere materiais claros e uniformes; prazos curtos.' },
    { name: 'Marmorista BR', client: 'Carla', context: 'Giro rápido e confiabilidade; volumes modestos; SP capital.' },
    { name: 'Distribuidor US', client: 'Alex', context: 'US distributor; prefers local resellers; small volumes; uniformity matters.' },
  ];

  for (const c of cases){
    test(`${c.name} – conversa completa com rapport 3–5 turnos`, async ({ page }) => {
      await page.goto(BASE_URL);

      // Perfil
      await page.waitForSelector('#profile-screen');
      await page.selectOption('#persona', { label: c.name });
      await page.fill('#clientName', c.client);
      await page.fill('#context', c.context);

      // Iniciar
      await page.click('#start');
      await page.waitForSelector('#chat-screen');
      await waitAssistantIncrement(page);

      // Coleta primeiras 5 mensagens do assistente (rapport-only)
      let assistantTexts: string[] = [];
      for (let i=0; i<5; i++){
        const texts = await page.$$eval('[data-testid="assistant-message"]', ns => ns.map(n => n.textContent || ''));
        assistantTexts = texts;
        if (texts.length >= (i+1)){
          const msg = texts[i] || '';
          // Heurísticas
          expect(wordCount(msg)).toBeLessThanOrEqual(100);
          expect(tooManyQuestions(msg)).toBeFalsy();
          expect(hasForbiddenEarly(msg)).toBeFalsy();
        }
        // Envia um ping humano curto para manter o ritmo
        await page.fill('#msgInput', i === 0 ? 'Oi, tudo bem e você?' : (i===1 ? 'Tranquilo por aqui.' : 'Conte-me mais.'));
        await page.click('#sendBtn');
        await waitAssistantIncrement(page);
      }

      // Avançar para qualificação e micro-compromisso (8–10 turnos totais)
      const prompts = [
        'Estamos olhando tons claros para cozinhas.',
        'Uniformidade é importante para nós.',
        'O que você sugere como próximo passo?'
      ];
      for (const p of prompts){
        await page.fill('#msgInput', p);
        await page.click('#sendBtn');
        await waitAssistantIncrement(page);
      }

      // Coleta final e validações gerais
      const finalAssistant = await page.$$eval('[data-testid="assistant-message"]', ns => ns.map(n => n.textContent || ''));
      expect(finalAssistant.length).toBeGreaterThanOrEqual(6);

      // Deve ter avançado progressivamente (sem dumps longos)
      for (const m of finalAssistant){
        expect(wordCount(m)).toBeLessThanOrEqual(100);
      }

      // No mínimo uma menção a rapport/escuta ativa (paráfrase simples) OU um sinal claro de acolhimento humano
      const hay = finalAssistant.join(' \n ').toLowerCase();
      const paraphrasePT = ['entendi', 'entendo', 'faz sentido', 'se eu entendi', 'pelo que você', 'você comentou', 'seu ponto'];
      const paraphraseEN = ['i see', 'got it', 'makes sense', 'i understand', 'as you said', 'from what you said'];
      const ackPT = ['beleza', 'show', 'perfeito', 'legal', 'boa'];
      const isUS = /US|Europa/i.test(c.name);
      const paraphraseHits = (isUS ? paraphraseEN.concat(paraphrasePT) : paraphrasePT).some(k => hay.includes(k));
      const ackHits = (!isUS) && ackPT.some(k => hay.includes(k));
      expect(paraphraseHits || ackHits).toBeTruthy();

      // Ao final, deve sugerir um micro‑compromisso leve (sem pressão)
      const micro = ['faz sentido', 'quer que eu', 'te mando', 'posso separar', 'preferem ver', 'fechou', 'combinado', 'vamos nessa', 'bora', 'shall i', 'can i send', 'would you like'];
      expect(micro.some(k => hay.includes(k))).toBeTruthy();

      // Screenshot da sessão
      await page.screenshot({ path: `reports/e2e/local-run/slp-${c.name.replace(/\s+/g,'_')}.png`, fullPage: true });
    });
  }
});

