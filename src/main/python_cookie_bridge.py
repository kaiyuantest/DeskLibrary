import argparse
import json
import os
import shutil
import sqlite3
import sys
import tempfile
from pathlib import Path
from datetime import datetime


DEFAULT_PROJECT_PATH = r"E:\project\多账号管理项目\cookie_manager\cookie_manager (3)\cookie_manager\cookie_manager_v5\cookie_manager"


def setup_external_project(project_path: str):
    target = Path(project_path or DEFAULT_PROJECT_PATH)
    if not target.exists():
        raise FileNotFoundError(f"未找到 Python Cookie 项目目录: {target}")
    if str(target) not in sys.path:
        sys.path.insert(0, str(target))
    return target


def load_modules(project_path: str):
    setup_external_project(project_path)
    import importer
    import data as data_module
    install_importer_patch(importer)
    return importer, data_module


def load_browser_module(project_path: str):
    setup_external_project(project_path)
    import browser
    return browser


def _decode_maybe_text(value, default: str = "") -> str:
    if value is None:
        return default
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="replace")
    if isinstance(value, memoryview):
        return bytes(value).decode("utf-8", errors="replace")
    return str(value)


def _safe_query_cookie_rows(importer, conn: sqlite3.Connection):
    columns = importer._cookie_table_columns(conn)
    wanted = {
        "name": "name",
        "value": "value",
        "encrypted_value": "encrypted_value",
        "host_key": "host_key",
        "path": "path",
        "is_secure": "is_secure",
        "is_httponly": "is_httponly",
        "expires_utc": "expires_utc",
        "samesite": "samesite",
        "source_scheme": "source_scheme",
        "source_port": "source_port",
        "is_partitioned": "is_partitioned",
        "top_frame_site_key": "top_frame_site_key",
        "has_cross_site_ancestor": "has_cross_site_ancestor",
    }
    select_parts = []
    aliases = []
    for alias, col in wanted.items():
        aliases.append(alias)
        if col not in columns:
            select_parts.append(f"NULL AS {alias}")
        elif alias == "encrypted_value":
            select_parts.append(f"CAST({col} AS BLOB) AS {alias}")
        else:
            select_parts.append(col)
    sql = "SELECT " + ", ".join(select_parts) + " FROM cookies"
    rows = conn.execute(sql).fetchall()
    return [dict(zip(aliases, row)) for row in rows]


def _safe_read_cookie_db(importer, cookie_file: Path, master_key: bytes, domain_filter: str = "") -> list:
    results = []
    rows = None

    def _read_from_conn(conn: sqlite3.Connection):
        return _safe_query_cookie_rows(importer, conn)

    try:
        conn = sqlite3.connect(
            f"file:{cookie_file.as_posix()}?mode=ro",
            uri=True,
            detect_types=sqlite3.PARSE_DECLTYPES,
        )
        try:
            rows = _read_from_conn(conn)
        finally:
            conn.close()
    except Exception:
        rows = None

    if rows is None:
        tmp = Path(tempfile.mkdtemp(prefix="click2save-cookie-")) / "Cookies"
        try:
            shutil.copy2(cookie_file, tmp)
            conn = sqlite3.connect(str(tmp), detect_types=sqlite3.PARSE_DECLTYPES)
            try:
                rows = _read_from_conn(conn)
            finally:
                conn.close()
        except Exception as exc:
            shutil.rmtree(tmp.parent, ignore_errors=True)
            raise RuntimeError(f"读取Cookie数据库失败：{exc}\n当前系统Chrome正在占用Cookie库，无法直接复制读取")
        shutil.rmtree(tmp.parent, ignore_errors=True)

    for row in rows:
        domain = _decode_maybe_text(row.get("host_key"), "")
        if domain_filter and domain_filter not in domain:
            continue

        raw = row.get("encrypted_value")
        if isinstance(raw, memoryview):
            enc = bytes(raw)
        elif isinstance(raw, bytes):
            enc = raw
        else:
            enc = b""

        if enc:
            value = importer._decrypt_value(master_key, enc) if master_key else enc.decode("utf-8", errors="replace")
        else:
            value = _decode_maybe_text(row.get("value"), "")

        expiry = importer.webkit_to_unix(row.get("expires_utc") or 0)
        cookie = {
            "name": _decode_maybe_text(row.get("name"), ""),
            "value": value,
            "domain": domain,
            "path": _decode_maybe_text(row.get("path"), "/") or "/",
            "secure": bool(row.get("is_secure", False)),
            "httpOnly": bool(row.get("is_httponly", False)),
        }
        if expiry is not None:
            cookie["expiry"] = expiry
        same_site = importer._chrome_samesite_to_text(row.get("samesite"))
        if same_site:
            cookie["sameSite"] = same_site
        source_scheme = row.get("source_scheme")
        if source_scheme is not None:
            try:
                cookie["sourceScheme"] = int(source_scheme)
            except Exception:
                pass
        source_port = row.get("source_port")
        if source_port is not None:
            try:
                cookie["sourcePort"] = int(source_port)
            except Exception:
                pass
        is_partitioned = row.get("is_partitioned")
        if is_partitioned is not None:
            cookie["isPartitioned"] = bool(is_partitioned)
        top_frame_site_key = _decode_maybe_text(row.get("top_frame_site_key"), "")
        if top_frame_site_key:
            cookie["topFrameSiteKey"] = top_frame_site_key
        has_cross_site_ancestor = row.get("has_cross_site_ancestor")
        if has_cross_site_ancestor is not None:
            cookie["hasCrossSiteAncestor"] = bool(has_cross_site_ancestor)
        results.append(cookie)

    return results


