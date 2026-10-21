from typing import TypedDict, List, Optional
from app.models.schemas import Citation

class GraphState(TypedDict):
    question: str
    query_type: Optional[str]
    retrieved_docs: List[dict]
    draft_answer: Optional[str]
    citations: List[dict]
    unsupported_citations: List[str]
    verification_status: str
    retry_count: int
    final_answer: Optional[str]