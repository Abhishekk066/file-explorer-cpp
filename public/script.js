// Current path for breadcrumb navigation

let currentPath = '';
const fileList = document.getElementById('file-list');
const loader = document.querySelector('.loader-parent');
const toast = document.getElementById('toast');
const breadcrumb = document.getElementById('breadcrumb');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const backButton = document.querySelector('.back');

// File and folder type icons mapping
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

// Fetch and display folders/files
async function fetchFolders() {
  try {
    showLoading(true, 'Loading files...');

    const res = await fetch('/send-file', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);

    const data = await res.json();
    fileList.innerHTML = '';

    if (data.folders.length === 0 && data.files.length === 0) {
      showEmptyState();
    } else {
      // Display folders first
      data.folders.forEach((folder) => {
        const folderDiv = createFolderElement(folder);
        fileList.appendChild(folderDiv);

        if (sessionStorage.getItem(folder.path) === 'open') {
          toggleFolder(folderDiv, folder, true);
        }
      });

      // Then display files
      data.files.forEach((file) => {
        const fileDiv = createFileElement(file);
        fileList.appendChild(fileDiv);
      });
    }

    showLoading(false);
  } catch (error) {
    console.error('Error fetching folders:', error);
    showLoading(false);
    //showToast('Failed to load files', 'error');
  }
}

// Create folder element
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

// Create file element
function createFileElement(file) {
  const fileDivMain = document.createElement('div');
  fileDivMain.className = 'item-main';

  // Get file extension for icon
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
    //fetchFileContent(file.path);
  };

  const fileBtn = document.createElement('button');
  fileBtn.className = 'action-btn';
  fileBtn.innerHTML =
    '<i class="fas fa-code"></i> <span class="button-text">Editor</span>';
  fileBtn.onclick = (e) => {
    e.stopPropagation();
    loadUrl(file.path);
  };

  fileLink.insertAdjacentElement('afterbegin', fileIcon);
  fileDivMain.appendChild(fileLink);
  fileDivMain.appendChild(fileBtn);
  return fileDivMain;
}

// Toggle folder open/closed
function toggleFolder(folderDiv, folder, isRestoring = false) {
  const arrow = folderDiv.querySelector('.arrow i');
  const icon = folderDiv.querySelector('.icon i');
  let subFolderDiv = folderDiv.nextElementSibling;

  if (subFolderDiv && subFolderDiv.classList.contains('sub-folder')) {
    // Folder is already open, toggle it
    const isHidden = subFolderDiv.classList.toggle('hidden');
    arrow.className = isHidden ? 'fas fa-chevron-right' : 'fas fa-chevron-down';
    icon.className = isHidden ? 'fas fa-folder' : 'fas fa-folder-open';
  } else {
    // Create new subfolder element
    subFolderDiv = document.createElement('div');
    subFolderDiv.className = 'sub-folder';
    folderDiv.after(subFolderDiv);

    // Open the folder visually
    arrow.className = 'fas fa-chevron-down';
    icon.className = 'fas fa-folder-open';

    folder.children.forEach((child) => {
      const childElement =
        child.type === 'folder'
          ? createFolderElement(child)
          : createFileElement(child);
      subFolderDiv.appendChild(childElement);

      if (
        child.type === 'folder' &&
        sessionStorage.getItem(child.path) === 'open'
      ) {
        toggleFolder(childElement, child, true);
      }
    });
  }

  // Store folder state
  if (!isRestoring) {
    const isOpen = !subFolderDiv.classList.contains('hidden');
    sessionStorage.setItem(folder.path, isOpen ? 'open' : 'closed');
  }
}

// Fetch and display file content
// async function fetchFileContent(filePath) {
//   try {
//     showLoading(true, 'Loading file content...');

//     const res = await fetch(`/files/${filePath}`, { method: 'POST' });
//     if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);

//     const data = await res.json();
//     showLoading(false);
//     showFilePreview(data.content, filePath);
//   } catch (error) {
//     console.error('Error fetching file:', error);
//     showLoading(false);
//     //showToast('Failed to fetch file content', 'error');
//   }
// }

const modalDiv = document.createElement('div');

// function showFilePreview(content, filename) {
//   setEditor(content, filename);
// }

function setEditor(content, filename) {
  const textArea = document.createElement('textarea');
  modalDiv.innerHTML = '';
  modalDiv.className = 'modal';
  textArea.value = content;
  modalDiv.appendChild(textArea);
  fileList.parentElement.appendChild(modalDiv);
  fileList.style.display = 'none';
  searchButton.disabled = true;
  searchInput.disabled = true;
  searchButton.style.cursor = 'not-allowed';
  searchInput.style.cursor = 'not-allowed';
  const isMeddiumDevice = window.innerWidth <= 650;
  backButton.style.display = isMeddiumDevice ? 'none' : 'block';
  const currentTheme = sessionStorage.getItem('theme');
  console.log(currentTheme === 'light');

  try {
    var editor = CodeMirror.fromTextArea(textArea, {
      mode: 'text/x-c++src',
      theme: currentTheme === 'light' ? 'eclipse' : 'monokai',
      lineNumbers: true,
      tabSize: 4,
      indentUnit: 4,
      readOnly: 'nocursor',
    });

    editor.refresh();

    window.addEventListener('resize', () => {
      editor.refresh();
    });
  } catch (e) {
    if (e) {
      console.error('not connected');
    }
  }
}

// Theme toggle functionality
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = themeToggle.querySelector('i');
const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

// Check for saved theme or use system preference
const savedTheme = sessionStorage.getItem('theme');
if (savedTheme) {
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
} else if (prefersDarkScheme.matches) {
  document.documentElement.setAttribute('data-theme', 'dark');
  updateThemeIcon('dark');
}