def install_importer_patch(importer):
    if getattr(importer, "_click2save_cookie_patch_installed", False):
        return importer
    importer._read_cookie_db = lambda cookie_file, master_key, domain_filter="": _safe_read_cookie_db(
        importer, cookie_file, master_key, domain_filter
    )
    importer._click2save_cookie_patch_installed = True
    return importer


SKIP_DOMAIN_SUFFIXES = [
    ".doubleclick.net", ".googlesyndication.com", ".google-analytics.com",
    ".facebook.com", ".twitter.com", ".analytics.", ".cloudflare.com",
    ".jsdelivr.net", ".unpkg.com", ".cdnjs.cloudflare.com",
]

AUTH_COOKIE_NAMES = [
    "session", "sess", "token", "auth", "login", "uid", "user",
    "account", "passport", "ticket", "sid", "csrf", "remember",
    "access", "refresh", "jwt", "bearer", "credential", "identity",
    "logged", "member", "customer", "visitor_id", "openid", "unionid",
    "_ga", "PHPSESSID", "JSESSIONID", "ASP.NET_SessionId", "laravel_session",
    "django", "wordpress", "wp-", "__utma", "connect.sid",
]


def is_auth_cookie(cookie: dict) -> bool:
    domain = str(cookie.get("domain", "")).lower()
    for suffix in SKIP_DOMAIN_SUFFIXES:
        if domain.endswith(suffix):
            return False
    name = str(cookie.get("name", "")).lower()
    if cookie.get("httpOnly"):
        return True
    if any(keyword in name for keyword in AUTH_COOKIE_NAMES):
        return True
    expiry = cookie.get("expiry") or cookie.get("expires")
    try:
        return float(expiry or 0) > 0
    except Exception:
        return False


def filter_auth_cookies(cookies: list) -> list:
    return [item for item in cookies if is_auth_cookie(item)]


def group_cookies_by_root_domain(cookies: list) -> dict:
    grouped = {}
    for cookie in cookies:
        domain = str(cookie.get("domain", "")).lstrip(".")
        parts = domain.split(".")
        root = "." + ".".join(parts[-2:]) if len(parts) >= 2 else ("." + domain if domain else "")
        grouped.setdefault(root, []).append(cookie)
    return grouped


def bit_check_health(api_url, token="") -> bool:
    return bit_check_health_message(api_url, token) == ""


