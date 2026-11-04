class NativeBridge {
  static get invoke() {
    return window.__TAURI__?.core?.invoke || window.__TAURI__?.invoke || null;
  }

  static async registerAsDefault() {
    if (this.invoke) {
      try {
        return await this.invoke('register_default_browser');
      } catch (e) {
        console.error(e);
      }
    }
    return false;
  }

  static async openDefaultSettings() {
    if (this.invoke) {
      try {
        await this.invoke('open_default_settings');
      } catch (e) {
        console.error(e);
      }
    }
  }

  static async getInitialUrl() {
    if (this.invoke) {
      try {
        return await this.invoke('get_initial_url');
      } catch (e) {
        console.error(e);
      }
    }
    return null;
  }

  static async startDragging() {
    try {
      if (window.__TAURI__?.window?.getCurrentWindow) {
        await window.__TAURI__.window.getCurrentWindow().startDragging();
        return;
      }
    } catch {}
    if (this.invoke) {
      try {
        await this.invoke('drag_window');
      } catch (e) {
        console.error(e);
      }
    }
  }

  static async minimizeWindow() {
    try {
      if (window.__TAURI__?.window?.getCurrentWindow) {
        await window.__TAURI__.window.getCurrentWindow().minimize();
        return;
      }
    } catch {}
    if (this.invoke) {
      try {
        await this.invoke('minimize_window');
      } catch (e) {
        console.error(e);
      }
    }
  }

  static async toggleMaximizeWindow() {
    try {
      if (window.__TAURI__?.window?.getCurrentWindow) {
        await window.__TAURI__.window.getCurrentWindow().toggleMaximize();
        return;
      }
    } catch {}
    if (this.invoke) {
      try {
        await this.invoke('toggle_maximize_window');
      } catch (e) {
        console.error(e);
      }
    }
  }

  static async closeWindow() {
    try {
      if (window.__TAURI__?.window?.getCurrentWindow) {
        await window.__TAURI__.window.getCurrentWindow().close();
        return;
      }
    } catch {}
    if (this.invoke) {
      try {
        await this.invoke('close_window');
      } catch (e) {
        console.error(e);
      }
    }
  }

  static async initContentView(x, y, width, height) {
    if (this.invoke) {
      try {
        await this.invoke('init_content_view', { x, y, width, height });
      } catch (e) {
        console.error('Error init_content_view:', e);
      }
    }
  }

  static async navigateContent(tabId, url, x, y, width, height) {
    if (this.invoke) {
      try {
        await this.invoke('navigate_content', { tabId, url, x, y, width, height });
      } catch (e) {
        console.error('Error navigate_content:', e);
      }
    }
  }

  static async syncContentBounds(x, y, width, height) {
    if (this.invoke) {
      try {
        await this.invoke('sync_content_bounds', { x, y, width, height });
      } catch (e) {
        console.error('Error sync_content_bounds:', e);
      }
    }
  }

  static async goBack() {
    if (this.invoke) {
      try {
        await this.invoke('go_back');
      } catch (e) {
        console.error(e);
      }
    }
  }

  static async goForward() {
    if (this.invoke) {
      try {
        await this.invoke('go_forward');
      } catch (e) {
        console.error(e);
      }
    }
  }

  static async reload() {
    if (this.invoke) {
      try {
        await this.invoke('reload_content');
      } catch (e) {
        console.error(e);
      }
    }
  }

  static async toggleAdblock(enabled) {
    if (this.invoke) {
      try {
        return await this.invoke('toggle_adblock', { enabled });
      } catch (e) {
        console.error(e);
      }
    }
    return enabled;
  }

  static async toggleEcoMode(enabled) {
    if (this.invoke) {
      try {
        return await this.invoke('toggle_eco_mode', { enabled });
      } catch (e) {
        console.error(e);
      }
    }
    return enabled;
  }

  static hideContentView() {
    if (this.invoke) {
      try {
        this.invoke('hide_content_view');
      } catch (e) {
        console.error(e);
      }
    }
  }

  static showContentView() {
    if (this.invoke) {
      try {
        this.invoke('show_content_view');
      } catch (e) {
        console.error(e);
      }
    }
  }

  static openDownloadsFolder() {
    if (this.invoke) {
      try {
        this.invoke('open_downloads_folder');
      } catch (e) {
        console.error(e);
      }
    }
  }

  static async autofillCredentials(username, password) {
    if (this.invoke) {
      try {
        await this.invoke('autofill_credentials', { username, password });
      } catch (e) {
        console.error(e);
      }
    }
  }
}

class ToastNotification {
  static show(message, duration = 2500) {
    const el = document.getElementById('status-toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('visible');
    clearTimeout(this._timeout);
    this._timeout = setTimeout(() => {
      el.classList.remove('visible');
    }, duration);
  }
}

class StorageManager {
  static getHistory() {
    try {
      return JSON.parse(localStorage.getItem('nano_history') || '[]');
    } catch {
      return [];
    }
  }

  static addHistory(entry) {
    const list = this.getHistory();
    list.unshift({ ...entry, time: Date.now() });
    if (list.length > 200) list.pop();
    localStorage.setItem('nano_history', JSON.stringify(list));
  }

