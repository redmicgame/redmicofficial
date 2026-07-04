import re

with open('context/GameContext.tsx', 'r') as f:
    content = f.read()

old_album_cert = """          // Album Certifications
          artistData.releases = artistData.releases.map((release) => {
            if (release.type === "Single") return release;
            const totalStreams = release.songIds.reduce((sum, songId) => {
              const song = artistData.songs.find((s) => s.id === songId);
              return sum + (song?.streams || 0);
            }, 0);
            const units = Math.floor(totalStreams / 1500);"""

new_album_cert = """          // Album Certifications
          artistData.releases = artistData.releases.map((release) => {
            if (release.type === "Single") return release;
            const rawStreams = release.songIds.reduce((sum, songId) => {
              const song = artistData.songs.find((s) => s.id === songId);
              return sum + (song?.streams || 0);
            }, 0);
            const totalStreams = Math.max(0, rawStreams - (release.preReleaseStreams || 0));
            const rawSales = release.songIds.reduce((sum, songId) => {
              const song = artistData.songs.find((s) => s.id === songId);
              return sum + (song?.sales || 0);
            }, 0);
            const totalSales = Math.max(0, rawSales - (release.preReleaseSales || 0));
            const units = Math.floor(totalStreams / 1500) + totalSales;"""

content = content.replace(old_album_cert, new_album_cert)

old_cert_format = """                      const albumCert = formatCertification(getAlbumCertification(albumTracks.reduce((sum, s) => sum + s.streams, 0)));"""
new_cert_format = """                      const rawAlbumStreams = albumTracks.reduce((sum, s) => sum + s.streams, 0);
                      const albumEffectiveStreams = Math.max(0, rawAlbumStreams - (release.preReleaseStreams || 0));
                      const albumCert = formatCertification(getAlbumCertification(Math.floor(albumEffectiveStreams / 1500)));"""
content = content.replace(old_cert_format, new_cert_format)

with open('context/GameContext.tsx', 'w') as f:
    f.write(content)
