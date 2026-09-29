from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Hindsight Cloud
    HINDSIGHT_API_KEY: str = ""
    HINDSIGHT_BANK_ID: str = ""
    HINDSIGHT_BASE_URL: str = "https://api.hindsight.vectorize.io"

    # Groq (LLM only — embeddings run locally)
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "openai/gpt-oss-20b"

    # Database
    DATABASE_URL: str = "postgresql+psycopg2://brain:brain@localhost:5432/brain"

    # Embeddings (Groq has no embeddings endpoint → local sentence-transformers)
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    EMBEDDING_DIM: int = 384

    # App
    UPLOAD_DIR: str = "./uploads"
    SEED_ON_START: bool = True
    TOP_K: int = 8
    CHUNK_SIZE: int = 1200
    CHUNK_OVERLAP: int = 200
    ALLOWED_ORIGINS: str = "*"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()