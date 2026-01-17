"""
FastAPI Application - Main entry point
Live Protest Finder RESTful API
"""

from fastapi import FastAPI, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Optional
from uuid import UUID
import os
import logging

from models.database import DatabaseManager
from models.stream import Platform
from models.channel import Channel
from .routes import feed, channels, user, submit, health

# Logging configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Live Protest Finder API",
    description="Multi-platform live stream aggregation engine for real-time civil documentation",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
cors_origins = os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(',')

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database instance (initialized on startup)
db: Optional[DatabaseManager] = None


@app.on_event("startup")
async def startup_event():
    """Initialize database connection on startup."""
    global db
    database_url = os.getenv('DATABASE_URL')

    if not database_url:
        raise RuntimeError("DATABASE_URL environment variable not set")

    db = DatabaseManager(database_url)
    await db.connect()

    logger.info("API server started successfully")


@app.on_event("shutdown")
async def shutdown_event():
    """Close database connection on shutdown."""
    global db
    if db:
        await db.disconnect()

    logger.info("API server shut down")


# Include routers
app.include_router(feed.router, prefix="/api/v1/feed", tags=["Feed"])
app.include_router(channels.router, prefix="/api/v1/channels", tags=["Channels"])
app.include_router(user.router, prefix="/api/v1/user", tags=["User"])
app.include_router(submit.router, prefix="/api/v1", tags=["Submit"])
app.include_router(health.router, tags=["Health"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "Live Protest Finder API",
        "version": "1.0.0",
        "status": "operational",
        "docs": "/docs"
    }


# Error handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={"error": "Resource not found"}
    )


@app.exception_handler(500)
async def internal_error_handler(request, exc):
    logger.error(f"Internal server error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error"}
    )
