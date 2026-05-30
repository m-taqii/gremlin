# 👾 Crawlix

[![npm version](https://badge.fury.io/js/crawlix.svg)](https://www.npmjs.com/package/crawlix)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/m-taqii/crawlix/pulls)

> Claw through bugs before your users do.

Crawlix is an open-source autonomous QA agent that spawns AI-powered user personas and unleashes them on your product. Each persona navigates independently, makes real decisions, hits dead ends, and finds bugs - without you writing a single test script.

---

## How it works

Crawlix spawns multiple AI agents simultaneously. Each one opens your app in a real browser, reads the UI, and navigates toward the goal exactly as that type of user would behave - including their mistakes, impatience, and confusion. When they find something broken, confusing, or unexpected - they report it.

```
  👾 Crawlix - Claw through bugs before your users do.

  target   → http://localhost:3000/
  goal     → Check the landing page is everything working fine
  agents   → First-Timer, Impatient, Power User, Adversarial, Non-Native Speaker, Slow Network

  ✓ First-Timer       2 critical · 3 warnings   18 steps · 12.3s
  ~ Impatient         1 warning                  6 steps  · 4.1s
  ✓ Power User        no findings                22 steps · 15.7s
  ✗ Adversarial       3 critical                 14 steps · 9.2s
  ~ Non-Native        106 warnings · 1 info      10 steps · 27.5s
  ~ Slow Network      no findings                4 steps  · 27.7s

  ╭──────────────────────────────────────────╮
  │  👾 Crawlix - run complete               │
  │                                          │
  │    1 critical  106 warnings  1 info      │
  │                                          │
  │    0 passed  0 stuck  6 incomplete       │
  │                                          │
  │    total time → 539.8s                   │
  ╰──────────────────────────────────────────╯

  📋 report saved → ./crawlix-reports/report-2026-05-24.md
```

No test scripts. No selectors. No maintenance.

---

## Install

```bash
npm install -g crawlix
```

---

## Setup

Run once. Crawlix asks for your LLM provider and API key - remembers it forever.

```bash
crawlix setup
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

Config is saved to `~/.crawlix/crawlix.config.json`.

---

## Usage

```bash
# run all agents against your app
crawlix run --url https://myapp.com --goal "complete the signup flow"

# run specific agent(s) only - comma separated
crawlix run --url https://myapp.com --goal "login" --agent first-timer,adversarial

# run headed - watch agents navigate in real browser
crawlix run --url https://myapp.com --goal "checkout" --headed

# control max steps per agent
crawlix run --url https://myapp.com --goal "find pricing" --steps 15

# control how many agents run in parallel
crawlix run --url https://myapp.com --goal "test signup" --concurrency 1

# use round robin across multiple providers to avoid rate limiting
crawlix run --url https://myapp.com --goal "test signup" --round-robin

# list all available agents
crawlix agents

# reconfigure your LLM provider
crawlix setup
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

Drop a JSON file into `.crawlix/agents/` in your project root:

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

Crawlix picks it up automatically on the next run. No code, no imports, no build step.

Run a specific custom agent:

```bash
crawlix run --url https://myapp.com --goal "book an appointment" --agent doctor
```

---

## Reports

After every run, Crawlix generates an AI-powered markdown report saved to `./crawlix-reports/`.

The report includes:
- Executive summary
- Critical issues with suggested fixes
- Warning patterns across agents
- Agent performance breakdown
- Prioritized recommendations

---

## Findings

Crawlix reports three severity levels:

| Severity | Meaning |
|---|---|
| `critical` | Broken element, crash, security issue, complete blocker |
| `warning` | Confusing flow, missing feedback, slow response, unclear copy |
| `info` | Minor friction, accessibility gap, copy improvement |

---

## Why no test scripts?

Traditional QA tools require you to write and maintain selectors, flows, and assertions. They break when your UI changes. They only test paths you already thought of.

Crawlix doesn't know your app. That's the point. It finds the paths you didn't think of - the ones your real users will find on their own.

---

## Contributing

Contributions are welcome - bug fixes, new agents, adapter improvements, or anything that makes it better.

### Getting started

```bash
git clone https://github.com/m-taqii/crawlix
cd crawlix
pnpm install
pnpm tsx src/cli/index.ts run --url https://example.com --goal "find the more information link"
```

### Ways to contribute

- **Add a built-in agent** - add a persona to `src/personas/index.ts` and open a PR
- **Fix a bug** - open an issue first, then a PR with the fix
- **Improve element resolution** - `src/adapters/web.ts` `resolve()` method always needs work
- **Add an adapter** - API testing, mobile, desktop - see `src/adapters/base.ts` for the interface
- **Improve the report** - `src/core/reporter.ts` - better prompts, better structure

### Before opening a PR

- Run `pnpm exec tsc --noEmit` - must be clean
- Test against a real URL
- Keep it focused - one thing per PR

### Found a bug?

Open an issue with the URL you were testing, the goal you gave, and the error output.

---

## License

MIT - see [LICENSE](LICENSE)