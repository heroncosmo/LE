'use strict';

function getKey(){
  const url = new URL(window.location.href);
  const k = url.searchParams.get('key') || document.getElementById('key').value.trim();
  return k;
}

async function fetchConfig(){
  const key = getKey();
  if(!key){
    document.getElementById('saveStatus').innerHTML = '<span class="err">Informe a key na URL (?key=...) ou no campo acima.</span>';
    return;
  }
  const res = await fetch(`/admin/config?key=${encodeURIComponent(key)}`);
  if(!res.ok){
    document.getElementById('saveStatus').innerHTML = '<span class="err">Não autorizado (verifique a key)</span>';
    return;
  }
  const data = await res.json();
  const cfg = data && data.config ? data.config : {};
  document.getElementById('adminInstructions').value = cfg.admin_instructions || '';
  document.getElementById('relationshipFirst').checked = !!cfg.relationship_first;
  document.getElementById('outboundInitiate').checked = !!cfg.outbound_initiate;
  // Salva override localmente para que o chat use enquanto não houver KV compartilhado
  try{ localStorage.setItem('le_admin_instructions', cfg.admin_instructions || ''); }catch(e){}
  document.getElementById('saveStatus').innerHTML = '<span class="ok">Config carregada</span>';
}

async function saveConfig(){
  const key = getKey();
  const cfg = {
    admin_instructions: document.getElementById('adminInstructions').value,
    relationship_first: document.getElementById('relationshipFirst').checked,
    outbound_initiate: document.getElementById('outboundInitiate').checked,
  };
  const res = await fetch(`/admin/config?key=${encodeURIComponent(key)}`, {
    method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ config: cfg })
  });
  if(!res.ok){
    document.getElementById('saveStatus').innerHTML = '<span class="err">Falha ao salvar</span>';
    return;
  }
  // persiste tambm no localStorage para que a UI principal use imediatamente
  try{ localStorage.setItem('le_admin_instructions', cfg.admin_instructions || ''); }catch(e){}
  document.getElementById('saveStatus').innerHTML = '<span class="ok">Salvo</span>';
}

async function testOpening(){
  const key = getKey();
  const p = {
    persona: document.getElementById('persona').value,
    client_name: document.getElementById('clientName').value,
    context: document.getElementById('context').value,
  };
  document.getElementById('testStatus').textContent = 'Testando…';
  const res = await fetch(`/admin/test?key=${encodeURIComponent(key)}`, {
    method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(p)
  });
  if(!res.ok){
    document.getElementById('testStatus').innerHTML = '<span class="err">Falha no teste</span>';
    return;
  }
  const data = await res.json();
  document.getElementById('reply').textContent = data.reply || '';
  document.getElementById('testStatus').innerHTML = '<span class="ok">OK</span>';
}

window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('loadBtn').addEventListener('click', fetchConfig);
  document.getElementById('saveBtn').addEventListener('click', saveConfig);
  document.getElementById('testBtn').addEventListener('click', testOpening);
  // auto-load if key in URL
  const url = new URL(window.location.href);
  if (url.searchParams.get('key')) fetchConfig();
});

