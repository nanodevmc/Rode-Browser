use std::env;
use std::sync::Mutex;
use std::collections::HashMap;
use tauri::{AppHandle, Manager, WebviewUrl, WebviewBuilder, Position, LogicalPosition, Size, LogicalSize, Emitter};
use tauri::window::WindowBuilder;
use tauri::webview::{PageLoadEvent, DownloadEvent};

#[cfg(target_os = "windows")]
unsafe extern "C" {
    fn RegisterAsDefaultBrowserNative() -> i32;
    fn OpenDefaultBrowserSettingsNative();
}

#[derive(Default)]
struct BrowserState {
    tab_urls: Mutex<HashMap<String, String>>,
    active_tab: Mutex<Option<String>>,
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
    if let Some(wv) = app.get_webview("content_view") {
        let _ = wv.set_position(Position::Logical(LogicalPosition::new(x, y)));
        let _ = wv.set_size(Size::Logical(LogicalSize::new(width, height)));
    }
    Ok(())
}

#[tauri::command]
async fn navigate_content(
    app: AppHandle,
    state: tauri::State<'_, BrowserState>,
    tab_id: String,
    url: String,
    x: f64,
    y: f64,
    width: f64,
    height: f64,
) -> Result<(), String> {
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

    if let Some(wv) = app.get_webview("content_view") {
        let _ = wv.set_position(Position::Logical(LogicalPosition::new(x, y)));
        let _ = wv.set_size(Size::Logical(LogicalSize::new(width, height)));
        let _ = wv.navigate(parsed_url);
        let _ = wv.show();
        let _ = wv.set_focus();

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
        let _ = wv.set_position(Position::Logical(LogicalPosition::new(x, y)));
        let _ = wv.set_size(Size::Logical(LogicalSize::new(width, height)));
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

#[tauri::command]
fn hide_content_view(app: AppHandle) -> Result<(), String> {
    if let Some(wv) = app.get_webview("content_view") {
        let _ = wv.hide();
    }
    Ok(())
}

#[tauri::command]
fn show_content_view(app: AppHandle) -> Result<(), String> {
    if let Some(wv) = app.get_webview("content_view") {
        let _ = wv.show();
        let _ = wv.set_focus();
    }
    Ok(())
}

#[tauri::command]
fn open_downloads_folder() -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        if let Some(user_profile) = env::var_os("USERPROFILE") {
            let downloads = std::path::Path::new(&user_profile).join("Downloads");
            let _ = std::process::Command::new("explorer").arg(downloads).spawn();
        }
    }
    Ok(())
}

