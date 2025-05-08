let currentPath = "";
const fileList = document.getElementById("file-list");
const loader = document.querySelector(".loader-parent");
const toast = document.getElementById("toast");
const breadcrumb = document.getElementById("breadcrumb");
const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");
const backButton = document.querySelector(".back");

const fileIcons = {
  cpp: "fa-file-code",
  h: "fa-file-code",
  c: "fa-file-code",
  hpp: "fa-file-code",
  txt: "fa-file-alt",
  md: "fa-file-alt",
  json: "fa-file-code",
  xml: "fa-file-code",
  jpg: "fa-file-image",
  png: "fa-file-image",
  pdf: "fa-file-pdf",
  default: "fa-file",
};

async function fetchFolders() {
  try {
    showLoading(true, "Loading...");

    const res = await fetch("/send-folder", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);

    const data = await res.json();
    fileList.innerHTML = "";

    if (data.folders.length === 0 && data.files.length === 0) {
      showEmptyState();
    } else {
      data.folders.forEach((folder) => {
        const folderDiv = createFolderElement(folder);
        fileList.appendChild(folderDiv);

        if (sessionStorage.getItem(folder.path) === "open") {
          toggleFolder(folderDiv, folder, true);
        }
      });

      data.files.forEach((file) => {
        const fileDiv = createFileElement(file);
        fileList.appendChild(fileDiv);
      });
    }

    showLoading(false);
  } catch (error) {
    showLoading(false);
    console.error("Failed to load folders:", error);
    //showToast('Failed to load files', 'error');
  }
}

function createFolderElement(folder) {
  const folderDiv = document.createElement("div");
  folderDiv.className = "item folder";
  folderDiv.dataset.path = folder.path;

  const arrow = document.createElement("span");
  arrow.className = "arrow";
  arrow.innerHTML = '<i class="fas fa-chevron-right"></i>';
  arrow.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleFolder(folderDiv, folder);
  });

  const icon = document.createElement("span");
  icon.className = "icon";
  icon.innerHTML = '<i class="fas fa-folder"></i>';

  const name = document.createElement("span");
  name.className = "name";
  name.textContent = folder.name;

  folderDiv.appendChild(arrow);
  folderDiv.appendChild(icon);
  folderDiv.appendChild(name);

  folderDiv.addEventListener("click", () => toggleFolder(folderDiv, folder));

  return folderDiv;
}

function createFileElement(file) {
  const fileDivMain = document.createElement("div");
  fileDivMain.className = "item-main";

  const fileExtension = file.name.split(".").pop().toLowerCase();
  const iconClass = fileIcons[fileExtension] || fileIcons["default"];

  const fileIcon = document.createElement("span");
  fileIcon.className = "icon";
  fileIcon.innerHTML = `<i class="fas ${iconClass}"></i>`;

  const fileLink = document.createElement("a");
  fileLink.href = "#";
  fileLink.className = "item";
  fileLink.textContent = file.name;
  fileLink.onclick = async (e) => {
    e.preventDefault();
    const response = await fetch("/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: file.url,
        download_url: file.download_url,
        fileName: file.name,
      }),
    });

    if (response.ok) {
      loadUrl();
    }
  };

  const fileBtn = document.createElement("button");
  fileBtn.className = "action-btn";
  fileBtn.innerHTML =
    '<i class="fas fa-code"></i> <span class="button-text">Editor</span>';
  fileBtn.onclick = async (e) => {
    e.stopPropagation();
    const response = await fetch("/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: file.url,
        download_url: file.download_url,
        fileName: file.name,
      }),
    });

    if (response.ok) {
      loadUrl();
    }
  };

  fileLink.insertAdjacentElement("afterbegin", fileIcon);
  fileDivMain.appendChild(fileLink);
  fileDivMain.appendChild(fileBtn);
  return fileDivMain;
}

