//  Gremlin — Types

// Actions 
export type ActionType = | 'open' | 'click' | 'type' | 'scroll' | 'select' | 'hover' | 'press'| 'wait'| 'done' | 'stuck'    

export interface Action {
  type:       ActionType
  target?:    string   // element description e.g. "Submit button"
  value?:     string   // text to type, url, key to press, scroll direction
  reasoning:  string   // why this action — one sentence
  finding?:   Finding  // bug or issue spotted at this step
}

// Findings 
export interface Finding {
  severity:    'critical' | 'warning' | 'info'
  description: string
  element?:    string
  screenshot?: string  // path - attached by runner
  step?:       number
}

// Page State 
export interface PageState {
  url?:       string   // undefined for native apps
  title?:     string
  tree:       string   // extracted UI elements as text
  timestamp:  number
}

// History 
export interface HistoryEntry {
  step:      number
  pageState: PageState
  action:    Action
}

// User Persona for Ai Tester
export interface PersonaConfig {
  name:        string
  description: string
  prompt:      string 
  maxSteps:    number
}

// LLM Provider Config
export type ProviderName = | 'groq' | 'openai' | 'anthropic' | 'gemini' | 'openrouter' | 'ollama' | 'cerebras' | 'mistral';

export interface ProviderConfig {
  provider: ProviderName
  apiKey?:  string
  model?:   string
  baseURL?: string
}

export interface LLMInput {
  system:   string
  messages: LLMMessage[]
}

export interface LLMMessage {
  role:    'user' | 'assistant'
  content: string
}

export interface LLMOutput {
  content:  string
  provider: ProviderName
  model:    string
}

// Gremlin Config (saved at ~/.gremlin/gremlin.config.json) 
export interface GremlinConfig {
  primary:   ProviderConfig
  fallback?: ProviderConfig
}

// Run Result 
export interface RunResult {
  persona:     string
  url:         string
  goal:        string
  steps:       number
  findings:    Finding[]
  goalReached: boolean
  stuck:       boolean
  duration:    number      // ms
  history:     HistoryEntry[]
}