  static clearAll() {
    localStorage.removeItem('nano_history');
    localStorage.removeItem('nano_bookmarks');
    localStorage.removeItem('nano_passwords');
  }

  static getPasswords() {
    try {
      return JSON.parse(localStorage.getItem('nano_passwords') || '[]');
    } catch {
      return [];
    }
  }

  static savePassword(entry) {
    const list = this.getPasswords();
    const existingIndex = list.findIndex(p => p.origin === entry.origin && p.username === entry.username);
    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...entry, time: Date.now() };
    } else {
      list.unshift({ ...entry, id: 'pwd_' + Date.now(), time: Date.now() });
    }
    localStorage.setItem('nano_passwords', JSON.stringify(list));
  }

  static removePassword(id) {
    let list = this.getPasswords();
    list = list.filter(p => p.id !== id);
    localStorage.setItem('nano_passwords', JSON.stringify(list));
  }

  static getBookmarks() {
    try {
      return JSON.parse(localStorage.getItem('nano_bookmarks') || '[]');
    } catch {
      return [];
    }
  }

  static addBookmark(bookmark) {
    const list = this.getBookmarks();
    if (!list.some(b => b.url === bookmark.url)) {
      list.push(bookmark);
      localStorage.setItem('nano_bookmarks', JSON.stringify(list));
      return true;
    }
    return false;
  }

  static removeBookmark(url) {
    let list = this.getBookmarks();
    list = list.filter(b => b.url !== url);
    localStorage.setItem('nano_bookmarks', JSON.stringify(list));
  }

  static isBookmarked(url) {
    return this.getBookmarks().some(b => b.url === url);
  }
}

class GoogleSuggest {
  static fetch(query) {
    if (!query || query.trim().length < 2) return Promise.resolve([]);
    return new Promise((resolve) => {
      const cbName = 'g_suggest_' + Math.random().toString(36).substring(2, 9);
      let timeout = null;

      const cleanup = () => {
        clearTimeout(timeout);
        delete window[cbName];
        if (script.parentNode) script.parentNode.removeChild(script);
      };

      window[cbName] = (data) => {
        cleanup();
        if (data && Array.isArray(data[1])) {
          const suggestions = data[1]
            .map((item) => (Array.isArray(item) ? item[0] : item))
            .filter((item) => typeof item === 'string' && item.trim().length > 0)
            .slice(0, 5);
          resolve(suggestions);
        } else {
          resolve([]);
        }
      };

      const script = document.createElement('script');
      script.src = `https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&q=${encodeURIComponent(query.trim())}&callback=${cbName}`;
      script.onerror = () => {
        cleanup();
        resolve([]);
      };

      timeout = setTimeout(() => {
        cleanup();
        resolve([]);
      }, 1500);

      document.body.appendChild(script);
    });
  }
}

class Tab {
  constructor(id, url = 'about:home', title = 'Новая вкладка') {
    this.id = id;
    this.url = url;
    this.title = title;
    this.faviconUrl = null;
    this.history = [url];
    this.historyIndex = 0;

    this.tabElement = this.createTabElement();
    this.resolveFavicon(url);
  }

  createTabElement() {
    const div = document.createElement('div');
    div.className = 'tab-item';
    div.dataset.tabId = this.id;

    div.innerHTML = `
      <div class="tab-favicon-container">
        <span class="tab-favicon-icon material-symbols-outlined">public</span>
        <img class="tab-favicon-img" alt="" style="display: none;" />
      </div>
      <span class="tab-title">${this.title}</span>
      <button class="tab-close-btn" title="Закрыть">
        <span class="material-symbols-outlined" style="font-size: 13px;">close</span>
      </button>
    `;
    return div;
  }

  resolveFavicon(url) {
    if (!url || url === 'about:home') {
      this.resetFavicon();
      return;
    }
    try {
      const parsed = new URL(url);
      if (parsed.protocol.startsWith('http')) {
        const faviconSrc = `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=32`;
        this.setFavicon(faviconSrc);
        return;
      }
    } catch {}
    this.resetFavicon();
  }

  setFavicon(src) {
    this.faviconUrl = src;
    const img = this.tabElement.querySelector('.tab-favicon-img');
    const icon = this.tabElement.querySelector('.tab-favicon-icon');
    if (img && icon) {
      img.src = src;
      img.onload = () => {
        img.style.display = 'block';
        icon.style.display = 'none';
      };
      img.onerror = () => this.resetFavicon();
    }
  }

  resetFavicon() {
    this.faviconUrl = null;
    const img = this.tabElement.querySelector('.tab-favicon-img');
    const icon = this.tabElement.querySelector('.tab-favicon-icon');
    if (img && icon) {
      img.style.display = 'none';
      icon.style.display = 'block';
    }
  }

  updateTitleFromUrl(url) {
    if (!url || url === 'about:home') {
      this.title = 'Новая вкладка';
    } else {
      try {
        const parsed = new URL(url);
        this.title = parsed.hostname || url;
      } catch {
        this.title = url;
      }
    }
    const titleEl = this.tabElement.querySelector('.tab-title');
    if (titleEl) titleEl.textContent = this.title;
  }
}