function updateThemeIcon(theme) {
  if (theme === 'dark') {
    themeIcon.className = 'fas fa-sun';
  } else {
    themeIcon.className = 'fas fa-moon';
  }
}

themeToggle.addEventListener('click', function () {
  let currentTheme = document.documentElement.getAttribute('data-theme');
  let newTheme = currentTheme === 'dark' ? 'light' : 'dark';

  document.documentElement.setAttribute('data-theme', newTheme);
  sessionStorage.setItem('theme', newTheme);
  updateThemeIcon(newTheme);
});

// Loading state management
function showLoading(show, message = 'Loading...') {
  loader.style.display = show ? 'block' : 'none';
  document.querySelector('.loader-container .title').textContent = message;
}

// Toast message display
function showToast(message, type = 'info') {
  toast.className = `toast ${type} show`;
  toast.querySelector('span').textContent = message;

  setTimeout(() => {
    toast.className = 'toast';
  }, 3000);
}

// Open file in editor
let loadCount = 0;
async function loadUrl(filePath) {
  if (loadCount > 0) return;
  loadCount++;

  try {
    showLoading(true, 'Opening in editor, please wait...');
    const res = await fetch(`/files-view/${filePath}`, {
      method: 'POST',
    });

    if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
    const data = await res.json();

    if (data.message === 'ok') {
      const geturl = await fetch(`/get-url`, { method: 'POST' });
      if (!geturl.ok) throw new Error(`HTTP error! Status: ${geturl.status}`);
      const dataUrl = await geturl.json();
      openInNewTab(dataUrl.url);
    }
  } catch (err) {
    console.error('Error loading file:', err);
  } finally {
    showLoading(false);
    loadCount = 0;
  }
}

// Open URL in new tab or redirect if popup blocked
function openInNewTab(url) {
  const newTab = window.open(url, '_blank');
  if (!newTab) {
    console.log('Popup blocked, redirecting to:', url);
    window.location.href = url;
  }
}

const headerBar = document.querySelector('header');
window.addEventListener('scroll', () => {
  if (window.scrollY > 71) {
    headerBar.style.background = 'var(--bg-primary)';
    headerBar.style.padding = '10px 25px';
  } else {
    headerBar.style.background = 'var(--bg-secondary)';
    headerBar.style.padding = '10px 25px 0';
  }
});

// Handle responsive behavior
function handleResponsive() {
  const isMobile = window.innerWidth <= 480;
  const isSmallMobile = window.innerWidth <= 375;
  const isLargerScreen = window.innerWidth <= 1024;
  const buttons = document.querySelectorAll('.action-btn');
  const searchButtonR = document.getElementById('search-button');
  const itemMain = document.querySelectorAll('.item-main');

  searchButtonR.innerHTML = isMobile
    ? '<i class="fas fa-search"></i>'
    : '<i class="fas fa-search"></i> Search';

  buttons.forEach((btn) => {
    const textSpan = btn.querySelector('.button-text');
    if (textSpan) {
      textSpan.textContent = isMobile ? 'Editor' : 'Open in Editor';
      textSpan.style.display = isSmallMobile ? 'none' : 'inline';
    }

    itemMain.forEach((element) => {
      element.style.maxWidth = isLargerScreen ? '100%' : '65%';
    });
  });
}

function init() {
  window.addEventListener('load', fetchFolders);
  window.addEventListener('resize', handleResponsive);
  setTimeout(handleResponsive, 300);
  breadcrumb.addEventListener('click', closeAndDefault);
  backButton.addEventListener('click', closeAndDefault);

  searchInput?.addEventListener('input', debounce(performSearch, 300));
  searchButton?.addEventListener('click', performSearch);

  function closeAndDefault() {
    showFolder();
    fetchFolders();
    fileList.style.display = 'block';
    modalDiv.innerHTML = '';
    searchButton.disabled = false;
    searchInput.disabled = false;
    searchButton.style.cursor = '';
    searchInput.style.cursor = '';
    backButton.style.display = 'none';
  }

  function performSearch() {
    const query = searchInput?.value.trim().toLowerCase();
    const allItems = fileList?.querySelectorAll('.item, .item-main');

    if (!allItems) return;
    let hasResults = false;

    if (!query) {
      allItems.forEach((item) => (item.style.display = 'flex'));
      showFolder();
      return;
    }

    allItems.forEach((item) => {
      const textContent = item.textContent.trim().toLowerCase();
      const matches = textContent.includes(query);
      item.style.display = matches ? 'flex' : 'none';
      if (matches) {
        hasResults = true;
        const button = item.querySelector('button');
        if (button) button.style.display = 'none';
      }
    });

    hasResults ? showFolder() : showEmptyState('No matching results found');
  }

  function debounce(func, delay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => func.apply(this, args), delay);
    };
  }

  function showFolder() {
    const emptyState = document.querySelector('.empty-folder');
    if (emptyState) {
      emptyState.style.display = 'none';
      emptyState.innerHTML = '';
    }
  }

  function showEmptyState(message = 'This folder is empty') {
    const emptyFolder = document.querySelector('.empty-folder');
    if (!emptyFolder) return;

    emptyFolder.style.display = 'block';
    emptyFolder.innerHTML = `
    <div class="empty-state">
      <i class="fas fa-folder-open"></i>
      <p>${message}</p>
    </div>
  `;
  }

  info();
}

async function info() {
  try {
    await fetch('/info', { method: 'POST' });
  } catch (error) {
    console.error(error);
  }
}

// Start the app
document.addEventListener('DOMContentLoaded', init);
