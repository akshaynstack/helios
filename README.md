# Helios CLI

> **🚀 AI Coding Assistant with 130+ Tools, MCP Support & Multi-Provider Integration**

<p align="center">
  <img src="https://img.shields.io/badge/BridgeMind-Vibeathon-purple?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Tools-130+-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/MCP-Supported-green?style=for-the-badge" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" />
</p>

## 🏆 BridgeMind Vibeathon Entry

Built for **[BridgeMind Vibeathon](https://bridgemind.ai/vibeathon)** (Jan 4-14, 2026).

> *Build an open source tool that makes vibe coders unstoppable.*

## 🚀 Install

```bash
npm install -g helios-cli
helios config set OPENROUTER_API_KEY sk-or-...
# Or: helios config set ANTHROPIC_API_KEY sk-ant-...
helios
```

## ⚡ Features

### 🔄 Multi-Provider Support
- **OpenRouter** - 100+ models including free ones
- **Claude** - Native Anthropic API
- **OpenAI** - Direct GPT access
- **Streaming** - Real-time responses

### 🔌 MCP Integration
Connect to Claude Desktop or any MCP client:
```bash
helios mcp           # Start MCP server
helios mcp config    # Show Claude Desktop config
```

### 📖 Slash Commands
Type `/` in chat for an interactive command menu:

| Command | Description |
|---------|-------------|
| `/help` | Show commands |
| `/clear` | Clear conversation |
| `/tools` | List 130+ tools |
| `/model` | Change AI model |
| `/stream` | Toggle streaming |
| `/status` | Session info |
| `/doctor` | Diagnose issues |
| `/exit` | Exit Helios |

### 🛠️ 130+ Power Tools

**File Operations**
- `read_file`, `write_file`, `edit_file`, `delete_file`, `file_diff`, `file_tree`

**Git Integration**
- `git_status`, `git_diff`, `git_commit`, `git_log`, `git_branch`, `git_rebase`, `git_cherry_pick`, `git_blame`

**Database**
- `query_sqlite`, `query_postgres`, `prisma_generate`, `prisma_migrate`

**Cloud & DevOps**
- `docker_build`, `docker_run`, `docker_compose_up`, `vercel_deploy`, `railway_deploy`, `fly_deploy`

**Testing**
- `run_jest`, `run_vitest`, `run_pytest`, `playwright_test`, `cypress_run`, `coverage_report`

**API & HTTP**
- `http_get`, `http_post`, `curl_command`, `parse_openapi`

**Code Quality**
- `format_code`, `lint_code`, `check_types`, `find_duplicates`, `check_complexity`

**Utilities**
- `uuid_generate`, `hash_text`, `base64_encode`, `timestamp`, `regex_test`, `calc`

### 🛡️ Supervision Layer

**Loop Detection** - Stops AI when it repeats actions
```
⚠️ Loop detected: "read_file" repeated 3 times
```

**Security Scanner** - Blocks dangerous code
```
🔒 Security blocked: eval() detected
```

**Audit Logging** - All actions saved to `~/.helios/audit.jsonl`

### 🎨 UI/UX Expert

Generate stunning UIs with Vercel v0:
```bash
helios config set V0_API_KEY v0-...
helios ui "modern pricing page"
```

## 📖 Usage

```bash
helios                     # Interactive mode
helios chat                # Same as above
helios "fix the bug"       # Single command
helios ui "dashboard"      # UI generation
helios doctor              # Check setup
helios tools               # List tools
helios mcp                 # Start MCP server
```

## 🔑 Get API Keys

- **OpenRouter** (Free models): [openrouter.ai](https://openrouter.ai/keys)
- **Anthropic** (Claude): [console.anthropic.com](https://console.anthropic.com)
- **V0**: [v0.dev/chat/settings/keys](https://v0.dev/chat/settings/keys)

## 🔌 Claude Desktop Integration

Add Helios to Claude Desktop's MCP config:

```json
{
  "mcpServers": {
    "helios": {
      "command": "helios",
      "args": ["mcp"]
    }
  }
}
```

## 📄 License

MIT © [akshaynstack](https://github.com/akshaynstack)

---

Built with ❤️ for **BridgeMind Vibeathon**