#[tauri::command]
fn autofill_credentials(app: AppHandle, username: String, password: String) -> Result<(), String> {
    if let Some(wv) = app.get_webview("content_view") {
        let u_json = serde_json::to_string(&username).unwrap_or_default();
        let p_json = serde_json::to_string(&password).unwrap_or_default();
        let js = format!(r#"
        (function() {{
            try {{
                const u = {u_json};
                const p = {p_json};
                const pwd = document.querySelector('input[type="password"]');
                if (pwd) {{
                    pwd.value = p;
                    pwd.dispatchEvent(new Event('input', {{ bubbles: true }}));
                    pwd.dispatchEvent(new Event('change', {{ bubbles: true }}));
                    const form = pwd.closest('form') || document;
                    const usr = form.querySelector('input[type="text"], input[type="email"], input[name*="user"], input[name*="login"], input[name*="email"], input[id*="user"], input[id*="login"], input[id*="email"]');
                    if (usr) {{
                        usr.value = u;
                        usr.dispatchEvent(new Event('input', {{ bubbles: true }}));
                        usr.dispatchEvent(new Event('change', {{ bubbles: true }}));
                    }}
                }}
            }} catch(e) {{}}
        }})();
        "#);
        let _ = wv.eval(&js);
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(BrowserState {
            tab_urls: Mutex::new(HashMap::new()),
            active_tab: Mutex::new(None),
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

            let width = 1100.0;
            let height = 720.0;

            let mut builder = WindowBuilder::new(app, "main")
                .title("Rode Browser")
                .inner_size(width, height)
                .min_inner_size(640.0, 480.0)
                .decorations(false)
                .resizable(true);

            if let Some(icon) = app.default_window_icon() {
                builder = builder.icon(icon.clone())?;
            }

            let window = builder.build()?;

            let _ui_webview = window.add_child(
                WebviewBuilder::new("main", WebviewUrl::App(Default::default()))
                    .auto_resize(),
                LogicalPosition::new(0.0, 0.0),
                LogicalSize::new(width, height),
            )?;

            let app_handle_nav = app.handle().clone();
            let app_handle_load = app.handle().clone();
            let app_handle_dl = app.handle().clone();
            let content_webview = window.add_child(
                WebviewBuilder::new(
                    "content_view",
                    WebviewUrl::External("about:blank".parse().unwrap()),
                )
                .on_navigation(move |url| {
                    if url.scheme() == "rode-auth" {
                        let mut origin = String::new();
                        let mut username = String::new();
                        let mut password = String::new();
                        for (key, val) in url.query_pairs() {
                            match key.as_ref() {
                                "origin" => origin = val.to_string(),
                                "username" => username = val.to_string(),
                                "password" => password = val.to_string(),
                                _ => {}
                            }
                        }
                        if !username.is_empty() && !password.is_empty() {
                            let _ = app_handle_nav.emit("credentials_detected", serde_json::json!({
                                "origin": origin,
                                "username": username,
                                "password": password,
                            }));
                        }
                        return false;
                    }
                    true
                })
                .auto_resize()
                .on_page_load(move |_wv, payload| {
                    let active_tab_id = app_handle_load
                        .try_state::<BrowserState>()
                        .and_then(|st| st.active_tab.lock().ok().and_then(|a| a.clone()));

                    match payload.event() {
                        PageLoadEvent::Started => {
                            let url = payload.url().to_string();
                            let _ = app_handle_load.emit("content_page_started", serde_json::json!({
                                "tab_id": active_tab_id,
                                "url": url,
                            }));
                        }
                        PageLoadEvent::Finished => {
                            let url = payload.url().to_string();
                            let _ = app_handle_load.emit("content_page_finished", serde_json::json!({
                                "tab_id": active_tab_id.clone(),
                                "url": url.clone(),
                            }));
                            let _ = app_handle_load.emit("content_url_changed", serde_json::json!({
                                "tab_id": active_tab_id,
                                "url": url,
                            }));

                            // Modern instant CSS AdBlock (Zero CPU timer overhead)
                            let adb_js = r#"
                            (function() {
                                let style = document.getElementById('rode-adb-style');
                                if (!style) {
                                    style = document.createElement('style');
                                    style.id = 'rode-adb-style';
                                    style.textContent = '[id*="ad-"], [class*="ad-"], [id*="banner"], [class*="banner"], iframe[src*="ad"] { display: none !important; }';
                                    (document.head || document.documentElement).appendChild(style);
                                }
                            })();
                            "#;
                            let _ = _wv.eval(adb_js);

                            // Form login & password capture
                            let auth_js = r#"
                            (function() {
                                if (window.__rodeAuthInjected) return;
                                window.__rodeAuthInjected = true;
                                function captureLogin(form) {
                                    try {
                                        const pwdInput = form ? form.querySelector('input[type="password"]') : document.querySelector('input[type="password"]');
                                        if (!pwdInput || !pwdInput.value) return;
                                        const root = form || pwdInput.closest('form') || document;
                                        const userInput = root.querySelector('input[type="text"], input[type="email"], input[name*="user"], input[name*="login"], input[name*="email"], input[id*="user"], input[id*="login"], input[id*="email"]');
                                        const username = userInput ? userInput.value : '';
                                        const password = pwdInput.value;
                                        if (password && password.length >= 2) {
                                            const dummy = document.createElement('iframe');
                                            dummy.style.display = 'none';
                                            dummy.src = 'rode-auth://save?origin=' + encodeURIComponent(window.location.origin) + '&username=' + encodeURIComponent(username) + '&password=' + encodeURIComponent(password);
                                            (document.body || document.documentElement).appendChild(dummy);
                                            setTimeout(() => dummy.remove(), 1000);
                                        }
                                    } catch(e) {}
                                }
                                document.addEventListener('submit', function(e) { captureLogin(e.target); }, true);
                                document.addEventListener('click', function(e) {
                                    const btn = e.target.closest('button, input[type="submit"], [role="button"]');
                                    if (btn) captureLogin(btn.closest('form'));
                                }, true);
                                document.addEventListener('keydown', function(e) {
                                    if (e.key === 'Enter' && e.target && e.target.tagName === 'INPUT') {
                                        captureLogin(e.target.closest('form'));
                                    }
                                }, true);
                            })();
                            "#;
                            let _ = _wv.eval(auth_js);
                        }
                    }
                })
                .on_download(move |_wv, event| {
                    match event {
                        DownloadEvent::Requested { url: _, destination: _ } => {
                            true
                        }
                        DownloadEvent::Finished { url: _, path, success } => {
                            if success {
                                let file_name = path
                                    .as_ref()
                                    .and_then(|p| p.file_name())
                                    .map(|n| n.to_string_lossy().to_string())
                                    .unwrap_or_else(|| "Файл".to_string());
                                let _ = app_handle_dl.emit("download_finished", file_name);
                            }
                            true
                        }
                        _ => true,
                    }
                }),
                LogicalPosition::new(0.0, 114.0),
                LogicalSize::new(width, height - 114.0),
            )?;

            let _ = content_webview.hide();

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
            toggle_eco_mode,
            hide_content_view,
            show_content_view,
            open_downloads_folder,
            autofill_credentials
        ])
        .run(tauri::generate_context!())
        .expect("error while building tauri application");
}