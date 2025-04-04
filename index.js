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
// Configurations
const localFolderPath = "./files"; // Local folder path (as backup)
const githubApiUrl = "https://api.github.com/repos/Abhi0065/cpp_questions_solved/contents";
const requestedDomain = 'https://compiler-cpp-production.up.railway.app';
const useGithub = true; // Set to true to use GitHub API, false to use local files

app.use(express.static('public'));
app.use(express.json());
app.use(cors());

// Function to get local folder structure
const getLocalFolderStructure = (dir, basePath = '') => {
  let structure = [];
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      return structure;
    }
    
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
          children: getLocalFolderStructure(fullPath, relativePath),
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

// Function to get GitHub folder structure
const getGithubFolderStructure = async (repoUrl = githubApiUrl, basePath = '') => {
  try {
    const response = await fetch(repoUrl, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        // Add authorization if needed for private repos
        // 'Authorization': `token ${process.env.GITHUB_TOKEN}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform GitHub API response to match our structure
    const items = data.map(item => {
      const relativePath = path.join(basePath, item.name);
      
      if (item.type === 'dir') {
        return {
          type: 'folder',
          name: item.name,
          path: relativePath,
          // Note: We don't immediately fetch children to avoid too many API calls
          // Children will be loaded when the folder is opened
          url: item.url
        };
      } else {
        return {
          type: 'file',
          name: item.name,
          path: relativePath,
          icon: getFileIcon(item.name),
          download_url: item.download_url,
          url: item.url
        };
      }
    });
    
    return items;
    
  } catch (err) {
    console.error('Error fetching from GitHub:', err);
    return [];
  }
};

const getFileIcon = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  const icons = {
    '.cpp': '📄',
    '.docx': '📝',
    '.md': '📋',
    '.txt': '📝',
    '.h': '📄',
    '.json': '📊',
  };
  return icons[ext] || '📄';
};

app.post('/send-file', async (req, res) => {
  try {
    if (useGithub) {
      const items = await getGithubFolderStructure();
      const folders = items.filter((item) => item.type === 'folder');
      const files = items.filter((item) => item.type === 'file');
      res.json({ folders, files });
    } else {
      const items = getLocalFolderStructure(localFolderPath);
      const folders = items.filter((item) => item.type === 'folder');
      const files = items.filter((item) => item.type === 'file');
      res.json({ folders, files });
    }
  } catch (error) {
    console.error('Error in send-file:', error);
    res.status(500).json({ error: 'Failed to get file structure' });
  }
});

// Get folder contents from GitHub by path
app.post('/folder/*', async (req, res) => {
  try {
    const requestedFolder = req.params[0];
    
    if (useGithub) {
      // Find the folder in our GitHub data
      let folderUrl = '';
      
      if (!requestedFolder || requestedFolder === '') {
        // Root folder
        folderUrl = githubApiUrl;
      } else {
        // Encode the folder path for the URL
        const encodedPath = encodeURIComponent(requestedFolder);
        folderUrl = `${githubApiUrl}/${encodedPath}`;
      }
      
      const items = await getGithubFolderStructure(folderUrl, requestedFolder);
      const folders = items.filter((item) => item.type === 'folder');
      const files = items.filter((item) => item.type === 'file');
      res.json({ folders, files });
    } else {
      // Local file system
      const folderPath = path.join(localFolderPath, requestedFolder);
      const safePath = getSafePath(requestedFolder);
      
      if (!safePath) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      const items = getLocalFolderStructure(folderPath, requestedFolder);
      const folders = items.filter((item) => item.type === 'folder');
      const files = items.filter((item) => item.type === 'file');
      res.json({ folders, files });
    }
  } catch (error) {
    console.error('Error getting folder contents:', error);
    res.status(500).json({ error: 'Failed to get folder contents' });
  }
});

const getSafePath = (requestedFile) => {
  // Normalize and prevent directory traversal
  const normalizedPath = path.normalize(requestedFile).replace(/^(\.\.[\/\\])+/, '');
  const absolutePath = path.join(localFolderPath, normalizedPath);
  
  // Verify the path is within the allowed directory
  if (!absolutePath.startsWith(path.resolve(localFolderPath))) {
    return null; // Attempt to access outside of the allowed directory
  }
  
  return absolutePath;
};

app.post('/files/*', async (req, res) => {
  try {
    const requestedFile = req.params[0];
    
    if (useGithub) {
      // Get file from GitHub
      const encodedPath = encodeURIComponent(requestedFile);
      const fileUrl = `${githubApiUrl}/${encodedPath}`;
      
      const response = await fetch(fileUrl, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          // Add authorization if needed
        }
      });
      
      if (!response.ok) {
        return res.status(response.status).json({ error: 'File not found on GitHub' });
      }
      
      const fileData = await response.json();
      
      if (fileData.type !== 'file' || !fileData.download_url) {
        return res.status(400).json({ error: 'Not a valid file' });
      }
      
      // Fetch the raw content
      const contentResponse = await fetch(fileData.download_url);
      if (!contentResponse.ok) {
        return res.status(contentResponse.status).json({ error: 'Failed to download file content' });
      }
      
      const content = await contentResponse.text();
      res.json({ content });
      
    } else {
      // Get file from local system
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
    }
  } catch (error) {
    console.error('Error getting file:', error);
    res.status(500).json({ error: 'Failed to get file content' });
  }
});

let updatedCode = {};

app.post('/files-view/*', async (req, res) => {
  try {
    const requestedFile = req.params[0];
    
    if (useGithub) {
      // Get file from GitHub for viewing
      const encodedPath = encodeURIComponent(requestedFile);
      const fileUrl = `${githubApiUrl}/${encodedPath}`;
      
      const response = await fetch(fileUrl, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
        }
      });
      
      if (!response.ok) {
        return res.status(response.status).json({ error: 'File not found on GitHub' });
      }
      
      const fileData = await response.json();
      
      if (fileData.type !== 'file' || !fileData.download_url) {
        return res.status(400).json({ error: 'Not a valid file' });
      }
      
      // Fetch the raw content
      const contentResponse = await fetch(fileData.download_url);
      if (!contentResponse.ok) {
        return res.status(contentResponse.status).json({ error: 'Failed to download file content' });
      }
      
      const content = await contentResponse.text();
      updatedCode = { content, file: requestedFile };
      res.json({ message: 'ok' });
      
    } else {
      // Get local file for viewing
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
    }
  } catch (error) {
    console.error('Error viewing file:', error);
    res.status(500).json({ error: 'Failed to view file' });
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

// Implement simple authentication middleware for admin routes
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

// Add authentication to sensitive routes
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

// Error handler middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Using ${useGithub ? 'GitHub API' : 'local files'} for file access`);
});
