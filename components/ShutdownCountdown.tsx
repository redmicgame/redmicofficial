import React, { useEffect, useState } from 'react';

// November 15, 2026 at 12:00:00 AM EST (UTC-5) === November 15, 2026 at 05:00:00 UTC
export const SHUTDOWN_TARGET_UTC_MS = Date.UTC(2026, 10, 15, 5, 0, 0);

interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isComplete: boolean;
}

function getTimeRemaining(targetMs: number): CountdownState {
  const diff = targetMs - Date.now();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isComplete: true };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds, isComplete: false };
}

function padTwo(value: number): string {
  return String(value).padStart(2, '0');
}

export const ShutdownCountdown: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [remaining, setRemaining] = useState<CountdownState>(() =>
    getTimeRemaining(SHUTDOWN_TARGET_UTC_MS)
  );

  useEffect(() => {
    setRemaining(getTimeRemaining(SHUTDOWN_TARGET_UTC_MS));
    const interval = setInterval(() => {
      setRemaining(getTimeRemaining(SHUTDOWN_TARGET_UTC_MS));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const units = [
    { label: 'Days', value: padTwo(remaining.days) },
    { label: 'Hours', value: padTwo(remaining.hours) },
    { label: 'Minutes', value: padTwo(remaining.minutes) },
    { label: 'Seconds', value: padTwo(remaining.seconds) },
  ];

  return (
    <div
      className={`rounded-xl border border-red-500/40 bg-gradient-to-br from-zinc-900 via-zinc-950 to-red-950/30 shadow-lg ${
        compact ? 'p-3.5 sm:p-4' : 'p-4 sm:p-5'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
          <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-red-400">
            Red Mic Shutdown
          </h3>
        </div>
        <span className="text-[11px] sm:text-xs font-semibold text-zinc-400">
          Nov 15, 2026 • 12:00 AM EST
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {units.map((unit) => (
          <div
            key={unit.label}
            className="bg-zinc-900/90 border border-zinc-800 rounded-lg py-2.5 px-1.5 flex flex-col items-center justify-center shadow-inner"
          >
            <span className="text-xl sm:text-2xl font-black text-white tabular-nums tracking-tight leading-none">
              {unit.value}
            </span>
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-400 mt-1.5">
              {unit.label}
            </span>
          </div>
        ))}
      </div>

      {remaining.isComplete && (
        <p className="text-center text-xs font-bold text-red-400 mt-2.5 uppercase tracking-wider">
          Shutdown Window Reached
        </p>
      )}
    </div>
  );
};

export default ShutdownCountdown;
