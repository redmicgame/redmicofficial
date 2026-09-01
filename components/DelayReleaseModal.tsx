import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { LabelSubmission, GameDate } from '../types';
import { getDateFromGameWeek, formatFullDateString } from './CalendarDatePicker';

interface DelayReleaseModalProps {
  submission: LabelSubmission;
  onClose: () => void;
}

export const DelayReleaseModal: React.FC<DelayReleaseModalProps> = ({
  submission,
  onClose,
}) => {
  const { dispatch } = useGame();
  const [delayWeeks, setDelayWeeks] = useState<number>(2);

  const currentRelDate = submission.projectReleaseDate || { year: 2026, week: 1, day: 5 };
  
  // Calculate new date
  const currentTotalWeeks = currentRelDate.year * 52 + currentRelDate.week;
  const newTotalWeeks = currentTotalWeeks + delayWeeks;
  const newYear = Math.floor((newTotalWeeks - 1) / 52);
  const newWeek = ((newTotalWeeks - 1) % 52) + 1;
  const newProjectReleaseDate: GameDate = {
    year: newYear,
    week: newWeek,
    day: currentRelDate.day || 5,
  };

  const dayOffset = (newProjectReleaseDate.day || 5) - 1;
  const targetDate = new Date(newProjectReleaseDate.year, 0, (newProjectReleaseDate.week - 1) * 7 + 1 + dayOffset);
  const formattedNewDate = targetDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedCurrentDate = formatFullDateString(currentRelDate);

  const handleConfirmDelay = () => {
    dispatch({
      type: 'DELAY_SCHEDULED_RELEASE',
      payload: {
        submissionId: submission.id,
        delayWeeks,
      },
    });
    onClose();
  };

  const presetWeeks = [1, 2, 3, 4, 6, 8, 12];

  return (
    <div
      className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-700 text-white w-full max-w-md rounded-2xl p-6 space-y-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-zinc-800 pb-3">
          <img
            src={submission.release.coverArt}
            alt={submission.release.title}
            className="w-14 h-14 rounded-lg object-cover border border-zinc-700 flex-shrink-0"
          />
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">
              Delay {submission.release.type === 'EP' ? 'EP' : 'Album'}
            </h2>
            <p className="text-sm text-zinc-300 font-semibold truncate">
              {submission.release.title}
            </p>
          </div>
        </div>

        <p className="text-xs text-zinc-400">
          Push back your release date. Pop Base will immediately post a breaking tweet with your cover art and the new calendar date.
        </p>

        {/* Delay weeks selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
            Delay By (Weeks):
          </label>
          <div className="grid grid-cols-4 gap-2">
            {presetWeeks.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setDelayWeeks(w)}
                className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                  delayWeeks === w
                    ? 'bg-amber-500 text-black border-amber-400 shadow-md font-black'
                    : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                }`}
              >
                +{w} {w === 1 ? 'Week' : 'Weeks'}
              </button>
            ))}
          </div>
        </div>

        {/* Date Comparison Banner */}
        <div className="bg-zinc-800/80 p-3.5 rounded-xl border border-zinc-700/60 space-y-2 text-xs">
          <div className="flex justify-between items-center text-zinc-400">
            <span>Currently Scheduled:</span>
            <span className="font-semibold text-zinc-300 line-through">
              {formattedCurrentDate}
            </span>
          </div>
          <div className="flex justify-between items-center text-amber-300 font-bold text-sm pt-1 border-t border-zinc-700/50">
            <span>New Release Date:</span>
            <span className="text-amber-400 underline decoration-amber-500/50">
              {formattedNewDate}
            </span>
          </div>
        </div>

        {/* Tweet Preview */}
        <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-xs text-zinc-300 flex items-start gap-2.5">
          <span className="text-sm">🐦</span>
          <div>
            <p className="font-bold text-white text-[11px]">Pop Base Announcement Preview:</p>
            <p className="text-zinc-400 mt-0.5 text-[11px] italic">
              "The artist's upcoming {submission.release.type === 'EP' ? 'EP' : 'album'} '{submission.release.title}' has been delayed to {formattedNewDate}."
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-2.5 rounded-xl text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmDelay}
            className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold py-2.5 rounded-xl text-xs shadow-lg transition-all"
          >
            Confirm Delay (+{delayWeeks}w)
          </button>
        </div>
      </div>
    </div>
  );
};
