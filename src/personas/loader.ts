import { PERSONAS } from './index.js'
import type { PersonaConfig } from '../types/index.js'
import fs from 'fs'
import path from 'path'

function isValidPersona(config: unknown): config is PersonaConfig {
    const c = config as Record<string, unknown>
    return (
        typeof c.name === 'string' &&
        typeof c.description === 'string' &&
        typeof c.systemPrompt === 'string' &&
        typeof c.patience === 'number' &&
        typeof c.aggression === 'number' &&
        ['thorough', 'skim', 'skip'].includes(c.readingBehavior as string)
    )
}

async function loadCustomPersonas(): Promise<PersonaConfig[]> {
  const dir = path.resolve(process.cwd(), '.gremlin/agents/')
  if (!fs.existsSync(dir)) return []

  const result: PersonaConfig[] = []
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'))

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(dir, file), 'utf-8')
      const config  = JSON.parse(content)

      if (isValidPersona(config)) {
        result.push(config)
      } else {
        console.warn(`👾 skipping ${file} — missing or invalid fields`)
      }
    } catch {
      console.warn(`👾 skipping ${file} — invalid JSON`)
    }
  }

  return result
}

export async function loadPersonas(agentFlag?: string): Promise<PersonaConfig[]> {
    const builtIns = Object.values(PERSONAS)

    // if --agent is specified, only load those 
    if (agentFlag) {
        const requested = agentFlag.split(',').map(a => a.trim().toLowerCase())

        const customs = await loadCustomPersonas()

        const allPersonas = [
            ...Object.values(PERSONAS),
            ...customs
        ]

        return requested.map(name => {
            const found = allPersonas.find(p => p.name.toLowerCase() === name)
            if (!found) throw new Error(
                `Unknown agent "${name}". Run 'gremlin agents --list' to see available agents.`
            )
            return found
        })
    }

    const customs = await loadCustomPersonas()

    return [...builtIns, ...customs]
}

export async function listPersonas() {
    const personas = await loadPersonas()
    console.log('Available Personas:')
    personas.forEach(p => {
        console.log(`- ${p.name}: ${p.description}`)
    })
}