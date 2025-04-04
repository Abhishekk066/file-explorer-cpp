import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const folderPath = "./files";
const githubApiUrl = "https://api.github.com/repos/Abhi0065/cpp_questions_solved/contents";
const requestedDomain = 'https://compiler-cpp-production.up.railway.app';

app.use(express.static('public'));
app.use(express.json());
app.use(cors());

const getFolderStructure = async (dir, basePath = '') => {
    let structure = [];
    try {
        let items = await fs.readdir(dir);
        items.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const relativePath = path.join(basePath, item);
            const stats = await fs.stat(fullPath);

            if (stats.isDirectory()) {
                structure.push({
                    type: 'folder',
                    name: item,
                    path: relativePath,
                    children: await getFolderStructure(fullPath, relativePath),
                });
            } else {
                structure.push({
                    type: 'file',
                    name: item,
                    path: relativePath,
                    icon: getFileIcon(item),
                });
            }
        }
    } catch (err) {
        console.error('Error reading folder:', err);
    }
    return structure;
};

const getFileIcon = (filename) => {
    const ext = path.extname(filename).toLowerCase();
    const icons = { '.cpp': '📄', '.docx': '📝' };
    return icons[ext] || '📄';
};

const getSafePath = (requestedFile) => {
    const normalizedPath = path.normalize(requestedFile).replace(/^\.+[\\/]/, '');
    const absolutePath = path.join(folderPath, normalizedPath);
    return absolutePath.startsWith(path.resolve(folderPath)) ? absolutePath : null;
};

app.post('/send-file', async (req, res) => {
    const items = await getFolderStructure(folderPath);
    res.json({ folders: items.filter(i => i.type === 'folder'), files: items.filter(i => i.type === 'file') });
});

app.post('/files/*', async (req, res) => {
    const filePath = getSafePath(req.params[0]);
    if (!filePath) return res.status(403).json({ error: 'Access denied' });
    
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        res.json({ content });
    } catch (error) {
        res.status(404).json({ error: 'File not found' });
    }
});

let updatedCode = {};

app.post('/files-view/*', async (req, res) => {
    const filePath = getSafePath(req.params[0]);
    if (!filePath) return res.status(403).json({ error: 'Access denied' });
    
    try {
        updatedCode = { content: await fs.readFile(filePath, 'utf-8'), file: req.params[0] };
        res.json({ message: 'ok' });
    } catch {
        res.status(404).json({ error: 'File not found' });
    }
});

app.post('/send-code', (req, res) => {
    res.json(updatedCode.content ? { message: true, type: 'editor', filename: updatedCode.file, code: updatedCode.content } : { message: false });
});

app.post('/get-url', async (req, res) => {
    try {
        const response = await fetch(`${requestedDomain}/send-url`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
        if (!response.ok) throw new Error('Fetch failed');
        
        const data = await response.json();
        res.status(data.message ? 200 : 404).json(data);
    } catch {
        res.status(404).json({ message: 'not found' });
    }
});

const authenticate = (req, res, next) => {
    if (!process.env.ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
    if (req.headers.authorization?.split(' ')[1] === process.env.ADMIN_KEY) return next();
    res.status(403).json({ error: 'Forbidden' });
};

app.post('/info', async (req, res) => {
    const filePath = path.join(__dirname, 'info.txt');
    const logData = `<span>IP:</span> ${req.ip}\n<span>User-Agent:</span> ${req.headers['user-agent']}\n<span>Date:</span> ${new Date().toLocaleString()}<hr>\n`;
    
    try {
        const content = await fs.readFile(filePath, 'utf8').catch(() => '');
        if (!content.includes(`<span>IP:</span> ${req.ip}`)) await fs.appendFile(filePath, logData);
        res.send(content.includes(`<span>IP:</span> ${req.ip}`) ? 'IP already logged.' : 'New IP logged.');
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/delete-info', authenticate, async (req, res) => {
    const filePath = path.join(__dirname, 'info.txt');
    try {
        await fs.unlink(filePath);
        res.send('info.txt deleted successfully!');
    } catch {
        res.status(404).send('File not found!');
    }
});

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
