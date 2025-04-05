import { Suspense } from 'react';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 text-white">
      <main className="flex flex-col items-center justify-center text-center p-8">
        <h1 className="text-8xl font-bold tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-pink-300 animate-pulse">
          Axistant
        </h1>
        <p className="text-xl max-w-2xl opacity-80 mb-8">
          Bridge API service for Zapier integration
        </p>
        <div className="p-4 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 shadow-xl">
          <code className="text-sm font-mono">
            POST /api/zapier
          </code>
        </div>
      </main>
    </div>
  );
}
