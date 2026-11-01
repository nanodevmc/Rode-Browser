# NanoBrowser Build Guide

## Требования
- Node.js (v18+)
- Rust + Cargo (stable toolchain)
- Visual Studio Build Tools (C++ x64 / MSVC)

## Сборка для тестирования
```cmd
cd /d C:\Users\nanodev\NanoBrowser
npx tauri dev
```

## Финальная сборка и создание инсталлера
```cmd
cd /d C:\Users\nanodev\NanoBrowser
set CARGO_BUILD_JOBS=1
npx tauri build
```
Готовый `.exe` и установщик NSIS будут сформированы в:
`src-tauri\target\release\bundle\nsis\NanoBrowser_*_x64-setup.exe`
