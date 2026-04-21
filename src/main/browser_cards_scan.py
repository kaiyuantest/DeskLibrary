import argparse
import json
import os
import shutil
import sqlite3
import tempfile
from pathlib import Path


def get_root_domain(domain: str) -> str:
    value = str(domain or "").strip().lstrip(".")
    if not value:
        return ""
    parts = value.split(".")
    if len(parts) >= 2:
        return "." + ".".join(parts[-2:])
    return "." + value


def get_cookie_path(base_dir: Path):
    candidates = [
        base_dir / "Network" / "Cookies",
        base_dir / "Cookies",
        base_dir / "Default" / "Network" / "Cookies",
        base_dir / "Default" / "Cookies",
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    return None


def query_cookie_rows(cookie_path: Path):
    sql = """
    SELECT host_key, name, path, is_secure, is_httponly, expires_utc
    FROM cookies
    """

    try:
        conn = sqlite3.connect(f"file:{cookie_path.as_posix()}?mode=ro", uri=True)
        try:
            return conn.execute(sql).fetchall()
        finally:
            conn.close()
    except Exception:
        tmp_dir = Path(tempfile.mkdtemp(prefix="desklibrary-cookie-scan-"))
        tmp_file = tmp_dir / "Cookies.db"
        try:
            shutil.copy2(cookie_path, tmp_file)
            conn = sqlite3.connect(str(tmp_file))
            try:
                return conn.execute(sql).fetchall()
            finally:
                conn.close()
        finally:
            shutil.rmtree(tmp_dir, ignore_errors=True)


def build_groups(rows):
    grouped = {}
    for host_key, name, path_value, is_secure, is_http_only, expires_utc in rows:
        root = get_root_domain(host_key)
        if not root:
          continue
        group = grouped.setdefault(root, [])
        group.append({
            "name": name or "",
            "domain": host_key or "",
            "path": path_value or "/",
            "secure": bool(is_secure),
            "httpOnly": bool(is_http_only),
            "expiresUtc": int(expires_utc or 0),
        })

    results = []
    for domain, cookies in sorted(grouped.items(), key=lambda item: (-len(item[1]), item[0])):
        names = []
        for cookie in cookies:
            cookie_name = cookie.get("name", "")
            if cookie_name and cookie_name not in names:
                names.append(cookie_name)
        results.append({
            "domain": domain,
            "openUrl": f"https://{domain.lstrip('.')}",
            "cookieCount": len(cookies),
            "cookieNames": names[:24],
            "cookies": cookies,
        })
    return results


def read_local_state_names(user_data_dir: Path):
    display_names = {}
    local_state = user_data_dir / "Local State"
    if not local_state.exists():
        return display_names
    try:
        payload = json.loads(local_state.read_text("utf-8"))
        info_cache = payload.get("profile", {}).get("info_cache", {})
        for profile_name, profile_info in info_cache.items():
            display_names[profile_name] = profile_info.get("name", profile_name)
    except Exception:
        return display_names
    return display_names


def scan_system_profiles():
    user_data_dir = Path(os.environ.get("LOCALAPPDATA", "")) / "Google" / "Chrome" / "User Data"
    if not user_data_dir.exists():
        return []

    display_names = read_local_state_names(user_data_dir)
    results = []
    for profile_dir in sorted(user_data_dir.iterdir(), key=lambda item: item.name.lower()):
        if not profile_dir.is_dir():
            continue
        if profile_dir.name != "Default" and not profile_dir.name.startswith("Profile "):
            continue
        cookie_path = get_cookie_path(profile_dir)
        if not cookie_path:
            continue
        try:
            rows = query_cookie_rows(cookie_path)
        except Exception:
            continue
        groups = build_groups(rows)
        if not groups:
            continue
        display_name = display_names.get(profile_dir.name, profile_dir.name)
        results.append({
            "source": {
                "type": "chrome_profile",
                "profileName": profile_dir.name,
                "displayName": display_name,
                "userDataDir": str(user_data_dir),
                "label": f"系统 Chrome · {display_name}",
            },
            "groups": groups,
        })
    return results


def scan_self_built(root_dir: str):
    if not root_dir:
        return []
    base_dir = Path(root_dir)
    if not base_dir.exists():
        return []

    results = []
    seen = set()
    for candidate in sorted(base_dir.rglob("chrome_user_data_port_*"), key=lambda item: item.name.lower()):
        if not candidate.is_dir():
            continue
        resolved = str(candidate.resolve())
        if resolved in seen:
            continue
        seen.add(resolved)
        cookie_path = get_cookie_path(candidate)
        if not cookie_path:
            continue
        try:
            rows = query_cookie_rows(cookie_path)
        except Exception:
            continue
        groups = build_groups(rows)
        if not groups:
            continue
        port = candidate.name.replace("chrome_user_data_port_", "")
        label = f"自建浏览器 · 端口 {port}" if port.isdigit() else f"自建浏览器 · {candidate.name}"
        results.append({
            "source": {
                "type": "self_built",
                "name": candidate.name,
                "port": int(port) if port.isdigit() else 0,
                "userDataDir": str(candidate),
                "label": label,
            },
            "groups": groups,
        })
    return results


def flatten_scan_results(scan_results):
    candidates = []
    for result in scan_results:
        source = result.get("source", {})
        for group in result.get("groups", []):
            candidates.append({
                "domain": group.get("domain", ""),
                "openUrl": group.get("openUrl", ""),
                "cookieCount": group.get("cookieCount", 0),
                "cookieNames": group.get("cookieNames", []),
                "cookies": group.get("cookies", []),
                "browserSource": source,
            })
    return candidates


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--scope", choices=["all", "chrome", "self_built"], default="all")
    parser.add_argument("--self-built-root", default="")
    args = parser.parse_args()

    scan_results = []
    if args.scope in ("all", "chrome"):
        scan_results.extend(scan_system_profiles())
    if args.scope in ("all", "self_built"):
        scan_results.extend(scan_self_built(args.self_built_root))

    print(json.dumps({
        "ok": True,
        "results": scan_results,
        "candidates": flatten_scan_results(scan_results),
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
