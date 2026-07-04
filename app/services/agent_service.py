import json
import uuid
import traceback
from datetime import datetime
from openai import AsyncOpenAI
from app.config import settings
from app.services.conversation_store import load_session, save_session
from typing import AsyncGenerator
from mcp_server.tools.request_tools import create_help_request, get_request_status

llm_client = AsyncOpenAI(
    api_key=settings.LLM_API_KEY,
    base_url=settings.LLM_BASE_URL
)

SYSTEM_PROMPT = """
You are a warm, patient, and simple-spoken assistant helping elderly or disabled people
arrange volunteer support. Your job is to have a friendly conversation to understand
what kind of help they need, then create a help request for them.

You must collect ALL of the following before saving the request:
1. What kind of help (category: medical, grocery, cleaning, transport, or other)
2. A clear description of the task
3. When they need it (specific date and time — convert to ISO format internally)
4. Where (their address or a clear location description)
5. Any special instructions (optional — ask gently)

Rules:
- ALWAYS reply in the exact same language the user is speaking (e.g., if the user speaks French, you MUST reply in French).
- Ask only 1-2 questions per message. Never overwhelm.
- Use simple, friendly language. No jargon.
- Confirm ALL collected details with the user before calling create_help_request.
- If the user mentions urgency or time sensitivity, set priority accordingly (low/medium/urgent). Otherwise default to medium.
- Do NOT call create_help_request until every required field is confirmed.
- After a successful tool call, tell the user their request is submitted and volunteers will be notified.
"""

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "create_help_request",
            "description": (
                "Save a completed help request to the database. "
                "Call ONLY when ALL fields are confirmed by the user: "
                "title, description, category, scheduled_at (ISO datetime), location_text, priority."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "title":         {"type": "string"},
                    "description":   {"type": "string"},
                    "category":      {
                        "type": "string",
                        "enum": ["medical", "grocery", "cleaning", "transport", "other"]
                    },
                    "priority": {
                        "type": "string",
                        "enum": ["low", "medium", "urgent"],
                        "description": "How urgent is this request? low = flexible timing, medium = within a day or two, urgent = as soon as possible"
                    },
                    "scheduled_at":  {
                        "type": "string",
                        "description": "ISO datetime e.g. 2026-07-10T14:00:00"
                    },
                    "location_text": {"type": "string"},
                },
                "required": ["title", "description", "category", "scheduled_at", "location_text", "priority"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_request_status",
            "description": "Check the current status of a help request by its ID.",
            "parameters": {
                "type": "object",
                "properties": {
                    "request_id": {"type": "string"}
                },
                "required": ["request_id"]
            }
        }
    }
]


def _build_system_prompt() -> str:
    now = datetime.now().astimezone().replace(microsecond=0)
    return (
        SYSTEM_PROMPT
        + "\n\n"
        + "Current date and time context:\n"
        + f"- Today is {now.date().isoformat()}.\n"
        + f"- Current local time is {now.isoformat()}.\n"
        + "- Interpret relative phrases like today, tomorrow, tonight, and next Monday using this date.\n"
        + "- If the user says a time only, assume it refers to today unless they say otherwise.\n"
    )


def _normalize_tool_messages(messages: list[dict]) -> list[dict]:
    normalized: list[dict] = []
    pending_ids: list[str] = []

    for msg in messages:
        role = msg.get("role")

        if role == "assistant" and msg.get("tool_calls"):
            tool_calls = []
            for i, tc in enumerate(msg.get("tool_calls", [])):
                fn = tc.get("function") or {}
                name = fn.get("name")
                args = fn.get("arguments")
                if not name or args is None:
                    continue
                tc_id = tc.get("id") or f"call_{i}_{uuid.uuid4().hex}"
                tool_calls.append({
                    "id": tc_id,
                    "type": tc.get("type") or "function",
                    "function": {"name": name, "arguments": args},
                })
            clean = {"role": "assistant", "content": msg.get("content")}
            if tool_calls:
                clean["tool_calls"] = tool_calls
                pending_ids = [tc["id"] for tc in tool_calls]
            else:
                pending_ids = []
            normalized.append(clean)
            continue

        if role == "tool":
            tc_id = msg.get("tool_call_id")
            if not tc_id and pending_ids:
                tc_id = pending_ids.pop(0)
            if not tc_id:
                continue
            normalized.append({
                "role": "tool",
                "tool_call_id": tc_id,
                "content": msg.get("content", ""),
            })
            continue

        normalized.append(msg)

    return normalized


