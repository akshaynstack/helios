# Helios CLI

> **🤖 AI Coding Assistant with Built-in Supervision**

<p align="center">
  <img src="https://img.shields.io/badge/BridgeMind-Vibeathon-purple?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Prize-$1000%20BTC-orange?style=for-the-badge" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" />
</p>

## 🏆 BridgeMind Vibeathon Entry

Built for **[BridgeMind Vibeathon](https://bridgemind.ai/vibeathon)** (Jan 4-14, 2026).

> *Build an open source tool that makes vibe coders unstoppable.*

## 🚀 Install

```bash
npm install -g helios-cli
helios config set OPENROUTER_API_KEY sk-or-...
helios chat
```

## ⚡ Features

### 📖 Slash Commands
Type `/` in chat for an interactive command menu:

| Command | Description |
|---------|-------------|
| `/help` | Show commands |
| `/clear` | Clear conversation |
| `/tools` | List 47+ tools |
| `/secrets` | Scan for hardcoded API keys |
| `/model` | Change AI model |
| `/status` | Session info |
| `/git` | Git status |
| `/project` | Analyze project |
| `/exit` | Exit Helios |

### 🛠️ 47+ Power Tools

**File Operations**
- `read_file`, `write_file`, `edit_file`, `append_file`, `delete_file`
- `list_directory`, `find_files`, `search_files`, `find_and_replace_all`

**Git Integration**
- `git_status`, `git_diff`, `git_commit`, `git_log`, `git_branch`, `git_stash`, `git_undo`

**Package Management**
- `install_package`, `uninstall_package`, `run_script`
- `audit_packages` - Check for security vulnerabilities (npm/pip/cargo/go)
- `check_outdated` - Find packages needing updates

**Code Generation**
- `generate_test`, `scaffold_component`, `scaffold_api`, `generate_types`

**AI-Assisted**
- `explain_code`, `fix_error`, `suggest_improvements`, `convert_code`, `add_documentation`

**Security**
- `detect_secrets` - Find hardcoded keys and move to .env
- `audit_packages` - Check npm/pip/cargo for vulnerabilities

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
helios                     # Show help
helios chat                # Interactive mode (type / for menu)
helios "fix the bug"       # Single command
helios ui "dashboard"      # UI generation
```

## 🔑 Get API Keys

- **OpenRouter**: [openrouter.ai](https://openrouter.ai/keys)
- **V0**: [v0.dev/chat/settings/keys](https://v0.dev/chat/settings/keys)

## 📄 License

MIT © [akshaynstack](https://github.com/akshaynstack)

---

Built with ❤️ for **BridgeMind Vibeathon**
