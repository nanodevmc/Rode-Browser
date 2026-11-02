use std::env;
use std::sync::Mutex;
use std::collections::HashMap;
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder, Position, LogicalPosition, Size, LogicalSize};

#[cfg(target_os = "windows")]
unsafe extern "C" {
    fn RegisterAsDefaultBrowserNative() -> i32;
    fn OpenDefaultBrowserSettingsNative();
}

#[derive(Default)]
struct BrowserState {
    active_tab: Mutex<Option<String>>,
    tabs: Mutex<HashMap<String, String>>,
}

#[tauri::command]
fn register_default_browser() -> bool {
    #[cfg(target_os = "windows")]
    {
        let result = unsafe { RegisterAsDefaultBrowserNative() };
        return result == 1;
    }
    #[cfg(not(target_os = "windows"))]
    {
        true
    }
}

#[tauri::command]
fn open_default_settings() {
    #[cfg(target_os = "windows")]
    unsafe {
        OpenDefaultBrowserSettingsNative();
    }
}

#[tauri::command]
fn get_initial_url() -> Option<String> {
    let args: Vec<String> = env::args().collect();
    if args.len() > 1 {
        let candidate = args[1].trim();
        if candidate.starts_with("http://") || candidate.starts_with("https://") || candidate.starts_with("file://") {
            return Some(candidate.to_string());
        }
    }
    None
}

#[tauri::command]
fn minimize_window(app: AppHandle) {
    if let Some(win) = app.get_webview_window("main") {
        let _ = win.minimize();
    }
}

#[tauri::command]
fn toggle_maximize_window(app: AppHandle) {
    if let Some(win) = app.get_webview_window("main") {
        if let Ok(is_max) = win.is_maximized() {
            if is_max {
                let _ = win.unmaximize();
            } else {
                let _ = win.maximize();
            }
        }
    }
}

#[tauri::command]
fn close_window(app: AppHandle) {
    if let Some(win) = app.get_webview_window("main") {
        let _ = win.close();
    }
}

#[tauri::command]
fn open_in_tab(
    app: AppHandle,
    state: tauri::State<BrowserState>,
    tab_id: String,
    url: String,
    x: f64,
    y: f64,
    width: f64,
    height: f64,
) -> Result<(), String> {
    let mut tabs = state.tabs.lock().map_err(|e| e.to_string())?;
    let mut active = state.active_tab.lock().map_err(|e| e.to_string())?;

    if let Some(ref prev_id) = *active {
        if prev_id != &tab_id {
            if let Some(prev_win) = app.get_webview_window(prev_id) {
                let _ = prev_win.hide();
            }
        }
    }

    let parsed_url: tauri::Url = tauri::Url::parse(&url).map_err(|e| e.to_string())?;

    let main_win = app.get_webview_window("main").ok_or("Main window not found")?;
    let main_pos = main_win.outer_position().unwrap_or(tauri::PhysicalPosition::new(0, 0));
    let scale_factor = main_win.scale_factor().unwrap_or(1.0);

    let screen_x = (main_pos.x as f64 / scale_factor) + x;
    let screen_y = (main_pos.y as f64 / scale_factor) + y;

    if let Some(win) = app.get_webview_window(&tab_id) {
        let _ = win.set_position(Position::Logical(LogicalPosition::new(screen_x, screen_y)));
        let _ = win.set_size(Size::Logical(LogicalSize::new(width, height)));
        let _ = win.navigate(parsed_url);
        let _ = win.show();
        let _ = win.set_focus();
    } else {
        let win = WebviewWindowBuilder::new(&app, &tab_id, WebviewUrl::External(parsed_url))
            .title("Rode View")
            .decorations(false)
            .shadow(false)
            .position(screen_x, screen_y)
            .inner_size(width, height)
            .resizable(true)
            .visible(true)
            .build()
            .map_err(|e| format!("Failed to create webview window: {}", e))?;
        
        let _ = win.show();
        let _ = win.set_focus();
    }

    tabs.insert(tab_id.clone(), url);
    *active = Some(tab_id);
    Ok(())
}

