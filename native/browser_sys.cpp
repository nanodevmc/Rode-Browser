#include <windows.h>
#include <shlobj.h>
#include <string>
#include <vector>

namespace {

bool SetRegistryStringValue(HKEY rootKey, const std::wstring& subKey, const std::wstring& valueName, const std::wstring& data) {
    HKEY hKey = nullptr;
    LONG result = RegCreateKeyExW(
        rootKey,
        subKey.c_str(),
        0,
        nullptr,
        REG_OPTION_NON_VOLATILE,
        KEY_SET_VALUE,
        nullptr,
        &hKey,
        nullptr
    );

    if (result != ERROR_SUCCESS) {
        return false;
    }

    result = RegSetValueExW(
        hKey,
        valueName.empty() ? nullptr : valueName.c_str(),
        0,
        REG_SZ,
        reinterpret_cast<const BYTE*>(data.c_str()),
        static_cast<DWORD>((data.length() + 1) * sizeof(wchar_t))
    );

    RegCloseKey(hKey);
    return result == ERROR_SUCCESS;
}

std::wstring GetCurrentExecutablePath() {
    std::vector<wchar_t> buffer(MAX_PATH);
    DWORD length = GetModuleFileNameW(nullptr, buffer.data(), static_cast<DWORD>(buffer.size()));
    while (length == buffer.size() && GetLastError() == ERROR_INSUFFICIENT_BUFFER) {
        buffer.resize(buffer.size() * 2);
        length = GetModuleFileNameW(nullptr, buffer.data(), static_cast<DWORD>(buffer.size()));
    }
    return std::wstring(buffer.data(), length);
}

}

extern "C" {

__declspec(dllexport) int RegisterAsDefaultBrowserNative() {
    std::wstring exePath = GetCurrentExecutablePath();
    std::wstring quotedExe = L"\"" + exePath + L"\" \"%1\"";
    std::wstring appName = L"NanoBrowser";
    std::wstring progId = L"NanoBrowserHTML";

    bool success = true;

    success &= SetRegistryStringValue(HKEY_CURRENT_USER, L"Software\\Clients\\StartMenuInternet\\NanoBrowser", L"", L"Nano Browser");
    success &= SetRegistryStringValue(HKEY_CURRENT_USER, L"Software\\Clients\\StartMenuInternet\\NanoBrowser\\DefaultIcon", L"", exePath + L",0");
    success &= SetRegistryStringValue(HKEY_CURRENT_USER, L"Software\\Clients\\StartMenuInternet\\NanoBrowser\\shell\\open\\command", L"", quotedExe);

    success &= SetRegistryStringValue(HKEY_CURRENT_USER, L"Software\\Clients\\StartMenuInternet\\NanoBrowser\\Capabilities", L"ApplicationName", L"Nano Browser");
    success &= SetRegistryStringValue(HKEY_CURRENT_USER, L"Software\\Clients\\StartMenuInternet\\NanoBrowser\\Capabilities", L"ApplicationDescription", L"Fast and lightweight Liquid Glass browser");
    success &= SetRegistryStringValue(HKEY_CURRENT_USER, L"Software\\Clients\\StartMenuInternet\\NanoBrowser\\Capabilities\\URLAssociations", L"http", progId);
    success &= SetRegistryStringValue(HKEY_CURRENT_USER, L"Software\\Clients\\StartMenuInternet\\NanoBrowser\\Capabilities\\URLAssociations", L"https", progId);
    success &= SetRegistryStringValue(HKEY_CURRENT_USER, L"Software\\Clients\\StartMenuInternet\\NanoBrowser\\Capabilities\\FileAssociations", L".htm", progId);
    success &= SetRegistryStringValue(HKEY_CURRENT_USER, L"Software\\Clients\\StartMenuInternet\\NanoBrowser\\Capabilities\\FileAssociations", L".html", progId);

    success &= SetRegistryStringValue(HKEY_CURRENT_USER, L"Software\\RegisteredApplications", L"NanoBrowser", L"Software\\Clients\\StartMenuInternet\\NanoBrowser\\Capabilities");

    success &= SetRegistryStringValue(HKEY_CURRENT_USER, L"Software\\Classes\\" + progId, L"", L"Nano Browser Document");
    success &= SetRegistryStringValue(HKEY_CURRENT_USER, L"Software\\Classes\\" + progId + L"\\DefaultIcon", L"", exePath + L",0");
    success &= SetRegistryStringValue(HKEY_CURRENT_USER, L"Software\\Classes\\" + progId + L"\\shell\\open\\command", L"", quotedExe);

    SHChangeNotify(SHCNE_ASSOCCHANGED, SHCNF_IDLIST, nullptr, nullptr);

    return success ? 1 : 0;
}

__declspec(dllexport) void OpenDefaultBrowserSettingsNative() {
    ShellExecuteW(nullptr, L"open", L"ms-settings:defaultapps", nullptr, nullptr, SW_SHOWNORMAL);
}

}
