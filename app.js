/**
 * huEVO SWAGdev — Скрипт каталога продуктов (VK 2010 Style)
 * Поддержка 3 продуктов, модального окна Firefox/Chromium, полноценной страницы "О проекте"
 * и кастомизации звуков через HTML-теги <audio src="..."> / папку sounds/
 */

// ============================================================================
// 1. ДАННЫЕ 3 ПРОДУКТОВ (Легко редактировать под ваши задачи)
// ============================================================================
const PRODUCTS = [
  {
    id: "product1",
    title: "huEVO themes",
    description: "Набор кастомных ретро-тем оформления ВКонтакте 2010 и стилей интерфейса для браузера.",
    version: "v1.1",
    image: "images/product1.png",
    firefoxFileName: "huevo-themes-firefox.zip",
    firefoxXpiFileName: "huevo-themes-firefox.xpi",
    chromiumFileName: "huevo-themes-chromium.zip",
    firefoxUrl: "https://github.com/neriusshadow/SWAGDEVhuEVOthemes/releases/download/v1.1/huevo-themes-firefox.zip",
    firefoxXpiUrl: "https://github.com/neriusshadow/SWAGDEVhuEVOthemes/releases/download/v1.1/huevo-themes-firefox.xpi",
    chromiumUrl: "https://github.com/neriusshadow/SWAGDEVhuEVOthemes/releases/download/v1.1/huevo-themes-chromium.zip",
    githubRepoUrl: "https://github.com/neriusshadow/SWAGDEVhuEVOthemes",
    githubReleaseUrl: "https://github.com/neriusshadow/SWAGDEVhuEVOthemes/releases/tag/v1.1"
  },
  {
    id: "product2",
    title: "huEVO games",
    description: "Полноценный раздел «Игры» для huEVO в эстетике старого ВКонтакте с каталогом браузерных ретро-игр.",
    version: "v1.0",
    image: "images/product2.png",
    firefoxFileName: "huevo-games-firefox.zip",
    firefoxXpiFileName: "huevo-games-firefox.xpi",
    chromiumFileName: "huevo-games-chromium.zip",
    firefoxUrl: "products/huevogames/huevo-games-firefox.zip",
    firefoxXpiUrl: "products/huevogames/huevo-games-firefox.xpi",
    chromiumUrl: "products/huevogames/huevo-games-chromium.zip"
  },
  {
    id: "product3",
    title: "fedorEvo",
    description: "Плагин кастомизации для huEVO: заменяет все иконки и названия категорий на Федор Яйца.",
    version: "v0.67",
    image: "images/product3.png",
    firefoxFileName: "fedorevo-firefox.zip",
    firefoxXpiFileName: "fedorevo-firefox.xpi",
    chromiumFileName: "fedorevo-chromium.zip",
    firefoxUrl: "products/fedorevo/fedorevo-firefox.zip",
    firefoxXpiUrl: "products/fedorevo/fedorevo-firefox.xpi",
    chromiumUrl: "products/fedorevo/fedorevo-chromium.zip"
  }
];

// ============================================================================
// 2. СОСТОЯНИЕ ПРИЛОЖЕНИЯ
// ============================================================================
const state = {
  activeView: "catalog", // "catalog" | "about"
  favorites: JSON.parse(localStorage.getItem("huevo_favs") || "[]"),
  activeFilter: "all",
  searchQuery: "",
  activeProduct: null,
  activeBrowserMode: null,
  soundEnabled: true
};

// ============================================================================
// 3. ЗВУКОВОЙ ДВИЖОК С ПОДДЕРЖКОЙ SRC ИЗ HTML (И СИНТЕЗАТОРОМ В КАЧЕСТВЕ FALLBACK)
// ============================================================================
class SiteAudioEngine {
  constructor() {
    this.synthCtx = null;
  }

  initSynth() {
    if (!this.synthCtx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.synthCtx = new AudioCtx();
    }
  }

