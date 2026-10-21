from app.graph.state import GraphState
from app.db.vectorstore import get_vectorstore

FETCH_K, KEEP_K, MAX_DIST = 4, 2, 1.2

def retriever_node(state: GraphState) -> dict:
    hits = get_vectorstore().similarity_search_with_score(state["question"], k=FETCH_K)
    hits.sort(key=lambda h: (round(h[1], 6), h[0].metadata.get("act", ""),
                             str(h[0].metadata.get("section_number", ""))))
    hits = [h for h in hits if h[1] <= MAX_DIST][:KEEP_K]
    return {"retrieved_docs": [{"content": d.page_content, "metadata": d.metadata, "score": s}
                               for d, s in hits]}