#[tauri::command]
fn sync_tabs_geometry(
    app: AppHandle,
    state: tauri::State<BrowserState>,
    x: f64,
    y: f64,
    width: f64,
    height: f64,
) -> Result<(), String> {
    let active = state.active_tab.lock().map_err(|e| e.to_string())?;
    if let Some(ref tab_id) = *active {
        if let Some(win) = app.get_webview_window(tab_id) {
            let main_win = app.get_webview_window("main").ok_or("Main window not found")?;
            let main_pos = main_win.outer_position().unwrap_or(tauri::PhysicalPosition::new(0, 0));
            let scale_factor = main_win.scale_factor().unwrap_or(1.0);

            let screen_x = (main_pos.x as f64 / scale_factor) + x;
            let screen_y = (main_pos.y as f64 / scale_factor) + y;

            let _ = win.set_position(Position::Logical(LogicalPosition::new(screen_x, screen_y)));
            let _ = win.set_size(Size::Logical(LogicalSize::new(width, height)));
        }
    }
    Ok(())
}

#[tauri::command]
fn switch_tab(
    app: AppHandle,
    state: tauri::State<BrowserState>,
    tab_id: String,
) -> Result<(), String> {
    let mut active = state.active_tab.lock().map_err(|e| e.to_string())?;
    if let Some(ref prev_id) = *active {
        if prev_id != &tab_id {
            if let Some(prev_win) = app.get_webview_window(prev_id) {
                let _ = prev_win.hide();
            }
        }
    }
    if let Some(win) = app.get_webview_window(&tab_id) {
        let _ = win.show();
        let _ = win.set_focus();
    }
    *active = Some(tab_id);
    Ok(())
}

#[tauri::command]
fn hide_all_tabs(
    app: AppHandle,
    state: tauri::State<BrowserState>,
) -> Result<(), String> {
    let mut active = state.active_tab.lock().map_err(|e| e.to_string())?;
    if let Some(ref id) = *active {
        if let Some(win) = app.get_webview_window(id) {
            let _ = win.hide();
        }
    }
    *active = None;
    Ok(())
}

#[tauri::command]
fn close_tab_window(
    app: AppHandle,
    state: tauri::State<BrowserState>,
    tab_id: String,
) -> Result<(), String> {
    if let Some(win) = app.get_webview_window(&tab_id) {
        let _ = win.close();
    }
    let mut tabs = state.tabs.lock().map_err(|e| e.to_string())?;
    tabs.remove(&tab_id);
    let mut active = state.active_tab.lock().map_err(|e| e.to_string())?;
    if active.as_ref() == Some(&tab_id) {
        *active = None;
    }
    Ok(())
}

#[tauri::command]
fn go_back_tab(app: AppHandle, tab_id: String) -> Result<(), String> {
    if let Some(win) = app.get_webview_window(&tab_id) {
        let _ = win.eval("window.history.back()");
    }
    Ok(())
}

#[tauri::command]
fn go_forward_tab(app: AppHandle, tab_id: String) -> Result<(), String> {
    if let Some(win) = app.get_webview_window(&tab_id) {
        let _ = win.eval("window.history.forward()");
    }
    Ok(())
}

#[tauri::command]
fn reload_tab(app: AppHandle, tab_id: String) -> Result<(), String> {
    if let Some(win) = app.get_webview_window(&tab_id) {
        let _ = win.eval("window.location.reload()");
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(BrowserState::default())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            register_default_browser,
            open_default_settings,
            get_initial_url,
            minimize_window,
            toggle_maximize_window,
            close_window,
            open_in_tab,
            sync_tabs_geometry,
            switch_tab,
            hide_all_tabs,
            close_tab_window,
            go_back_tab,
            go_forward_tab,
            reload_tab
        ])
        .run(tauri::generate_context!())
        .expect("error while building tauri application");
}
