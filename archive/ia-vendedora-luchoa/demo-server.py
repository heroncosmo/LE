#!/usr/bin/env python3
"""
Servidor de demonstração para o Sistema IA Vendedora Luchoa
Simula o comportamento da aplicação Next.js para testes com Playwright
"""

import http.server
import socketserver
import json
import urllib.parse
import os
import sys
from datetime import datetime

PORT = 3000

class DemoHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory="demo-static", **kwargs)
    
    def do_GET(self):
        if self.path == '/':
            self.serve_index()
        elif self.path == '/chat':
            self.serve_chat()
        elif self.path.startswith('/api/'):
            self.serve_api()
        else:
            super().do_GET()
    
    def do_POST(self):
        if self.path == '/api/chat':
            self.handle_chat_api()
        else:
            self.send_error(404)
    
    def serve_index(self):
        """Serve a página de cadastro"""
        html = """
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IA Vendedora Luchoa - Cadastro</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 min-h-screen">
    <div class="container mx-auto px-4 py-8">
        <div class="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
            <h1 class="text-2xl font-bold text-center mb-6 text-gray-800">
                🤖 IA Vendedora Luchoa
            </h1>
            <p class="text-gray-600 text-center mb-6">
                Sistema de prospecção e relacionamento com clientes
            </p>
            
            <form id="cadastroForm" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                    <input type="text" id="nome" name="nome" required 
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                           placeholder="Seu nome completo">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Perfil Pessoal</label>
                    <textarea id="perfil" name="perfil" rows="3" required
                              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Conte um pouco sobre você e seu trabalho..."></textarea>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de Usuário</label>
                    <select id="userType" name="userType" required
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Selecione...</option>
                        <option value="arquiteto">Arquiteto</option>
                        <option value="marmorista">Marmorista</option>
                        <option value="distribuidor">Distribuidor</option>
                        <option value="cliente_final">Cliente Final</option>
                    </select>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Mercado de Atuação</label>
                    <select id="market" name="market" required
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Selecione...</option>
                        <option value="brasil">Brasil</option>
                        <option value="usa">Estados Unidos</option>
                        <option value="europa">Europa</option>
                        <option value="america_latina">América Latina</option>
                        <option value="asia">Ásia</option>
                        <option value="oriente_medio">Oriente Médio</option>
                    </select>
                </div>
                
                <button type="submit" 
                        class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200">
                    Iniciar Conversa com Leandro
                </button>
            </form>
        </div>
    </div>
    
    <script>
        document.getElementById('cadastroForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const userData = {
                nome: formData.get('nome'),
                perfil: formData.get('perfil'),
                userType: formData.get('userType'),
                market: formData.get('market'),
                id: 'user_' + Date.now()
            };
            
            localStorage.setItem('userProfile', JSON.stringify(userData));
            window.location.href = '/chat';
        });
    </script>
</body>
</html>
        """
        
        self.send_response(200)
        self.send_header('Content-type', 'text/html; charset=utf-8')
        self.end_headers()
        self.wfile.write(html.encode('utf-8'))
    
    def serve_chat(self):
        """Serve a página de chat"""
        html = """
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chat com Leandro Uchoa</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 h-screen flex flex-col">
    <div class="bg-green-600 text-white p-4 flex items-center">
        <div class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-3">
            <span class="text-lg font-bold">L</span>
        </div>
        <div>
            <h1 class="font-semibold">Leandro Uchoa</h1>
            <p class="text-sm text-green-100">Consultor Luchoa Revestimentos</p>
        </div>
    </div>
    
    <div id="chatMessages" class="flex-1 overflow-y-auto p-4 space-y-4">
        <div class="flex">
            <div class="bg-white rounded-lg p-3 max-w-xs shadow">
                <p class="text-sm">Olá! Sou o Leandro da Luchoa Revestimentos. Prazer em conhecer você! 😊</p>
                <p class="text-xs text-gray-500 mt-1">Agora</p>
            </div>
        </div>
    </div>
    
    <div class="bg-white border-t p-4">
        <div class="flex space-x-2">
            <input type="text" id="messageInput" 
                   class="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                   placeholder="Digite sua mensagem...">
            <button id="sendButton" 
                    class="bg-green-600 text-white rounded-full p-2 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                </svg>
            </button>
        </div>
    </div>
    
    <script>
        const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        const conversationHistory = [];
        
        if (!userProfile.nome) {
            window.location.href = '/';
        }
        
        function addMessage(content, isUser = false) {
            const messagesDiv = document.getElementById('chatMessages');
            const messageDiv = document.createElement('div');
            messageDiv.className = isUser ? 'flex justify-end' : 'flex';
            
            messageDiv.innerHTML = `
                <div class="${isUser ? 'bg-green-600 text-white' : 'bg-white'} rounded-lg p-3 max-w-xs shadow">
                    <p class="text-sm">${content}</p>
                    <p class="text-xs ${isUser ? 'text-green-100' : 'text-gray-500'} mt-1">Agora</p>
                </div>
            `;
            
            messagesDiv.appendChild(messageDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
        
        async function sendMessage() {
            const input = document.getElementById('messageInput');
            const message = input.value.trim();
            
            if (!message) return;
            
            addMessage(message, true);
            input.value = '';
            
            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message,
                        userProfile,
                        conversationHistory
                    })
                });
                
                const data = await response.json();
                addMessage(data.message);
                
                conversationHistory.push({ user: message, ai: data.message });
                
            } catch (error) {
                addMessage('Desculpe, tive um problema técnico. Pode repetir?');
            }
        }
        
        document.getElementById('sendButton').addEventListener('click', sendMessage);
        document.getElementById('messageInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
        
        // Mensagem inicial personalizada
        setTimeout(() => {
            addMessage(`Oi ${userProfile.nome}! Vi que você é ${userProfile.userType} no mercado ${userProfile.market}. Que legal! Como posso te ajudar hoje?`);
        }, 1000);
    </script>
</body>
</html>
        """
        
        self.send_response(200)
        self.send_header('Content-type', 'text/html; charset=utf-8')
        self.end_headers()
        self.wfile.write(html.encode('utf-8'))
    
    def handle_chat_api(self):
        """Simula a API de chat com respostas da persona Leandro"""
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        try:
            data = json.loads(post_data.decode('utf-8'))
            message = data.get('message', '')
            user_profile = data.get('userProfile', {})
            
            # Simular resposta da IA baseada na persona Leandro
            response_message = self.generate_leandro_response(message, user_profile)
            
            response = {
                'message': response_message,
                'currentStage': 'exploracao',
                'relationshipMetrics': {
                    'trustLevel': 75,
                    'engagementLevel': 80,
                    'readinessToReceiveOffers': 60,
                    'relationshipStage': 'desenvolvimento'
                },
                'confidence': 0.9
            }
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
            
        except Exception as e:
            self.send_error(500, f"Erro interno: {str(e)}")
    
    def generate_leandro_response(self, message, user_profile):
        """Gera resposta simulada baseada na persona Leandro Uchoa"""
        message_lower = message.lower()
        user_type = user_profile.get('userType', '')
        market = user_profile.get('market', '')
        
        # Respostas baseadas na persona
        if any(word in message_lower for word in ['oi', 'olá', 'bom dia', 'boa tarde']):
            return f"Oi! Que bom falar com você! Sou o Leandro da Luchoa. Vi que você é {user_type}, trabalho muito com profissionais como você. Faz sentido pra você se eu entender melhor o que você tá buscando?"
        
        elif any(word in message_lower for word in ['mármore', 'granito', 'pedra', 'revestimento']):
            return "Perfeito! Trabalhamos com as melhores rochas ornamentais do mercado. Uma coisa que sempre falo pros meus clientes: o segredo tá no padrão de lote. Deixa eu te explicar - quando você compra uma pedra, não é só a beleza que importa, é a consistência do padrão em todo o lote. Faz sentido pra você?"
        
        elif any(word in message_lower for word in ['preço', 'valor', 'custo', 'orçamento']):
            return "Olha, entendo sua preocupação com investimento. Mas deixa eu te falar uma coisa: pedra natural é investimento de longo prazo. O que parece mais caro hoje, amanhã você vai ver que foi economia. Quer que eu separe algumas opções com fotos reais pra você ver a diferença na qualidade?"
        
        elif any(word in message_lower for word in ['qualidade', 'durabilidade', 'resistência']):
            return "Essa é a pergunta certa! Nossa pedra vem direto da jazida, com controle de qualidade rigoroso. Cada lote passa por análise técnica completa. Posso te mostrar os laudos técnicos e fotos reais dos materiais. Qual tipo de aplicação você tá pensando?"
        
        elif any(word in message_lower for word in ['entrega', 'prazo', 'quando']):
            return "Ótima pergunta! Nosso prazo padrão é de 15 a 20 dias úteis, mas isso pode variar dependendo do material e quantidade. O importante é que você receba exatamente o que combinou, no padrão de lote correto. Prefere que eu verifique a disponibilidade de algum material específico?"
        
        else:
            # Resposta genérica mantendo o tom da persona
            return "Interessante! Deixa eu entender melhor sua necessidade. Na Luchoa, a gente sempre trabalha focado na solução ideal para cada cliente. Cada projeto é único, faz sentido pra você? Me conta mais detalhes do que você tá pensando."

def main():
    # Criar diretório para arquivos estáticos se não existir
    os.makedirs("demo-static", exist_ok=True)
    
    print(f"🚀 Servidor de demonstração IA Vendedora Luchoa")
    print(f"📍 Rodando em: http://localhost:{PORT}")
    print(f"🤖 Persona: Leandro Uchoa - Luchoa Revestimentos")
    print(f"⏰ Iniciado em: {datetime.now().strftime('%H:%M:%S')}")
    print(f"🔄 Pressione Ctrl+C para parar")
    
    with socketserver.TCPServer(("", PORT), DemoHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print(f"\n🛑 Servidor parado em: {datetime.now().strftime('%H:%M:%S')}")

if __name__ == "__main__":
    main()