class BrowserEngine {
  constructor() {
    this.tabs = new Map();
    this.activeTabId = null;
    this.tabCounter = 0;
    this.adblockActive = true;
    this.ecoActive = false;

    this.tabsContainer = document.getElementById('tabs-container');
    this.viewportContainer = document.getElementById('views-viewport');
    this.speedDial = document.getElementById('speed-dial');
    this.omnibox = document.getElementById('omnibox-input');
    this.progressBar = document.getElementById('progress-bar');
    this.securityIcon = document.getElementById('security-icon');
    this.omniboxFaviconImg = document.getElementById('omnibox-favicon-img');
    this.btnBookmark = document.getElementById('btn-add-bookmark');
    this.suggestionsDropdown = document.getElementById('suggestions-dropdown');

    this.modalContainer = document.getElementById('modal-container');
    this.modalTitle = document.getElementById('modal-title');
    this.modalBody = document.getElementById('modal-body');
    this.settingsPopup = document.getElementById('settings-popup');
    this.pageLoader = document.getElementById('page-loader');
    this.russiaBlockScreen = document.getElementById('russia-block-screen');
    this.blockTimer = null;

    this.initClock();
    this.initEvents();
  }

  isRestrictedDomain(url) {
    if (!url) return false;
    return /^(https?:\/\/)?([a-z0-9-]+\.)*(youtube\.com|youtu\.be|yt\.be|googlevideo\.com|t\.me|telegram\.me|telegram\.org|web\.telegram\.org)/i.test(url);
  }

