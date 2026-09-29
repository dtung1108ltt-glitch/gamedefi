from fastapi.testclient import TestClient
from starlette.applications import Starlette

from app.hosted import create_hosted_app


def test_hosted_html_is_fresh_and_versioned_assets_are_immutable(tmp_path):
    (tmp_path / "index.html").write_text('<div id="root"></div>', encoding="utf-8")
    assets = tmp_path / "assets"
    assets.mkdir()
    (assets / "index-abc123.js").write_text("export const ready = true;", encoding="utf-8")

    with TestClient(create_hosted_app(tmp_path, Starlette())) as client:
        page = client.get("/")
        asset = client.get("/assets/index-abc123.js")

    assert page.status_code == 200
    assert page.headers["cache-control"] == "no-store, must-revalidate"
    assert asset.status_code == 200
    assert asset.headers["cache-control"] == "public, max-age=31536000, immutable"
