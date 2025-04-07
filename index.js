import cors from 'cors';
import 'dotenv/config';
import EventEmitter from 'events';
import express from 'express';
import fs from 'fs/promises';
import NodeCache from 'node-cache';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
EventEmitter.defaultMaxListeners = 60;

const app = express();
const githubApiUrl =
  'https://api.github.com/repos/apk02211/CPP_Solved_Questions_LAB/contents';
const requestedDomain = 'http://127.0.0.1:10000';

const codeCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

app.use(express.static('public'));
app.use(express.json());
app.use(cors());

const getFileIcon = (filename) => {
  const ext = filename.split('.').pop().toLowerCase();
  const icons = {
    cpp: '📄',
    docx: '📝',
    md: '📘',
    txt: '📜',
  };
  return icons[ext] || '📂';
};

const fetchGitHubRepoContents = async (url) => {
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
        'User-Agent': 'Node.js',
      },
    });

    if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);

    const data = await response.json();
    data.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true }),
    );

    const items = [];

    for (const item of data) {
      const isFile = item.type === 'file';
      if (isFile) {
        const entry = {
          type: item.type,
          name: item.name,
          path: item.path,
          icon: getFileIcon(item.name),
          html_url: item.html_url,
          url: item.url,
          download_url: item.download_url,
        };
        items.push(entry);
      } else {
        const entry = {
          type: item.type,
          name: item.name,
          path: item.path,
          icon: getFileIcon(item.name),
          html_url: item.html_url,
          url: item.url,
        };
        items.push(entry);
      }
    }

    return items;
  } catch (error) {
    return [];
  }
};

const fetchFileContent = async (url) => {
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
        'User-Agent': 'Node.js',
      },
    });

    if (!response.ok)
      throw new Error(`GitHub API error (content): ${response.status}`);

    const data = await response.json();
    return Buffer.from(data.content, 'base64').toString('utf-8');
  } catch (error) {
    return null;
  }
};

app.post('/send-file', async (req, res) => {
  const { folderName, url } = req.body;
  let savedFile = codeCache.get(folderName);
  if (!savedFile) {
    savedFile = await fetchGitHubRepoContents(url);
    codeCache.set(folderName, savedFile);
  }
  res.json(savedFile);
});

app.post('/send-folder', async (req, res) => {
  let savedFolder = codeCache.get('repo-folder');
  if (!savedFolder) {
    const items = await fetchGitHubRepoContents(githubApiUrl);
    savedFolder = {
      folders: items.filter((i) => i.type === 'dir'),
      files: items.filter((i) => i.type === 'file'),
    };
    codeCache.set('repo-folder', savedFolder);
  }

  res.json(savedFolder);
});

let updatedFiles = {};
app.post('/content', async (req, res) => {
  try {
    const { fileName, url, download_url } = req.body;
    let content = codeCache.get(fileName);
    if (!content) {
      content = await fetchFileContent(url);
      codeCache.set(fileName, content);
    }
    const data = {
      filename: fileName,
      code: content,
      download_url,
    };
    updatedFiles.data = data;
    res.status(200).json({ message: 'success' });
  } catch (error) {
    res.status(404).json({ message: 'Something went wrong' });
  }
});

app.post('/send-code', (req, res) => {
  if (updatedFiles.data) {
    res.json({
      message: true,
      type: 'editor',
      ...updatedFiles.data,
    });
  } else {
    res.json({ message: false });
  }
});

app.post('/get-url', async (req, res) => {
  try {
    const response = await fetch(`${requestedDomain}/send-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Fetch failed');

    const data = await response.json();
    res.status(data.message ? 200 : 404).json(data);
  } catch (error) {
    res.status(404).json({ message: 'not found' });
  }
});

const authenticate = (req, res, next) => {
  if (!process.env.ADMIN_KEY)
    return res.status(401).json({ error: 'Unauthorized' });

  const token = req.headers.authorization?.split(' ')[1];
  if (token === process.env.ADMIN_KEY) return next();

  res.status(403).json({ error: 'Forbidden' });
};

app.post('/info', async (req, res) => {
  const filePath = path.join(__dirname, 'info.txt');
  const logData = `<span>IP:</span> ${req.ip}\n<span>User-Agent:</span> ${
    req.headers['user-agent']
  }\n<span>Date:</span> ${new Date().toLocaleString()}<hr>\n`;

  try {
    const content = await fs.readFile(filePath, 'utf8').catch(() => '');
    if (!content.includes(`<span>IP:</span> ${req.ip}`))
      await fs.appendFile(filePath, logData);

    res.send(
      content.includes(`<span>IP:</span> ${req.ip}`)
        ? 'IP already logged.'
        : 'New IP logged.',
    );
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/delete-info', authenticate, async (req, res) => {
  const filePath = path.join(__dirname, 'info.txt');
  try {
    await fs.unlink(filePath);
    res.send('info.txt deleted successfully!');
  } catch (error) {
    res.status(404).send('File not found!');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT);
