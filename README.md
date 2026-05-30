# 👾 Qlaw

> Claw through bugs before your users do.

Qlaw is an open-source autonomous QA agent that spawns AI-powered user personas and unleashes them on your product. Each persona navigates independently, makes real decisions, hits dead ends, and finds bugs — without you writing a single test script.

---

## How it works

Qlaw spawns multiple AI agents simultaneously. Each one opens your app in a real browser, reads the UI, and navigates toward the goal exactly as that type of user would behave — including their mistakes, impatience, and confusion. When they find something broken, confusing, or unexpected — they report it.

```
  👾 Qlaw — Claw through bugs before your users do.

  target   → http://localhost:3000/
  goal     → Check the landing page is everything working fine
  agents   → First-Timer, Impatient, Power User, Adversarial, Non-Native Speaker, Slow Network

  ✓ First-Timer       2 critical · 3 warnings   18 steps · 12.3s
  ~ Impatient         1 warning                  6 steps  · 4.1s
  ✓ Power User        no findings                22 steps · 15.7s
  ✗ Adversarial       3 critical                 14 steps · 9.2s
  ~ Non-Native        106 warnings · 1 info      10 steps · 27.5s
  ~ Slow Network      no findings                4 steps  · 27.7s

  ╭──────────────────────────────────────╮
  │ 👾 Qlaw — run complete               │
  │                                      │
  │   1 critical  106 warnings  1 info   │
  │                                      │
  │   0 passed  0 stuck  6 incomplete    │
  │                                      │
  │   total time → 539.8s                │
  ╰──────────────────────────────────────╯
```

No test scripts. No selectors. No maintenance.

---

## Install

```bash
npm install -g qlaw
```

---

## Setup

Run once. Qlaw asks for your LLM provider and API key — remembers it forever.

```bash
qlaw setup
```

Supported providers:

- Groq
- Gemini
- Cerebras
- Mistral
- OpenRouter
- Ollama
- OpenAI
- Anthropic

Config is saved to `~/.qlaw/qlaw.config.json`.

---

## Usage

```bash
# run all agents against your app
qlaw run --url https://myapp.com --goal "complete the signup flow"

# run specific agents only
qlaw run --url https://myapp.com --goal "login" --agent first-timer,adversarial

# run headed — watch agents navigate in real browser
qlaw run --url https://myapp.com --goal "checkout" --headed

# control steps and concurrency
qlaw run --url https://myapp.com --goal "find pricing" --steps 15 --concurrency 1

# list all available agents
qlaw agents
```

---

## Built-in agents

| Agent | Behavior |
|---|---|
| `first-timer` | Never seen this app. Reads nothing. Clicks whatever looks obvious. |
| `impatient` | Skips everything. Rage-clicks. Abandons if stuck for more than 2 steps. |
| `power-user` | Tries every edge case, advanced flow, and keyboard shortcut. |
| `adversarial` | SQL injection, XSS attempts, wrong inputs, broken sequences. |
| `non-native` | Misreads labels, confused by idioms. Tests copy clarity ruthlessly. |
| `slow-network` | Throttled connection. Finds missing loading states and timeouts. |

---

## Custom agents

Drop a JSON file into `.qlaw/agents/` in your project root:

```json
{
  "name": "doctor",
  "description": "Medical professional, time-pressured, technically literate",
  "systemPrompt": "You are a busy doctor with 2 minutes between patients. You know what you want, you don't read instructions, and you get frustrated fast if the UI isn't obvious.",
  "patience": 4,
  "aggression": 3,
  "readingBehavior": "skim"
}
```

Qlaw picks it up automatically on the next run. No code, no imports, no build step.

Run a specific custom agent:

```bash
qlaw run --url https://myapp.com --goal "book an appointment" --agent doctor
```

---

## Findings

Qlaw reports three severity levels:

| Severity | Meaning |
|---|---|
| `critical` | Broken element, crash, security issue, complete blocker |
| `warning` | Confusing flow, missing feedback, slow response, unclear copy |
| `info` | Minor friction, accessibility gap, copy improvement |

---

## Why no test scripts?

Traditional QA tools require you to write and maintain selectors, flows, and assertions. They break when your UI changes. They only test paths you already thought of.

Qlaw doesn't know your app. That's the point. It finds the paths you didn't think of — the ones your real users will find on their own.

---

## Contributing

```bash
git clone https://github.com/m-taqii/qlaw
cd qlaw
pnpm install
pnpm tsx src/cli/index.ts run --url https://example.com --goal "find the more information link"
```



---

## License

MIT - see [LICENSE](LICENSE)