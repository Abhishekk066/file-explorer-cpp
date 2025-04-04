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
const folderPath = "./files"; 
const githubApiUrl = "https://api.github.com/repos/Abhi0065/cpp_questions_solved/contents";
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
  const normalizedPath = path.normalize(requestedFile).replace(/^(\.\.[\/\\])+/, '');
  const absolutePath = path.join(folderPath, normalizedPath);
  
  if (!absolutePath.startsWith(path.resolve(folderPath))) {
    return null; 
  }
  
  return absolutePath;
};

app.post('/files/*', async (req, res) => {
  const requestedFile = req.params[0];
  const filePath = getSafePath(requestedFile);

  if (!filePath) {
    return res.status(403).json({ error: 'Access denied' });
  }

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

  if (!filePath) {
    return res.status(403).json({ error: 'Access denied' });
  }

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
    const response = await fetch(fetchUrl, { 
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const data = await response.json();
    if (!data.message) return res.status(404).json({ message: false });

    res.status(200).json(data);
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(404).json({ message: 'not found' });
  }
});

app.post('/send-code', (req, res) => {
  if (!updatedCode.content) {
    return res.json({ message: false });
  }
  res.json({
    message: true,
    type: 'editor',
    filename: updatedCode.file,
    code: updatedCode.content,
  });
});

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const token = authHeader.split(' ')[1];
  if (token === process.env.ADMIN_KEY) {
    next();
  } else {
    res.status(403).json({ error: 'Forbidden' });
  }
};

app.post('/info', (req, res) => {
  const filePath = path.join(__dirname, 'info.txt');
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];
  const logData = `<span>IP:</span> ${ip}\n<span>User-Agent:</span> ${userAgent}\n<span>Date:</span> ${new Date().toLocaleString()}<hr>\n`;

  try {
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
  } catch (err) {
    console.error('Error logging info:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/info', authenticate, (req, res) => {
  try {
    const filePath = path.join(__dirname, 'info.txt');
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).send(
        `<head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body { background: #000; color: lime; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        </style>
        </head>
        <body>File not found!</body>`
      );
    }
    
    const readFile = fs.readFileSync(filePath, 'utf8');
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
        .join('')}</body>`
    );
  } catch (err) {
    console.error('Error reading info file:', err);
    res.status(500).send(
      `<head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        body { background: #000; color: lime; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
      </style>
      </head>
      <body>Server error: ${err.message}</body>`
    );
  }
});

app.get('/delete-info', authenticate, (req, res) => {
  try {
    const filePath = path.join(__dirname, 'info.txt');

    if (!fs.existsSync(filePath)) {
      return res.status(404).send(
        `<head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body { background: #000; color: lime; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        </style>
        </head>
        <body>File not found!</body>`
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
      <body>info.txt deleted successfully!</body>`
    );
  } catch (err) {
    console.error('Error deleting file:', err);
    res.status(500).send('Error deleting file: ' + err.message);
  }
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
