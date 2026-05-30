import { Command } from 'commander'
import { select, input, password, confirm } from '@inquirer/prompts'
import fs from 'fs'
import os from 'os'
import path from 'path'
import type { ProviderConfig, ProviderName, QlawConfig } from '../../types/index.js'

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

async function setupProvider(label: string): Promise<ProviderConfig> {
    const provider = await select<ProviderName>({
        message: `Select ${label} provider`,
        choices: [
            { name: 'Groq', value: 'groq' },
            { name: 'Gemini', value: 'gemini' },
            { name: 'Cerebras', value: 'cerebras' },
            { name: 'Mistral', value: 'mistral' },
            { name: 'OpenRouter', value: 'openrouter' },
            { name: 'Ollama', value: 'ollama' },
            { name: 'OpenAI', value: 'openai' },
            { name: 'Anthropic', value: 'anthropic' },
        ]
    })

    let apiKey: string | undefined

    if (provider === 'ollama') {
        console.log('  ✓ Ollama runs locally — no API key needed')
    } else {
        apiKey = await password({
            message: `Enter your ${provider} API key:`,
            validate: v => v.trim().length > 0 ? true : 'API key cannot be empty'
        })
    }

    const defaultModel: string = DEFAULT_MODELS[provider]
    const customModel: string = await input({
        message: `Model to use (press enter for default: ${defaultModel}):`,
    })

    const config: ProviderConfig = {
        provider,
        ...(apiKey && { apiKey }),
        ...(customModel.trim().length > 0 && { model: customModel.trim() }),
    }

    return config
}

export const setupCommand = new Command('setup')
    .description('Configure your LLM provider')
    .action(async () => {
        console.log('\n  👾 qlaw setup\n')

        const primary = await setupProvider('primary')

        const wantsFallback = await confirm({
            message: 'Add a fallback provider?',
            default: false,
        })

        let fallback: ProviderConfig | undefined
        if (wantsFallback) {
            fallback = await setupProvider('fallback')
        }

        // after fallback setup
        const wantsRoundRobin = await confirm({
            message: 'Add round robin providers to spread load across multiple providers?',
            default: false,
        })

        const roundRobin: ProviderConfig[] = []

        if (wantsRoundRobin) {
            console.log('\n  Add providers one by one. Press N when done.\n')

            let addMore = true
            while (addMore) {
                const provider = await setupProvider(`round robin #${roundRobin.length + 1}`)
                roundRobin.push(provider)
                addMore = await confirm({ message: 'Add another provider?', default: false })
            }
        }

        // build config
        const qlawConfig: QlawConfig = {
            primary,
            ...(fallback && { fallback }),
            ...(roundRobin.length > 0 && { roundRobin }),
        }

        // save to ~/.qlaw/qlaw.config.json
        const configDir = path.join(os.homedir(), '.qlaw')
        const configPath = path.join(configDir, 'qlaw.config.json')

        fs.mkdirSync(configDir, { recursive: true })
        fs.writeFileSync(configPath, JSON.stringify(qlawConfig, null, 2))

        console.log('\n  ✓ Config saved to', configPath)
        console.log('  Run qlaw run --url <url> --goal "<goal>" to start testing\n')
    })