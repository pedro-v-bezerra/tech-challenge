'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

import { LiveIndicator } from './live-indicator';

/** Moldura da aplicação: barra superior com marca + indicador ao vivo, conteúdo e rodapé. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              B
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-slate-900">BIUD</span>
              <span className="text-xs text-slate-500">Transações</span>
            </span>
          </Link>
          <LiveIndicator />
        </div>
      </header>

      <div className="flex-1">{children}</div>

      <footer className="border-t border-slate-200 py-6">
        <p className="mx-auto max-w-5xl px-6 text-xs text-slate-400">
          Arquitetura orientada a eventos · transactions ↔ anti-fraud via Kafka
        </p>
      </footer>
    </div>
  );
}
