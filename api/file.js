import fs from 'fs';
import path from 'path';

const MIME_TYPES = {
    '.webp': 'image/webp',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.md': 'text/markdown; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
};

export default function handler(req, res) {
    const dir = req.query.dir || '';
    const file = req.query.file || '';

    if (!dir || !file) {
        return res.status(400).json({ error: 'Missing dir or file parameter' });
    }

    const allowedDirs = ['images', 'scenes', 'details'];
    if (!allowedDirs.includes(dir)) {
        return res.status(403).json({ error: 'Forbidden directory' });
    }

    const filePath = path.join(process.cwd(), dir, file);
    const resolved = path.resolve(filePath);
    const dirResolved = path.resolve(path.join(process.cwd(), dir));

    if (!resolved.startsWith(dirResolved)) {
        return res.status(403).json({ error: 'Path traversal not allowed' });
    }

    if (!fs.existsSync(resolved)) {
        return res.status(404).json({ error: 'File not found' });
    }

    const ext = path.extname(resolved).toLowerCase();
    const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'public, max-age=3600');

    const buffer = fs.readFileSync(resolved);
    return res.status(200).send(buffer);
}
