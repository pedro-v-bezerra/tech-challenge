'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

import { BiudLogo } from './biud-logo';
import { LiveIndicator } from './live-indicator';

/** Moldura da aplicação: barra superior com marca + indicador ao vivo, conteúdo e rodapé. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3">
          <Link href="/" className="flex items-center gap-3">
            <BiudLogo className="h-6 w-auto text-brand-600" />
            <span className="hidden h-5 w-px bg-slate-200 sm:block" aria-hidden="true" />
            <span className="hidden text-sm font-medium text-slate-500 sm:block">Transações</span>
          </Link>
          <LiveIndicator />
        </div>
      </header>

      <div className="flex-1">{children}</div>

      <footer className="border-t border-slate-200 py-6">
        <p className="mx-auto max-w-5xl px-6 text-xs text-slate-400">
          Desenvolvido por Pedro Lima para o Tech Challenge BIUD
        </p>
      </footer>
    </div>
  );
}
