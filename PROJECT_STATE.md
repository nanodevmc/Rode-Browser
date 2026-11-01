# PROJECT STATE: Rode Browser (ex NanoBrowser)

## Архитектура и стек
- **Репозиторий**: https://github.com/nanodevmc/Rode-Browser (public)
- **Core**: Tauri v2 (`@tauri-apps/cli` 2.12.4), Rust (`nanobrowser_lib`), Win32 C++ FFI (`native/browser_sys.cpp`)
- **Frontend**: Vanilla ES2024, CSS3 Ultra-Light Liquid Glass + Material Design 3, Google Material Symbols
- **Engine**: WebView2 (системный Chromium рантайм, нативные `WebviewWindow` окна для вкладок без ограничений CSP/X-Frame-Options)
- **Целевая система**: Windows 10/11 x64, оптимизировано под двухъядерный Celeron и 4 ГБ ОЗУ (нагрузка < 5% CPU)

## Статус
- Репозиторий успешно создан и полностью залит на GitHub.
- Токен очищен из git remote URL и временных файлов.
