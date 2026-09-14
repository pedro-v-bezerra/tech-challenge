'use client';

import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * Modal acessível (role=dialog, fecha no Esc e no backdrop, trava o scroll do body).
 * Vira bottom sheet no mobile e card centralizado a partir de sm.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="animate-modal-pop relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-xl sm:rounded-2xl"
      >
        <header className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </header>
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
      <style>{`@keyframes modal-pop{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:none}}.animate-modal-pop{animation:modal-pop .18s ease-out}@media (prefers-reduced-motion:reduce){.animate-modal-pop{animation:none}}`}</style>
    </div>,
    document.body,
  );
}
