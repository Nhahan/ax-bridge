"use client";

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const GraphView = dynamic(() => import('@/components/GraphView'), { 
  ssr: false,
});

export default function Home() {
  return (
    <div className="flex flex-col h-screen bg-[#000428] text-white relative overflow-hidden">
      {/* Position Header and ensure text gradient works */}
      <header className="absolute top-0 left-0 right-0 p-6 text-center z-10 pointer-events-none opacity-60">
        <h1 className="text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-fuchsia-500 to-indigo-700 mb-1 inline-block">
          Axistant
        </h1>
        <p className="text-base text-gray-400 opacity-80">
          Bridge API Service for Seamless Integrations
        </p>
      </header>
      {/* Ensure main takes full space and canvas fills it */}
      <main className="flex-grow h-full w-full">
        <Suspense fallback={null}> 
          <GraphView /> 
        </Suspense>
      </main>
    </div>
  );
}
