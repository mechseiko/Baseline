import { useState } from 'react';
import { LogomarkIndicator } from './BaselineIndicator';

const ROLES = ['CHW View', 'Doctor View'];

/**
 * NavBar — top navigation bar.
 * Left: Baseline logomark + product name.
 * Right: Role toggle (CHW View / Doctor View).
 */
export default function NavBar({ role, onRoleChange }) {
  return (
    <header
      className="sticky top-0 z-30 w-full"
      style={{ backgroundColor: '#0E4B44' }}
    >
      <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
        {/* ── Logomark + wordmark ── */}
        <div className="flex items-center gap-2.5">
          <LogomarkIndicator className="text-white opacity-90" />
          <span
            className="text-white font-serif text-lg font-semibold tracking-tight leading-none"
            style={{ fontFamily: '"IBM Plex Serif", Georgia, serif' }}
          >
            Baseline
          </span>
        </div>

        {/* ── Role toggle ── */}
        <div
          className="flex items-center rounded-full p-0.5 gap-0.5"
          style={{ backgroundColor: 'rgba(255,255,255,0.10)' }}
          role="group"
          aria-label="View mode"
        >
          {ROLES.map((r) => {
            const active = r === role;
            return (
              <button
                key={r}
                id={`role-toggle-${r.replace(/\s+/g, '-').toLowerCase()}`}
                onClick={() => onRoleChange(r)}
                className={`
                  px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-200
                  ${active
                    ? 'text-white shadow-sm'
                    : 'text-white/60 hover:text-white/90'}
                `}
                style={active ? { backgroundColor: '#B8703F' } : {}}
                aria-pressed={active}
              >
                {r}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
