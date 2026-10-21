from langgraph.graph import StateGraph, END
from app.graph.state import GraphState
from app.graph.node.retriever import retriever_node
from app.graph.node.synthesizer import synthesizer_node
from app.graph.node.verifier import verifier_node

MAX_RETRIES = 1

def route_after_verify(state: GraphState) -> str:
    if state["verification_status"] in ("flagged", "unverified") and state["retry_count"] <= MAX_RETRIES:
        return "synthesize"
    return END

def build_graph():
    graph = StateGraph(GraphState)

    graph.add_node("retrieve", retriever_node)
    graph.add_node("synthesize", synthesizer_node)
    graph.add_node("verify", verifier_node)

    graph.set_entry_point("retrieve")
    graph.add_edge("retrieve", "synthesize")
    graph.add_edge("synthesize", "verify")
    graph.add_conditional_edges("verify", route_after_verify, {"synthesize": "synthesize", END:END})

    return graph.compile()