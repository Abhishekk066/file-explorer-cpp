let currentPath = '';
const fileList = document.getElementById('file-list');
const loader = document.querySelector('.loader-parent');
const toast = document.getElementById('toast');
const breadcrumb = document.getElementById('breadcrumb');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const backButton = document.querySelector('.back');

const fileIcons = {
  cpp: 'fa-file-code',
  h: 'fa-file-code',
  c: 'fa-file-code',
  hpp: 'fa-file-code',
  txt: 'fa-file-alt',
  md: 'fa-file-alt',
  json: 'fa-file-code',
  xml: 'fa-file-code',
  jpg: 'fa-file-image',
  png: 'fa-file-image',
  pdf: 'fa-file-pdf',
  default: 'fa-file',
};

async function fetchFolders() {
  try {
    showLoading(true, 'Loading files...');

    const res = await fetch('/send-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);

    const data = await res.json();
    fileList.innerHTML = '';

    if (data.folders.length === 0 && data.files.length === 0) {
      showEmptyState();
    } else {
      data.folders.forEach((folder) => {
        const folderDiv = createFolderElement(folder);
        fileList.appendChild(folderDiv);
      });

      data.files.forEach((file) => {
        const fileDiv = createFileElement(file);
        fileList.appendChild(fileDiv);
      });
    }

    showLoading(false);
  } catch (error) {
    console.error('Error fetching folders:', error);
    showLoading(false);
  }
}

function createFolderElement(folder) {
  const folderDiv = document.createElement('div');
  folderDiv.className = 'item folder';
  folderDiv.dataset.path = folder.path;

  const arrow = document.createElement('span');
  arrow.className = 'arrow';
  arrow.innerHTML = '<i class="fas fa-chevron-right"></i>';
  arrow.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleFolder(folderDiv, folder);
  });

  const icon = document.createElement('span');
  icon.className = 'icon';
  icon.innerHTML = '<i class="fas fa-folder"></i>';

  const name = document.createElement('span');
  name.className = 'name';
  name.textContent = folder.name;

  folderDiv.appendChild(arrow);
  folderDiv.appendChild(icon);
  folderDiv.appendChild(name);

  folderDiv.addEventListener('click', () => toggleFolder(folderDiv, folder));

  return folderDiv;
}

function createFileElement(file) {
  const fileDiv = document.createElement('div');
  fileDiv.className = 'item file';

  const fileExtension = file.name.split('.').pop().toLowerCase();
  const iconClass = fileIcons[fileExtension] || fileIcons['default'];

  const fileIcon = document.createElement('span');
  fileIcon.className = 'icon';
  fileIcon.innerHTML = `<i class="fas ${iconClass}"></i>`;

  const fileLink = document.createElement('a');
  fileLink.href = '#';
  fileLink.className = 'item';
  fileLink.textContent = file.name;
  fileLink.onclick = (e) => {
    e.preventDefault();
    loadFileFromGitHub(file.path);
  };

  fileLink.insertAdjacentElement('afterbegin', fileIcon);
  fileDiv.appendChild(fileLink);

  return fileDiv;
}

async function loadFileFromGitHub(filePath) {
  try {
    showLoading(true, 'Opening file...');
    const res = await fetch(`/file-content/${filePath}`, { method: 'POST' });

    if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
    const data = await res.json();

    if (data.content) {
      showFilePreview(atob(data.content), filePath);
    }
  } catch (error) {
    console.error('Error loading file:', error);
  } finally {
    showLoading(false);
  }
}

function toggleFolder(folderDiv, folder) {
  const arrow = folderDiv.querySelector('.arrow i');
  const icon = folderDiv.querySelector('.icon i');
  let subFolderDiv = folderDiv.nextElementSibling;

  if (subFolderDiv && subFolderDiv.classList.contains('sub-folder')) {
    const isHidden = subFolderDiv.classList.toggle('hidden');
    arrow.className = isHidden ? 'fas fa-chevron-right' : 'fas fa-chevron-down';
    icon.className = isHidden ? 'fas fa-folder' : 'fas fa-folder-open';
  } else {
    subFolderDiv = document.createElement('div');
    subFolderDiv.className = 'sub-folder';
    folderDiv.after(subFolderDiv);
    arrow.className = 'fas fa-chevron-down';
    icon.className = 'fas fa-folder-open';

    folder.children.forEach((child) => {
      const childElement = child.type === 'folder' ? createFolderElement(child) : createFileElement(child);
      subFolderDiv.appendChild(childElement);
    });
  }
}

function showFilePreview(content, filename) {
  const textArea = document.createElement('textarea');
  modalDiv.innerHTML = '';
  modalDiv.className = 'modal';
  textArea.value = content;
  modalDiv.appendChild(textArea);
  fileList.parentElement.appendChild(modalDiv);
  fileList.style.display = 'none';

  const editor = CodeMirror.fromTextArea(textArea, {
    mode: 'text/x-c++src',
    theme: 'monokai',
    lineNumbers: true,
  });

  editor.refresh();
}

const themeToggle = document.getElementById('theme-toggle');
themeToggle.addEventListener('click', () => {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  sessionStorage.setItem('theme', newTheme);
});

function showLoading(show, message = 'Loading...') {
  loader.style.display = show ? 'block' : 'none';
  document.querySelector('.loader-container .title').textContent = message;
}

function showEmptyState(message = 'This folder is empty') {
  const emptyFolder = document.querySelector('.empty-folder');
  if (!emptyFolder) return;
  emptyFolder.style.display = 'block';
  emptyFolder.innerHTML = `<div class="empty-state"><i class="fas fa-folder-open"></i><p>${message}</p></div>`;
}

function init() {
  window.addEventListener('load', fetchFolders);
}

document.addEventListener('DOMContentLoaded', init);