def bit_check_health_message(api_url, token="") -> str:
    import requests
    headers = {"Content-Type": "application/json"}
    if token:
        headers["x-api-key"] = token
    try:
        resp = requests.post(f"{api_url}/browser/list", headers=headers, json={"page": 0, "pageSize": 1}, timeout=5)
        if resp.status_code == 200:
            payload = resp.json()
            if payload.get("success"):
                return ""
            return payload.get("msg", "比特浏览器 API 返回失败")
        return f"HTTP {resp.status_code}"
    except Exception as exc:
        return str(exc)


def bit_get_browsers(api_url, token="") -> list:
    import requests
    headers = {"Content-Type": "application/json"}
    if token:
        headers["x-api-key"] = token
    try:
        resp = requests.post(f"{api_url}/browser/list", headers=headers, json={"page": 0, "pageSize": 200}, timeout=10).json()
        if resp.get("success"):
            return resp.get("data", {}).get("list", [])
    except Exception:
        return []
    return []


def bit_get_open_ports(api_url, token="") -> dict:
    import requests
    headers = {"Content-Type": "application/json"}
    if token:
        headers["x-api-key"] = token
    try:
        resp = requests.post(f"{api_url}/browser/ports", headers=headers, json={}, timeout=5).json()
        if resp.get("success"):
            return resp.get("data", {})
    except Exception:
        return {}
    return {}


def bit_get_cookies(api_url, browser_id, token="") -> list:
    import requests
    headers = {"Content-Type": "application/json"}
    if token:
        headers["x-api-key"] = token
    try:
        resp = requests.post(f"{api_url}/browser/cookies/get", headers=headers, json={"id": browser_id}, timeout=10).json()
        if resp.get("success"):
            raw = resp.get("data", {})
            if isinstance(raw, list):
                return raw
            if isinstance(raw, dict):
                return raw.get("cookies", []) or raw.get("list", [])
    except Exception:
        return []
    return []


def parse_json_arg(value: str):
    if not value:
        return {}
    return json.loads(value)


def parse_json_input(value: str = "", file_path: str = "", default=None):
    if file_path:
        with open(file_path, "r", encoding="utf-8") as fh:
            return json.load(fh)
    if value:
        return json.loads(value)
    return {} if default is None else default


def scan_all_browsers(project_path: str, cfg: dict):
    setup_external_project(project_path)
    import browser
    return browser.scan_all_browsers(cfg or {})


def list_offline_sources(project_path: str, cfg: dict):
    importer, _ = load_modules(project_path)
    chrome_profiles = []
    listed_profiles = importer.list_profiles()
    if listed_profiles:
        chrome_profiles = [
            {
                "type": "chrome_profile",
                "id": f"{str(importer.get_chrome_user_data_dir())}::{name}",
                "label": f"{display}  [{mod}]",
                "profile_name": name,
                "display_name": display,
                "updated_at": mod,
                "user_data_dir": str(importer.get_chrome_user_data_dir()),
            }
            for name, display, mod in listed_profiles
        ]
    else:
        for user_data_dir in find_chrome_user_data_dirs():
            chrome_profiles.extend(scan_chrome_profiles_from_dir(user_data_dir))

    self_built = [
        {
            "type": "self_built",
            "id": path_str,
            "label": display,
            "user_data_dir": path_str,
            "port": port,
        }
        for path_str, display, port in importer.list_self_built_profiles()
    ]

    bitbrowser = []
    bitbrowser_error = ""
    api_url = cfg.get("bit_api_url", "http://127.0.0.1:54345")
    token = cfg.get("bit_api_token", "")
    open_ports = bit_get_open_ports(api_url, token)
    bitbrowser = []
    for item in bit_get_browsers(api_url, token):
        bid = item.get("id", "")
        name = item.get("name", bid)
        seq = item.get("seq", "")
        label = f"[{seq}] {name}" if seq else name
        bitbrowser.append({
            "type": "bitbrowser_api",
            "id": bid,
            "label": label,
            "browser_id": bid,
            "is_open": bid in open_ports,
            "port": int(open_ports[bid]) if bid in open_ports else 0,
        })
    if not bitbrowser:
        bitbrowser_error = bit_check_health_message(api_url, token)
    return {
        "chrome_profiles": chrome_profiles,
        "self_built": self_built,
        "bitbrowser": bitbrowser,
        "bitbrowser_error": bitbrowser_error,
    }


