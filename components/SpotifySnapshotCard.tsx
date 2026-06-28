import React from "react";

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
};

export const SpotifySnapshotCard: React.FC<{ dataString: string }> = ({
  dataString,
}) => {
  try {
    const jsonStr = dataString.replace("snapshot:", "");
    const data = JSON.parse(jsonStr);

    if (data.type === "presave") {
      return (
        <div className="mt-2 rounded-xl bg-[#c57d77] border border-[#a1615c] p-5 text-white font-sans max-w-full overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="text-xs font-bold tracking-widest uppercase opacity-80">
              Presave
            </div>
            <div className="text-xs font-bold opacity-80">
              {data.date?.year || 2026}
            </div>
          </div>
          <div className="flex gap-4 items-start mb-6">
            <img
              src={data.coverArt}
              className="w-24 h-24 rounded-lg shadow-xl object-cover"
            />
            <div>
              <h2 className="text-2xl font-black leading-tight mb-1">
                {data.albumName}
              </h2>
              <p className="text-sm font-semibold opacity-90 mb-1">
                {data.artistName}
              </p>
              <p className="text-xs opacity-75">
                Releases Week {data.releaseDate?.week}, {data.releaseDate?.year}
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1 border border-white/20 rounded-xl p-3 bg-white/5">
              <div className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-1">
                Total Presaves
              </div>
              <div className="text-xl font-black">
                {data.preSaves.toLocaleString()}
              </div>
            </div>
            <div className="flex-1 border border-white/20 rounded-xl p-3 bg-white/5 flex flex-col justify-center">
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-1">
                    Daily
                  </div>
                  <div className="text-lg font-bold">
                    +{data.d3.toLocaleString()}
                  </div>
                </div>
                <div className="text-green-300 font-bold text-xs bg-green-500/20 px-2 py-1 rounded">
                  ▲ {data.surge.toFixed(2)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (data.type === "prerelease_streams") {
      return (
        <div className="mt-2 rounded-xl bg-[#87a5a8] border border-[#6b8587] p-4 pb-0 text-white font-sans max-w-full overflow-hidden">
          <div className="flex gap-4 items-center mb-6">
            <img
              src={data.coverArt}
              className="w-24 h-24 rounded shadow-xl object-cover"
            />
            <div>
              <div className="text-xs font-bold opacity-80 mb-1">
                Pre-Release
              </div>
              <h2 className="text-xl font-black leading-tight mb-1">
                {data.songName}
              </h2>
              <p className="text-sm font-semibold opacity-90">
                {data.artistName} • Week {data.date?.week}
              </p>
            </div>
          </div>

          <div className="w-[calc(100%+2rem)] -ml-4 bg-white/10 text-xs mt-4">
            <div className="grid grid-cols-4 p-2 opacity-80 border-b border-white/20 font-semibold uppercase text-[10px] tracking-wider text-right">
              <div className="text-center">Song</div>
              <div>Total Streams</div>
              <div>Daily Streams</div>
              <div>Change</div>
            </div>
            {data.tracks.map((t: any, i: number) => {
              const isTarget = t.title === data.songName;
              return (
                <div
                  key={i}
                  className={`grid grid-cols-4 p-2 items-center text-right ${isTarget ? "bg-white/20 font-bold" : ""}`}
                >
                  <div className="text-left font-bold line-clamp-1 truncate">
                    {t.title}
                  </div>
                  <div>{t.streams.toLocaleString()}</div>
                  <div>+{t.weekly.toLocaleString()}</div>
                  <div className="text-green-300">
                    +{(Math.random() * 40 + 5).toFixed(2)}%
                  </div>
                </div>
              );
            })}
            <div className="grid grid-cols-4 p-2 items-center text-right bg-white/20 font-bold border-t border-white/20">
              <div className="text-left text-black/50 text-[10px]">
                @SnapshotSpotify
              </div>
              <div>
                {data.tracks
                  .reduce((sum: number, t: any) => sum + t.streams, 0)
                  .toLocaleString()}
              </div>
              <div>
                +
                {data.tracks
                  .reduce((sum: number, t: any) => sum + t.weekly, 0)
                  .toLocaleString()}
              </div>
              <div className="text-green-300">
                +{(Math.random() * 40 + 5).toFixed(2)}%
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (
      data.type === "album_weekly" ||
      data.type === "album" ||
      data.type === "popular_tracks"
    ) {
      // Shared generic style for spotify data (like drake style)
      return (
        <div className="mt-2 rounded-xl bg-[#2a2a2a] border border-[#1a1a1a] p-5 text-[#dcdcdc] font-mono max-w-full overflow-hidden">
          {data.type === "popular_tracks" ? (
            <div>
              <h2 className="text-2xl font-sans font-bold text-white mb-4">
                Popular
              </h2>
              <div className="space-y-3">
                {data.tracks.map((t: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-4 text-right text-zinc-500 font-sans font-bold">
                      {i + 1}
                    </div>
                    <img
                      src={t.coverArt}
                      className="w-10 h-10 object-cover rounded"
                    />
                    <div className="flex-1 font-sans">
                      <div className="font-bold text-white text-sm">
                        {t.title}
                      </div>
                      <div className="text-[10px] bg-zinc-700 text-zinc-300 px-1 rounded w-max mt-1">
                        E
                      </div>
                    </div>
                    <div className="text-sm font-sans">
                      {t.streams.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex gap-4 items-start mb-4">
                <img src={data.coverArt} className="w-24 h-24 object-cover" />
                <div className="flex-1 font-sans">
                  <h2 className="text-2xl font-black text-white leading-none tracking-tight uppercase">
                    {data.albumName}
                  </h2>
                  <p className="text-xl text-zinc-300 mb-2">
                    {data.artistName}
                  </p>
                  <div className="flex justify-between items-end">
                    <p className="text-xs text-zinc-500">
                      Week {data.date?.week}, {data.date?.year}
                    </p>
                    <p className="text-xs text-zinc-500">
                      Day {(data.date?.week || 1) * 7}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-stretch mb-2">
                <div className="bg-[#bda58d] text-white text-2xl font-sans font-black flex-1 p-2 text-center">
                  {data.streams.toLocaleString()}
                </div>
                <div className="bg-[#cc5555] text-white text-lg font-sans font-bold p-2 flex items-center">
                  {(Math.random() * -5).toFixed(2)}%
                </div>
              </div>
              <div className="text-center text-zinc-400 text-xs uppercase tracking-widest mb-4 font-sans font-bold">
                Total Streams: {data.totalStreams.toLocaleString()}
              </div>
              <div className="w-[calc(100%+2rem)] -ml-4 border-t border-zinc-700/50">
                <div className="grid grid-cols-[1rem_1fr_4rem_4rem_3rem_4.5rem] gap-2 p-2 text-[10px] font-bold text-zinc-500 border-b border-zinc-700/50">
                  <div></div>
                  <div>Track</div>
                  <div className="text-right">Daily Streams</div>
                  <div className="text-right">Change</div>
                  <div className="text-right">%</div>
                  <div className="text-right">Total</div>
                </div>
                <div className="max-h-[300px] overflow-y-auto scrollbar-hide">
                  {data.tracks.map((t: any, i: number) => (
                    <div
                      key={i}
                      className="grid grid-cols-[1rem_1fr_4rem_4rem_3rem_4.5rem] gap-2 px-2 py-1.5 text-xs items-center border-b border-zinc-800/30"
                    >
                      <div className="text-[10px] text-zinc-500 text-right">
                        {i + 1}
                      </div>
                      <div className="truncate font-sans font-semibold text-zinc-200">
                        {t.title}
                      </div>
                      <div className="text-right">
                        {t.weekly
                          ? t.weekly.toLocaleString()
                          : t.dailyStreams
                            ? t.dailyStreams.toLocaleString()
                            : 0}
                      </div>
                      <div className="text-right text-red-400">
                        -{Math.floor(Math.random() * 5000).toLocaleString()}
                      </div>
                      <div className="text-right text-red-400">
                        {(Math.random() * -3 - 0.5).toFixed(2)}%
                      </div>
                      <div className="text-right text-zinc-400">
                        {t.streams
                          ? t.streams.toLocaleString()
                          : t.totalStreams
                            ? t.totalStreams.toLocaleString()
                            : 0}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-[1rem_1fr_4rem_4rem_3rem_4.5rem] gap-2 p-2 text-xs font-bold items-center bg-[#bda58d]/20 text-[#bda58d]">
                  <div></div>
                  <div>Total</div>
                  <div className="text-right">
                    {data.streams.toLocaleString()}
                  </div>
                  <div className="text-right">
                    -{Math.floor(Math.random() * 40000).toLocaleString()}
                  </div>
                  <div className="text-right">-1.90%</div>
                  <div className="text-right">
                    {data.totalStreams.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Default fallback to old style
    return (
      <div className="mt-2 rounded-xl bg-zinc-900 border border-zinc-800 p-4 text-white font-sans max-w-full overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-24 h-24 text-[#1DB954]"
          >
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.24 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.24 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
          </svg>
        </div>
        <div className="flex gap-4 items-center mb-4 z-10 relative">
          <img
            src={data.coverArt}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-md shadow-lg object-cover flex-shrink-0"
          />
          <div className="min-w-0 overflow-hidden">
            <p
              className="text-lg sm:text-xl font-bold leading-tight line-clamp-2"
              title={data.type === "album" ? data.albumName : data.songName}
            >
              {data.type === "album" ? data.albumName : data.songName}
            </p>
            <p
              className="text-zinc-400 text-sm truncate"
              title={data.artistName}
            >
              {data.artistName}
            </p>
            <p className="text-[#1DB954] text-xs sm:text-sm mt-1 font-bold">
              BEST WEEK EVER
            </p>
          </div>
        </div>
        <div className="bg-zinc-800/50 rounded-lg p-3 z-10 relative mb-4">
          <div className="text-xs text-zinc-400 mb-1 uppercase tracking-wider">
            Weekly Streams
          </div>
          <div className="text-2xl font-black">
            {data.streams.toLocaleString()}
          </div>
        </div>
        {data.type === "song" && data.dailyStreams && (
          <div className="space-y-1.5 z-10 relative text-sm sm:text-base font-mono">
            {data.dailyStreams.map((steams: number, i: number) => {
              const date = new Date();
              date.setDate(date.getDate() - (6 - i));
              const dateStr = `${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getDate().toString().padStart(2, "0")}`;
              const prev =
                i === 0 ? data.dailyStreams[0] : data.dailyStreams[i - 1];
              const diff = steams - prev;
              const percent = prev > 0 ? (diff / prev) * 100 : 0;
              const percentStr =
                percent > 0
                  ? `[+${percent.toFixed(2)}%]`
                  : percent < 0
                    ? `[${percent.toFixed(2)}%]`
                    : "[+0.00%]";
              return (
                <div
                  key={i}
                  className="flex justify-between items-center bg-black/20 px-3 py-1.5 rounded"
                >
                  <span className="text-zinc-400">{dateStr}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-bold">{steams.toLocaleString()}</span>
                    <span
                      className={
                        percent > 0
                          ? "text-green-400 text-xs sm:text-sm min-w-[65px] text-right"
                          : percent < 0
                            ? "text-red-400 text-xs sm:text-sm min-w-[65px] text-right"
                            : "text-zinc-500 text-xs sm:text-sm min-w-[65px] text-right"
                      }
                    >
                      {percentStr}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  } catch (e) {
    return null;
  }
};
