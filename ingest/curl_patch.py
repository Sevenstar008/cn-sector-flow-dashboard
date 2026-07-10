"""Patch requests.get to fall back to curl when TLS handshake fails.

EastMoney's server (push2.eastmoney.com) intermittently rejects Python's
OpenSSL TLS connections while accepting curl's.  This module monkey-patches
``requests.get`` so that on connection failure it retries via the system
``curl`` binary, which uses a different TLS implementation.
"""
from __future__ import annotations

import json as _json
import subprocess
import urllib.parse

import requests
from requests.models import Response

_original_get = requests.get
_patched = False


class _CurlResponse:
    """Minimal stand-in for requests.Response backed by curl output."""

    def __init__(self, text: str, status_code: int = 200):
        self.text = text
        self.status_code = status_code
        self._json = _json.loads(text) if text else {}

    def json(self) -> dict:
        return self._json

    def raise_for_status(self) -> None:
        if self.status_code >= 400:
            raise requests.HTTPError(f"HTTP {self.status_code}")


def _curl_get(url: str, params: dict | None, headers: dict | None, timeout: float) -> _CurlResponse:
    full_url = url
    if params:
        full_url += "?" + urllib.parse.urlencode(params)

    cmd = ["curl", "-s", "-m", str(int(timeout))]
    if headers:
        for k, v in headers.items():
            cmd.extend(["-H", f"{k}: {v}"])
    cmd.append(full_url)

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout + 5)
    return _CurlResponse(result.stdout)


def _patched_get(url: str, **kwargs) -> Response | _CurlResponse:
    params = kwargs.get("params")
    headers = kwargs.get("headers") or {}
    timeout = kwargs.get("timeout", 30)

    try:
        return _original_get(url, **kwargs)
    except Exception:
        # Fall back to curl
        return _curl_get(url, params, headers, timeout)


def apply() -> None:
    """Monkey-patch requests.get with curl fallback."""
    global _patched
    if _patched:
        return
    requests.get = _patched_get  # type: ignore[assignment]
    # Also patch the module-level reference in akshare's fund_em module
    try:
        import akshare.stock.stock_fund_em as fund_em
        fund_em.requests.get = _patched_get  # type: ignore[assignment]
    except Exception:
        pass
    _patched = True
