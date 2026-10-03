from datetime import datetime, timedelta, timezone

import httpx
import pytest

from app.dex.market_price import MarketPriceService, MarketPriceUnavailable


def test_market_price_uses_recent_coinbase_ticker_and_caches_it(client):
    calls = 0

    def ticker(_request):
        nonlocal calls
        calls += 1
        return httpx.Response(200, json={
            "price": "120.70",
            "time": datetime.now(timezone.utc).isoformat(),
        })

    client.app.state.market_price = MarketPriceService(httpx.Client(transport=httpx.MockTransport(ticker)))
    first = client.get("/dex/market-price")
    second = client.get("/dex/market-price")
    assert first.status_code == second.status_code == 200
    assert first.json()["price"] == "120.70"
    assert first.json()["source"] == "Coinbase Exchange"
    assert first.json() == second.json()
    assert calls == 1


def test_market_price_rejects_stale_or_invalid_ticker(client):
    def stale(_request):
        return httpx.Response(200, json={
            "price": "120.70",
            "time": (datetime.now(timezone.utc) - timedelta(minutes=3)).isoformat(),
        })

    client.app.state.market_price = MarketPriceService(httpx.Client(transport=httpx.MockTransport(stale)))
    response = client.get("/dex/market-price")
    assert response.status_code == 503
    assert "Chưa lấy được giá" in response.json()["detail"]

    def invalid(_request):
        return httpx.Response(200, json={"price": "0", "time": datetime.now(timezone.utc).isoformat()})

    service = MarketPriceService(httpx.Client(transport=httpx.MockTransport(invalid)))
    with pytest.raises(MarketPriceUnavailable):
        service.sol_usd()
