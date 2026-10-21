from fastapi import APIRouter
from app.core.llm import get_llm
from pydantic import BaseModel, Field

router = APIRouter()

class AskRequest(BaseModel):
    question: str = Field(
        ...,
        min_length=1,
        description="The question to ask the LLM",
    )

@router.post("/test")
def test(req: AskRequest):
    llm = get_llm()
    response = llm.invoke(req.question)
    return {"Answer": response.content}