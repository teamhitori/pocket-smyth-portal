from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # B2C / Graph API
    b2c_tenant_id: str = ""
    b2c_graph_client_id: str = ""
    b2c_graph_client_secret: str = ""

    # Admin Agent
    admin_agent_url: str = "http://admin-agent:8080"
    admin_agent_secret: str = ""

    # Environment
    environment: str = "development"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
