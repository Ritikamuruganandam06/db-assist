from langgraph.checkpoint.memory import MemorySaver

memory = MemorySaver()

_thread_ids = []


def _get_config(thread_id):
    return {"configurable": {"thread_id": thread_id}}


def _extract_name_from_state(state):
    if not state or not state.values:
        return "New Chat"
    for msg in state.values.get("messages", []):
        if msg.type == "human":
            text = msg.content.strip()
            if len(text) > 50:
                return text[:50] + "..."
            return text
    return "New Chat"


def get_memory():
    return memory


def list_threads(agent):
    threads = []
    for tid in _thread_ids:
        state = agent.get_state(_get_config(tid))
        name = _extract_name_from_state(state)
        threads.append({"id": tid, "name": name})
    return threads


def create_thread(thread_id):
    if thread_id not in _thread_ids:
        _thread_ids.insert(0, thread_id)
    return {"id": thread_id, "name": "New Chat"}


def delete_thread(thread_id):
    if thread_id in _thread_ids:
        _thread_ids.remove(thread_id)


def get_thread_messages(agent, thread_id):
    config = _get_config(thread_id)
    state = agent.get_state(config)
    if not state or not state.values:
        return []

    messages = []
    for msg in state.values.get("messages", []):
        if msg.type == "human":
            messages.append({"role": "user", "content": msg.content})
        elif msg.type == "ai":
            entry = {"role": "assistant", "content": msg.content, "tool_calls": []}
            if hasattr(msg, "tool_calls") and msg.tool_calls:
                for tc in msg.tool_calls:
                    entry["tool_calls"].append({
                        "name": tc["name"],
                        "args": tc["args"]
                    })
            messages.append(entry)
        elif msg.type == "tool":
            messages.append({
                "role": "tool",
                "name": msg.name,
                "content": msg.content
            })
    return messages
