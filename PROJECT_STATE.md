# PROJECT STATE: Rode Browser (ex NanoBrowser)

## Архитектура и стек
- **Репозиторий**: https://github.com/nanodevmc/Rode-Browser (public)
- **Core**: Tauri v2 (`@tauri-apps/cli` 2.12.4), Rust (`nanobrowser_lib`), Win32 C++ FFI (`native/browser_sys.cpp`)
- **Frontend**: Vanilla ES2024, CSS3 Ultra-Light Liquid Glass + Material Design 3, Google Material Symbols
- **Engine**: WebView2 (системный Chromium рантайм, нативные `WebviewWindow` окна для вкладок без ограничений CSP/X-Frame-Options)
- **Целевая система**: Windows 10/11 x64, оптимизировано под двухъядерный Celeron и 4 ГБ ОЗУ (нагрузка < 5% CPU)

## Статус
- Версия 1.0.6 собрана и готова к использованию.
- Инсталлятор `RodeBrowser_1.0.6_Setup.exe` на Рабочем столе.
- Реализованы: нативная индикация загрузки при переходах (Started/Finished), устранение задержек через CSS-адблок, автозаполнение и менеджер паролей, персистентные cookies, исправление слоев модалок над webview, движок загрузок файлов и брендовые иконки/баннер.
