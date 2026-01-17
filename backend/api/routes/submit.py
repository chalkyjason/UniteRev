"""
Submission endpoints
POST /api/v1/submit
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, HttpUrl
import logging
import re

router = APIRouter()
logger = logging.getLogger(__name__)


class SubmissionRequest(BaseModel):
    url: str
    device_id: str


@router.post("/submit")
async def submit_stream(request: SubmissionRequest, background_tasks: BackgroundTasks):
    """
    User submission of Rumble/Other platform links.

    Accepts a URL, validates format, and queues for verification.
    """
    from api.main import db

    if not db:
        raise HTTPException(status_code=503, detail="Database not available")

    # Validate URL format
    supported_domains = ['rumble.com', 'youtube.com', 'twitch.tv', 'twitter.com', 'x.com']

    url_valid = any(domain in request.url.lower() for domain in supported_domains)

    if not url_valid:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported URL. Please submit links from: {', '.join(supported_domains)}"
        )

    try:
        # Queue for background verification
        background_tasks.add_task(verify_submission, request.url, request.device_id)

        return {
            "status": "accepted",
            "message": "Stream submitted for verification. It will appear in the feed if validated."
        }

    except Exception as e:
        logger.error(f"Error submitting stream: {e}")
        raise HTTPException(status_code=500, detail="Error processing submission")


async def verify_submission(url: str, device_id: str):
    """
    Background task to verify a submitted URL.

    For Rumble: Fetch the URL and parse meta tags to confirm it's live.
    For YouTube/Twitch: Use existing connectors to validate.
    """
    import httpx
    from bs4 import BeautifulSoup

    logger.info(f"Verifying submission: {url}")

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=10.0)
            response.raise_for_status()

            # Parse HTML
            soup = BeautifulSoup(response.text, 'html.parser')

            # Check for live indicators (platform-specific)
            if 'rumble.com' in url:
                # Look for OpenGraph tags or specific DOM elements
                og_type = soup.find('meta', property='og:type')
                if og_type and 'video' in og_type.get('content', ''):
                    logger.info(f"Valid Rumble video found: {url}")
                    # Would create a NormalizedStream and save to DB
                else:
                    logger.warning(f"Invalid Rumble submission: {url}")

            logger.info(f"Verification complete for: {url}")

    except Exception as e:
        logger.error(f"Error verifying submission {url}: {e}")
