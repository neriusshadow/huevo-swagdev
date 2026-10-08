# huEVO SWAGdev — Сайт в стиле ВКонтакте 2010 (GitHub Pages)

Сайт-каталог для скачивания продуктов в ретро-дизайне ВКонтакте 2010 года.

## 🌟 Возможности и структура
1. **Сетка из 3 продуктов в ряд (по вашему референсу):**
   - На десктопе 3 карточки продуктов располагаются в ряд с аккуратными разделителями и границами.
   - У каждого продукта есть заголовок, категория, крупное окно для PNG-картинки, краткое описание и объемная синяя кнопка **«Скачать ▼»**.
2. **Навигация ВКонтакте 2010:**
   - В шапке две аккуратные вкладки: **«Каталог»** и **«О проекте»**.
   - Полноценная страница **«О проекте»** с описанием платформы, информацией о форматах (.xpi и .zip), инструкциями и кнопкой быстрого возврата в каталог.
3. **Модальное окно скачивания с выбором браузера:**
   - При нажатии на **«Скачать ▼»** открывается окно:
     - **Шаг 1:** Выбор между **Mozilla Firefox** и **Chromium** (Chrome, Яндекс, Edge, Opera, Brave).
     - **Шаг 2:** Пошаговая инструкция под выбранный браузер + кнопка прямой загрузки файла (`.xpi` или `.zip`) + кнопка копирования текста инструкции.
4. **Замена картинок и логотипов (PNG):**
   - Все изображения хранятся в папке `images/`:
     - `images/product1.png` — huEVO themes (v1.1)
     - `images/product2.png` — huEVO games (v1.0)
     - `images/product3.png` — fedorEvo (v0.67)
     - `images/logo.png` — квадратный логотип huEVO SWAGdev на странице «О проекте»
     - `images/firefox.png` — логотип Mozilla Firefox в модальном окне
     - `images/chromium.png` — логотип Chromium в модальном окне
   - Просто замените файлы на свои PNG — они автоматически подхватятся на сайте!
5. **Кастомизация звуков через SRC сайта:**
   - В начале `index.html` прописаны теги:
     ```html
     <audio id="soundClickSrc" src="sounds/click.mp3" preload="auto"></audio>
     <audio id="soundSuccessSrc" src="sounds/success.mp3" preload="auto"></audio>
     ```
   - Вы можете указать любой свой файл или ссылку в атрибуте `src="..."`, либо заменить готовые аудиофайлы в папке `sounds/`:
     - `sounds/click.mp3` — звук клика
     - `sounds/success.mp3` — звук успешного скачивания

---

## 🌐 Онлайн-сайт на GitHub Pages:

- **Рабочий сайт:** [https://neriusshadow.github.io/huevo-swagdev/](https://neriusshadow.github.io/huevo-swagdev/)
- **Репозиторий сайта:** [neriusshadow/huevo-swagdev](https://github.com/neriusshadow/huevo-swagdev)
- **Репозиторий huEVO themes:** [neriusshadow/SWAGDEVhuEVOthemes](https://github.com/neriusshadow/SWAGDEVhuEVOthemes)
  - Релиз v1.1: [huEVO themes v1.1](https://github.com/neriusshadow/SWAGDEVhuEVOthemes/releases/tag/v1.1)