def find_chrome_user_data_dirs():
    candidates = [
        Path(os.environ.get("LOCALAPPDATA", "")) / "Google" / "Chrome" / "User Data",
        Path.home() / "AppData" / "Local" / "Google" / "Chrome" / "User Data",
        Path("C:/Users") / os.environ.get("USERNAME", "") / "AppData" / "Local" / "Google" / "Chrome" / "User Data",
    ]
    results = []
    seen = set()
    for candidate in candidates:
        key = str(candidate)
        if key in seen:
            continue
        seen.add(key)
        if candidate.exists():
            results.append(candidate)
    return results


def get_cookie_path(profile_dir: Path):
    for candidate in [
        profile_dir / "Network" / "Cookies",
        profile_dir / "Cookies",
        profile_dir / "Default" / "Network" / "Cookies",
        profile_dir / "Default" / "Cookies",
    ]:
        if candidate.exists():
            return candidate
    return None


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


def scan_chrome_profiles_from_dir(user_data_dir: Path):
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
            mod = datetime.fromtimestamp(cookie_path.stat().st_mtime).strftime("%Y-%m-%d %H:%M")
        except Exception:
            mod = "未知"
        display = display_names.get(profile_dir.name, profile_dir.name)
        results.append({
            "type": "chrome_profile",
            "id": f"{str(user_data_dir)}::{profile_dir.name}",
            "label": f"{display}  [{mod}]",
            "profile_name": profile_dir.name,
            "display_name": display,
            "updated_at": mod,
            "user_data_dir": str(user_data_dir),
        })
    return results


def load_offline_groups(project_path: str, cfg: dict, source_type: str, source_id: str, filter_auth: bool, merge_domain: bool):
    importer, _ = load_modules(project_path)

    if source_type == "chrome_profile":
        if "::" in source_id:
            user_data_dir, profile_name = source_id.split("::", 1)
            cookie_file = get_cookie_path(Path(user_data_dir) / profile_name)
            if not cookie_file:
                raise FileNotFoundError(f"找不到 Profile {profile_name} 的 Cookie 文件")
            master_key = importer._get_master_key(Path(user_data_dir))
            all_cookies = importer._read_cookie_db(cookie_file, master_key)
        else:
            all_cookies = importer.import_cookies_auto("chrome_profile", profile_name=source_id)
    elif source_type == "self_built":
        all_cookies = importer.import_cookies_auto("self_built", user_data_dir=source_id)
    elif source_type == "bitbrowser_api":
        api_url = cfg.get("bit_api_url", "http://127.0.0.1:54345")
        token = cfg.get("bit_api_token", "")
        all_cookies = bit_get_cookies(api_url, source_id, token)
    else:
        raise ValueError(f"未知来源类型: {source_type}")

    if filter_auth:
        all_cookies = filter_auth_cookies(all_cookies)

    if merge_domain:
        grouped = group_cookies_by_root_domain(all_cookies)
    else:
        grouped = {}
        for cookie in all_cookies:
            domain = cookie.get("domain", "unknown")
            grouped.setdefault(domain, []).append(cookie)

    groups = []
    for domain, cookies in sorted(grouped.items(), key=lambda item: (-len(item[1]), item[0])):
        auth_count = len(filter_auth_cookies(cookies))
        groups.append({
            "domain": domain,
            "name": domain.lstrip(".") or domain,
            "cookies": cookies,
            "cookieCount": len(cookies),
            "authCount": auth_count,
            "openUrl": f"https://{domain.lstrip('.')}",
        })
    return groups


