"""Single-origin Devnet app: serve the built game and its API from one process."""

from pathlib import Path

from fastapi.staticfiles import StaticFiles
from starlette.applications import Starlette
from starlette.routing import Mount

from app.main import app as api_app


FRONTEND_DIST = Path(__file__).resolve().parents[2] / "frontend" / "dist"


class AppStaticFiles(StaticFiles):
    async def get_response(self, path: str, scope):
        response = await super().get_response(path, scope)
        normalized_path = path.replace("\\", "/").lstrip("./")
        if normalized_path in {"", ".", "index.html"}:
            response.headers["Cache-Control"] = "no-store, must-revalidate"
        elif normalized_path.startswith("assets/") and response.status_code == 200:
            response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
        return response


def create_hosted_app(frontend_dist: Path = FRONTEND_DIST, backend=api_app) -> Starlette:
    return Starlette(routes=[
        Mount("/api", app=backend),
        Mount("/", app=AppStaticFiles(directory=frontend_dist, html=True, check_dir=False)),
    ])


app = create_hosted_app()
