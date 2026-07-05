from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ── Auth ──────────────────────────────────────────────────────────────────
    SECRET_KEY: str
    ALGORITHM:  str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days

    # ── Database ──────────────────────────────────────────────────────────────
    DATABASE_URL: str

    # ── LLM ──────────────────────────────────────────────────────────────────
    LLM_API_KEY: str = Field(
        validation_alias=AliasChoices("OPENAI_API_KEY", "LLM_API_KEY")
    )
    LLM_BASE_URL: str = Field(
        default="https://api.groq.com/openai/v1",
        validation_alias=AliasChoices("OPENAI_BASE_URL", "LLM_BASE_URL")
    )
    LLM_MODEL: str = Field(
        default="llama-3.1-8b-instant",
        validation_alias=AliasChoices("LLM_MODEL_NAME", "LLM_MODEL")
    )

    # ── Conversations ─────────────────────────────────────────────────────────
    CONVERSATIONS_DIR: str = "./conversations"

    # Fernet key for encrypting conversation files at rest.
    # Generate: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
    # Leave empty in dev — an ephemeral key is used (files won't survive restarts).
    CONVERSATION_SECRET_KEY: str = ""

    # ── Security ──────────────────────────────────────────────────────────────
    # Comma-separated origins string — parsed into a list in main.py
    # Example: ALLOWED_ORIGINS=http://localhost:8000,https://yourdomain.com
    ALLOWED_ORIGINS: str = "http://localhost:8000"
    HTTPS_ENABLED:   bool = False  # Set True only if your app itself terminates TLS

    class Config:
        env_file = ".env"


settings = Settings()  # type: ignore 