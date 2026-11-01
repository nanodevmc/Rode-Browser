# PROJECT STATE: NanoBrowser

## Архитектура и стек
- **Core**: Tauri v2 (`@tauri-apps/cli` 2.12.4), Rust (`nanobrowser_lib`), Win32 C++ FFI (`native/browser_sys.cpp`)
- **Frontend**: Vanilla ES2024, CSS3 Liquid Glass + Material Design 3, Google Material Symbols (Google Icons)
- **Engine**: WebView2 (системный Chromium рантайм, полная поддержка современного JS/CSS/WASM без фонового перерасхода ОЗУ)
- **Целевая система**: Windows 10/11 x64, оптимизировано под двухъядерный Celeron и 4 ГБ ОЗУ

## Реализовано
1. `native/browser_sys.cpp`: Win32 C++ модуль системной регистрации дефолтного браузера в реестре Windows (`HKCU\Software\Clients\StartMenuInternet`, `Capabilities`, URL & File associations для http/https/.htm/.html).
2. `src-tauri/build.rs`: интеграция C++ компилятора через `cc::Build` и линковка с `advapi32`, `shell32`.
3. `src-tauri/src/lib.rs`: экспорт FFI функций, Tauri IPC команды (`register_default_browser`, `open_default_settings`, `get_initial_url`).
4. `src-tauri/tauri.conf.json`: безрамочная конфигурация окна (`decorations: false`), NSIS bundle установщик.
5. **AdBlock**: высокоскоростной движок блокировки баннеров, трекеров и телеметрии (`Set` O(1)) для экономии памяти Celeron.
6. **Low-Spec Mode (Eco)**: режим мгновенного подавления тяжелых CSS-анимаций и графических эффектов на страницах.
7. **Speed Dial (Новая вкладка)**: домашний экран Liquid Glass с живыми часами, быстрым поиском и стеклянными плитками.
8. **История и закладки**: сохранение локальных данных, кнопка `★` в Omnibox, модальные окна `Ctrl+H` и `Bookmarks`.
9. **Горячие клавиши**: `Ctrl+T`, `Ctrl+W`, `Ctrl+L`, `Ctrl+D`, `Ctrl+H`, `F5`, `Esc`.
10. **Гибернация вкладок**: моментальная выгрузка рендера неактивных вкладок из ОЗУ и кэширование снимка состояния.
