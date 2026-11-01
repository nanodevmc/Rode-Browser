use std::env;
use std::sync::Mutex;
use std::collections::HashMap;
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

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
    let result = unsafe { RegisterAsDefaultBrowserNative() };
    result == 1
}

#[tauri::command]
fn open_default_settings() {
    unsafe { OpenDefaultBrowserSettingsNative() };
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

    if let Some(win) = app.get_webview_window(&tab_id) {
        let _ = win.set_position(tauri::Position::Logical(tauri::LogicalPosition::new(x, y)));
        let _ = win.set_size(tauri::Size::Logical(tauri::LogicalSize::new(width, height)));
        let _ = win.navigate(parsed_url);
        let _ = win.show();
        let _ = win.set_focus();
    } else {
        let win = WebviewWindowBuilder::new(&app, &tab_id, WebviewUrl::CustomProtocol(parsed_url))
            .title("Nano Browser View")
            .decorations(false)
            .position(x, y)
            .inner_size(width, height)
            .resizable(true)
            .visible(true)
            .build()
            .map_err(|e| e.to_string())?;
        
        let _ = win.show();
    }

    tabs.insert(tab_id.clone(), url);
    *active = Some(tab_id);
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
            open_in_tab,
            switch_tab,
            close_tab_window
        ])
        .run(tauri::generate_context!())
        .expect("error while building tauri application");
}
