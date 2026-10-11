import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';


async function startServer() {
  const app = express();
  const PORT = 3000;

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/patreon/url', (req, res) => {
    const origin = req.query.origin;
    if (!origin) return res.status(400).json({error: 'origin required'});
    const redirectUri = origin + '/api/patreon/callback';
    
    // Pass origin via state so we can reconstruct the exact redirectUri in the callback
    const params = new URLSearchParams({
      client_id: process.env.PATREON_CLIENT_ID || 'EZDVY8KjKxZ8G95-TNEi4IC_hXWF5Ua4WWaVDjoag4ZSiUBghbete1kth_1qWVWH',
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'identity identity.memberships',
      state: origin as string
    });
    
    const authUrl = `https://www.patreon.com/oauth2/authorize?${params}`;
    res.json({ url: authUrl });
  });

  app.get(['/api/patreon/callback', '/api/patreon/callback/'], async (req, res) => {
    const { code, state } = req.query;
    if (!code) return res.send('No code provided');

    // Get origin from state
    let origin = typeof state === 'string' ? state : undefined;
    if (!origin) {
         return res.send('No state provided (origin tracking lost)');
    }
    
    const redirectUri = origin + '/api/patreon/callback';

    try {
        const tokenResponse = await fetch('https://www.patreon.com/api/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code: code.toString(),
                grant_type: 'authorization_code',
                client_id: process.env.PATREON_CLIENT_ID || 'EZDVY8KjKxZ8G95-TNEi4IC_hXWF5Ua4WWaVDjoag4ZSiUBghbete1kth_1qWVWH',
                client_secret: process.env.PATREON_CLIENT_SECRET || 'KlXXkWOlXwyEkWsM736d-xV5nPYPu3NEXgy74551Q645YizqEN4-xEz9KT2iw2RF',
                redirect_uri: redirectUri
            })
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
            return res.send(`OAuth Error: ${tokenData.error} - ${tokenData.error_description}`);
        }

        // Fetch User identity
        const userResp = await fetch('https://www.patreon.com/api/oauth2/v2/identity?include=memberships.campaign&fields[member]=patron_status', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` }
        });
        const userData = await userResp.json();
        
        let isPro = false;
        // Check if user has an active patron status
        if (userData.included) {
             const activeMembership = userData.included.find((inc: any) => inc.type === 'member' && inc.attributes && inc.attributes.patron_status === 'active_patron');
             if (activeMembership) {
                  isPro = true;
             }
        }

        res.send(`
          <html>
            <body>
              <script>
                if (window.opener) {
                  window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', isPro: ${isPro} }, '*');
                  window.close();
                } else {
                  window.location.href = '/';
                }
              </script>
              <p>Authentication successful. You can close this window now.</p>
            </body>
          </html>
        `);

    } catch (e: any) {
        res.send(`Server Error: ${e.message}`);
    }
  });

  app.get('/api/spotify/album', async (req, res) => {
    try {
        const url = req.query.url;
        if (!url || typeof url !== 'string') return res.status(400).json({ error: 'URL is required' });
        
        const response = await fetch(`https://embed.spotify.com/?uri=${encodeURIComponent(url)}`);
        const text = await response.text();
        const match = text.match(/<script id="__NEXT_DATA__" type="application\/json"[^>]*>([\s\S]*?)<\/script>/);
        
        if (!match) {
             return res.status(500).json({ error: 'Could not extract data from Spotify' });
        }
        
        const json = JSON.parse(match[1]);
        const entity = json.props?.pageProps?.state?.data?.entity;
        
        if (!entity) {
             return res.status(500).json({ error: 'Data shape not recognized from Spotify' });
        }
        
        const images = entity.coverArt?.sources || entity.images || entity.visualIdentity?.image;
        let image = '';
        if (Array.isArray(images) && images.length > 0) {
             image = images[0]?.url || '';
        }

        const tracks = entity.trackList ? entity.trackList.map((t: any) => ({ 
            title: t.title, 
            duration: t.duration,
            explicit: Boolean(t.isExplicit || t.explicit)
        })) : [{ 
            title: entity.name, 
            duration: entity.duration,
            explicit: Boolean(entity.isExplicit || entity.explicit)
        }];
        
        res.json({
            title: entity.name,
            artist: entity.subtitle,
            image: image,
            tracks: tracks
        });
    } catch (e: any) {
        res.status(500).json({ error: e.message || String(e) });
    }
  });

  app.get('/api/spotify/track', async (req, res) => {
    try {
        const url = req.query.url;
        if (!url || typeof url !== 'string') return res.status(400).json({ error: 'URL is required' });

        const trackIdMatch = url.match(/track[/:]([a-zA-Z0-9]+)/) || url.match(/spotify:track:([a-zA-Z0-9]+)/);
        const trackId = trackIdMatch ? trackIdMatch[1] : url.trim();

        if (!trackId) {
            return res.status(400).json({ error: 'Invalid Spotify track link or ID' });
        }

        let title = '';
        let artist = '';
        let image = '';
        let previewUrl = '';
        const spotifyUrl = `https://open.spotify.com/track/${trackId}`;

        // Attempt 1: embed.spotify.com
        try {
            const response = await fetch(`https://embed.spotify.com/?uri=spotify:track:${encodeURIComponent(trackId)}`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            const text = await response.text();
            const match = text.match(/<script id="__NEXT_DATA__" type="application\/json"[^>]*>([\s\S]*?)<\/script>/);

            if (match) {
                const json = JSON.parse(match[1]);
                const entity = json.props?.pageProps?.state?.data?.entity;
                if (entity) {
                    title = entity.name || entity.title || '';
                    artist = entity.artists?.[0]?.name || entity.subtitle || '';
                    const images = entity.coverArt?.sources || entity.images || entity.visualIdentity?.image;
                    if (Array.isArray(images) && images.length > 0) {
                        image = images[0]?.url || '';
                    }
                    previewUrl = entity.audioPreview?.url || '';
                }
            }
        } catch {
            // fallback below
        }

        // Attempt 2: open.spotify.com/embed/track/
        if (!title || !previewUrl) {
            try {
                const fallbackRes = await fetch(`https://open.spotify.com/embed/track/${encodeURIComponent(trackId)}`, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                const fallbackText = await fallbackRes.text();
                const fallbackMatch = fallbackText.match(/<script id="__NEXT_DATA__" type="application\/json"[^>]*>([\s\S]*?)<\/script>/);
                if (fallbackMatch) {
                    const json = JSON.parse(fallbackMatch[1]);
                    const entity = json.props?.pageProps?.state?.data?.entity;
                    if (entity) {
                        title = title || entity.name || entity.title || '';
                        artist = artist || entity.artists?.[0]?.name || entity.subtitle || '';
                        previewUrl = previewUrl || entity.audioPreview?.url || '';
                        const images = entity.coverArt?.sources || entity.images || entity.visualIdentity?.image;
                        if (!image && Array.isArray(images) && images.length > 0) {
                            image = images[0]?.url || '';
                        }
                    }
                }
            } catch {
                // ignore
            }
        }

        if (!title && !previewUrl) {
            return res.status(404).json({ error: 'Track not found on Spotify. Please verify the URL or Track ID.' });
        }

        res.json({
            id: trackId,
            title: title || 'Spotify Track',
            artist: artist || '',
            image: image,
            previewUrl: previewUrl,
            spotifyUrl: spotifyUrl
        });
    } catch (e: any) {
        res.status(500).json({ error: e.message || String(e) });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
