import re

with open('context/GameContext.tsx', 'r') as f:
    content = f.read()

old_cert_format = """                      const rawAlbumStreams = albumTracks.reduce((sum, s) => sum + s.streams, 0);
                      const albumEffectiveStreams = Math.max(0, rawAlbumStreams - (release.preReleaseStreams || 0));
                      const albumCert = formatCertification(getAlbumCertification(Math.floor(albumEffectiveStreams / 1500)));"""

new_cert_format = """                      const rawAlbumStreams = albumTracks.reduce((sum, s) => sum + s.streams, 0);
                      const rawAlbumSales = albumTracks.reduce((sum, s) => sum + (s.sales || 0), 0);
                      const albumEffectiveStreams = Math.max(0, rawAlbumStreams - (release.preReleaseStreams || 0));
                      const albumEffectiveSales = Math.max(0, rawAlbumSales - (release.preReleaseSales || 0));
                      const albumCert = formatCertification(getAlbumCertification(Math.floor(albumEffectiveStreams / 1500) + albumEffectiveSales));"""

content = content.replace(old_cert_format, new_cert_format)

with open('context/GameContext.tsx', 'w') as f:
    f.write(content)
