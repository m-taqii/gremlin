import { getBrowser, closeBrowser } from "../lib/browser.js";
import { Director } from "./director.js";
import { Runner } from "./runner.js";
import { WebAdapter } from "../adapters/web.js";
import type { LLM } from "../llm/index.js";
import type { PersonaConfig, RunResult } from "../types/index.js";

export interface OrchestratorConfig {
    url: string
    goal: string
    llm: LLM
    personas: PersonaConfig[]
    maxSteps?: number
    concurrency?: number
    headless?: boolean
}

export class Orchestrator {
    private url: string;
    private goal: string;
    private llm: LLM;
    private personas: PersonaConfig[];
    private maxSteps: number;
    private concurrency: number;
    private headless: boolean;

    constructor(config: OrchestratorConfig) {
        this.url = config.url;
        this.goal = config.goal;
        this.llm = config.llm;
        this.personas = config.personas;
        this.maxSteps = config.maxSteps || 10;
        this.concurrency = config.concurrency || 2;
        this.headless = config.headless || true;
    }

    async run(): Promise<RunResult[]> {
        const browser = await getBrowser(this.headless)
        const allResults: RunResult[] = []

        try {
            for (let i = 0; i < this.personas.length; i += this.concurrency) {
                const batch = this.personas.slice(i, i + this.concurrency)

                const results = await Promise.all(
                    batch.map(async persona => {
                        const context = await browser.newContext()
                        const page = await context.newPage()

                        try {
                            const adapter = new WebAdapter(page)
                            const director = new Director(persona, this.llm, this.goal)
                            const runner = new Runner(adapter, director, this.url, this.goal, this.maxSteps)
                            return await runner.run()
                        } finally {
                            await page.close()
                            await context.close()  
                        }
                    })
                )

                allResults.push(...results)
            }

            return allResults

        } catch (err) {
            console.error(`Error during orchestration: ${err}`)
            return []
        } finally {
            await closeBrowser()
        }
    }
}