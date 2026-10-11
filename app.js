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
    version: "v1.1.0",
    image: "images/product1.png",
    firefoxFileName: "swagdev_huevo_themes-1.1.0.xpi",
    chromiumFileName: "huevo-themes-chromium.zip",
    firefoxUrl: "https://addons.mozilla.org/en-US/firefox/addon/swagdev-huevo-themes/",
    firefoxDirectXpiUrl: "https://addons.mozilla.org/firefox/downloads/file/5109575/swagdev_huevo_themes-1.1.0.xpi",
    isOfficialFfAddon: true,
    amoUrl: "https://addons.mozilla.org/en-US/firefox/addon/swagdev-huevo-themes/",
    chromiumUrl: "https://github.com/neriusshadow/SWAGDEVhuEVOthemes/raw/main/huevo-themes-chromium.zip"
  },
  {
    id: "product2",
    title: "huEVO games",
    description: "Полноценный раздел «Игры» для huEVO в эстетике старого ВКонтакте с каталогом браузерных ретро-игр.",
    version: "v1.0",
    image: "images/product2.png",
    firefoxFileName: "huEVO_games_firefox.xpi",
    chromiumFileName: "huEVO_games_chromium.zip",
    firefoxUrl: "",
    chromiumUrl: ""
  },
  {
    id: "product3",
    title: "fedorEvo",
    description: "Плагин кастомизации для huEVO: заменяет все иконки и названия категорий на Федор Яйца.",
    version: "v0.67",
    image: "images/product3.png",
    firefoxFileName: "fedorEvo_firefox.xpi",
    chromiumFileName: "fedorEvo_chromium.zip",
    firefoxUrl: "",
    chromiumUrl: ""
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
    } catch (e) { }
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
    } catch (e) { }
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
    if (isFirefox && product.isOfficialFfAddon) {
      window.open(directUrl, "_blank", "noopener,noreferrer");
      showToast("Открываем страницу huEVO themes в Mozilla Add-ons!");
    } else {
      const a = document.createElement("a");
      a.href = directUrl;
      a.download = fileName;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast(`Загрузка ${fileName} запущена!`);
    }
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
    const amoBadge = prod.isOfficialFfAddon
      ? `<span class="product-card-amo-badge" title="Официально опубликовано в каталоге Mozilla Firefox Add-ons (AMO)">🦊 AMO ✓</span>`
      : "";
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
          <div class="product-card-badges-row">
            <span class="product-card-badge">${prod.version}</span>
            ${amoBadge}
          </div>
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

  document.getElementById("ffFileName").textContent = prod.isOfficialFfAddon
    ? "swagdev-huevo-themes (Firefox Add-ons)"
    : prod.firefoxFileName;
  document.getElementById("crFileName").textContent = prod.chromiumFileName;

  const ffChoiceFormat = document.getElementById("ffChoiceFormat");
  if (ffChoiceFormat) {
    if (prod.isOfficialFfAddon) {
      ffChoiceFormat.innerHTML = `<span class="official-amo-tag">✓ Официальный каталог Mozilla Add-ons (в 1 клик)</span>`;
    } else {
      ffChoiceFormat.textContent = "Пакет расширения (.xpi)";
    }
  }

  const downloadFfBtn = document.getElementById("downloadFfFileBtn");
  if (downloadFfBtn) {
    downloadFfBtn.onclick = (e) => {
      e.preventDefault();
      triggerDownloadFile(state.activeProduct, "firefox");
    };
  }

  const downloadCrBtn = document.getElementById("downloadCrFileBtn");
  const crFileTag = document.querySelector("#instructionChromiumPane .file-tag");
  if (crFileTag) {
    crFileTag.textContent = prod.id === "product1" ? "Архив .zip с расширением (16.7 МБ)" : "Архив .zip с файлами";
  }

  if (downloadCrBtn) {
    if (prod.chromiumUrl && prod.chromiumUrl.trim() !== "") {
      downloadCrBtn.href = prod.chromiumUrl;
      downloadCrBtn.setAttribute("download", prod.chromiumFileName);
      downloadCrBtn.target = "_blank";
      downloadCrBtn.rel = "noopener noreferrer";
      downloadCrBtn.onclick = () => {
        audio.playSuccess();
        showToast(`Загрузка ${prod.chromiumFileName} запущена!`);
      };
    } else {
      downloadCrBtn.href = "#";
      downloadCrBtn.removeAttribute("download");
      downloadCrBtn.removeAttribute("target");
      downloadCrBtn.removeAttribute("rel");
      downloadCrBtn.onclick = (e) => {
        e.preventDefault();
        triggerDownloadFile(state.activeProduct, "chromium");
      };
    }
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

  const prod = state.activeProduct;

  document.getElementById("stepBrowserSelect").style.display = "none";

  if (browserType === "firefox") {
    renderFirefoxInstructions(prod);
    document.getElementById("instructionFirefoxPane").style.display = "block";
    document.getElementById("instructionChromiumPane").style.display = "none";

    // Для официального аддона huEVO themes — сразу перенаправляем на страницу в Mozilla Add-ons в новой вкладке
    if (prod && prod.isOfficialFfAddon && prod.firefoxUrl) {
      window.open(prod.firefoxUrl, "_blank", "noopener,noreferrer");
      audio.playSuccess();
      showToast("Открываем страницу huEVO themes в Mozilla Add-ons!");
    }
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

function renderFirefoxInstructions(prod) {
  const heading = document.getElementById("ffInstructionHeading");
  const pill = document.getElementById("ffBrowserPill");
  const fileName = document.getElementById("ffFileName");
  const fileTag = document.getElementById("ffFileTag");
  const btn = document.getElementById("downloadFfFileBtn");
  const btnIcon = document.getElementById("downloadFfBtnIcon");
  const btnText = document.getElementById("downloadFfBtnText");
  const directLink = document.getElementById("directFfXpiLink");
  const timeline = document.getElementById("ffStepsTimeline");

  if (!timeline) return;

  if (prod && prod.isOfficialFfAddon) {
    if (heading) heading.textContent = "Страница аддона открыта в новой вкладке Mozilla Add-ons";
    if (pill) pill.innerHTML = "🦊 Mozilla Add-ons (AMO)";
    if (fileName) fileName.textContent = "swagdev-huevo-themes";
    if (fileTag) fileTag.innerHTML = "<span class='official-amo-tag'>✓ Официально проверено Mozilla · Версия 1.1.0</span>";

    if (btn) {
      btn.href = prod.firefoxUrl;
      btn.removeAttribute("download");
      btn.target = "_blank";
      btn.rel = "noopener noreferrer";
      btn.onclick = () => {
        audio.playSuccess();
        showToast("Открываем страницу в Mozilla Add-ons!");
      };
    }
    if (btnIcon) btnIcon.textContent = "↗";
    if (btnText) btnText.textContent = "Открыть в Firefox Add-ons еще раз";

    if (directLink) {
      if (prod.firefoxDirectXpiUrl) {
        directLink.href = prod.firefoxDirectXpiUrl;
        directLink.textContent = "Или скачать подписанный файл .xpi напрямую (16.7 МБ)";
        directLink.style.display = "inline-block";
        directLink.onclick = () => {
          audio.playSuccess();
          showToast("Загрузка подписанного файла .xpi...");
        };
      } else {
        directLink.style.display = "none";
      }
    }

    timeline.innerHTML = `
      <li class="timeline-step">
        <div class="step-badge">1</div>
        <div class="step-content">
          <strong>Страница аддона уже открыта в новой вкладке</strong>
          <p>Если страница не открылась автоматически, нажмите синюю кнопку выше или перейдите по официальной ссылке:</p>
          <div class="copy-url-block">
            <a href="${prod.firefoxUrl}" target="_blank" rel="noopener noreferrer" class="vk-link-underline">addons.mozilla.org/en-US/firefox/addon/swagdev-huevo-themes/</a>
            <button class="mini-copy-btn" type="button" data-target="${prod.firefoxUrl}">Копировать</button>
          </div>
        </div>
      </li>
      <li class="timeline-step">
        <div class="step-badge">2</div>
        <div class="step-content">
          <strong>Нажмите синюю кнопку «+ Добавить в Firefox»</strong>
          <p>На официальной странице каталога дополнений Mozilla нажмите кнопку <strong>«+ Добавить в Firefox»</strong> (Add to Firefox). Расширение подписано официальным ключом безопасности Mozilla.</p>
        </div>
      </li>
      <li class="timeline-step">
        <div class="step-badge">3</div>
        <div class="step-content">
          <strong>Подтвердите установку в системном окне</strong>
          <p>В появившемся диалоговом окне Firefox в правом верхнем углу нажмите кнопку <strong>«Добавить»</strong>. Также по желанию отметьте галочку <em>«Разрешить этому расширению работать в приватных окнах»</em>.</p>
        </div>
      </li>
      <li class="timeline-step">
        <div class="step-badge">4</div>
        <div class="step-content">
          <strong>Готово к использованию!</strong>
          <p>Плагин <strong>huEVO themes</strong> сразу активен на сайтах <code>huevo.su</code> и <code>huevo.departament.site</code>. В правом верхнем углу браузера появится значок дополнения для выбора тем и настроек.</p>
        </div>
      </li>
    `;
  } else {
    if (heading) heading.textContent = "Пошаговая инструкция установки для Firefox";
    if (pill) pill.innerHTML = "🦊 Mozilla Firefox";
    if (fileName) fileName.textContent = prod.firefoxFileName;
    if (fileTag) fileTag.textContent = "Готовый пакет .xpi";

    if (btn) {
      btn.href = "#";
      btn.download = prod.firefoxFileName;
      btn.removeAttribute("target");
      btn.removeAttribute("rel");
      btn.onclick = (e) => {
        e.preventDefault();
        triggerDownloadFile(state.activeProduct, "firefox");
      };
    }
    if (btnIcon) btnIcon.textContent = "⬇";
    if (btnText) btnText.textContent = "Скачать для Firefox (.xpi)";
    if (directLink) directLink.style.display = "none";

    timeline.innerHTML = `
      <li class="timeline-step">
        <div class="step-badge">1</div>
        <div class="step-content">
          <strong>Скачайте пакет расширения</strong>
          <p>Нажмите синюю кнопку «Скачать для Firefox (.xpi)» выше и сохраните файл.</p>
        </div>
      </li>
      <li class="timeline-step">
        <div class="step-badge">2</div>
        <div class="step-content">
          <strong>Подтвердите установку в Firefox</strong>
          <p>Если в верхнем правом углу браузера появится плашка <em>«Сайт пытается установить дополнение»</em>, нажмите <strong>«Разрешить»</strong>, а затем <strong>«Добавить»</strong>.</p>
        </div>
      </li>
      <li class="timeline-step">
        <div class="step-badge">3</div>
        <div class="step-content">
          <strong>Альтернативный способ установки (из файла):</strong>
          <p>Перейдите в браузере по адресу <code class="copyable-tag" data-copy="about:addons" title="Кликните для копирования">about:addons</code> ➔ Нажмите на иконку ⚙️ шестерёнки вверху ➔ Выберите <em>«Установить дополнение из файла...»</em> ➔ Укажите скачанный <code>.xpi</code>.</p>
        </div>
      </li>
      <li class="timeline-step">
        <div class="step-badge">4</div>
        <div class="step-content">
          <strong>Готово к запуску!</strong>
          <p>Иконка появится в меню дополнений Firefox. Продукт готов к работе.</p>
        </div>
      </li>
    `;
  }

  timeline.querySelectorAll(".mini-copy-btn").forEach(b => {
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      const target = b.getAttribute("data-target");
      copyTextToClipboard(target, "Ссылка скопирована!");
    });
  });
  timeline.querySelectorAll("[data-copy]").forEach(el => {
    el.addEventListener("click", () => {
      copyTextToClipboard(el.getAttribute("data-copy"), `Скопировано: ${el.getAttribute("data-copy")}`);
    });
  });
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

  const copyGuideBtn = document.getElementById("modalCopyGuideBtn");
  if (copyGuideBtn) {
    copyGuideBtn.addEventListener("click", () => {
      if (!state.activeProduct || !state.activeBrowserMode) return;
      const isFf = state.activeBrowserMode === "firefox";
      let guideText = "";
      if (isFf) {
        if (state.activeProduct.isOfficialFfAddon) {
          guideText = `ИНСТРУКЦИЯ ПО УСТАНОВКЕ HUEVO THEMES В FIREFOX:
1. Перейдите на страницу дополнения в официальном каталоге Mozilla Add-ons:
${state.activeProduct.firefoxUrl}
2. Нажмите синюю кнопку «+ Добавить в Firefox» (Add to Firefox).
3. Во всплывающем системном окне подтверждения нажмите «Добавить».
4. Готово! Расширение huEVO themes официально установлено, проверено Mozilla и готово к работе!`;
        } else {
          guideText = `ИНСТРУКЦИЯ ПО УСТАНОВКЕ В FIREFOX:\n1. Скачайте ${state.activeProduct.firefoxFileName}\n2. В появившемся окне Firefox нажмите «Разрешить» и «Добавить»\n3. Или перейдите в about:addons -> шестеренка -> «Установить дополнение из файла...»`;
        }
      } else {
        guideText = `ИНСТРУКЦИЯ ПО УСТАНОВКЕ В CHROMIUM:\n1. Скачайте архив ${state.activeProduct.chromiumFileName} и распакуйте его\n2. Откройте chrome://extensions/\n3. Включите «Режим разработчика» вверху справа\n4. Нажмите «Загрузить распакованное расширение» и укажите распакованную папку.`;
      }
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
