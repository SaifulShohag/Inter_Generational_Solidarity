from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080

    DATABASE_URL: str

    GLM_API_KEY: str = Field(
        validation_alias=AliasChoices("GLM_API_KEY", "OPENAI_API_KEY")
    )
    GLM_BASE_URL: str = Field(
        default="https://open.bigmodel.cn/api/paas/v4/",
        validation_alias=AliasChoices("GLM_BASE_URL", "OPENAI_BASE_URL")
    )
    GLM_MODEL: str = Field(
        default="glm-4-flash",
        validation_alias=AliasChoices("GLM_MODEL", "LLM_MODEL_NAME")
    )

    CONVERSATIONS_DIR: str = "./conversations"

    class Config:
        env_file = ".env"

settings = Settings()