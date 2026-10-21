from app.graph.state import GraphState
from app.core.llm import get_llm

SYSTEM = """You are a legal research assistant for Indian law.
1. Use ONLY the numbered sources below. Do not mention any section, article or Act that is not in the sources.
2. After every statement that relies on a source, add its tag, e.g. [D1] or [D2][D3]. Use only tags that appear below.
3. If the sources do not answer the question, reply exactly: NOT_FOUND
4. Explain in simple language."""


def synthesizer_node(state: GraphState) -> dict:
    llm = get_llm()
    docs = state["retrieved_docs"]
    if not docs:
        return {"draft_answer": "NOT_FOUND"}

    context = "\n\n".join(f"[D{i}]\n{d['content']}" for i, d in enumerate(docs, 1))

    retry_note = ""
    if state.get("retry_count", 0) > 0:
        problems = ", ".join(state.get("unsupported_citations") or []) or "no [D#] citation tags"
        retry_note = (f"\nYour previous answer had problems: {problems}. "
                      f"Cite only tags D1..D{len(docs)} and mention no sections that are not in the sources.\n")

    prompt = f"{SYSTEM}\n{retry_note}\nSources:\n{context}\n\nQuestion: {state['question']}\nAnswer:"
    return {"draft_answer": llm.invoke(prompt).content}