async function toggleFolder(folderDiv, folder, isRestoring = false) {
  try {
    const arrow = folderDiv.querySelector(".arrow i");
    const icon = folderDiv.querySelector(".icon i");
    let subFolderDiv = folderDiv.nextElementSibling;

    if (subFolderDiv && subFolderDiv.classList.contains("sub-folder")) {
      const isHidden = subFolderDiv.classList.toggle("hidden");
      arrow.className = isHidden
        ? "fas fa-chevron-right"
        : "fas fa-chevron-down";
      icon.className = isHidden ? "fas fa-folder" : "fas fa-folder-open";
    } else {
      showLoading(true, "Loading files...");

      const response = await fetch("/send-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderName: folder.name, url: folder.url }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      subFolderDiv = document.createElement("div");
      subFolderDiv.className = "sub-folder";
      folderDiv.after(subFolderDiv);
      arrow.className = "fas fa-chevron-down";
      icon.className = "fas fa-folder-open";

      for (const child of data) {
        const childElement =
          child.type === "folder"
            ? createFolderElement(child)
            : createFileElement(child);
        subFolderDiv.appendChild(childElement);

        if (
          child.type === "folder" &&
          sessionStorage.getItem(child.path) === "open"
        ) {
          await toggleFolder(childElement, child, true);
        }
      }

      showLoading(false);
    }

    if (!isRestoring) {
      const isOpen = !subFolderDiv.classList.contains("hidden");
      sessionStorage.setItem(folder.path, isOpen ? "open" : "closed");
    }
  } catch (error) {
    console.error("Error in toggleFolder:", error);
    showLoading(false);
  }
}

const themeToggle = document.getElementById("theme-toggle");
const themeIcon = themeToggle?.querySelector("i");
const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");

if (themeToggle && themeIcon) {
  const savedTheme = sessionStorage.getItem("theme");
  if (savedTheme) {
    document.documentElement.setAttribute("data-theme", savedTheme);
    updateThemeIcon(savedTheme);
  } else if (prefersDarkScheme.matches) {
    document.documentElement.setAttribute("data-theme", "dark");
    updateThemeIcon("dark");
  } else {
    document.documentElement.setAttribute("data-theme", "light");
    updateThemeIcon("light");
  }

  prefersDarkScheme.addEventListener("change", function (e) {
    const newTheme = e.matches ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", newTheme);
    sessionStorage.setItem("theme", newTheme);
    updateThemeIcon(newTheme);
  });

  themeToggle.addEventListener("click", function () {
    let currentTheme = document.documentElement.getAttribute("data-theme");
    let newTheme = currentTheme === "dark" ? "light" : "dark";

    document.documentElement.setAttribute("data-theme", newTheme);
    sessionStorage.setItem("theme", newTheme);
    updateThemeIcon(newTheme);
  });
}

function updateThemeIcon(theme) {
  if (!themeIcon) return;

  if (theme === "dark") {
    themeIcon.className = "fas fa-sun";
  } else {
    themeIcon.className = "fas fa-moon";
  }
}

function showLoading(show, message = "Loading...") {
  if (!loader) return;

  loader.style.display = show ? "block" : "none";
  const loaderTitle = document.querySelector(".loader-container .title");
  if (loaderTitle) {
    loaderTitle.textContent = message;
  }
}

function showToast(message, type = "info") {
  if (!toast) return;

  toast.className = `toast ${type} show`;
  const toastSpan = toast.querySelector("span");
  if (toastSpan) {
    toastSpan.textContent = message;
  }

  setTimeout(() => {
    toast.className = "toast";
  }, 3000);
}

let loadCount = 0;
async function loadUrl() {
  if (loadCount > 0) return;
  loadCount++;
  try {
    showLoading(true, "Opening in editor, please wait...");
    const geturl = await fetch(`/get-url`, { method: "POST" });
    if (!geturl.ok) throw new Error(`HTTP error! Status: ${geturl.status}`);
    const dataUrl = await geturl.json();
    if (dataUrl && dataUrl.url) {
      openInNewTab(dataUrl.url);
    } else {
      throw new Error("Invalid URL data received");
    }
  } catch (err) {
    console.error("Error loading file:", err);
    showToast("Failed to open file in editor", "error");
  } finally {
    showLoading(false);
    loadCount = 0;
  }
}

function openInNewTab(url) {
  const newTab = window.open(url, "_blank");
  if (!newTab) {
    window.location.href = url;
  }
}

const headerBar = document.querySelector("header");
if (headerBar) {
  window.addEventListener("scroll", () => {
    if (window.scrollY > 71) {
      headerBar.style.background = "var(--bg-primary)";
      headerBar.style.padding = "10px 25px";
    } else {
      headerBar.style.background = "var(--bg-secondary)";
      headerBar.style.padding = "10px 25px 0";
    }
  });
}

function handleResponsive() {
  const isMobile = window.innerWidth <= 480;
  const middleD = window.innerWidth <= 660;
  const isSmallMobile = window.innerWidth <= 375;
  const isLargerScreen = window.innerWidth <= 1024;
  const buttons = document.querySelectorAll(".action-btn");
  const searchButtonR = document.getElementById("search-button");
  const itemMain = document.querySelectorAll(".item-main");
  const serachCon = document.querySelector(".search-container");

  if (searchButtonR) {
    searchButtonR.innerHTML = isMobile
      ? '<i class="fas fa-search"></i>'
      : '<i class="fas fa-search"></i> Search';
  }

  if (middleD) {
    searchButton.style.display = "none";
    searchInput.style.display = "none";
    serachCon.style.display = "block";
    serachCon.style.width = "50px";
  } else {
    searchButton.style.display = "block";
    searchInput.style.display = "block";
    serachCon.style.display = "flex";
  }

  buttons.forEach((btn) => {
    const textSpan = btn.querySelector(".button-text");
    if (textSpan) {
      textSpan.textContent = isMobile ? "Editor" : "Open in Editor";
      textSpan.style.display = isSmallMobile ? "none" : "inline";
    }
  });

  itemMain.forEach((element) => {
    element.style.maxWidth = isLargerScreen ? "100%" : "65%";
  });
}

function init() {
  window.addEventListener("load", fetchFolders);
  window.addEventListener("resize", handleResponsive);
  setTimeout(handleResponsive, 300);

  if (breadcrumb) {
    breadcrumb.addEventListener("click", closeAndDefault);
  }

  if (backButton) {
    backButton.addEventListener("click", closeAndDefault);
  }

  if (searchInput) {
    searchInput.addEventListener("input", debounce(performSearch, 300));
  }

  if (searchButton) {
    searchButton.addEventListener("click", performSearch);
  }

  function closeAndDefault() {
    showFolder();
    fetchFolders();
    if (fileList) fileList.style.display = "block";
    if (modalDiv) modalDiv.innerHTML = "";

    if (searchButton) {
      searchButton.disabled = false;
      searchButton.style.cursor = "";
    }

    if (searchInput) {
      searchInput.disabled = false;
      searchInput.style.cursor = "";
    }

    if (backButton) {
      backButton.style.display = "none";
    }
  }

  function performSearch() {
    const query = searchInput?.value.trim().toLowerCase();
    const allItems = fileList?.querySelectorAll(".item, .item-main");

    if (!allItems || allItems.length === 0) return;
    let hasResults = false;

    if (!query) {
      allItems.forEach((item) => {
        item.style.display = "flex";
        const button = item.querySelector("button");
        if (button) button.style.display = "block";
      });
      showFolder();
      return;
    }

    allItems.forEach((item) => {
      const button = item.querySelector("button");
      const text = item.textContent.trim().toLowerCase();
      const matches = text.includes(query);
      item.style.display = matches ? "flex" : "none";
      if (button) button.style.display = matches ? "none" : "block";
      if (matches) hasResults = true;
    });

    hasResults ? showFolder() : showEmptyState("No matching results found");
  }

  function debounce(func, delay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => func.apply(this, args), delay);
    };
  }

  function showFolder() {
    const emptyState = document.querySelector(".empty-folder");
    if (emptyState) {
      emptyState.style.display = "none";
      emptyState.innerHTML = "";
    }
  }

  function showEmptyState(message = "This folder is empty") {
    const emptyFolder = document.querySelector(".empty-folder");
    if (!emptyFolder) {
      const emptyFolder = document.createElement("div");
      emptyFolder.className = "empty-folder";
      fileList?.appendChild(emptyFolder);
    }

    const emptyFolderElement = document.querySelector(".empty-folder");
    if (emptyFolderElement) {
      emptyFolderElement.style.display = "block";
      emptyFolderElement.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-folder-open"></i>
          <p>${message}</p>
        </div>
      `;
    }
  }

  info();
}

async function info() {
  try {
    await fetch("/info", { method: "POST" });
  } catch (error) {
    console.error("Error sending info:", error);
  }
}

document.addEventListener("DOMContentLoaded", init);
