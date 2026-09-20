"""spec 006 — Sentry SDK 初始化(后端)

云版优先(sentry.io 免费层 5K 错误/月)
"""
import logging
from typing import Any

log = logging.getLogger(__name__)

_initialized = False


def init_sentry() -> None:
    """启动时调用,初始化 Sentry SDK(幂等)"""
    global _initialized
    if _initialized:
        return

    import os

    dsn = os.environ.get("SENTRY_DSN", "")
    if not dsn:
        log.info("sentry.disabled", extra={"reason": "SENTRY_DSN not set"})
        return

    try:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        from sentry_sdk.integrations.logging import LoggingIntegration

        sentry_sdk.init(
            dsn=dsn,
            environment=os.environ.get("SENTRY_ENV", "production"),
            release=os.environ.get("SENTRY_RELEASE"),
            traces_sample_rate=0.1,
            integrations=[
                FastApiIntegration(),
                LoggingIntegration(level=logging.INFO, event_level=logging.ERROR),
            ],
            before_send=_scrub_pii,
        )
        _initialized = True
        log.info("sentry.initialized")
    except ImportError:
        log.warning("sentry.disabled", extra={"reason": "sentry-sdk not installed"})
    except Exception as e:
        log.warning("sentry.init_failed", extra={"error": str(e)})


def _scrub_pii(event: dict[str, Any], hint: Any) -> dict[str, Any] | None:
    """去除 PII(邮箱/密码/IP 原始值)"""
    if "user" in event and event["user"]:
        user = event["user"]
        # 仅保留 user_id_hash,去除 email / username / ip_address
        if "email" in user:
            del user["email"]
        if "username" in user:
            del user["username"]
        if "ip_address" in user:
            del user["ip_address"]
    return event


def capture_exception(error: Exception, **kwargs: Any) -> None:
    """便捷上报异常(失败静默)"""
    if not _initialized:
        return
    try:
        import sentry_sdk
        sentry_sdk.capture_exception(error, **kwargs)
    except Exception:
        pass