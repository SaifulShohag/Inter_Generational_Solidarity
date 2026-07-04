import asyncio
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp import types
from mcp_server.tools.request_tools import create_help_request, get_request_status

server = Server("helpme-mcp")

@server.list_tools()
async def list_tools() -> list[types.Tool]:
    return [
        types.Tool(
            name="create_help_request",
            description=(
                "Save a completed help request to the database. "
                "Call ONLY when ALL fields are confirmed by the user: "
                "title, description, category, scheduled_at (ISO datetime), location_text."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "title":         {"type": "string"},
                    "description":   {"type": "string"},
                    "category":      {
                        "type": "string",
                        "enum": ["medical", "grocery", "cleaning", "transport", "other"]
                    },
                    "scheduled_at":  {
                        "type": "string",
                        "description": "ISO datetime e.g. 2026-07-10T14:00:00"
                    },
                    "location_text": {"type": "string"}
                },
                "required": ["title", "description", "category", "scheduled_at", "location_text"]
            }
        ),
        types.Tool(
            name="get_request_status",
            description="Check the current status of a help request by its ID.",
            inputSchema={
                "type": "object",
                "properties": {
                    "request_id": {"type": "string"}
                },
                "required": ["request_id"]
            }
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "create_help_request":
        result = await create_help_request(**arguments)
    elif name == "get_request_status":
        result = await get_request_status(**arguments)
    else:
        result = '{"ok": false, "message": "Unknown tool"}'
    return [types.TextContent(type="text", text=result)]

async def main():
    async with stdio_server() as streams:
        await server.run(*streams, server.create_initialization_options())

if __name__ == "__main__":
    asyncio.run(main())