def build_browser_source(project_path: str, source_type: str, source_id: str, cfg: dict):
    importer, _ = load_modules(project_path)
    if source_type == "chrome_profile":
        if "::" in source_id:
            user_data_dir, profile_name = source_id.split("::", 1)
            udd = Path(user_data_dir)
            display = importer._get_profile_display_name(udd, profile_name)
            source_id = profile_name
        else:
            udd = importer.get_chrome_user_data_dir()
            display = importer._get_profile_display_name(udd, source_id)
        return {
            "type": "chrome_profile",
            "profile_name": source_id,
            "display_name": display,
            "user_data_dir": str(udd),
            "label": f"系统 Chrome · {display}",
        }
    if source_type == "self_built":
        path_obj = Path(source_id)
        try:
            port = int(path_obj.name.replace("chrome_user_data_port_", ""))
        except Exception:
            port = 0
        return {
            "type": "self_built",
            "port": port,
            "user_data_dir": source_id,
            "name": f"端口{port}" if port else path_obj.name,
            "label": f"自建浏览器 · {path_obj.name}",
        }
    if source_type == "bitbrowser_api":
        api_url = cfg.get("bit_api_url", "http://127.0.0.1:54345")
        token = cfg.get("bit_api_token", "")
        for item in bit_get_browsers(api_url, token):
            if item.get("id") == source_id:
                name = item.get("name", source_id)
                return {
                    "type": "bitbrowser",
                    "browser_id": source_id,
                    "name": name,
                    "label": f"比特浏览器 · {name}",
                }
        return {
            "type": "bitbrowser",
            "browser_id": source_id,
            "name": source_id,
            "label": f"比特浏览器 · {source_id}",
        }
    raise ValueError(f"未知来源类型: {source_type}")


def build_import_cards(project_path: str, cfg: dict, source_type: str, source_id: str, domains: list):
    importer, data_module = load_modules(project_path)
    browser_source = build_browser_source(project_path, source_type, source_id, cfg)
    profile_source_id = source_id.split("::", 1)[1] if source_type == "chrome_profile" and "::" in source_id else source_id
    cards = []
    for group in domains:
        domain = group.get("domain", "")
        username = ""
        password = ""
        try:
            if source_type == "chrome_profile":
                username, password = importer.get_login_for_domain(domain, "chrome_profile", profile_name=profile_source_id)
            elif source_type == "self_built":
                username, password = importer.get_login_for_domain(domain, "self_built", user_data_dir=source_id)
        except Exception:
            pass

        cards.append({
            "id": data_module.make_card_id(),
            "name": group.get("name", domain.lstrip(".")),
            "url": f"https://{domain.lstrip('.')}",
            "open_url": group.get("openUrl") or f"https://{domain.lstrip('.')}",
            "domain": domain,
            "cookies": group.get("cookies", []),
            "source": "offline_import",
            "saved_at": data_module.now_str(),
            "remark": "",
            "username": username,
            "password": password,
            "last_used_at": "",
            "last_used_method": "",
            "browser_source": browser_source,
        })
    return cards


def default_open(project_path: str, cfg: dict, card: dict):
    browser = load_browser_module(project_path)
    source = card.get("browser_source") or {}
    src_type = source.get("type", "")
    url = card.get("open_url") or card.get("url") or ""
    cookies = card.get("cookies", [])

    if src_type == "chrome_profile":
        ok = browser.open_url_with_system_chrome(url, source.get("profile_name", ""))
        return {"ok": ok, "message": "已用系统 Chrome 打开" if ok else "未找到系统 Chrome"}

    if src_type == "self_built":
        port = int(source.get("port", 0))
        user_data_dir = source.get("user_data_dir", "")
        err = browser.launch_self_built_browser(port, user_data_dir, "")
        if err:
            return {"ok": False, "message": err}
        ok, detail = browser.inject_cookies(port, url, cookies)
        return {"ok": ok, "message": detail if ok else f"注入失败: {detail}"}

    if src_type == "bitbrowser":
        api_url = cfg.get("bit_api_url", "http://127.0.0.1:54345")
        token = cfg.get("bit_api_token", "")
        browser_id = source.get("browser_id", "")
        result = browser.bit_open_browser(api_url, browser_id, token)
        if not result:
            return {"ok": False, "message": "打开比特浏览器失败"}
        port = int(result.get("port", 0))
        ok, detail = browser.inject_cookies(port, url, cookies)
        return {"ok": ok, "message": detail if ok else f"注入失败: {detail}"}

    return {"ok": False, "message": f"未知来源类型: {src_type}"}


