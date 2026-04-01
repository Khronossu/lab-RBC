from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql://rbclab:rbclab@localhost:5432/rbclab"
    ollama_host: str = "http://localhost:11434"
    ollama_model: str = "llama3.2"
    storage_path: str = "./storage"

    model_config = SettingsConfigDict(env_file="../.env", extra="ignore")


settings = Settings()