  async checkIfRussianIP() {
    try {
      const res = await fetch('https://api.country.is/', { signal: AbortSignal.timeout(3500) });
      const data = await res.json();
      if (data && data.country === 'RU') return true;
    } catch {
      try {
        const res2 = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(3500) });
        const data2 = await res2.json();
        if (data2 && data2.country_code === 'RU') return true;
      } catch {}
    }
    return false;
  }

  startBlockTimeout(url) {
    clearTimeout(this.blockTimer);
    if (!this.isRestrictedDomain(url)) return;
    this.blockTimer = setTimeout(async () => {
      const activeTab = this.tabs.get(this.activeTabId);
      if (!activeTab || !this.isRestrictedDomain(activeTab.url)) return;
      const isRU = await this.checkIfRussianIP();
      if (isRU) {
        this.showRussiaBlockScreen(activeTab.url);
      }
    }, 10000);
  }

  showRussiaBlockScreen(url) {
    if (!this.russiaBlockScreen) return;
    NativeBridge.hideContentView();
    if (this.pageLoader) this.pageLoader.style.display = 'none';
    this.russiaBlockScreen.style.display = 'flex';
  }

  hideRussiaBlockScreen() {
    if (!this.russiaBlockScreen) return;
    this.russiaBlockScreen.style.display = 'none';
  }

  initClock() {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const clockEl = document.getElementById('dial-clock');
      if (clockEl) clockEl.textContent = `${h}:${m}`;
    };
    updateTime();
    setInterval(updateTime, 1000);
  }

  getViewportBounds() {
    const rect = this.viewportContainer.getBoundingClientRect();
    return {
      x: Math.round(rect.left),
      y: Math.round(rect.top),
      width: Math.max(100, Math.round(rect.width)),
      height: Math.max(100, Math.round(rect.height))
    };
  }

  triggerProgress() {
    this.progressBar.classList.add('loading');
    this.progressBar.style.width = '35%';
    clearTimeout(this._progressTimer);
    this._progressTimer = setTimeout(() => {
      if (this.progressBar.classList.contains('loading')) {
        this.progressBar.style.width = '75%';
      }
    }, 250);
  }

  finishProgress() {
    clearTimeout(this._progressTimer);
    this.progressBar.style.width = '100%';
    setTimeout(() => {
      this.progressBar.classList.remove('loading');
      this.progressBar.style.width = '0%';
    }, 250);
  }

  showPasswordPrompt(creds) {
    this.pendingCredentials = creds;
    const prompt = document.getElementById('password-prompt');
    const text = document.getElementById('pwd-prompt-text');
    if (text) text.textContent = `Сохранить пароль для ${creds.origin} (${creds.username})?`;
    if (prompt) prompt.style.display = 'flex';
  }

  init() {
    // 1. Создаем начальную вкладку синхронно СРАЗУ, чтобы DOM, вкладки и начальная страница были готовы мгновенно
    this.createTab('about:home');

    // 2. В фоне без блокировки синхронизируем bounds и нативные слушатели
    (async () => {
      try {
        const bounds = this.getViewportBounds();
        await NativeBridge.initContentView(bounds.x, bounds.y, bounds.width, bounds.height);

        if (window.__TAURI__?.event?.listen) {
          window.__TAURI__.event.listen('content_page_started', (event) => {
            const tabId = event.payload?.tab_id;
            const startedUrl = typeof event.payload === 'string' ? event.payload : event.payload?.url;
            if (tabId === this.activeTabId || !tabId) {
              if (startedUrl && startedUrl !== 'about:blank' && startedUrl !== 'about:home') {
                this.omnibox.value = startedUrl;
                this.updateSecurityBadge(startedUrl);
              }
              this.triggerProgress();
              this.startBlockTimeout(startedUrl);
            }
          });

          window.__TAURI__.event.listen('content_page_finished', (event) => {
            const tabId = event.payload?.tab_id;
            if (tabId === this.activeTabId || !tabId) {
              this.finishProgress();
              clearTimeout(this.blockTimer);
              this.hideRussiaBlockScreen();
              if (this.pageLoader) this.pageLoader.style.display = 'none';
              const activeTab = this.tabs.get(this.activeTabId);
              if (activeTab && activeTab.url !== 'about:home' && this.modalContainer.style.display !== 'flex' && this.settingsPopup.style.display !== 'flex') {
                NativeBridge.showContentView();
              }
            }
          });

          window.__TAURI__.event.listen('content_url_changed', (event) => {
            const tabId = event.payload?.tab_id;
            const newUrl = typeof event.payload === 'string' ? event.payload : event.payload?.url;
            if (newUrl && newUrl !== 'about:blank' && newUrl !== 'about:home') {
              if (tabId) {
                const targetTab = this.tabs.get(tabId);
                if (targetTab) {
                  targetTab.url = newUrl;
                  targetTab.updateTitleFromUrl(newUrl);
                  targetTab.resolveFavicon(newUrl);
                }
              }
              if (tabId === this.activeTabId || !tabId) {
                this.onInternalNavigated(newUrl);
                // Autofill сохраненных паролей для домена
                try {
                  const origin = new URL(newUrl).origin;
                  const passwords = StorageManager.getPasswords();
                  const match = passwords.find((p) => p.origin === origin);
                  if (match) {
                    NativeBridge.autofillCredentials(match.username, match.password);
                  }
                } catch {}
              }
            }
          });

          window.__TAURI__.event.listen('credentials_detected', (event) => {
            const creds = event.payload;
            if (creds && creds.username && creds.password) {
              this.showPasswordPrompt(creds);
            }
          });

          window.__TAURI__.event.listen('download_finished', (event) => {
            const fileName = event.payload || 'Файл';
            ToastNotification.show(`Файл загружен: ${fileName}`);
          });
        }

        const initialUrl = await NativeBridge.getInitialUrl();
        if (initialUrl && initialUrl !== 'about:home') {
          this.navigateActiveTab(initialUrl);
        }
      } catch (e) {
        console.error('Async init error:', e);
      }
    })();

    window.addEventListener('resize', () => {
      const activeTab = this.tabs.get(this.activeTabId);
      if (activeTab && activeTab.url !== 'about:home') {
        const bounds = this.getViewportBounds();
        NativeBridge.syncContentBounds(bounds.x, bounds.y, bounds.width, bounds.height);
      }
    });
  }

  createTab(url = 'about:home') {
    const id = `tab_${++this.tabCounter}`;
    const tab = new Tab(id, url);

    this.tabs.set(id, tab);
    this.tabsContainer.appendChild(tab.tabElement);

    this.bindTabEvents(tab);
    this.activateTab(id);
    return tab;
  }

  activateTab(id) {
    if (!this.tabs.has(id)) return;

    this.tabs.forEach((tab, tabId) => {
      tab.tabElement.classList.toggle('active', tabId === id);
    });

    this.activeTabId = id;
    const activeTab = this.tabs.get(id);

    clearTimeout(this.blockTimer);
    this.hideRussiaBlockScreen();

    if (activeTab.url === 'about:home') {
      this.speedDial.style.display = 'flex';
      if (this.pageLoader) this.pageLoader.style.display = 'none';
      this.omnibox.value = '';
      this.updateSecurityBadge('about:home');
      this.updateOmniboxFavicon(null);
      this.updateBookmarkButton('about:home');
      const bounds = this.getViewportBounds();
      NativeBridge.navigateContent(activeTab.id, 'about:home', bounds.x, bounds.y, bounds.width, bounds.height);
    } else {
      this.speedDial.style.display = 'none';
      this.omnibox.value = activeTab.url;
      this.updateSecurityBadge(activeTab.url);
      this.updateOmniboxFavicon(activeTab.faviconUrl);
      this.updateBookmarkButton(activeTab.url);

      if (this.pageLoader) this.pageLoader.style.display = 'flex';
      NativeBridge.hideContentView();

      this.triggerProgress();
      this.startBlockTimeout(activeTab.url);
      const bounds = this.getViewportBounds();
      NativeBridge.navigateContent(activeTab.id, activeTab.url, bounds.x, bounds.y, bounds.width, bounds.height);
    }
  }

  onInternalNavigated(newUrl) {
    const activeTab = this.tabs.get(this.activeTabId);
    if (!activeTab || activeTab.url === 'about:home') return;

    activeTab.url = newUrl;
    activeTab.updateTitleFromUrl(newUrl);
    activeTab.resolveFavicon(newUrl);

    this.omnibox.value = newUrl;
    this.updateSecurityBadge(newUrl);
    this.updateOmniboxFavicon(activeTab.faviconUrl);
    this.updateBookmarkButton(newUrl);
    this.finishProgress();

    StorageManager.addHistory({ title: activeTab.title, url: newUrl });
  }

  closeTab(id) {
    const tab = this.tabs.get(id);
    if (!tab) return;

    // Если осталась ровно одна вкладка
    if (this.tabs.size <= 1) {
      // Если на ней открыт сайт (не главное меню) - переходим в главное меню
      if (tab.url !== 'about:home') {
        this.navigateActiveTab('about:home');
      }
      // Если уже главное меню ('about:home') - ничего не делаем
      return;
    }

    tab.tabElement.remove();
    this.tabs.delete(id);

    if (this.activeTabId === id) {
      const remainingIds = Array.from(this.tabs.keys());
      this.activateTab(remainingIds[remainingIds.length - 1]);
    }
  }

  bindTabEvents(tab) {
    tab.tabElement.addEventListener('click', (e) => {
      if (e.target.closest('.tab-close-btn')) {
        this.closeTab(tab.id);
      } else {
        this.activateTab(tab.id);
      }
    });
  }

  updateOmniboxFavicon(faviconUrl) {
    if (!this.omniboxFaviconImg) return;
    if (faviconUrl) {
      this.omniboxFaviconImg.src = faviconUrl;
      this.omniboxFaviconImg.style.display = 'block';
      if (this.securityIcon) this.securityIcon.style.display = 'none';
    } else {
      this.omniboxFaviconImg.style.display = 'none';
      if (this.securityIcon) this.securityIcon.style.display = 'inline-block';
    }
  }

  updateBookmarkButton(url) {
    if (!this.btnBookmark) return;
    const icon = this.btnBookmark.querySelector('.material-symbols-outlined');
    if (!icon) return;
    if (StorageManager.isBookmarked(url)) {
      icon.textContent = 'star';
      icon.style.color = 'var(--accent-neon)';
    } else {
      icon.textContent = 'star_border';
      icon.style.color = 'var(--text-secondary)';
    }
  }

  formatInputToUrl(input) {
    const trimmed = input.trim();
    if (!trimmed || trimmed === 'about:home') return 'about:home';

    if (/^https?:\/\//i.test(trimmed) || /^file:\/\//i.test(trimmed)) {
      return trimmed;
    }

    // Если начинается с www.
    if (/^www\.[a-zA-Z0-9.-]+/i.test(trimmed)) {
      return `https://${trimmed}`;
    }

    // Если введено доменное имя с зоной (yandex.ru, google.com, youtube.com/feed, domain:port)
    if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(:\d+)?(\/.*)?$/i.test(trimmed)) {
      return `https://${trimmed}`;
    }

    // Если localhost с портом или без
    if (/^localhost(:\d+)?(\/.*)?$/i.test(trimmed)) {
      return `http://${trimmed}`;
    }

    // Если IPv4 адрес
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?(\/.*)?$/.test(trimmed)) {
      return `http://${trimmed}`;
    }

    // Если нет пробелов и есть точка (например domain/path)
    if (!trimmed.includes(' ') && trimmed.includes('.')) {
      return `https://${trimmed}`;
    }

    return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
  }

  updateSecurityBadge(url) {
    if (url.startsWith('https://')) {
      this.securityIcon.textContent = 'lock';
      this.securityIcon.style.color = 'var(--accent-neon)';
    } else {
      this.securityIcon.textContent = 'info';
      this.securityIcon.style.color = 'var(--text-muted)';
    }
  }

  navigateActiveTab(rawInput) {
    const url = this.formatInputToUrl(rawInput);
    const activeTab = this.tabs.get(this.activeTabId);
    if (!activeTab) return;

    this.suggestionsDropdown.style.display = 'none';
    clearTimeout(this.blockTimer);
    this.hideRussiaBlockScreen();

    activeTab.url = url;
    activeTab.updateTitleFromUrl(url);
    activeTab.resolveFavicon(url);

    if (url === 'about:home') {
      this.activateTab(activeTab.id);
      return;
    }

    this.speedDial.style.display = 'none';
    this.omnibox.value = url;
    this.updateSecurityBadge(url);
    this.updateOmniboxFavicon(activeTab.faviconUrl);
    this.updateBookmarkButton(url);

    if (this.pageLoader) this.pageLoader.style.display = 'flex';
    NativeBridge.hideContentView();

    this.triggerProgress();
    this.startBlockTimeout(url);
    StorageManager.addHistory({ title: activeTab.title, url });

    const bounds = this.getViewportBounds();
    NativeBridge.navigateContent(activeTab.id, url, bounds.x, bounds.y, bounds.width, bounds.height);
  }

  openModal(title, renderContent) {
    this.modalTitle.textContent = title;
    this.modalBody.innerHTML = '';
    renderContent(this.modalBody);
    this.modalContainer.style.display = 'flex';
    NativeBridge.hideContentView();
  }

  closeModal() {
    this.modalContainer.style.display = 'none';
    this.settingsPopup.style.display = 'none';
    const activeTab = this.tabs.get(this.activeTabId);
    if (activeTab && activeTab.url !== 'about:home') {
      NativeBridge.showContentView();
    }
  }

  openPasswordsModal() {
    this.openModal('Сохранённые пароли', (body) => {
      const list = StorageManager.getPasswords();
      if (list.length === 0) {
        body.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: 24px;">Нет сохранённых паролей</div>';
        return;
      }
      body.innerHTML = '';
      list.forEach((entry) => {
        const div = document.createElement('div');
        div.className = 'modal-list-item';
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.justifyContent = 'space-between';
        div.innerHTML = `
          <div class="modal-item-info">
            <span class="modal-item-title">${entry.origin}</span>
            <span class="modal-item-sub">Логин: <b>${entry.username}</b></span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="pwd-val" style="font-family: monospace; font-size: 13px; color: var(--accent-neon);">••••••••</span>
            <button class="action-icon-btn btn-show-pwd" title="Показать/скрыть" style="width: 28px; height: 28px;">
              <span class="material-symbols-outlined" style="font-size: 16px;">visibility</span>
            </button>
            <button class="action-icon-btn btn-copy-pwd" title="Скопировать" style="width: 28px; height: 28px;">
              <span class="material-symbols-outlined" style="font-size: 16px;">content_copy</span>
            </button>
            <button class="action-icon-btn btn-del-pwd" title="Удалить" style="width: 28px; height: 28px; color: #ff5555;">
              <span class="material-symbols-outlined" style="font-size: 16px;">delete</span>
            </button>
          </div>
        `;
        let visible = false;
        const pwdEl = div.querySelector('.pwd-val');
        const eyeBtn = div.querySelector('.btn-show-pwd');
        eyeBtn?.addEventListener('click', (e) => {
          e.stopPropagation();
          visible = !visible;
          pwdEl.textContent = visible ? entry.password : '••••••••';
          eyeBtn.querySelector('.material-symbols-outlined').textContent = visible ? 'visibility_off' : 'visibility';
        });
        div.querySelector('.btn-copy-pwd')?.addEventListener('click', (e) => {
          e.stopPropagation();
          navigator.clipboard.writeText(entry.password).then(() => {
            ToastNotification.show('Пароль скопирован');
          });
        });
        div.querySelector('.btn-del-pwd')?.addEventListener('click', (e) => {
          e.stopPropagation();
          StorageManager.removePassword(entry.id);
          div.remove();
          ToastNotification.show('Пароль удалён');
          if (StorageManager.getPasswords().length === 0) {
            body.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: 24px;">Нет сохранённых паролей</div>';
          }
        });
        body.appendChild(div);
      });
    });
  }

  initEvents() {
    // Window dragging: нативное событие + fallback mousedown
    const dragArea = document.getElementById('drag-titlebar');
    dragArea?.addEventListener('mousedown', (e) => {
      if (e.target.closest('button') || e.target.closest('.tab-item') || e.target.closest('.action-icon-btn')) return;
      NativeBridge.startDragging();
    });

    // Window controls
    document.getElementById('btn-win-minimize')?.addEventListener('click', () => {
      NativeBridge.minimizeWindow();
    });

    document.getElementById('btn-win-maximize')?.addEventListener('click', () => {
      NativeBridge.toggleMaximizeWindow();
    });

    document.getElementById('btn-win-close')?.addEventListener('click', () => {
      NativeBridge.closeWindow();
    });

    // Navigation buttons
    document.getElementById('btn-back')?.addEventListener('click', () => {
      NativeBridge.goBack();
    });

    document.getElementById('btn-forward')?.addEventListener('click', () => {
      NativeBridge.goForward();
    });

    document.getElementById('btn-reload')?.addEventListener('click', () => {
      this.triggerProgress();
      NativeBridge.reload();
    });

    document.getElementById('btn-new-tab')?.addEventListener('click', () => {
      this.createTab('about:home');
    });

    document.getElementById('btn-home')?.addEventListener('click', () => {
      this.navigateActiveTab('about:home');
    });

    // Omnibox Google Autocomplete
    let suggestDebounce = null;
    this.omnibox?.addEventListener('input', () => {
      clearTimeout(suggestDebounce);
      const val = this.omnibox.value.trim();
      if (!val || val.startsWith('http')) {
        this.suggestionsDropdown.style.display = 'none';
        return;
      }
      suggestDebounce = setTimeout(async () => {
        const suggestions = await GoogleSuggest.fetch(val);
        if (suggestions.length === 0) {
          this.suggestionsDropdown.style.display = 'none';
          return;
        }
        this.suggestionsDropdown.innerHTML = '';
        suggestions.forEach((item) => {
          const div = document.createElement('div');
          div.className = 'suggestion-item';
          div.innerHTML = `<span class="material-symbols-outlined">search</span><span>${item}</span>`;
          div.addEventListener('click', () => {
            this.navigateActiveTab(item);
          });
          this.suggestionsDropdown.appendChild(div);
        });
        this.suggestionsDropdown.style.display = 'flex';
      }, 150);
    });

    this.omnibox?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.navigateActiveTab(this.omnibox.value);
        this.omnibox.blur();
      }
    });

    document.getElementById('btn-clear-url')?.addEventListener('click', () => {
      this.omnibox.value = '';
      this.suggestionsDropdown.style.display = 'none';
      this.omnibox.focus();
    });

    // Quick tools: AdBlock & Eco
    const btnAdblock = document.getElementById('btn-adblock');
    btnAdblock?.addEventListener('click', async () => {
      this.adblockActive = !this.adblockActive;
      btnAdblock.classList.toggle('active', this.adblockActive);
      await NativeBridge.toggleAdblock(this.adblockActive);
      ToastNotification.show(this.adblockActive ? 'AdBlock включен' : 'AdBlock отключен');
    });

    const btnEco = document.getElementById('btn-lowspec');
    btnEco?.addEventListener('click', async () => {
      this.ecoActive = !this.ecoActive;
      btnEco.classList.toggle('active', this.ecoActive);
      await NativeBridge.toggleEcoMode(this.ecoActive);
      ToastNotification.show(this.ecoActive ? 'Eco Mode включен (анимации отключены)' : 'Eco Mode выключен');
    });

    // Chrome-style Settings Menu
    const btnSettings = document.getElementById('btn-settings-menu');
    btnSettings?.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = this.settingsPopup.style.display === 'flex';
      if (isVisible) {
        this.settingsPopup.style.display = 'none';
        const activeTab = this.tabs.get(this.activeTabId);
        if (activeTab && activeTab.url !== 'about:home' && this.modalContainer.style.display !== 'flex') {
          NativeBridge.showContentView();
        }
      } else {
        this.settingsPopup.style.display = 'flex';
        NativeBridge.hideContentView();
      }
    });

    document.addEventListener('click', (e) => {
      if (!this.settingsPopup.contains(e.target) && e.target !== btnSettings) {
        if (this.settingsPopup.style.display === 'flex') {
          this.settingsPopup.style.display = 'none';
          const activeTab = this.tabs.get(this.activeTabId);
          if (activeTab && activeTab.url !== 'about:home' && this.modalContainer.style.display !== 'flex') {
            NativeBridge.showContentView();
          }
        }
      }
      if (!this.suggestionsDropdown.contains(e.target) && e.target !== this.omnibox) {
        this.suggestionsDropdown.style.display = 'none';
      }
    });

    // Password Prompt Bar buttons
    document.getElementById('btn-save-pwd')?.addEventListener('click', () => {
      if (this.pendingCredentials) {
        StorageManager.savePassword(this.pendingCredentials);
        ToastNotification.show('Пароль сохранён');
        this.pendingCredentials = null;
      }
      const prompt = document.getElementById('password-prompt');
      if (prompt) prompt.style.display = 'none';
    });

    document.getElementById('btn-dismiss-pwd')?.addEventListener('click', () => {
      this.pendingCredentials = null;
      const prompt = document.getElementById('password-prompt');
      if (prompt) prompt.style.display = 'none';
    });

    document.getElementById('popup-passwords')?.addEventListener('click', () => {
      this.settingsPopup.style.display = 'none';
      this.openPasswordsModal();
    });

    document.getElementById('popup-new-tab')?.addEventListener('click', () => {
      this.createTab('about:home');
      this.settingsPopup.style.display = 'none';
    });

    document.getElementById('popup-history')?.addEventListener('click', () => {
      document.getElementById('btn-history')?.click();
      this.settingsPopup.style.display = 'none';
    });

    document.getElementById('popup-bookmarks')?.addEventListener('click', () => {
      document.getElementById('btn-bookmarks-menu')?.click();
      this.settingsPopup.style.display = 'none';
    });

    document.getElementById('popup-downloads')?.addEventListener('click', () => {
      document.getElementById('btn-downloads')?.click();
      this.settingsPopup.style.display = 'none';
    });

    document.getElementById('popup-set-default')?.addEventListener('click', () => {
      document.getElementById('btn-set-default')?.click();
      this.settingsPopup.style.display = 'none';
    });

    document.getElementById('popup-eco')?.addEventListener('click', () => {
      btnEco?.click();
      this.settingsPopup.style.display = 'none';
    });

    document.getElementById('popup-clear-data')?.addEventListener('click', () => {
      StorageManager.clearAll();
      ToastNotification.show('История и данные успешно очищены');
      this.settingsPopup.style.display = 'none';
    });

    const dialSearch = () => {
      const val = document.getElementById('dial-search-input')?.value;
      if (val) this.navigateActiveTab(val);
    };

    document.getElementById('dial-search-btn')?.addEventListener('click', dialSearch);
    document.getElementById('dial-search-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') dialSearch();
    });

    document.getElementById('home-banner-card')?.addEventListener('click', () => {
      this.navigateActiveTab('https://github.com/nanodevmc/Rode-Browser');
    });

    // Russia DPI / Zapret block screen buttons
    document.getElementById('btn-open-zapret')?.addEventListener('click', () => {
      this.navigateActiveTab('https://github.com/bol-van/zapret');
    });

    document.getElementById('btn-open-zapret-guide')?.addEventListener('click', () => {
      this.navigateActiveTab('https://github.com/Flowseal/zapret-discord-youtube');
    });

    document.getElementById('btn-retry-page')?.addEventListener('click', () => {
      const activeTab = this.tabs.get(this.activeTabId);
      if (activeTab && activeTab.url !== 'about:home') {
        this.navigateActiveTab(activeTab.url);
      }
    });

    document.querySelectorAll('.speed-tile').forEach((tile) => {
      tile.addEventListener('click', () => {
        const url = tile.dataset.url;
        if (url) this.navigateActiveTab(url);
      });
    });

    document.querySelectorAll('.bmark-pill').forEach((btn) => {
      btn.addEventListener('click', () => {
        const url = btn.dataset.url;
        if (url) this.navigateActiveTab(url);
      });
    });

    this.btnBookmark?.addEventListener('click', () => {
      const activeTab = this.tabs.get(this.activeTabId);
      if (!activeTab || activeTab.url === 'about:home') return;
      if (StorageManager.isBookmarked(activeTab.url)) {
        StorageManager.removeBookmark(activeTab.url);
        ToastNotification.show('Закладка удалена');
      } else {
        StorageManager.addBookmark({ title: activeTab.title, url: activeTab.url });
        ToastNotification.show('Страница в закладках ★');
      }
      this.updateBookmarkButton(activeTab.url);
    });

    document.getElementById('btn-history')?.addEventListener('click', () => {
      this.openModal('История', (body) => {
        const history = StorageManager.getHistory();
        if (history.length === 0) {
          body.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: 20px;">История пуста</div>';
          return;
        }
        history.forEach((item) => {
          const div = document.createElement('div');
          div.className = 'modal-list-item';
          div.innerHTML = `
            <div class="modal-item-info">
              <span class="modal-item-title">${item.title}</span>
              <span class="modal-item-sub">${item.url}</span>
            </div>
            <span class="material-symbols-outlined" style="font-size: 16px; color: var(--accent-neon);">arrow_outward</span>
          `;
          div.addEventListener('click', () => {
            this.closeModal();
            this.navigateActiveTab(item.url);
          });
          body.appendChild(div);
        });
      });
    });

    document.getElementById('btn-bookmarks-menu')?.addEventListener('click', () => {
      this.openModal('Закладки', (body) => {
        const bmarks = StorageManager.getBookmarks();
        if (bmarks.length === 0) {
          body.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: 20px;">Закладок нет</div>';
          return;
        }
        bmarks.forEach((item) => {
          const div = document.createElement('div');
          div.className = 'modal-list-item';
          div.innerHTML = `
            <div class="modal-item-info">
              <span class="modal-item-title">${item.title}</span>
              <span class="modal-item-sub">${item.url}</span>
            </div>
            <span class="material-symbols-outlined" style="font-size: 16px; color: var(--accent-neon);">star</span>
          `;
          div.addEventListener('click', () => {
            this.closeModal();
            this.navigateActiveTab(item.url);
          });
          body.appendChild(div);
        });
      });
    });

    document.getElementById('btn-downloads')?.addEventListener('click', () => {
      this.openModal('Загрузки', (body) => {
        body.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 14px; align-items: center; padding: 24px; color: var(--text-secondary); text-align: center;">
            <span class="material-symbols-outlined" style="font-size: 42px; color: var(--accent-neon);">download_done</span>
            <div style="font-size: 13px; color: var(--text-primary); font-weight: 500;">Файлы сохраняются в системную папку Загрузки</div>
            <div style="font-size: 11px; color: var(--text-muted);">WebView2 загружает файлы напрямую на полной скорости</div>
            <button id="btn-open-dl-folder" style="margin-top: 8px; display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 10px; background: rgba(0, 255, 157, 0.12); color: var(--accent-neon); border: 1px solid rgba(0, 255, 157, 0.35); cursor: pointer; font-size: 12px; font-weight: 600; transition: all 0.2s ease;">
              <span class="material-symbols-outlined" style="font-size: 18px;">folder_open</span>
              <span>Открыть папку загрузок</span>
            </button>
          </div>
        `;
        body.querySelector('#btn-open-dl-folder')?.addEventListener('click', () => {
          NativeBridge.openDownloadsFolder();
          ToastNotification.show('Открыта папка Загрузки');
        });
      });
    });

    document.getElementById('btn-modal-close')?.addEventListener('click', () => this.closeModal());
    this.modalContainer?.addEventListener('click', (e) => {
      if (e.target === this.modalContainer) this.closeModal();
    });

    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        this.createTab('about:home');
      } else if (e.ctrlKey && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        if (this.activeTabId) this.closeTab(this.activeTabId);
      } else if (e.ctrlKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        this.omnibox?.select();
        this.omnibox?.focus();
      } else if (e.ctrlKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        this.btnBookmark?.click();
      } else if (e.ctrlKey && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        document.getElementById('btn-history')?.click();
      } else if (e.key === 'Escape') {
        this.closeModal();
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const browser = new BrowserEngine();
  browser.init();
});
