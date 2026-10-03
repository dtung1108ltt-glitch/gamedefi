from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from threading import Lock
from time import monotonic

import httpx


COINBASE_SOL_USD_TICKER = "https://api.exchange.coinbase.com/products/SOL-USD/ticker"


class MarketPriceUnavailable(Exception):
    pass


class MarketPriceService:
    """A short-lived SOL/USD reference price, separate from executable pool quotes."""

    def __init__(self, client: httpx.Client | None = None):
        self.client = client or httpx.Client(timeout=5.0)
        self._lock = Lock()
        self._cached: dict[str, str] | None = None
        self._cache_until = 0.0

    def sol_usd(self) -> dict[str, str]:
        with self._lock:
            if self._cached is not None and monotonic() < self._cache_until:
                return self._cached
            try:
                response = self.client.get(COINBASE_SOL_USD_TICKER)
                response.raise_for_status()
                ticker = response.json()
                price = Decimal(str(ticker["price"]))
                as_of = datetime.fromisoformat(str(ticker["time"]).replace("Z", "+00:00"))
                age = (datetime.now(timezone.utc) - as_of).total_seconds()
                if not price.is_finite() or price <= 0 or as_of.tzinfo is None or not -30 <= age <= 120:
                    raise ValueError("stale or invalid ticker")
            except (httpx.HTTPError, ValueError, TypeError, KeyError, InvalidOperation) as exc:
                raise MarketPriceUnavailable("Chưa lấy được giá SOL/USD mới từ thị trường.") from exc

            self._cached = {
                "base_symbol": "SOL",
                "quote_symbol": "USD",
                "price": str(price),
                "source": "Coinbase Exchange",
                "as_of": as_of.isoformat(),
            }
            self._cache_until = monotonic() + 15
            return self._cached
