import type { Action, HistoryEntry, LLMInput, PageState, PersonaConfig } from "../types/index.js";
import { LLM } from "../llm/index.js";

export class Director {
    private persona: PersonaConfig;
    private llm: LLM;
    private goal: string;

    constructor(persona: PersonaConfig, llm: LLM, goal: string) {
        this.persona = persona;
        this.llm = llm;
        this.goal = goal;
    }

    private buildSystemPrompt(): string {
        return `You are an autonomous QA agent embodying the following user persona.

PERSONA: ${this.persona.name}
DESCRIPTION: ${this.persona.description}

BEHAVIOR:
${this.persona.systemPrompt}

BEHAVIORAL MODIFIERS:
- Patience level: ${this.persona.patience}/10 — ${this.persona.patience <= 3 ? 'give up quickly if stuck' : this.persona.patience >= 8 ? 'persist through difficulties' : 'try a few times before giving up'}
- Aggression level: ${this.persona.aggression}/10 — ${this.persona.aggression >= 8 ? 'actively try to break things' : this.persona.aggression <= 2 ? 'interact gently and carefully' : 'interact normally'}
- Reading behavior: ${this.persona.readingBehavior === 'thorough' ? 'read everything on the page before acting' : this.persona.readingBehavior === 'skim' ? 'skim text quickly, catch main points only' : 'skip all text, act on visual cues only'}

RESPONSE RULES:
You must always respond with valid JSON only. No explanation outside JSON.

{
  "type": "open" | "click" | "type" | "scroll" | "select" | "hover" | "press" | "wait" | "done" | "stuck",
  "target": "element description",
  "value": "text to type / key to press / scroll direction / url to open",
  "reasoning": "one sentence why",
  "finding": {
    "severity": "critical" | "warning" | "info",
    "description": "what you observed",
    "element": "which element"
  }
}

Set "finding" to null if nothing notable this step.
Set "type" to "done" only when goal is fully complete.
Set "type" to "stuck" only after ${this.persona.patience <= 3 ? '2' : this.persona.patience <= 6 ? '3' : '4'} failed attempts on the same step.`
    }

    private buildUserMessage(pageState: PageState, history: HistoryEntry[]): string {
        const header = [
            pageState.url ? `Current URL: ${pageState.url}` : null,
            pageState.title ? `Current Title: ${pageState.title}` : null,
        ].filter(Boolean).join('\n')

        const historyText = history.length === 0
            ? 'No actions yet — this is your first step.'
            : history.slice(-10).map(e =>
                `[${String(e.step).padStart(2, '0')}] ${e.action.type.toUpperCase().padEnd(8)} ` +
                `${e.action.target ?? '—'} ` +
                `${e.action.value ? `"${e.action.value}"` : ''} ` +
                `→ ${e.action.reasoning}` +
                (e.action.finding ? ` ⚠ ${e.action.finding.severity.toUpperCase()}: ${e.action.finding.description}` : '')
            ).join('\n')

        return [
            `GOAL: ${this.goal}`,
            '',
            header,
            '',
            '── PAGE ELEMENTS ──────────────────────────',
            pageState.tree,
            '',
            '── HISTORY ────────────────────────────────',
            historyText,
            '',
            'What is your next action?',
        ].join('\n')
    }

    private parseAction(raw: string): Action {
        const cleaned = raw
            .replace(/^```(?:json)?\n?/m, '')
            .replace(/\n?```$/m, '')
            .trim()

        let parsed: Record<string, unknown>
        try {
            parsed = JSON.parse(cleaned)
        } catch {
            throw new Error(`Qlaw: received non-JSON response:\n${raw}`)
        }

        if (!parsed['type'] || typeof parsed['type'] !== 'string') {
            throw new Error(`Qlaw: missing "type" in response:\n${raw}`)
        }
        if (!parsed['reasoning'] || typeof parsed['reasoning'] !== 'string') {
            throw new Error(`Qlaw: missing "reasoning" in response:\n${raw}`)
        }

        return parsed as unknown as Action
    }

    public async decide(pageState: PageState, history: HistoryEntry[]): Promise<Action> {
        const input: LLMInput = {
            system: this.buildSystemPrompt(),
            messages: [{ role: 'user', content: this.buildUserMessage(pageState, history) }]
        }

        const response = await this.llm.complete(input)
        return this.parseAction(response.content)
    }
}