  // Воспроизведение звука клика (берет из <audio id="soundClickSrc" src="...">)
  playClick() {
    if (!state.soundEnabled) return;

    const audioEl = document.getElementById("soundClickSrc");
    if (audioEl && audioEl.src) {
      // Клонируем или сбрасываем время для мгновенного повторного клика
      try {
        const soundClone = audioEl.cloneNode();
        soundClone.volume = 0.5;
        const playPromise = soundClone.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Если браузер заблокировал файл или путь недоступен — используем синтезатор
            this.fallbackSynthClick();
          });
        }
        return;
      } catch (err) {
        this.fallbackSynthClick();
        return;
      }
    }

    this.fallbackSynthClick();
  }

  // Воспроизведение звука успеха (берет из <audio id="soundSuccessSrc" src="...">)
  playSuccess() {
    if (!state.soundEnabled) return;

    const audioEl = document.getElementById("soundSuccessSrc");
    if (audioEl && audioEl.src) {
      try {
        const soundClone = audioEl.cloneNode();
        soundClone.volume = 0.6;
        const playPromise = soundClone.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            this.fallbackSynthSuccess();
          });
        }
        return;
      } catch (err) {
        this.fallbackSynthSuccess();
        return;
      }
    }

    this.fallbackSynthSuccess();
  }

  // Резервный синтезатор щелчка (Web Audio)
  fallbackSynthClick() {
    try {
      this.initSynth();
      if (!this.synthCtx) return;
      if (this.synthCtx.state === "suspended") this.synthCtx.resume();

      const osc = this.synthCtx.createOscillator();
      const gain = this.synthCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(680, this.synthCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, this.synthCtx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.08, this.synthCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.synthCtx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.synthCtx.destination);

      osc.start();
      osc.stop(this.synthCtx.currentTime + 0.04);
    } catch (e) {}
  }

  // Резервный синтезатор успеха (Web Audio)
  fallbackSynthSuccess() {
    try {
      this.initSynth();
      if (!this.synthCtx) return;
      if (this.synthCtx.state === "suspended") this.synthCtx.resume();

      const now = this.synthCtx.currentTime;
      const osc = this.synthCtx.createOscillator();
      const gain = this.synthCtx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.08);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.synthCtx.destination);

      osc.start();
      osc.stop(now + 0.22);
    } catch (e) {}
  }
}

const audio = new SiteAudioEngine();

