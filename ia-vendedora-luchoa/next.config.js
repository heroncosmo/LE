/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  },
  typescript: {
    // Ignora erros de tipos durante build para evitar falhas em libs de terceiros (ex.: csstype)
    ignoreBuildErrors: true,
  },
  eslint: {
    // Evita falha de build por lint em pipeline de testes
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
