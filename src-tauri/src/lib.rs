use std::env;
use std::sync::Mutex;
use std::collections::HashMap;
use tauri::{AppHandle, Manager, WebviewUrl, WebviewBuilder, Position, PhysicalPosition, Size, PhysicalSize, Emitter};

#[cfg(target_os = "windows")]
unsafe extern "C" {
    fn RegisterAsDefaultBrowserNative() -> i32;
    fn OpenDefaultBrowserSettingsNative();
}

#[derive(Default)]
struct BrowserState {
    tab_urls: Mutex<HashMap<String, String>>,
    active_tab: Mutex<Option<String>>,
    current_url: Mutex<String>,
    adblock_enabled: Mutex<bool>,
    eco_enabled: Mutex<bool>,
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
fn drag_window(app: AppHandle) {
    if let Some(win) = app.get_window("main") {
        let _ = win.start_dragging();
    }
}

#[tauri::command]
fn minimize_window(app: AppHandle) {
    if let Some(win) = app.get_window("main") {
        let _ = win.minimize();
    }
}

#[tauri::command]
fn toggle_maximize_window(app: AppHandle) {
    if let Some(win) = app.get_window("main") {
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
    if let Some(win) = app.get_window("main") {
        let _ = win.close();
    }
}

#[tauri::command]
fn init_content_view(
    app: AppHandle,
    x: f64,
    y: f64,
    width: f64,
    height: f64,
) -> Result<(), String> {
    let main_win = app.get_window("main").ok_or("Main window not found")?;
    let scale_factor = main_win.scale_factor().unwrap_or(1.0);

    let phys_pos = Position::Physical(PhysicalPosition::new(
        (x * scale_factor) as i32,
        (y * scale_factor) as i32,
    ));
    let phys_size = Size::Physical(PhysicalSize::new(
        (width * scale_factor) as u32,
        (height * scale_factor) as u32,
    ));

    if let Some(wv) = app.get_webview("content_view") {
        let _ = wv.set_position(phys_pos);
        let _ = wv.set_size(phys_size);
    } else {
        let builder = WebviewBuilder::new(
            "content_view",
            WebviewUrl::External("about:blank".parse().unwrap())
        ).auto_resize();

        let wv = main_win.add_child(builder, phys_pos, phys_size)
            .map_err(|e| format!("Failed to create content webview: {}", e))?;
        
        let _ = wv.hide();
    }
    Ok(())
}

#[tauri::command]
fn navigate_content(
    app: AppHandle,
    state: tauri::State<BrowserState>,
    tab_id: String,
    url: String,
    x: f64,
    y: f64,
    width: f64,
    height: f64,
) -> Result<(), String> {
    let main_win = app.get_window("main").ok_or("Main window not found")?;
    let scale_factor = main_win.scale_factor().unwrap_or(1.0);

    let phys_pos = Position::Physical(PhysicalPosition::new(
        (x * scale_factor) as i32,
        (y * scale_factor) as i32,
    ));
    let phys_size = Size::Physical(PhysicalSize::new(
        (width * scale_factor) as u32,
        (height * scale_factor) as u32,
    ));

    {
        let mut tabs = state.tab_urls.lock().map_err(|e| e.to_string())?;
        tabs.insert(tab_id.clone(), url.clone());
        let mut active = state.active_tab.lock().map_err(|e| e.to_string())?;
        *active = Some(tab_id);
    }

    if url == "about:home" || url == "about:blank" {
        if let Some(wv) = app.get_webview("content_view") {
            let _ = wv.hide();
        }
        return Ok(());
    }

    let parsed_url: tauri::Url = tauri::Url::parse(&url).map_err(|e| e.to_string())?;

    let wv = match app.get_webview("content_view") {
        Some(w) => {
            let _ = w.set_position(phys_pos);
            let _ = w.set_size(phys_size);
            let _ = w.navigate(parsed_url);
            let _ = w.show();
            let _ = w.set_focus();
            w
        }
        None => {
            let builder = WebviewBuilder::new("content_view", WebviewUrl::External(parsed_url)).auto_resize();
            let created = main_win.add_child(builder, phys_pos, phys_size)
                .map_err(|e| format!("Failed to build content webview: {}", e))?;
            let _ = created.show();
            let _ = created.set_focus();
            created
        }
    };

    let app_clone = app.clone();
    let url_clone = url.clone();
    tauri::async_runtime::spawn(async move {
        std::thread::sleep(std::time::Duration::from_millis(150));
        let _ = app_clone.emit("content_page_loaded", url_clone);
    });

    if let Ok(adb) = state.adblock_enabled.lock() {
        if *adb {
            let js = r#"
            (function() {
                const hide = () => {
                    document.querySelectorAll('[id*="ad-"], [class*="ad-"], [id*="banner"], [class*="banner"], iframe[src*="ad"]').forEach(el => el.style.setProperty('display', 'none', 'important'));
                };
                hide();
                setInterval(hide, 1500);
            })();
            "#;
            let _ = wv.eval(js);
        }
    }

    if let Ok(eco) = state.eco_enabled.lock() {
        if *eco {
            let js = r#"
            (function() {
                let style = document.getElementById('rode-eco-style');
                if (!style) {
                    style = document.createElement('style');
                    style.id = 'rode-eco-style';
                    style.textContent = '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; } video { max-width: 100% !important; }';
                    document.head.appendChild(style);
                }
            })();
            "#;
            let _ = wv.eval(js);
        }
    }

    Ok(())
}

#[tauri::command]
fn sync_content_bounds(
    app: AppHandle,
    x: f64,
    y: f64,
    width: f64,
    height: f64,
) -> Result<(), String> {
    if let Some(wv) = app.get_webview("content_view") {
        if let Some(main_win) = app.get_window("main") {
            let scale_factor = main_win.scale_factor().unwrap_or(1.0);
            let phys_pos = Position::Physical(PhysicalPosition::new(
                (x * scale_factor) as i32,
                (y * scale_factor) as i32,
            ));
            let phys_size = Size::Physical(PhysicalSize::new(
                (width * scale_factor) as u32,
                (height * scale_factor) as u32,
            ));
            let _ = wv.set_position(phys_pos);
            let _ = wv.set_size(phys_size);
        }
    }
    Ok(())
}

#[tauri::command]
fn go_back(app: AppHandle) -> Result<(), String> {
    if let Some(wv) = app.get_webview("content_view") {
        let _ = wv.eval("window.history.back()");
    }
    Ok(())
}

#[tauri::command]
fn go_forward(app: AppHandle) -> Result<(), String> {
    if let Some(wv) = app.get_webview("content_view") {
        let _ = wv.eval("window.history.forward()");
    }
    Ok(())
}

#[tauri::command]
fn reload_content(app: AppHandle) -> Result<(), String> {
    if let Some(wv) = app.get_webview("content_view") {
        let _ = wv.eval("window.location.reload()");
    }
    Ok(())
}

#[tauri::command]
fn toggle_adblock(app: AppHandle, state: tauri::State<BrowserState>, enabled: bool) -> Result<bool, String> {
    let mut adb = state.adblock_enabled.lock().map_err(|e| e.to_string())?;
    *adb = enabled;

    if let Some(wv) = app.get_webview("content_view") {
        if enabled {
            let js = r#"
            (function() {
                const hide = () => {
                    document.querySelectorAll('[id*="ad-"], [class*="ad-"], [id*="banner"], [class*="banner"], iframe[src*="ad"]').forEach(el => el.style.setProperty('display', 'none', 'important'));
                };
                hide();
                setInterval(hide, 1500);
            })();
            "#;
            let _ = wv.eval(js);
        }
    }
    Ok(enabled)
}

#[tauri::command]
fn toggle_eco_mode(app: AppHandle, state: tauri::State<BrowserState>, enabled: bool) -> Result<bool, String> {
    let mut eco = state.eco_enabled.lock().map_err(|e| e.to_string())?;
    *eco = enabled;

    if let Some(wv) = app.get_webview("content_view") {
        let js = if enabled {
            r#"
            (function() {
                let style = document.getElementById('rode-eco-style');
                if (!style) {
                    style = document.createElement('style');
                    style.id = 'rode-eco-style';
                    style.textContent = '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; } video { max-width: 100% !important; }';
                    document.head.appendChild(style);
                }
            })();
            "#
        } else {
            r#"
            (function() {
                let style = document.getElementById('rode-eco-style');
                if (style) style.remove();
            })();
            "#
        };
        let _ = wv.eval(js);
    }
    Ok(enabled)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(BrowserState {
            tab_urls: Mutex::new(HashMap::new()),
            active_tab: Mutex::new(None),
            current_url: Mutex::new(String::new()),
            adblock_enabled: Mutex::new(true),
            eco_enabled: Mutex::new(false),
        })
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
            drag_window,
            minimize_window,
            toggle_maximize_window,
            close_window,
            init_content_view,
            navigate_content,
            sync_content_bounds,
            go_back,
            go_forward,
            reload_content,
            toggle_adblock,
            toggle_eco_mode
        ])
        .run(tauri::generate_context!())
        .expect("error while building tauri application");
}