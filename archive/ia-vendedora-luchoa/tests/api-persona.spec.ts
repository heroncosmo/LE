import { test, expect, request } from '@playwright/test';

test.describe('API Chat Persona/Progressivo', () => {
  const baseURL = 'http://localhost:3000';
  const userProfile = {
    id: `e2e-${Date.now()}`,
    name: 'QA Persona',
    personalProfile: 'Cliente final testando via API.',
    preferences: [],
    teamAffiliations: [],
    market: 'brasil',
    userType: 'cliente-final',
    createdAt: new Date().toISOString(),
  } as any;

  test('responde com chunks progressivos e frase assinatura', async ({ playwright }) => {
    const context = await request.newContext({ baseURL });
    const res = await context.post('/api/chat', {
      data: {
        message: 'Quanto custa um mármore branco? Me explique o que muda de lote para lote e o que faz sentido para durabilidade e manutenção.',
        userProfile,
        conversationHistory: [],
      },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();

    // Deve retornar ou messageChunks (progressivo) ou message
    const chunks: string[] = json.messageChunks || [];
    const message: string = json.message || '';
    console.log('API DEBUG chunks=', chunks);
    console.log('API DEBUG message=', message);

    expect(chunks.length > 0 || message.length > 0).toBeTruthy();

    // Se chunks vieram, validar 2-5 bolhas curtas
    if (chunks.length > 0) {
      expect(chunks.length).toBeGreaterThanOrEqual(2);
      expect(chunks.length).toBeLessThanOrEqual(5);
      for (const c of chunks) {
        const words = c.trim().split(/\s+/).filter(Boolean).length;
        expect(words).toBeGreaterThanOrEqual(5);
        expect(words).toBeLessThanOrEqual(22);
      }
    }

    // Validar presença de frase assinatura em pelo menos um chunk ou na mensagem
    const hay = chunks.join(' \n ') + ' ' + message;
    const signature = /Faz sentido pra você\?|Quer que eu te (envie|mande) as fotos reais agora|Posso te mandar 2–3 lotes|Deixa eu separar algo que eu cuidaria como se fosse pra mim/i;
    expect(signature.test(hay)).toBeTruthy();
  });
});

