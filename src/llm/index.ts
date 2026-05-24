import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import type { ProviderConfig, LLMInput, LLMOutput, ProviderName } from "../types/index.js";

// Default baseURLs per provider 
const BASE_URLS: Partial<Record<ProviderName, string>> = {
    groq: 'https://api.groq.com/openai/v1',
    gemini: 'https://generativelanguage.googleapis.com/v1beta/openai',
    openrouter: 'https://openrouter.ai/api/v1',
    ollama: 'http://localhost:11434/v1',
    cerebras: 'https://api.cerebras.ai/v1',
    mistral: 'https://api.mistral.ai/v1',
}

const DEFAULT_MODELS: Record<ProviderName, string> = {
    groq: 'llama-3.3-70b-versatile',
    openai: 'gpt-4o-mini',
    gemini: 'gemini-2.5-flash',
    anthropic: 'claude-haiku-4-5-20251001',
    openrouter: 'meta-llama/llama-3.3-70b-instruct:free',
    ollama: 'llama3.2',
    cerebras: 'gpt-oss-120b',
    mistral: 'mistral-medium-3-5',
}

// Client factory 
function createClient(config: ProviderConfig): OpenAI | Anthropic {
    if (config.provider === 'anthropic') {
        return new Anthropic({ apiKey: config.apiKey })
    }

    return new OpenAI({
        apiKey: config.apiKey ?? 'no-key-needed', // ollama doesn't need a key
        baseURL: config.baseURL ?? BASE_URLS[config.provider],
    })
}

// LLM
export class LLM {
    private primaryConfig: ProviderConfig;
    private fallbackConfig?: ProviderConfig | undefined;

    private client: OpenAI | Anthropic;
    private fallbackClient?: OpenAI | Anthropic | undefined;

    constructor(primaryConfig: ProviderConfig, fallbackConfig?: ProviderConfig) {
        this.primaryConfig = primaryConfig;
        this.fallbackConfig = fallbackConfig;

        this.client = createClient(primaryConfig)
        if (fallbackConfig) {
            this.fallbackClient = createClient(fallbackConfig)
        }
    }

    async complete(input: LLMInput): Promise<LLMOutput> {
        try {
            return await this.callProvider(this.client, this.primaryConfig, input)
        } catch (err: unknown) {
            const isRateLimit =
                (err as { status?: number })?.status === 429 ||
                String(err).toLowerCase().includes('rate')

            if (isRateLimit && this.fallbackClient && this.fallbackConfig) {
                console.warn(`  👾 ${this.primaryConfig.provider} rate limited — falling back to ${this.fallbackConfig.provider}`)
                return await this.callProvider(this.fallbackClient, this.fallbackConfig, input)
            }

            throw err
        }
    }

    private async callProvider(
        client: OpenAI | Anthropic,
        config: ProviderConfig,
        input: LLMInput
    ): Promise<LLMOutput> {
        const model = config.model ?? DEFAULT_MODELS[config.provider]

        // Anthropic 
        if (client instanceof Anthropic) {
            const res = await client.messages.create({
                model,
                max_tokens: 1024,
                system: input.system,
                messages: input.messages.map(m => ({
                    role: m.role as 'user' | 'assistant',
                    content: m.content,
                })),
            })

            const block = res.content[0]
            if (!block || block.type !== 'text') {
                throw new Error('Anthropic returned empty response')
            }

            return {
                content: block.text,
                provider: config.provider,
                model,
            }
        }

        // OpenAI-compatible (Groq, Gemini, etc.)
        const res = await (client as OpenAI).chat.completions.create({
            model,
            temperature: 0.2,
            max_tokens: 1024,
            messages: [
                { role: 'system', content: input.system },
                ...input.messages.map(m => ({
                    role: m.role as 'user' | 'assistant',
                    content: m.content,
                })),
            ],
        })

        const content = res.choices[0]?.message?.content
        if (!content) throw new Error(`${config.provider} returned empty response`)

        return {
            content,
            provider: config.provider,
            model,
        }
    }
}