"""
Fernet symmetric encryption (AES-128-CBC + HMAC-SHA256) for conversation files.

Generate a key:
    python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
Add to .env:
    CONVERSATION_SECRET_KEY=<output>
"""
from __future__ import annotations
import warnings
from cryptography.fernet import Fernet, InvalidToken
from app.config import settings

_fernet: Fernet | None = None


def _get_fernet() -> Fernet:
    global _fernet
    if _fernet is None:
        key = settings.CONVERSATION_SECRET_KEY
        if not key:
            key = Fernet.generate_key().decode()
            warnings.warn(
                "CONVERSATION_SECRET_KEY not set — using ephemeral key. "
                "Conversation files will not survive restarts. Set this in .env for production.",
                stacklevel=3,
            )
        _fernet = Fernet(key.encode() if isinstance(key, str) else key)
    return _fernet


def encrypt_str(plaintext: str) -> str:
    """Encrypt a UTF-8 string → base64 ciphertext string."""
    return _get_fernet().encrypt(plaintext.encode()).decode()


def try_decrypt_str(raw: str) -> str:
    """
    Decrypt ciphertext → plaintext.
    Falls back to the raw string for legacy unencrypted files so old conversations
    are still readable after the migration.
    """
    try:
        return _get_fernet().decrypt(raw.encode()).decode()
    except (InvalidToken, Exception):
        return raw  # legacy plaintext file