// ============================================================================
// 4. ПЕРЕКЛЮЧЕНИЕ СТРАНИЦ: КАТАЛОГ И О ПРОЕКТЕ
// ============================================================================
function switchView(viewName) {
  state.activeView = viewName;

  const catalogView = document.getElementById("catalogView");
  const aboutView = document.getElementById("aboutView");
  const navCatalogBtn = document.getElementById("navCatalogBtn");
  const navAboutBtn = document.getElementById("navAboutBtn");

  if (viewName === "about") {
    if (catalogView) catalogView.style.display = "none";
    if (aboutView) {
      aboutView.style.display = "flex";
      aboutView.classList.add("active");
    }
    if (navCatalogBtn) navCatalogBtn.classList.remove("active");
    if (navAboutBtn) navAboutBtn.classList.add("active");
    window.location.hash = "about";
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    if (aboutView) {
      aboutView.style.display = "none";
      aboutView.classList.remove("active");
    }
    if (catalogView) {
      catalogView.style.display = "flex";
      catalogView.classList.add("active");
    }
    if (navAboutBtn) navAboutBtn.classList.remove("active");
    if (navCatalogBtn) navCatalogBtn.classList.add("active");
    window.location.hash = "catalog";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

// ============================================================================
// 5. ГЕНЕРАТОР ПАКЕТА ДЛЯ СКАЧИВАНИЯ (Fallback blob)
// ============================================================================
function triggerDownloadFile(product, browserType) {
  audio.playSuccess();

  const isFirefox = browserType === "firefox";
  const fileName = isFirefox ? product.firefoxFileName : product.chromiumFileName;
  const directUrl = isFirefox ? product.firefoxUrl : product.chromiumUrl;

  if (directUrl && directUrl.trim() !== "#" && directUrl.trim() !== "") {
    const a = document.createElement("a");
    a.href = directUrl;
    a.download = fileName;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast(`Загрузка ${fileName} запущена!`);
    return;
  }

  const manifest = {
    manifest_version: isFirefox ? 2 : 3,
    name: product.title,
    version: product.version.replace(/^v/, ""),
    description: product.description,
    author: "huEVO SWAGdev",
    action: {
      default_title: product.title
    }
  };

  const fileContent = 
`================================================================
 huEVO SWAGdev Package: ${product.title}
 Версия: ${product.version}
 Браузер: ${isFirefox ? "Mozilla Firefox (.xpi)" : "Chromium (.zip)"}
================================================================

ИНСТРУКЦИЯ ПО УСТАНОВКЕ:
${isFirefox ? 
`1. Откройте в Firefox страницу: about:addons
2. Нажмите на шестеренку вверху и выберите «Установить дополнение из файла...»
3. Укажите этот файл для завершения установки.` 
: 
`1. Откройте в браузере страницу: chrome://extensions/
2. В правом верхнем углу включите тумблер «Режим разработчика».
3. Нажмите «Загрузить распакованное расширение» и выберите распакованные файлы.`
}

CONFIG:
${JSON.stringify(manifest, null, 2)}
`;

  const blob = new Blob([fileContent], { type: "application/octet-stream" });
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);

  showToast(`Файл ${fileName} успешно сохранён!`);
}

// ============================================================================
// 6. РЕНДЕРИНГ СЕТКИ 3 КАРТОЧЕК ПРОДУКТОВ
// ============================================================================
function renderProductsGrid() {
  const container = document.getElementById("productsGrid");
  if (!container) return;

  const query = state.searchQuery.toLowerCase().trim();
  const filtered = PRODUCTS.filter(p => {
    if (state.activeFilter === "fav" && !state.favorites.includes(p.id)) {
      return false;
    }
    if (query) {
      const matchTitle = p.title.toLowerCase().includes(query);
      const matchDesc = p.description.toLowerCase().includes(query);
      return matchTitle || matchDesc;
    }
    return true;
  });

  const favCountEl = document.getElementById("favCount");
  if (favCountEl) favCountEl.textContent = state.favorites.length;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="catalog-empty-state">
        <p>Ничего не найдено ${state.activeFilter === "fav" ? "в избранном" : ""}. Попробуйте изменить поисковый запрос.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(prod => {
    const isFav = state.favorites.includes(prod.id);
    return `
      <article class="product-card" data-id="${prod.id}">
        
        <!-- Заголовок карточки -->
        <header class="product-card-header">
          <div class="product-card-title-group">
            <h3 class="product-card-title" onclick="openDownloadModal('${prod.id}')">${prod.title}</h3>
          </div>
          <button 
            class="product-card-fav-btn ${isFav ? "is-fav" : ""}" 
            onclick="toggleFavorite('${prod.id}')"
            title="${isFav ? "Удалить из избранного" : "Добавить в избранное"}"
            aria-label="Избранное"
          >
            ${isFav ? "★" : "☆"}
          </button>
        </header>

        <!-- Область PNG картинки -->
        <div class="product-card-image-box" onclick="openDownloadModal('${prod.id}')">
          <span class="product-card-badge">${prod.version}</span>
          <img 
            src="${prod.image}" 
            alt="${prod.title}" 
            class="product-card-image" 
            onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22260%22 height=%22220%22 viewBox=%220 0 260 220%22><rect width=%22260%22 height=%22220%22 fill=%22%23eef2f7%22/><text x=%22130%22 y=%22115%22 text-anchor=%22middle%22 font-family=%22Tahoma%22 font-size=%2214%22 fill=%22%236688aa%22 font-weight=%22bold%22>${prod.title}</text></svg>'"
          />
        </div>

        <!-- Описание -->
        <div class="product-card-body">
          <p class="product-card-desc">${prod.description}</p>
        </div>

        <!-- Кнопка Скачать ▼ в точности как в референсе -->
        <footer class="product-card-footer">
          <button class="vk-download-btn-2010" onclick="openDownloadModal('${prod.id}')">
            <span>Скачать</span>
            <span class="btn-down-arrow">▼</span>
          </button>
        </footer>

      </article>
    `;
  }).join("");
}

// ============================================================================
// 7. ИЗБРАННОЕ
// ============================================================================
function toggleFavorite(productId) {
  audio.playClick();
  const index = state.favorites.indexOf(productId);
  if (index === -1) {
    state.favorites.push(productId);
    showToast("Добавлено в избранное!");
  } else {
    state.favorites.splice(index, 1);
    showToast("Удалено из избранного");
  }
  localStorage.setItem("huevo_favs", JSON.stringify(state.favorites));
  renderProductsGrid();
}

// ============================================================================
// 8. МОДАЛЬНОЕ ОКНО СКАЧИВАНИЯ (ВЫБОР БРАУЗЕРА + ИНСТРУКЦИИ)
// ============================================================================
function openDownloadModal(productId) {
  audio.playClick();
  const prod = PRODUCTS.find(p => p.id === productId);
  if (!prod) return;

  state.activeProduct = prod;
  state.activeBrowserMode = null;

  document.getElementById("modalTitle").textContent = `Загрузка: ${prod.title}`;
  document.getElementById("modalProdTitle").textContent = prod.title;
  document.getElementById("modalProdVersion").textContent = prod.version;
  document.getElementById("modalProdDesc").textContent = prod.description;
  document.getElementById("modalProdImg").src = prod.image;

  document.getElementById("ffFileName").textContent = prod.firefoxFileName;
  document.getElementById("crFileName").textContent = prod.chromiumFileName;

  const githubLink = document.getElementById("modalGithubLink");
  if (githubLink) {
    if (prod.githubRepoUrl) {
      githubLink.href = prod.githubRepoUrl;
      githubLink.style.display = "inline-flex";
    } else {
      githubLink.style.display = "none";
    }
  }

  const downloadFfBtn = document.getElementById("downloadFfFileBtn");
  if (downloadFfBtn) {
    downloadFfBtn.href = prod.firefoxUrl || "#";
    downloadFfBtn.setAttribute("download", prod.firefoxFileName);
    downloadFfBtn.onclick = (e) => {
      e.preventDefault();
      triggerDownloadFile(state.activeProduct, "firefox");
    };
  }

  const downloadFfXpiBtn = document.getElementById("downloadFfXpiBtn");
  if (downloadFfXpiBtn) {
    const xpiUrl = prod.firefoxXpiUrl || prod.firefoxUrl || "#";
    const xpiName = prod.firefoxXpiFileName || "addon.xpi";
    downloadFfXpiBtn.href = xpiUrl;
    downloadFfXpiBtn.setAttribute("download", xpiName);
    downloadFfXpiBtn.onclick = (e) => {
      e.preventDefault();
      const a = document.createElement("a");
      a.href = xpiUrl;
      a.download = xpiName;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast(`Загрузка ${xpiName} запущена!`);
    };
  }

  const downloadCrBtn = document.getElementById("downloadCrFileBtn");
  if (downloadCrBtn) {
    downloadCrBtn.href = prod.chromiumUrl || "#";
    downloadCrBtn.setAttribute("download", prod.chromiumFileName);
    downloadCrBtn.onclick = (e) => {
      e.preventDefault();
      triggerDownloadFile(state.activeProduct, "chromium");
    };
  }

  showBrowserSelectStep();

  const modal = document.getElementById("downloadModal");
  modal.style.display = "flex";
  document.body.style.overflow = "hidden";
}

function closeDownloadModal() {
  audio.playClick();
  const modal = document.getElementById("downloadModal");
  modal.style.display = "none";
  document.body.style.overflow = "";
}

function showBrowserSelectStep() {
  state.activeBrowserMode = null;
  document.getElementById("stepBrowserSelect").style.display = "flex";
  document.getElementById("instructionFirefoxPane").style.display = "none";
  document.getElementById("instructionChromiumPane").style.display = "none";
  document.getElementById("modalCopyGuideBtn").style.display = "none";
}

function selectBrowser(browserType) {
  audio.playClick();
  state.activeBrowserMode = browserType;

  document.getElementById("stepBrowserSelect").style.display = "none";

  if (browserType === "firefox") {
    document.getElementById("instructionFirefoxPane").style.display = "block";
    document.getElementById("instructionChromiumPane").style.display = "none";
  } else {
    document.getElementById("instructionFirefoxPane").style.display = "none";
    document.getElementById("instructionChromiumPane").style.display = "block";
  }

  const copyBtn = document.getElementById("modalCopyGuideBtn");
  copyBtn.style.display = "inline-block";
  copyBtn.textContent = browserType === "firefox" 
    ? "Скопировать инструкцию для Firefox" 
    : "Скопировать инструкцию для Chromium";
}

// ============================================================================
// 9. УТИЛИТЫ: КОПИРОВАНИЕ И TOAST
// ============================================================================
function copyTextToClipboard(text, customMessage = "Скопировано в буфер обмена!") {
  audio.playClick();
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(customMessage);
    }).catch(() => {
      fallbackCopy(text, customMessage);
    });
  } else {
    fallbackCopy(text, customMessage);
  }
}