def inject_open(project_path: str, cfg: dict, card: dict):
    browser = load_browser_module(project_path)
    source = card.get("browser_source") or {}
    src_type = source.get("type", "")
    url = card.get("open_url") or card.get("url") or ""
    cookies = card.get("cookies", [])

    if src_type == "chrome_profile":
        profile_name = source.get("profile_name", "")
        user_data_dir = source.get("user_data_dir", "")
        cookie_file = get_cookie_path(Path(user_data_dir) / profile_name) if user_data_dir and profile_name else None
        if not cookie_file:
            return {"ok": False, "message": "未找到系统 Chrome Cookie 数据库"}
        count, detail = browser.db_write_cookies(str(cookie_file), cookies, user_data_dir)
        if not count:
            return {"ok": False, "message": detail or "Cookie 写入失败"}
        opened = browser.open_url_with_system_chrome(url, profile_name)
        return {
            "ok": True,
            "message": f"Cookie 已转移 {count} 条" + ("，并已打开系统 Chrome" if opened else "，但未能自动打开系统 Chrome"),
        }

    if src_type == "self_built":
        port = int(source.get("port", 0))
        user_data_dir = source.get("user_data_dir", "")
        err = browser.launch_self_built_browser(port, user_data_dir, "")
        if err:
            return {"ok": False, "message": err}
        ok, detail = browser.inject_cookies(port, url, cookies)
        return {"ok": ok, "message": detail if ok else f"注入失败: {detail}"}

    if src_type == "bitbrowser":
        api_url = cfg.get("bit_api_url", "http://127.0.0.1:54345")
        token = cfg.get("bit_api_token", "")
        browser_id = source.get("browser_id", "")
        result = browser.bit_open_browser(api_url, browser_id, token)
        if not result:
            return {"ok": False, "message": "打开比特浏览器失败"}
        port = int(result.get("port", 0))
        ok, detail = browser.inject_cookies(port, url, cookies)
        return {"ok": ok, "message": detail if ok else f"注入失败: {detail}"}

    return {"ok": False, "message": f"未知来源类型: {src_type}"}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("command")
    parser.add_argument("--project-path", default=DEFAULT_PROJECT_PATH)
    parser.add_argument("--cfg-json", default="{}")
    parser.add_argument("--cfg-file", default="")
    parser.add_argument("--source-type", default="")
    parser.add_argument("--source-id", default="")
    parser.add_argument("--filter-auth", action="store_true")
    parser.add_argument("--merge-domain", action="store_true")
    parser.add_argument("--domains-json", default="[]")
    parser.add_argument("--domains-file", default="")
    parser.add_argument("--card-json", default="{}")
    parser.add_argument("--card-file", default="")
    args = parser.parse_args()

    cfg = parse_json_input(args.cfg_json, args.cfg_file, {})

    if args.command == "scan-all-browsers":
        payload = {"ok": True, "results": scan_all_browsers(args.project_path, cfg)}
    elif args.command == "list-offline-sources":
        payload = {"ok": True, "results": list_offline_sources(args.project_path, cfg)}
    elif args.command == "load-offline-groups":
        payload = {
            "ok": True,
            "results": load_offline_groups(
                args.project_path,
                cfg,
                args.source_type,
                args.source_id,
                args.filter_auth,
                args.merge_domain,
            ),
        }
    elif args.command == "build-import-cards":
        payload = {
            "ok": True,
            "results": build_import_cards(
                args.project_path,
                cfg,
                args.source_type,
                args.source_id,
                parse_json_input(args.domains_json, args.domains_file, []),
            ),
        }
    elif args.command == "default-open":
        payload = default_open(args.project_path, cfg, parse_json_input(args.card_json, args.card_file, {}))
    elif args.command == "inject-open":
        payload = inject_open(args.project_path, cfg, parse_json_input(args.card_json, args.card_file, {}))
    else:
        raise ValueError(f"未知命令: {args.command}")

    print(json.dumps(payload, ensure_ascii=False))


if __name__ == "__main__":
    main()
