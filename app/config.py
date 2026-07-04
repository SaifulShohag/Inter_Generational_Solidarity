from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080

    DATABASE_URL: str

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

    CONVERSATIONS_DIR: str = "./conversations"

    class Config:
        env_file = ".env"

settings = Settings() # type: ignore