function fallbackCopy(text, customMessage) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand("copy");
    showToast(customMessage);
  } catch (err) {
    showToast("Не удалось скопировать");
  }
  document.body.removeChild(textArea);
}

let toastTimer = null;
function showToast(message) {
  const toast = document.getElementById("vkToast");
  const msgEl = document.getElementById("toastMessage");
  if (!toast || !msgEl) return;

  msgEl.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2400);
}

// ============================================================================
// 10. ИНИЦИАЛИЗАЦИЯ И СЛУШАТЕЛИ СОБЫТИЙ
// ============================================================================
document.addEventListener("DOMContentLoaded", () => {
  renderProductsGrid();

  // Проверка начального URL хеша (#about или #catalog)
  if (window.location.hash === "#about") {
    switchView("about");
  } else {
    switchView("catalog");
  }

  window.addEventListener("hashchange", () => {
    if (window.location.hash === "#about") {
      switchView("about");
    } else {
      switchView("catalog");
    }
  });

  // Навигация
  const navCatalogBtn = document.getElementById("navCatalogBtn");
  const navAboutBtn = document.getElementById("navAboutBtn");
  const logoLink = document.getElementById("logoLink");
  const backToCatalogFromAbout = document.getElementById("backToCatalogFromAbout");
  const returnCatalogFooterBtn = document.getElementById("returnCatalogFooterBtn");

  if (navCatalogBtn) {
    navCatalogBtn.addEventListener("click", () => {
      audio.playClick();
      switchView("catalog");
    });
  }

  if (navAboutBtn) {
    navAboutBtn.addEventListener("click", () => {
      audio.playClick();
      switchView("about");
    });
  }

  if (logoLink) {
    logoLink.addEventListener("click", (e) => {
      e.preventDefault();
      audio.playClick();
      switchView("catalog");
    });
  }

  if (backToCatalogFromAbout) {
    backToCatalogFromAbout.addEventListener("click", () => {
      audio.playClick();
      switchView("catalog");
    });
  }

  if (returnCatalogFooterBtn) {
    returnCatalogFooterBtn.addEventListener("click", () => {
      audio.playClick();
      switchView("catalog");
    });
  }

  // Поиск
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      state.searchQuery = e.target.value;
      renderProductsGrid();
    });
  }

  // Табы фильтра
  const tabAll = document.getElementById("tabAll");
  const tabFav = document.getElementById("tabFav");
  if (tabAll && tabFav) {
    tabAll.addEventListener("click", () => {
      audio.playClick();
      state.activeFilter = "all";
      tabAll.classList.add("active");
      tabFav.classList.remove("active");
      renderProductsGrid();
    });
    tabFav.addEventListener("click", () => {
      audio.playClick();
      state.activeFilter = "fav";
      tabFav.classList.add("active");
      tabAll.classList.remove("active");
      renderProductsGrid();
    });
  }

  // Обновить кэш
  const refreshCacheBtn = document.getElementById("refreshCacheBtn");
  if (refreshCacheBtn) {
    refreshCacheBtn.addEventListener("click", () => {
      audio.playClick();
      const symbol = refreshCacheBtn.querySelector(".refresh-symbol");
      if (symbol) {
        symbol.classList.add("spinning");
        setTimeout(() => symbol.classList.remove("spinning"), 600);
      }
      showToast("Кэш успешно очищен и обновлен!");
    });
  }

  // Звук (вкл / выкл)
  const soundToggle = document.getElementById("soundToggle");
  const soundIcon = document.getElementById("soundIcon");
  if (soundToggle) {
    soundToggle.addEventListener("click", () => {
      state.soundEnabled = !state.soundEnabled;
      soundIcon.textContent = state.soundEnabled ? "🔊" : "🔇";
      showToast(state.soundEnabled ? "Звуки включены" : "Звуки выключены");
    });
  }

  // Закрытие модального окна
  const modalCloseBtn = document.getElementById("modalCloseBtn");
  const modalCloseFooterBtn = document.getElementById("modalCloseFooterBtn");
  const modalBackdrop = document.getElementById("downloadModal");

  if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeDownloadModal);
  if (modalCloseFooterBtn) modalCloseFooterBtn.addEventListener("click", closeDownloadModal);

  if (modalBackdrop) {
    modalBackdrop.addEventListener("click", (e) => {
      if (e.target === modalBackdrop) closeDownloadModal();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalBackdrop.style.display !== "none") {
      closeDownloadModal();
    }
  });

  // Выбор браузера в модалке
  const chooseFirefoxBtn = document.getElementById("chooseFirefoxBtn");
  const chooseChromiumBtn = document.getElementById("chooseChromiumBtn");
  if (chooseFirefoxBtn) chooseFirefoxBtn.addEventListener("click", () => selectBrowser("firefox"));
  if (chooseChromiumBtn) chooseChromiumBtn.addEventListener("click", () => selectBrowser("chromium"));

  // Сменить браузер
  const backFfBtn = document.getElementById("backToSelectFromFf");
  const backCrBtn = document.getElementById("backToSelectFromCr");
  if (backFfBtn) backFfBtn.addEventListener("click", showBrowserSelectStep);
  if (backCrBtn) backCrBtn.addEventListener("click", showBrowserSelectStep);

  // Копирование инструкции
  const copyGuideBtn = document.getElementById("modalCopyGuideBtn");
  if (copyGuideBtn) {
    copyGuideBtn.addEventListener("click", () => {
      if (!state.activeProduct || !state.activeBrowserMode) return;
      const isFf = state.activeBrowserMode === "firefox";
      const guideText = isFf
        ? `ИНСТРУКЦИЯ ПО УСТАНОВКЕ В FIREFOX:\n1. Скачайте архив ${state.activeProduct.firefoxFileName}\n2. Откройте в адресной строке Firefox: about:debugging#/runtime/this-firefox\n3. В блоке «Временные дополнения» нажмите «Загрузить временное дополнение...»\n4. Выберите скачанный .zip или .xpi файл.`
        : `ИНСТРУКЦИЯ ПО УСТАНОВКЕ В CHROMIUM:\n1. Скачайте архив ${state.activeProduct.chromiumFileName} и распакуйте его\n2. Откройте chrome://extensions/\n3. Включите «Режим разработчика» вверху справа\n4. Нажмите «Загрузить распакованное расширение» и укажите распакованную папку.`;
      copyTextToClipboard(guideText, "Текст инструкции скопирован!");
    });
  }

  // Копирование кода по клику
  document.querySelectorAll("[data-copy]").forEach(el => {
    el.addEventListener("click", () => {
      copyTextToClipboard(el.getAttribute("data-copy"), `Скопировано: ${el.getAttribute("data-copy")}`);
    });
  });

  document.querySelectorAll(".mini-copy-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const target = btn.getAttribute("data-target");
      copyTextToClipboard(target, `Скопировано: ${target}`);
    });
  });
});

// Глобальные методы
window.openDownloadModal = openDownloadModal;
window.toggleFavorite = toggleFavorite;
window.triggerDownloadFile = triggerDownloadFile;
window.switchView = switchView;
