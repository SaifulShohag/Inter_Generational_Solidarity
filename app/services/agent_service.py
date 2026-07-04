import json
import os
import sys
import traceback
from openai import AsyncOpenAI
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from app.config import settings
from app.services.conversation_store import load_session, save_session
from typing import AsyncGenerator

# Project root = Inter_Generational_Solidarity/
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

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

# Inject PROJECT_ROOT into PYTHONPATH so the subprocess can find mcp_server on Windows
_env = dict(os.environ)
_existing_path = _env.get("PYTHONPATH", "")
_env["PYTHONPATH"] = f"{PROJECT_ROOT}{os.pathsep}{_existing_path}" if _existing_path else PROJECT_ROOT

MCP_SERVER_PARAMS = StdioServerParameters(
    command=sys.executable,
    args=["-m", "mcp_server.server"],
    env=_env
)

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

    try:
        async with stdio_client(MCP_SERVER_PARAMS) as (read, write):
            async with ClientSession(read, write) as mcp_session:
                await mcp_session.initialize()

                # Fetch available tools from MCP and convert to OpenAI format
                mcp_tools_result = await mcp_session.list_tools()
                tools = [
                    {
                        "type": "function",
                        "function": {
                            "name":        t.name,
                            "description": t.description,
                            "parameters":  t.inputSchema
                        }
                    }
                    for t in mcp_tools_result.tools
                ]

                # First GLM call — streaming
                stream = await glm_client.chat.completions.create(
                    model=settings.GLM_MODEL,
                    messages=[
                        {"role": "system", "content": SYSTEM_PROMPT},
                        *session["messages"]
                    ],
                    tools=tools,
                    tool_choice="auto",
                    stream=True
                )

                full_reply       = ""
                tool_calls_buffer = []

                async for chunk in stream:
                    delta = chunk.choices[0].delta

                    # Stream text tokens to the client
                    if delta.content:
                        full_reply += delta.content
                        yield f"data: {delta.content}\n\n"

                    # Accumulate tool call fragments across streamed chunks
                    if delta.tool_calls:
                        for tc in delta.tool_calls:
                            if tc.index >= len(tool_calls_buffer):
                                tool_calls_buffer.append({"name": "", "arguments": ""})
                            if tc.function.name:
                                tool_calls_buffer[tc.index]["name"] = tc.function.name
                            if tc.function.arguments:
                                tool_calls_buffer[tc.index]["arguments"] += tc.function.arguments

                # Handle tool calls after stream ends
                if tool_calls_buffer:
                    session["messages"].append({
                        "role":       "assistant",
                        "content":    full_reply or None,
                        "tool_calls": tool_calls_buffer
                    })

                    for tc in tool_calls_buffer:
                        args = json.loads(tc["arguments"])
                        args["user_id"] = str(user_id)   # always inject the authenticated user_id

                        tool_result = await mcp_session.call_tool(tc["name"], args)
                        result_text = tool_result.content[0].text
                        result_data = json.loads(result_text)

                        # Track the created request_id in the session
                        if tc["name"] == "create_help_request" and result_data.get("ok"):
                            session["request_id"] = result_data.get("request_id")
                            session["status"]     = "completed"

                        session["messages"].append({
                            "role":    "tool",
                            "name":    tc["name"],
                            "content": result_text
                        })

                    # Second GLM call — get the final user-facing reply after tool result
                    final_stream = await glm_client.chat.completions.create(
                        model=settings.GLM_MODEL,
                        messages=[
                            {"role": "system", "content": SYSTEM_PROMPT},
                            *session["messages"]
                        ],
                        stream=True
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
        yield f"data: [ERROR] Agent error: {type(e).__name__}: {str(e)}\n\n"
        yield f"data: [ERROR] Traceback: {traceback.format_exc()}\n\n"

    finally:
        # Always persist — even if the stream failed mid-way
        await save_session(session_id, session)