import React, { useState, useMemo, useRef } from 'react';
import { useGame } from '../context/GameContext';
import MusicNoteIcon from './icons/MusicNoteIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import XMarkIcon from './icons/XMarkIcon';
import FireIcon from './icons/FireIcon';
import ArrowUpTrayIcon from './icons/ArrowUpTrayIcon';

interface CoachellaLiveAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  emailId?: string;
  year?: number;
}

export const CoachellaLiveAlbumModal: React.FC<CoachellaLiveAlbumModalProps> = ({
  isOpen,
  onClose,
  emailId,
  year
}) => {
  const { gameState, dispatch, activeArtistData } = useGame();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !activeArtistData) return null;

  const currentYear = year || gameState.date.year;
  const artistName = activeArtistData.name || "Artist";

  const defaultCover = activeArtistData.artistImages?.[0] || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80';

  const [title, setTitle] = useState(`${artistName} - Live From Coachella ${currentYear}`);
  const [uploadedCover, setUploadedCover] = useState<string | null>(null);
  const [selectedSongIds, setSelectedSongIds] = useState<string[]>([]);
  const [error, setError] = useState('');

  // Eligible songs: all released songs or setlist songs
  const availableSongs = useMemo(() => {
    return (activeArtistData.songs || []).filter(s => s.isReleased || s.isRecorded || s.status === 'completed');
  }, [activeArtistData.songs]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file.');
        return;
      }
      setError('');
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUploadedCover(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleToggleSong = (songId: string) => {
    setError('');
    if (selectedSongIds.includes(songId)) {
      setSelectedSongIds(selectedSongIds.filter(id => id !== songId));
    } else {
      setSelectedSongIds([...selectedSongIds, songId]);
    }
  };

  const handleSelectAll = () => {
    setError('');
    setSelectedSongIds(availableSongs.map(s => s.id));
  };

  const handleDeselectAll = () => {
    setError('');
    setSelectedSongIds([]);
  };

  const handleRelease = () => {
    if (!title.trim()) {
      setError('Please enter an album title.');
      return;
    }
    if (selectedSongIds.length === 0) {
      setError('Please select at least 1 track for your Coachella live album.');
      return;
    }

    const finalCover = uploadedCover || defaultCover;

    dispatch({
      type: 'CREATE_COACHELLA_LIVE_ALBUM',
      payload: {
        emailId,
        title: title.trim(),
        coverArt: finalCover,
        selectedSongIds,
      }
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-white">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 bg-gradient-to-r from-orange-950 via-zinc-900 to-amber-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
              <FireIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-400">
                <span>Coachella {currentYear}</span>
                <span>•</span>
                <span>Official Live Album</span>
              </div>
              <h2 className="text-xl font-black text-white mt-0.5">Record & Release Live Coachella Album</h2>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium">
              {error}
            </div>
          )}

          {/* Album Title */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
              Album Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Live From Coachella 2026"
              className="w-full bg-zinc-800/80 border border-zinc-700/80 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors text-sm font-semibold"
            />
          </div>

          {/* Cover Art Upload */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
              Upload Album Cover
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />

            {uploadedCover ? (
              <div className="flex items-center gap-4 p-3 bg-zinc-800/40 border border-orange-500/30 rounded-xl">
                <img
                  src={uploadedCover}
                  alt="Uploaded Cover"
                  className="w-20 h-20 rounded-lg object-cover border border-zinc-700 shadow-md"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white">Custom Cover Uploaded</p>
                  <p className="text-xs text-zinc-400 mt-0.5">Image successfully attached to album</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 text-xs font-bold text-orange-400 hover:text-orange-300 transition-colors flex items-center gap-1"
                  >
                    <ArrowUpTrayIcon className="w-3.5 h-3.5" /> Change Image
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-700 hover:border-orange-500 bg-zinc-800/30 hover:bg-orange-500/5 rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
              >
                <div className="p-3 bg-zinc-800 group-hover:bg-orange-500/10 rounded-full text-zinc-400 group-hover:text-orange-400 transition-colors">
                  <ArrowUpTrayIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-200 group-hover:text-white">
                    Click to upload album cover artwork
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Upload image from device (PNG, JPG, WEBP)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Track Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Select Tracks ({selectedSongIds.length} selected)
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-xs font-bold text-orange-400 hover:underline"
                >
                  Select All
                </button>
                <span className="text-zinc-600">•</span>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="text-xs font-bold text-zinc-400 hover:underline"
                >
                  Clear
                </button>
              </div>
            </div>

            {availableSongs.length === 0 ? (
              <div className="p-6 text-center text-zinc-500 bg-zinc-800/30 rounded-xl border border-zinc-800 text-sm">
                No songs available to add. Write or record songs first.
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 divide-y divide-zinc-800/40">
                {availableSongs.map((song) => {
                  const isSelected = selectedSongIds.includes(song.id);
                  const cleanTitle = song.title.replace(/\s*\(Live From Coachella\)$/i, '');
                  const liveTitle = `${cleanTitle} (Live From Coachella)`;

                  return (
                    <div
                      key={song.id}
                      onClick={() => handleToggleSong(song.id)}
                      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer border transition-all ${
                        isSelected
                          ? 'bg-orange-500/10 border-orange-500/40 text-white'
                          : 'bg-zinc-800/30 border-zinc-800/60 hover:bg-zinc-800/60 text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'bg-orange-500 text-black' : 'border border-zinc-600'}`}>
                          {isSelected && <CheckCircleIcon className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate">{liveTitle}</p>
                          <p className="text-xs text-zinc-500">{song.genre || 'Music'} • Original: {song.title}</p>
                        </div>
                      </div>
                      <MusicNoteIcon className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-orange-400' : 'text-zinc-600'}`} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between">
          <div className="text-xs text-zinc-400">
            Every track will end with <strong className="text-orange-400">(Live From Coachella)</strong>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleRelease}
              className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-orange-500/20 transition-all"
            >
              Release Coachella Album
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoachellaLiveAlbumModal;
