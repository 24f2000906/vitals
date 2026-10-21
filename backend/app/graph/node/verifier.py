import re
from app.graph.state import GraphState

TAG = re.compile(r"\[D(\d+)\]")
MENTION = re.compile(r"\b(?:section|sec\.?|article|art\.?)\s+(\d+[A-Za-z]*)", re.I)

NOT_FOUND_MSG = ("I couldn't find a provision in the indexed corpus that answers this. "
                 "Try rephrasing, or name the Act and section.")

def _sec(meta: dict) -> str:
    return str(meta.get("section_number", "")).strip()

def verifier_node(state: GraphState) -> dict:
    answer = (state["draft_answer"] or "").strip()
    docs = state["retrieved_docs"]
    retries = state.get("retry_count", 0)

    if not docs or answer == "NOT_FOUND":
        return {"citations": [], "unsupported_citations": [], "verification_status": "not_found",
                "final_answer": NOT_FOUND_MSG, "retry_count": retries}

    tags = list(dict.fromkeys(int(n) for n in TAG.findall(answer)))
    valid = [n for n in tags if 1 <= n <= len(docs)]
    bad = [f"D{n}" for n in tags if n not in valid]

    ctx = " ".join(d["content"] for d in docs)
    known = {s.lower() for s in MENTION.findall(ctx)} | {_sec(d["metadata"]).lower() for d in docs}
    bad += [f"section/article {m}" for m in dict.fromkeys(MENTION.findall(answer)) if m.lower() not in known]

    status = "flagged" if bad else ("verified" if valid else "unverified")

    citations, seen = [], set()
    for n in sorted(valid):
        m = docs[n - 1]["metadata"]
        key = (m.get("act"), _sec(m))
        if key in seen:
            continue
        seen.add(key)
        citations.append({"source": m.get("act_full") or m.get("act", "unknown"),
                          "section": _sec(m),
                          "excerpt": docs[n - 1]["content"][:200]})

    def label(match):
        n = int(match.group(1))
        if n in valid:
            m = docs[n - 1]["metadata"]
            return f"[{m.get('act', '?')} {_sec(m)}]"
        return ""

    final = TAG.sub(label, answer)
    if status == "flagged":
        final = ("⚠️ Some references could not be verified against the retrieved sources: "
                 + ", ".join(bad) + "\n\n" + final)

    return {"citations": citations, "unsupported_citations": bad, "verification_status": status,
            "final_answer": final,
            "retry_count": retries + (1 if status in ("flagged", "unverified") else 0)}