"""Gmail OAuth Token Setup Utility.

Run this script manually to perform the initial OAuth flow and generate
the token.json file that the backend uses to send emails via Gmail.

Usage:
    cd backend/
    python -m scripts.setup_gmail_token

Prerequisites:
    1. Download your OAuth 2.0 Client credentials from the Google Cloud Console.
    2. Save the file as backend/credentials.json (or set GMAIL_CREDENTIALS_PATH in .env).

The script will:
    - Open a browser window for you to authorize the Sprout app.
    - Save the resulting token to backend/token.json (or GMAIL_TOKEN_PATH from .env).
    - The token includes a refresh_token so it auto-renews until revoked.
"""

import sys
from pathlib import Path

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = ["https://www.googleapis.com/auth/gmail.send"]

# Default paths — override via environment variables if needed
DEFAULT_CREDENTIALS_PATH = "credentials.json"
DEFAULT_TOKEN_PATH = "token.json"


def main() -> None:
    # Try to load paths from settings, fall back to defaults
    try:
        from src.core.config import settings
        credentials_path = Path(settings.GMAIL_CREDENTIALS_PATH)
        token_path = Path(settings.GMAIL_TOKEN_PATH)
    except Exception:
        credentials_path = Path(DEFAULT_CREDENTIALS_PATH)
        token_path = Path(DEFAULT_TOKEN_PATH)

    if not credentials_path.exists():
        print(f"ERROR: Credentials file not found at '{credentials_path}'.")
        print("Download your OAuth 2.0 Client credentials from:")
        print("  https://console.cloud.google.com/apis/credentials")
        print(f"Save the file as '{credentials_path}' and re-run this script.")
        sys.exit(1)

    # Check if a valid token already exists
    if token_path.exists():
        creds = Credentials.from_authorized_user_file(str(token_path), SCOPES)
        if creds and creds.valid:
            print(f"Valid token already exists at '{token_path}'. No action needed.")
            return
        print(f"Existing token at '{token_path}' is expired or invalid. Re-authorizing...")

    print(f"Starting OAuth flow using credentials from '{credentials_path}'...")
    print("A browser window will open. Please authorize the Sprout application.\n")

    flow = InstalledAppFlow.from_client_secrets_file(str(credentials_path), SCOPES)
    creds = flow.run_local_server(port=0)

    token_path.write_text(creds.to_json())
    print(f"\nToken saved to '{token_path}'.")
    print("The backend can now send emails via Gmail. You can close this terminal.")


if __name__ == "__main__":
    main()
