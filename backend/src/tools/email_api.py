"""Gmail API integration tool for sending approved outreach emails.

This is Function B of the human-in-the-loop constraint:
it only sends emails that have been explicitly approved (status=DRAFT → SENT).
The Gmail API calls are synchronous, so we run them in a thread executor.
"""

import asyncio
import base64
import logging
import uuid
from email.mime.text import MIMEText
from pathlib import Path

from fastapi import HTTPException
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from sqlmodel.ext.asyncio.session import AsyncSession

from src.core.config import settings
from src.models.outreach import OutreachEmail, OutreachEmailRead, OutreachStatus

logger = logging.getLogger(__name__)

SCOPES = ["https://www.googleapis.com/auth/gmail.send"]


def _load_credentials() -> Credentials:
    """Load Gmail OAuth credentials from token.json, refreshing if expired.

    Raises:
        HTTPException: If token.json is missing or credentials cannot be refreshed.
    """
    token_path = Path(settings.GMAIL_TOKEN_PATH)
    credentials_path = Path(settings.GMAIL_CREDENTIALS_PATH)

    if not token_path.exists():
        raise HTTPException(
            status_code=503,
            detail=(
                "Gmail not configured: token.json not found. "
                "Run 'python -m scripts.setup_gmail_token' to authorize."
            ),
        )

    creds = Credentials.from_authorized_user_file(str(token_path), SCOPES)

    if creds.expired and creds.refresh_token:
        try:
            creds.refresh(Request())
            token_path.write_text(creds.to_json())
            logger.info("Gmail token refreshed successfully.")
        except Exception as e:
            raise HTTPException(
                status_code=503,
                detail=(
                    f"Gmail token expired and could not be refreshed: {e}. "
                    "Re-run 'python -m scripts.setup_gmail_token' to reauthorize."
                ),
            )

    if not creds.valid:
        raise HTTPException(
            status_code=503,
            detail=(
                "Gmail credentials are invalid. "
                "Re-run 'python -m scripts.setup_gmail_token' to reauthorize."
            ),
        )

    return creds


def _build_mime_message(to: str, subject: str, body: str) -> dict:
    """Construct a base64url-encoded MIME message for the Gmail API."""
    message = MIMEText(body)
    message["to"] = to
    message["subject"] = subject
    raw = base64.urlsafe_b64encode(message.as_bytes()).decode("utf-8")
    return {"raw": raw}


def _send_via_gmail(creds: Credentials, to: str, subject: str, body: str) -> str:
    """Synchronous Gmail send — runs inside a thread executor.

    Returns:
        The Gmail message ID on success.

    Raises:
        HTTPException: On Gmail API errors.
    """
    service = build("gmail", "v1", credentials=creds)
    create_message = _build_mime_message(to, subject, body)

    try:
        result = (
            service.users()
            .messages()
            .send(userId="me", body=create_message)
            .execute()
        )
        return result["id"]
    except HttpError as e:
        logger.error("Gmail API error: %s", e)
        raise HTTPException(
            status_code=502,
            detail=f"Gmail API error: {e.reason}",
        )


async def send_approved_email(
    session: AsyncSession,
    draft_id: uuid.UUID,
) -> OutreachEmailRead:
    """Send an approved outreach email via the Gmail API.

    This is Function B: only triggered when the frontend calls the
    "Approve & Send" endpoint. It:
    1. Looks up the draft by ID.
    2. Validates it is in DRAFT status.
    3. Authenticates with Gmail.
    4. Sends the email.
    5. Updates the DB row to SENT.

    Args:
        session: Async database session.
        draft_id: UUID of the outreach draft to send.

    Returns:
        The updated OutreachEmail record (status=SENT).

    Raises:
        HTTPException: If draft not found, not in DRAFT status, or Gmail fails.
    """
    outreach = await session.get(OutreachEmail, draft_id)
    if not outreach:
        raise HTTPException(status_code=404, detail="Outreach draft not found.")

    if outreach.status != OutreachStatus.drafted:
        raise HTTPException(
            status_code=409,
            detail=f"Cannot send: email status is '{outreach.status.value}', expected 'Drafted'.",
        )

    # Load credentials (handles refresh and error reporting)
    creds = _load_credentials()

    # Run the synchronous Gmail API call in a thread to avoid blocking the event loop
    loop = asyncio.get_running_loop()
    gmail_message_id = await loop.run_in_executor(
        None,
        _send_via_gmail,
        creds,
        outreach.recipient_email,
        outreach.subject,
        outreach.body,
    )

    logger.info(
        "Email sent to %s (gmail_id=%s, draft_id=%s)",
        outreach.recipient_email,
        gmail_message_id,
        draft_id,
    )

    # Update status to SENT
    outreach.status = OutreachStatus.sent
    session.add(outreach)
    await session.commit()
    await session.refresh(outreach)

    return OutreachEmailRead.model_validate(outreach)
