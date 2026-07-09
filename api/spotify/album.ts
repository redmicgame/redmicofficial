import spotifyUrlInfo from 'spotify-url-info';
import fetch from 'isomorphic-unfetch';

const spotify = spotifyUrlInfo(fetch);

export default async function handler(req: any, res: any) {
    try {
        const url = req.query.url;
        if (!url || typeof url !== 'string') return res.status(400).json({ error: 'URL is required' });
        
        const data = await spotify.getData(url);
        const preview = await spotify.getPreview(url);
        
        res.json({
            title: data.title,
            artist: data.subtitle,
            image: preview.image,
            tracks: data.trackList ? data.trackList.map((t: any) => ({ title: t.title, duration: t.duration })) : [{ title: data.title, duration: data.duration }]
        });
    } catch (e: any) {
        res.status(500).json({ error: e.message || String(e) });
    }
}
