#!/usr/bin/env python3
"""
Servidor Python para IA Vendedora Luchoa
Inicia automaticamente o servidor Next.js e gerencia o processo.
"""

import os
import sys
import subprocess
import signal
import time
import threading
import requests
import shutil
from pathlib import Path

class LuchoaServer:
    def __init__(self):
        self.process = None
        self.server_url = "http://localhost:3000"
        self.project_dir = Path(__file__).parent
        self.running = False
        
    def log(self, message, level="INFO"):
        """Log com timestamp e nível"""
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] [{level}] {message}")
        
    def check_port_available(self, port=3000):
        """Verifica se a porta está disponível"""
        try:
            response = requests.get(f"http://localhost:{port}", timeout=2)
            return False  # Porta em uso
        except requests.exceptions.RequestException:
            return True  # Porta disponível
            
    def wait_for_server(self, timeout=60):
        """Aguarda o servidor ficar disponível"""
        self.log("Aguardando servidor ficar disponível...")
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            try:
                response = requests.get(self.server_url, timeout=2)
                if response.status_code == 200:
                    self.log("✅ Servidor disponível!", "SUCCESS")
                    return True
            except requests.exceptions.RequestException:
                pass
            time.sleep(1)
            
        self.log("❌ Timeout aguardando servidor", "ERROR")
        return False
        
    def start_nextjs(self):
        """Inicia o servidor Next.js"""
        # Verificar Node.js e npm via which
        node_cmd = shutil.which('node')
        npm_cmd = shutil.which('npm') or shutil.which('npm.cmd')
        if not node_cmd:
            self.log("❌ Node.js não encontrado no PATH. Instale Node.js primeiro.", "ERROR")
            return False
        else:
            self.log(f"✅ Node.js encontrado: {node_cmd}")
        if not npm_cmd:
            self.log("❌ npm não encontrado no PATH. Instale Node.js (inclui npm).", "ERROR")
            return False
        else:
            self.log(f"✅ npm encontrado: {npm_cmd}")
            
        # Verificar se package.json existe
        package_json = self.project_dir / "package.json"
        if not package_json.exists():
            self.log("❌ package.json não encontrado", "ERROR")
            return False
            
        self.log("✅ Arquivos do projeto encontrados")
        
        # Verificar se a porta está disponível
        if not self.check_port_available():
            self.log("⚠️  Porta 3000 já está em uso", "WARNING")
            self.log("Tentando conectar ao servidor existente...")
            if self.wait_for_server(timeout=5):
                self.log("✅ Conectado ao servidor existente")
                return True
            else:
                self.log("❌ Não foi possível conectar ao servidor na porta 3000", "ERROR")
                return False
        
        # Iniciar servidor Next.js
        self.log("🚀 Iniciando servidor Next.js...")
        try:
            npm_cmd = shutil.which('npm') or shutil.which('npm.cmd')
            if not npm_cmd:
                self.log("❌ npm não encontrado no PATH.", "ERROR")
                return False
            self.process = subprocess.Popen(
                [npm_cmd, "run", "dev"],
                cwd=str(self.project_dir),
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                universal_newlines=True,
                shell=False
            )

            # Thread para monitorar output do servidor
            output_thread = threading.Thread(target=self._monitor_output)
            output_thread.daemon = True
            output_thread.start()
            
            # Aguardar servidor ficar disponível
            if self.wait_for_server():
                self.running = True
                return True
            else:
                self.stop()
                return False
                
        except Exception as e:
            self.log(f"❌ Erro ao iniciar servidor: {e}", "ERROR")
            return False
            
    def _monitor_output(self):
        """Monitora output do servidor Next.js"""
        if not self.process:
            return
            
        for line in iter(self.process.stdout.readline, ''):
            if line.strip():
                # Exibir todo o output para facilitar o diagnóstico no Windows
                self.log(f"Next.js: {line.strip()}", "DEBUG")
                    
    def stop(self):
        """Para o servidor"""
        if self.process:
            self.log("🛑 Parando servidor...")
            try:
                # Tentar parar graciosamente
                self.process.terminate()
                self.process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                # Forçar parada se necessário
                self.log("Forçando parada do servidor...", "WARNING")
                self.process.kill()
                self.process.wait()
            finally:
                self.process = None
                self.running = False
                self.log("✅ Servidor parado")
                
    def signal_handler(self, signum, frame):
        """Handler para sinais (Ctrl+C)"""
        self.log("\n🛑 Recebido sinal de parada...")
        self.stop()
        sys.exit(0)
        
    def run(self):
        """Executa o servidor"""
        # Configurar handler para Ctrl+C
        signal.signal(signal.SIGINT, self.signal_handler)
        if hasattr(signal, 'SIGTERM'):
            signal.signal(signal.SIGTERM, self.signal_handler)
            
        self.log("🎯 IA Vendedora Luchoa - Servidor Python")
        self.log("=" * 50)
        
        if not self.start_nextjs():
            self.log("❌ Falha ao iniciar servidor", "ERROR")
            return False
            
        self.log("=" * 50)
        self.log(f"🌐 Aplicação disponível em: {self.server_url}")
        self.log(f"📁 Diretório do projeto: {self.project_dir}")
        self.log("💡 Pressione Ctrl+C para parar o servidor")
        self.log("=" * 50)
        
        try:
            # Manter o processo principal vivo
            while self.running:
                time.sleep(1)
                # Verificar se o processo ainda está rodando
                if self.process and self.process.poll() is not None:
                    self.log("❌ Servidor Next.js parou inesperadamente", "ERROR")
                    break
        except KeyboardInterrupt:
            pass
        finally:
            self.stop()
            
        return True

def main():
    """Função principal"""
    server = LuchoaServer()
    success = server.run()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
