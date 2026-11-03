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
    if (this.invoke) {
      try {
        await this.invoke('drag_window');
      } catch (e) {
        console.error(e);
      }
    }
  }

  static async minimizeWindow() {
    if (this.invoke) {
      try {
        await this.invoke('minimize_window');
      } catch (e) {
        console.error(e);
      }
    }
  }

  static async toggleMaximizeWindow() {
    if (this.invoke) {
      try {
        await this.invoke('toggle_maximize_window');
      } catch (e) {
        console.error(e);
      }
    }
  }

  static async closeWindow() {
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
  static async fetch(query) {
    if (!query || query.length < 2) return [];
    try {
      const res = await fetch(`https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(query)}`);
      const data = await res.json();
      return (data && data[1]) ? data[1].slice(0, 5) : [];
    } catch {
      return [];
    }
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

    this.initClock();
    this.initEvents();
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
    this.progressBar.style.width = '40%';
    setTimeout(() => {
      if (this.progressBar.classList.contains('loading')) {
        this.progressBar.style.width = '80%';
      }
    }, 200);
    setTimeout(() => {
      this.finishProgress();
    }, 700);
  }

  finishProgress() {
    this.progressBar.style.width = '100%';
    setTimeout(() => {
      this.progressBar.classList.remove('loading');
      this.progressBar.style.width = '0%';
    }, 250);
  }

  async init() {
    const bounds = this.getViewportBounds();
    await NativeBridge.initContentView(bounds.x, bounds.y, bounds.width, bounds.height);

    if (window.__TAURI__?.event?.listen) {
      window.__TAURI__.event.listen('content_page_loaded', () => {
        this.finishProgress();
      });
    }

    const initialUrl = await NativeBridge.getInitialUrl();
    this.createTab(initialUrl || 'about:home');

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

    if (activeTab.url === 'about:home') {
      this.speedDial.style.display = 'flex';
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

      this.triggerProgress();
      const bounds = this.getViewportBounds();
      NativeBridge.navigateContent(activeTab.id, activeTab.url, bounds.x, bounds.y, bounds.width, bounds.height);
    }
  }

  closeTab(id) {
    if (this.tabs.size <= 1) {
      NativeBridge.closeWindow();
      return;
    }

    const tab = this.tabs.get(id);
    if (!tab) return;

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

    // Если введено доменное имя или IP-адрес (например yandex.ru, google.com, 192.168.1.1, localhost)
    if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/.test(trimmed) || /^localhost(:\d+)?(\/.*)?$/i.test(trimmed) || /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?(\/.*)?$/.test(trimmed)) {
      return `https://${trimmed}`;
    }

    // Если нет пробелов и есть слеш (например domain/path)
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

    this.triggerProgress();
    StorageManager.addHistory({ title: activeTab.title, url });

    const bounds = this.getViewportBounds();
    NativeBridge.navigateContent(activeTab.id, url, bounds.x, bounds.y, bounds.width, bounds.height);
  }

  openModal(title, renderContent) {
    this.modalTitle.textContent = title;
    this.modalBody.innerHTML = '';
    renderContent(this.modalBody);
    this.modalContainer.style.display = 'flex';
  }

  closeModal() {
    this.modalContainer.style.display = 'none';
    this.settingsPopup.style.display = 'none';
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
      this.settingsPopup.style.display = isVisible ? 'none' : 'flex';
    });

    document.addEventListener('click', (e) => {
      if (!this.settingsPopup.contains(e.target) && e.target !== btnSettings) {
        this.settingsPopup.style.display = 'none';
      }
      if (!this.suggestionsDropdown.contains(e.target) && e.target !== this.omnibox) {
        this.suggestionsDropdown.style.display = 'none';
      }
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
          <div style="display: flex; flex-direction: column; gap: 8px; align-items: center; padding: 20px; color: var(--text-secondary);">
            <span class="material-symbols-outlined" style="font-size: 36px; color: var(--accent-neon);">folder_open</span>
            <span style="font-size: 12px;">Папка: %USERPROFILE%\\Downloads</span>
          </div>
        `;
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
