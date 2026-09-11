import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.config import settings
from app.database import engine, Base
from app.api.endpoints import router as api_router

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="RenewGuard AI - Predictive Maintenance Platform for Solar & Wind Assets (HackOut'26)"
)

# Enable CORS for frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# System status route
@app.get("/api/info")
def get_system_info():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "operational",
        "docs_url": "/docs"
    }

# API routes
app.include_router(api_router, prefix=settings.API_V1_STR)

# Serve built frontend if dist exists
dist_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))

if os.path.exists(dist_dir):
    app.mount("/assets", StaticFiles(directory=os.path.join(dist_dir, "assets")), name="static_assets")

    @app.get("/")
    async def serve_index():
        index_file = os.path.join(dist_dir, "index.html")
        return FileResponse(index_file)

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        if full_path in ["docs", "redoc", "openapi.json"] or full_path.startswith("api"):
            return None
        index_file = os.path.join(dist_dir, "index.html")
        return FileResponse(index_file)
else:
    @app.get("/")
    def root():
        return get_system_info()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
