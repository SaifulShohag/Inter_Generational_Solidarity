import json
import uuid
import sys
from datetime import datetime
from openai import AsyncOpenAI
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from app.config import settings
from app.services.conversation_store import load_session, save_session
from typing import AsyncGenerator
from mcp_server.tools.request_tools import create_help_request, get_request_status

glm_client = AsyncOpenAI(
    api_key=settings.GLM_API_KEY,
    base_url=settings.GLM_BASE_URL
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
- Ask only 1-2 questions per message. Never overwhelm.
- Use simple, friendly language. No jargon.
- Confirm ALL collected details with the user before calling create_help_request.
- Do NOT call create_help_request until every required field is confirmed.
- After a successful tool call, tell the user their request is submitted and volunteers will be notified.
"""


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

MCP_SERVER_PARAMS = StdioServerParameters(
    command=sys.executable,
    args=["-m", "mcp_server.server"]
)


def _use_stdio_mcp() -> bool:
    return sys.platform != "win32"


def _normalize_tool_messages(messages: list[dict]) -> list[dict]:
    normalized_messages: list[dict] = []
    pending_tool_call_ids: list[str] = []

    for message in messages:
        role = message.get("role")

        if role == "assistant" and message.get("tool_calls"):
            tool_calls = []
            for index, tool_call in enumerate(message.get("tool_calls", [])):
                function = tool_call.get("function") or {}
                function_name = function.get("name")
                arguments = function.get("arguments")
                if not function_name or arguments is None:
                    continue

                tool_call_id = tool_call.get("id") or f"call_{index}_{uuid.uuid4().hex}"
                tool_calls.append(
                    {
                        "id": tool_call_id,
                        "type": tool_call.get("type") or "function",
                        "function": {
                            "name": function_name,
                            "arguments": arguments,
                        },
                    }
                )

            clean_message = {
                "role": "assistant",
                "content": message.get("content"),
            }
            if tool_calls:
                clean_message["tool_calls"] = tool_calls
                pending_tool_call_ids = [tool_call["id"] for tool_call in tool_calls]
            else:
                pending_tool_call_ids = []
            normalized_messages.append(clean_message)
            continue

        if role == "tool":
            tool_call_id = message.get("tool_call_id")
            if not tool_call_id and pending_tool_call_ids:
                tool_call_id = pending_tool_call_ids.pop(0)
            if not tool_call_id:
                continue

            normalized_messages.append(
                {
                    "role": "tool",
                    "tool_call_id": tool_call_id,
                    "content": message.get("content", ""),
                }
            )
            continue

        normalized_messages.append(message)

    return normalized_messages


def _append_tool_call_message(session: dict, full_reply: str, tool_calls_buffer: list[dict]) -> None:
    session["messages"].append(
        {
            "role": "assistant",
            "content": full_reply or None,
            "tool_calls": [
                {
                    "id": tool_call["id"],
                    "type": tool_call.get("type", "function"),
                    "function": {
                        "name": tool_call["name"],
                        "arguments": tool_call["arguments"],
                    },
                }
                for tool_call in tool_calls_buffer
                if tool_call.get("name")
            ],
        }
    )


def _prepare_create_help_request_args(arguments: dict, user_id: int) -> dict:
    cleaned_arguments = {
        key: value
        for key, value in arguments.items()
        if value is not None and key not in {"user_id", "latitude", "longitude"}
    }
    cleaned_arguments["user_id"] = str(user_id)
    return cleaned_arguments


async def _list_local_tools():
    return [
        {
            "name": "create_help_request",
            "description": (
                "Save a completed help request to the database. "
                "Call ONLY when ALL fields are confirmed by the user: "
                "title, description, category, scheduled_at (ISO datetime), location_text."
            ),
            "inputSchema": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "description": {"type": "string"},
                    "category": {
                        "type": "string",
                        "enum": ["medical", "grocery", "cleaning", "transport", "other"],
                    },
                    "scheduled_at": {
                        "type": "string",
                        "description": "ISO datetime e.g. 2026-07-10T14:00:00",
                    },
                    "location_text": {"type": "string"},
                },
                "required": ["title", "description", "category", "scheduled_at", "location_text"],
            },
        },
        {
            "name": "get_request_status",
            "description": "Check the current status of a help request by its ID.",
            "inputSchema": {
                "type": "object",
                "properties": {"request_id": {"type": "string"}},
                "required": ["request_id"],
            },
        },
    ]


async def _call_local_tool(name: str, arguments: dict) -> str:
    if name == "create_help_request":
        return await create_help_request(**arguments)
    if name == "get_request_status":
        return await get_request_status(**arguments)
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
    system_prompt = _build_system_prompt()
    session["messages"] = _normalize_tool_messages(session["messages"])

    try:
        if _use_stdio_mcp():
            async with stdio_client(MCP_SERVER_PARAMS) as (read, write):
                async with ClientSession(read, write) as mcp_session:
                    await mcp_session.initialize()

                    mcp_tools_result = await mcp_session.list_tools()
                    tools = [
                        {
                            "type": "function",
                            "function": {
                                "name": t.name,
                                "description": t.description,
                                "parameters": t.inputSchema,
                            },
                        }
                        for t in mcp_tools_result.tools
                    ]

                    stream = await glm_client.chat.completions.create(
                        model=settings.GLM_MODEL,
                        messages=[
                            {"role": "system", "content": system_prompt},
                            *session["messages"],
                        ],
                        tools=tools,
                        tool_choice="auto",
                        stream=True,
                    )

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
                                if getattr(tc, "type", None):
                                    tool_calls_buffer[tc.index]["type"] = tc.type
                                if tc.function.name:
                                    tool_calls_buffer[tc.index]["name"] = tc.function.name
                                if tc.function.arguments:
                                    tool_calls_buffer[tc.index]["arguments"] += tc.function.arguments

                    if tool_calls_buffer:
                        _append_tool_call_message(session, full_reply, tool_calls_buffer)

                        for tc in tool_calls_buffer:
                            args = json.loads(tc["arguments"])
                            args = _prepare_create_help_request_args(args, user_id)

                            tool_result = await mcp_session.call_tool(tc["name"], args)
                            result_text = tool_result.content[0].text
                            result_data = json.loads(result_text)

                            if tc["name"] == "create_help_request" and result_data.get("ok"):
                                session["request_id"] = result_data.get("request_id")
                                session["status"] = "completed"

                            session["messages"].append({
                                "role": "tool",
                                "tool_call_id": tc["id"],
                                "name": tc["name"],
                                "content": result_text,
                            })

                        final_stream = await glm_client.chat.completions.create(
                            model=settings.GLM_MODEL,
                            messages=[
                                {"role": "system", "content": system_prompt},
                                *session["messages"],
                            ],
                            stream=True,
                        )

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
        else:
            tools = await _list_local_tools()

            stream = await glm_client.chat.completions.create(
                model=settings.GLM_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    *session["messages"],
                ],
                tools=[
                    {
                        "type": "function",
                        "function": {
                            "name": tool["name"],
                            "description": tool["description"],
                            "parameters": tool["inputSchema"],
                        },
                    }
                    for tool in tools
                ],
                tool_choice="auto",
                stream=True,
            )
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
                        if getattr(tc, "type", None):
                            tool_calls_buffer[tc.index]["type"] = tc.type
                        if tc.function.name:
                            tool_calls_buffer[tc.index]["name"] = tc.function.name
                        if tc.function.arguments:
                            tool_calls_buffer[tc.index]["arguments"] += tc.function.arguments

            if tool_calls_buffer:
                _append_tool_call_message(session, full_reply, tool_calls_buffer)

                for tc in tool_calls_buffer:
                    args = json.loads(tc["arguments"])
                    args = _prepare_create_help_request_args(args, user_id)

                    result_text = await _call_local_tool(tc["name"], args)
                    result_data = json.loads(result_text)

                    if tc["name"] == "create_help_request" and result_data.get("ok"):
                        session["request_id"] = result_data.get("request_id")
                        session["status"] = "completed"

                    session["messages"].append({
                        "role": "tool",
                        "tool_call_id": tc["id"],
                        "name": tc["name"],
                        "content": result_text,
                    })

                final_stream = await glm_client.chat.completions.create(
                    model=settings.GLM_MODEL,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        *session["messages"],
                    ],
                    stream=True,
                )
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
        yield f"data: [ERROR] Agent error: {str(e)}\n\n"

    finally:
        # Always persist — even if the stream failed mid-way
        await save_session(session_id, session)
