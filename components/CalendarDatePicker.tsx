import React, { useState } from 'react';
import { GameDate } from '../types';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';

interface CalendarDatePickerProps {
  currentDate: GameDate;
  selectedDate: GameDate;
  onSelectDate: (date: GameDate) => void;
  isSigned?: boolean;
  minDate?: GameDate;
  labelName?: string;
  title?: string;
  minDateErrorMessage?: string;
  subtitle?: string;
  onClose?: () => void;
}

export const getDateFromGameWeek = (year: number, week: number, day: number = 1): Date => {
  const dayOffset = (day - 1);
  return new Date(year, 0, (week - 1) * 7 + 1 + dayOffset);
};

export const getGameWeekFromDate = (date: Date): { week: number; year: number; day: number; isFriday: boolean } => {
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const diffDays = Math.round((date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
  const week = Math.min(52, Math.max(1, Math.floor(diffDays / 7) + 1));
  const day = (diffDays % 7) + 1;
  const isFriday = date.getDay() === 5;
  return { week, year, day, isFriday };
};

export const formatFullDateString = (gameDate: GameDate): string => {
  const day = gameDate.day || 1;
  const date = getDateFromGameWeek(gameDate.year, gameDate.week, day);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const CalendarDatePicker: React.FC<CalendarDatePickerProps> = ({
  currentDate,
  selectedDate,
  onSelectDate,
  isSigned = false,
  minDate,
  labelName,
  title = "Select Release Date",
  minDateErrorMessage,
  subtitle,
  onClose,
}) => {
  // Start view at selectedDate's month or currentDate's month
  const initialDate = getDateFromGameWeek(selectedDate.year, selectedDate.week, selectedDate.day || 1);
  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth()); // 0-11
  const [errorNotice, setErrorNotice] = useState<string>('');

  const minGameTotalDays = minDate
    ? minDate.year * 364 + (minDate.week - 1) * 7 + (minDate.day || 1)
    : currentDate.year * 364 + (currentDate.week - 1) * 7 + (currentDate.day || 1);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun, 5 = Fri

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  const handleDayClick = (dayNumber: number) => {
    setErrorNotice('');
    const targetDate = new Date(viewYear, viewMonth, dayNumber);
    const dayOfWeek = targetDate.getDay(); // 5 = Friday
    const isFriday = dayOfWeek === 5;

    // Calculate game week and day
    const { week: calculatedWeek, day: calculatedDay } = getGameWeekFromDate(targetDate);
    const targetTotalDays = viewYear * 364 + (calculatedWeek - 1) * 7 + calculatedDay;

    if (targetTotalDays <= minGameTotalDays) {
      setErrorNotice(minDateErrorMessage || "Date must be scheduled in the future.");
      return;
    }

    if (isSigned && !isFriday) {
      setErrorNotice(
        labelName
          ? `${labelName} only allows releases on Fridays (New Music Friday). Please tap a highlighted Friday date.`
          : `Record labels require all releases to drop on Friday (New Music Friday). Please tap a highlighted Friday date.`
      );
      return;
    }

    // Set date preserving exact week and day
    onSelectDate({
      year: viewYear,
      week: calculatedWeek,
      day: calculatedDay,
    });
  };

  const selectedDateObj = getDateFromGameWeek(selectedDate.year, selectedDate.week, selectedDate.day || 1);

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 w-full shadow-2xl">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-white text-base">{title}</h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Current Date: <span className="text-emerald-400 font-semibold">{formatFullDateString(currentDate)}</span> (Week {currentDate.week})
          </p>
          {subtitle && (
            <p className="text-[11px] text-amber-400 font-medium mt-0.5">{subtitle}</p>
          )}
          {isSigned && (
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-600/40 px-2 py-0.5 rounded-full inline-block mt-1">
              Friday Releases Only (Label Policy)
            </span>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white text-sm bg-zinc-800 hover:bg-zinc-700 rounded-full w-7 h-7 flex items-center justify-center font-bold"
          >
            ✕
          </button>
        )}
      </div>

      {/* Month & Year Navigation */}
      <div className="flex justify-between items-center bg-zinc-800/80 px-3 py-2 rounded-lg mb-3">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-1 rounded hover:bg-zinc-700 text-zinc-300 hover:text-white"
          aria-label="Previous Month"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        <span className="font-bold text-white text-sm">
          {monthNames[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          onClick={handleNextMonth}
          className="p-1 rounded hover:bg-zinc-700 text-zinc-300 hover:text-white"
          aria-label="Next Month"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-zinc-400 mb-1">
        <span>Sun</span>
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span className="text-emerald-400 font-bold">Fri</span>
        <span>Sat</span>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {/* Empty cells before month start */}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="h-9" />
        ))}

        {/* Days of current month */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNumber = i + 1;
          const targetDate = new Date(viewYear, viewMonth, dayNumber);
          const dayOfWeek = targetDate.getDay();
          const isFriday = dayOfWeek === 5;

          const { week: calculatedWeek, day: dayInWeek } = getGameWeekFromDate(targetDate);
          const targetTotalDays = viewYear * 364 + (calculatedWeek - 1) * 7 + dayInWeek;

          const isPast = targetTotalDays <= minGameTotalDays;
          const isSelected =
            selectedDateObj.getFullYear() === viewYear &&
            selectedDateObj.getMonth() === viewMonth &&
            selectedDateObj.getDate() === dayNumber;

          let btnClass = "h-9 rounded-lg font-semibold transition-all flex flex-col items-center justify-center relative ";

          if (isSelected) {
            btnClass += "bg-emerald-500 text-black font-extrabold shadow-lg shadow-emerald-500/40 ring-2 ring-white ";
          } else if (isPast) {
            btnClass += "text-zinc-600 cursor-not-allowed opacity-40 ";
          } else if (isFriday) {
            btnClass += "bg-emerald-950/70 border border-emerald-500/60 text-emerald-300 hover:bg-emerald-600 hover:text-black font-bold cursor-pointer ";
          } else if (isSigned) {
            btnClass += "text-zinc-500 hover:bg-zinc-800/60 cursor-pointer opacity-50 ";
          } else {
            btnClass += "text-zinc-200 hover:bg-zinc-700 cursor-pointer ";
          }

          return (
            <button
              key={`day-${dayNumber}`}
              type="button"
              onClick={() => handleDayClick(dayNumber)}
              className={btnClass}
              title={
                isFriday
                  ? `New Music Friday (Week ${calculatedWeek})`
                  : isSigned
                  ? `Fridays only for signed artists`
                  : `Week ${calculatedWeek}`
              }
            >
              <span>{dayNumber}</span>
              {isFriday && !isSelected && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 -mt-0.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* Error / Notice */}
      {errorNotice && (
        <div className="mt-3 p-2 bg-red-950/80 border border-red-500/50 rounded-lg text-red-300 text-xs font-medium text-center">
          {errorNotice}
        </div>
      )}

      {/* Selected Date Summary */}
      <div className="mt-4 pt-3 border-t border-zinc-800 flex justify-between items-center text-xs">
        <div>
          <span className="text-zinc-400">Scheduled Date: </span>
          <span className="text-emerald-400 font-bold">
            {formatFullDateString(selectedDate)} (Week {selectedDate.week})
          </span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-black font-bold rounded-md"
          >
            Done
          </button>
        )}
      </div>
    </div>
  );
};
