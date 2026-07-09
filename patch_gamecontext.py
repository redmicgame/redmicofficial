import re

with open('context/GameContext.tsx', 'r') as f:
    content = f.read()

old_release1 = """                    isReleased: true,
                    releaseId: release.id,
                    coverArt:
                      release.type === "Single" ? release.coverArt : s.coverArt,"""

new_release1 = """                    isReleased: true,
                    releaseId: release.type === "Compilation" ? s.releaseId : release.id,
                    coverArt:
                      release.type === "Single" ? release.coverArt : s.coverArt,"""

content = content.replace(old_release1, new_release1)

old_release2 = """      const newSongs = activeData.songs.map((song) =>
        releaseWithLabel.songIds.includes(song.id)
          ? { ...song, isReleased: true, releaseId: releaseWithLabel.id }
          : song,
      );"""

new_release2 = """      const newSongs = activeData.songs.map((song) =>
        releaseWithLabel.songIds.includes(song.id)
          ? { ...song, isReleased: true, releaseId: releaseWithLabel.type === "Compilation" ? song.releaseId : releaseWithLabel.id }
          : song,
      );"""

content = content.replace(old_release2, new_release2)

with open('context/GameContext.tsx', 'w') as f:
    f.write(content)
