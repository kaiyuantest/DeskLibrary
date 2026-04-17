import argparse
import json
import os
import sys
from pathlib import Path


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
    return importer, data_module


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
    import requests
    try:
        r = requests.get(f"{api_url}/health", timeout=3)
        if r.status_code == 200:
            return True
    except Exception:
        return False
    return False


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


def scan_all_browsers(project_path: str, cfg: dict):
    setup_external_project(project_path)
    import browser
    return browser.scan_all_browsers(cfg or {})


def list_offline_sources(project_path: str, cfg: dict):
    importer, _ = load_modules(project_path)
    chrome_profiles = [
        {
            "type": "chrome_profile",
            "id": name,
            "label": f"{display}  [{mod}]",
            "profile_name": name,
            "display_name": display,
            "updated_at": mod,
        }
        for name, display, mod in importer.list_profiles()
    ]

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
    api_url = cfg.get("bit_api_url", "http://127.0.0.1:54345")
    token = cfg.get("bit_api_token", "")
    if bit_check_health(api_url, token):
      open_ports = bit_get_open_ports(api_url, token)
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
    return {
        "chrome_profiles": chrome_profiles,
        "self_built": self_built,
        "bitbrowser": bitbrowser,
    }


def load_offline_groups(project_path: str, cfg: dict, source_type: str, source_id: str, filter_auth: bool, merge_domain: bool):
    importer, _ = load_modules(project_path)

    if source_type == "chrome_profile":
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
    cards = []
    for group in domains:
        domain = group.get("domain", "")
        username = ""
        password = ""
        try:
            if source_type == "chrome_profile":
                username, password = importer.get_login_for_domain(domain, "chrome_profile", profile_name=source_id)
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
    browser, _, _ = load_modules(project_path)
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


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("command")
    parser.add_argument("--project-path", default=DEFAULT_PROJECT_PATH)
    parser.add_argument("--cfg-json", default="{}")
    parser.add_argument("--source-type", default="")
    parser.add_argument("--source-id", default="")
    parser.add_argument("--filter-auth", action="store_true")
    parser.add_argument("--merge-domain", action="store_true")
    parser.add_argument("--domains-json", default="[]")
    parser.add_argument("--card-json", default="{}")
    args = parser.parse_args()

    cfg = parse_json_arg(args.cfg_json)

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
                json.loads(args.domains_json or "[]"),
            ),
        }
    elif args.command == "default-open":
        payload = default_open(args.project_path, cfg, parse_json_arg(args.card_json))
    else:
        raise ValueError(f"未知命令: {args.command}")

    print(json.dumps(payload, ensure_ascii=False))


if __name__ == "__main__":
    main()
