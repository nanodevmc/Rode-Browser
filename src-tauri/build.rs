fn main() {
    cc::Build::new()
        .cpp(true)
        .file("../native/browser_sys.cpp")
        .compile("browser_sys");

    println!("cargo:rustc-link-lib=advapi32");
    println!("cargo:rustc-link-lib=shell32");

    tauri_build::build()
}
