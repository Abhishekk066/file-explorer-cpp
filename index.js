import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const fopderPath = "https://api.github.com/repos/Abhi0065/cpp_questions_solved/contents";
const requestedDomain = 'https://compiler-cpp-production.up.railway.app';

app.use(express.static('public'));
app.use(express.json());
app.use(cors());

const getFolderStructure = (dir, basePath = '') => {
  let structure = [];
  try {
    let items = fs.readdirSync(dir);
    items.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    items.forEach((item) => {
      const fullPath = path.join(dir, item);
      const relativePath = path.join(basePath, item);
      const stats = fs.statSync(fullPath);

      if (stats.isDirectory()) {
        structure.push({
          type: 'folder',
          name: item,
          path: relativePath,
          children: getFolderStructure(fullPath, relativePath),
        });
      } else if (stats.isFile()) {
        structure.push({
          type: 'file',
          name: item,
          path: relativePath,
          icon: getFileIcon(item),
        });
      }
    });
  } catch (err) {
    console.error('Error reading folder:', err);
  }
  return structure;
};

const getFileIcon = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  const icons = {
    '.cpp': '📄',
    '.docx': '📝',
  };
  return icons[ext] || '📄';
};

app.post('/send-file', (req, res) => {
  const items = getFolderStructure(folderPath);
  const folders = items.filter((item) => item.type === 'folder');
  const files = items.filter((item) => item.type === 'file');
  res.json({ folders, files });
});

const getSafePath = (requestedFile) => {
  const safePath = path.normalize(requestedFile).replace(/^(\.\.[\/\\])+/, '');
  return path.join(folderPath, safePath);
};

app.post('/files/*', async (req, res) => {
  const requestedFile = req.params[0];
  const filePath = getSafePath(requestedFile);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const content = fs.readFileSync(filePath, 'utf-8');
    res.json({ content });
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

let updatedCode = {};

app.post('/files-view/*', async (req, res) => {
  const requestedFile = req.params[0];
  const filePath = getSafePath(requestedFile);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const content = fs.readFileSync(filePath, 'utf-8');
    updatedCode = { content, file: requestedFile };
    res.json({ message: 'ok' });
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

app.post('/get-url', async (req, res) => {
  const fetchUrl = `${requestedDomain}/send-url`;
  try {
    const response = await fetch(fetchUrl, { method: 'POST' });
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const data = await response.json();
    if (!data.message) return res.status(404).join({ message: false });

    res.status(200).json(data);
  } catch (error) {
    res.status(404).json({ message: 'not found' });
    console.error('Fetch error:', error);
    return { error: 'Failed to fetch code from external service' };
  }
});

app.post('/send-code', sendCode);

function sendCode(req, res) {
  if (!updatedCode.content) {
    res.json({ message: false });
    return;
  }
  res.json({
    message: true,
    type: 'editor',
    filename: updatedCode.file,
    code: updatedCode.content,
  });
}

app.post('/info', (req, res) => {
  const filePath = 'info.txt';
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];
  const logData = `<span>IP:</span> ${ip}\n<span>User-Agent:</span> ${userAgent}\n<span>Date:</span> ${new Date().toLocaleString()}<hr>\n`;

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, logData);
    return res.send('First IP logged!');
  }

  const fileContent = fs.readFileSync(filePath, 'utf8');
  if (fileContent.includes(`<span>IP:</span> ${ip}`)) {
    return res.send('IP already logged.');
  }

  fs.appendFileSync(filePath, logData);
  res.send('New IP logged.');
});

app.get('/info', (req, res) => {
  try {
    const readFile = fs.readFileSync('info.txt', 'utf8');
    res.send(
      `<head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        body { background: #000; color: lime; }
        span { color: red; }
        p { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0.6rem 0; padding: 0 5px; }
        hr {border: 1px solid grey; border-bottom: none; }
      </style>
      </head>
      <body>${readFile
        .split('\n')
        .map((e) => `<p>${e}</p>`)
        .join('')}</body>`,
    );
  } catch (err) {
    res.status(500).send(
      `<head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        body { background: #000; color: lime; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
      </style>
      </head>
      <body>File not found!</body>`,
    );
  }
});

app.get('/delete-info', (req, res) => {
  try {
    const filePath = 'info.txt';

    if (!fs.existsSync(filePath)) {
      return res.status(404).send(
        `<head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        body { background: #000; color: lime; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
      </style>
      </head>
      <body>File not found!</body>`,
      );
    }

    fs.unlinkSync(filePath);
    res.send(
      `<head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        body { background: #000; color: lime; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
      </style>
      </head>
      <body>info.txt deleted successfully!</body>`,
    );
  } catch (err) {
    res.status(500).send('Error deleting file: ' + err.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT);
