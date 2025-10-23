/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@google/genai'],
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };
    return config;
  },
  env: {
    GEMINI_API_KEY: process.env.VITE_GEMINI_API_KEY || '',
    OPENAI_API_KEY: process.env.VITE_OPENAI_API_KEY || '',
    ANTHROPIC_API_KEY: process.env.VITE_ANTHROPIC_API_KEY || '',
  },
}

export default nextConfig