async def _call_tool(name: str, args: dict, user_id: int) -> str:
    if name == "create_help_request":
        clean = {k: v for k, v in args.items() if v is not None and k not in {"user_id", "latitude", "longitude"}}
        clean["user_id"] = str(user_id)
        return await create_help_request(**clean)
    if name == "get_request_status":
        return await get_request_status(**args)
    return json.dumps({"ok": False, "message": f"Unknown tool '{name}'"})


async def stream_agent_response(
    session_id: str,
    user_id: int,
    user_message: str
) -> AsyncGenerator[str, None]:
    session = await load_session(session_id)
    if not session:
        yield "data: [ERROR] Session not found\n\n"
        return

    session["messages"].append({"role": "user", "content": user_message})
    session["messages"] = _normalize_tool_messages(session["messages"])
    system_prompt = _build_system_prompt()

    try:
        stream = await llm_client.chat.completions.create(
            model=settings.LLM_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                *session["messages"], # type: ignore
            ],
            tools=TOOLS, # type: ignore
            tool_choice="auto",
            stream=True,
        ) # type: ignore

        full_reply = ""
        tool_calls_buffer = []

        async for chunk in stream:
            delta = chunk.choices[0].delta

            if delta.content:
                full_reply += delta.content
                yield f"data: {delta.content}\n\n"

            if delta.tool_calls:
                for tc in delta.tool_calls:
                    if tc.index >= len(tool_calls_buffer):
                        tool_calls_buffer.append({"id": "", "type": "function", "name": "", "arguments": ""})
                    if getattr(tc, "id", None):
                        tool_calls_buffer[tc.index]["id"] = tc.id
                    if tc.function.name:
                        tool_calls_buffer[tc.index]["name"] = tc.function.name
                    if tc.function.arguments:
                        tool_calls_buffer[tc.index]["arguments"] += tc.function.arguments

        if tool_calls_buffer:
            session["messages"].append({
                "role": "assistant",
                "content": full_reply or None,
                "tool_calls": [
                    {
                        "id":       tc["id"],
                        "type":     "function",
                        "function": {"name": tc["name"], "arguments": tc["arguments"]},
                    }
                    for tc in tool_calls_buffer if tc.get("name")
                ],
            })

            for tc in tool_calls_buffer:
                args = json.loads(tc["arguments"])
                result_text = await _call_tool(tc["name"], args, user_id)
                result_data = json.loads(result_text)

                if tc["name"] == "create_help_request" and result_data.get("ok"):
                    session["request_id"] = result_data.get("request_id")
                    session["status"] = "completed"

                session["messages"].append({
                    "role":         "tool",
                    "tool_call_id": tc["id"],
                    "name":         tc["name"],
                    "content":      result_text,
                })

            final_stream = await llm_client.chat.completions.create(
                model=settings.LLM_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    *session["messages"], # type: ignore
                ],
                stream=True,
            ) # type: ignore

            final_reply = ""
            async for chunk in final_stream:
                if chunk.choices[0].delta.content:
                    token = chunk.choices[0].delta.content
                    final_reply += token
                    yield f"data: {token}\n\n"

            session["messages"].append({"role": "assistant", "content": final_reply})

        else:
            session["messages"].append({"role": "assistant", "content": full_reply})

        request_created = session.get("request_id") is not None
        yield f"data: [DONE] request_created={request_created}\n\n"

    except Exception as e:
        yield f"data: [ERROR] Agent error: {type(e).__name__}: {str(e)}\n\n"
        yield f"data: [ERROR] Traceback: {traceback.format_exc()}\n\n"

    finally:
        await save_session(session_id, session)
