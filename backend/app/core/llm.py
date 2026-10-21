from langchain_nvidia_ai_endpoints import ChatNVIDIA
from app.core.config import settings

def get_llm():
    return ChatNVIDIA(
        model=settings.text_model,
        api_key=settings.text_model_api_key, 
        temperature=0,
        top_p=0.95,
        max_tokens=4096,
        timeout=300,
        model_kwargs={
            "chat_template_kwargs": {"enable_thinking": False}
        }
    )