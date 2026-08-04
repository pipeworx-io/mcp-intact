# mcp-intact

IntAct (EBI) molecular-interaction database MCP. Keyless.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `find_interactions` | IntAct (EBI) molecular-interaction database — find protein-protein and other molecular interactions for a gene/protein (by name or UniProt id), with detection method, interaction type, organism, PubMed ref, and MI confidence score. Keyless. |
| `interaction_count` | IntAct (EBI) — fast count of how many molecular interactions a gene/protein (by name or UniProt id) has. Keyless. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "intact": {
      "url": "https://gateway.pipeworx.io/intact/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Intact data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
