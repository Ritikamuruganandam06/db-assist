import os


PROVIDER_ENV_REQUIREMENTS = {
    "azure-openai": ["AZURE_OPENAI_API_KEY", "AZURE_OPENAI_ENDPOINT", "OPENAI_API_VERSION", "AZURE_OPENAI_MODEL", "AZURE_OPENAI_DEPLOYMENT"],
    "openai": ["OPENAI_API_KEY", "OPENAI_MODEL"],
    "gemini": ["GOOGLE_API_KEY", "GEMINI_MODEL"],
    "anthropic": ["ANTHROPIC_API_KEY", "ANTHROPIC_MODEL"],
}

SUPPORTED_PROVIDERS = list(PROVIDER_ENV_REQUIREMENTS.keys())


def _validate_env(provider: str):
    required = PROVIDER_ENV_REQUIREMENTS[provider]
    missing = [var for var in required if not os.environ.get(var)]
    if missing:
        raise EnvironmentError(
            f"Provider '{provider}' requires these env variables: {', '.join(missing)}"
        )


def get_model():
    provider = os.environ.get("LLM_PROVIDER", "").strip().lower()
    if not provider:
        raise EnvironmentError(
            f"LLM_PROVIDER env variable is required. Supported values: {', '.join(SUPPORTED_PROVIDERS)}"
        )
    if provider not in SUPPORTED_PROVIDERS:
        raise ValueError(
            f"Unsupported LLM_PROVIDER '{provider}'. Supported values: {', '.join(SUPPORTED_PROVIDERS)}"
        )

    _validate_env(provider)

    if provider == "azure-openai":
        from langchain_openai import AzureChatOpenAI
        return AzureChatOpenAI(
            model=os.environ["AZURE_OPENAI_MODEL"],
            azure_deployment=os.environ["AZURE_OPENAI_DEPLOYMENT"],
        )

    if provider == "openai":
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(
            model=os.environ["OPENAI_MODEL"],
        )

    if provider == "gemini":
        from langchain_google_genai import ChatGoogleGenerativeAI
        return ChatGoogleGenerativeAI(
            model=os.environ["GEMINI_MODEL"],
        )

    if provider == "anthropic":
        from langchain_anthropic import ChatAnthropic
        return ChatAnthropic(
            model=os.environ["ANTHROPIC_MODEL"],
        )
