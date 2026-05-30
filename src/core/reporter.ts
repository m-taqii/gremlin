import type { LLMInput, RunResult } from '../types/index.js'
import { LLM } from '../llm/index.js'
import fs from 'fs'
import path from 'path'

const REPORT_SYSTEM_PROMPT = `You are a senior QA analyst reviewing results from an autonomous AI testing session.

Your job is to turn raw test findings into a clear, actionable markdown report that a developer can read and immediately understand what to fix.

REPORT STRUCTURE — follow this exactly:

# Qlaw Report

## Overview
- URL tested
- Goal
- Agents run
- Total findings
- Time taken

## Critical Issues
List every critical finding. For each one:
- What broke
- Which agent found it
- Why it matters
- Suggested fix

## Warnings
Group similar warnings together. For each group:
- What the pattern is
- How many agents hit it
- Suggested fix

## Patterns
Findings that multiple agents experienced — these are the most important UX problems because real users of different types all hit them.

## Agent Performance
One line per agent — goal reached, steps taken, findings count, notable observations.

## Recommendations
Top 3-5 things to fix first, ordered by impact.

---

RULES:
- Be specific — name the element, describe the exact problem
- Be actionable — every finding should have a suggested fix
- Be concise — no filler, no generic advice
- Use proper markdown — headers, bullet points, code blocks where relevant
- If no critical issues found — say so clearly
- Write for a developer who will act on this immediately

RESPONSE RULES:
You must always respond with valid JSON only. No explanation outside JSON.

{
  "title": "Short report title for report filename",
  "report": "Complete markdown report content following the structure and rules above",
  }
}`

// formats all results into structured text for the LLM
function buildReportPrompt(results: RunResult[], url: string, goal: string): LLMInput {
    const totalFindings = results.flatMap(r => r.findings).length
    const totalDuration = results.reduce((acc, r) => acc + r.duration, 0)

    // summary context as first message
    const summary = {
        role: 'user' as const,
        content: [
            `URL: ${url}`,
            `Goal: ${goal}`,
            `Agents run: ${results.length}`,
            `Total findings: ${totalFindings}`,
            `Total duration: ${(totalDuration / 1000).toFixed(1)}s`,
        ].join('\n')
    }

    // one message per agent
    const agentMessages = results.map(result => {
        const findingsText = result.findings.length === 0
            ? 'No findings.'
            : result.findings
                .map(f => `- [${f.severity}] ${f.description}${f.element ? ` — element: ${f.element}` : ''}`)
                .join('\n')

        return {
            role: 'user' as const,
            content: [
                `Agent: ${result.persona}`,
                `Goal reached: ${result.goalReached}`,
                `Stuck: ${result.stuck}`,
                `Steps taken: ${result.steps}`,
                `Duration: ${(result.duration / 1000).toFixed(1)}s`,
                `Findings:\n${findingsText}`,
            ].join('\n')
        }
    })

    // final instruction
    const instruction = {
        role: 'user' as const,
        content: 'Generate the full QA report based on the above results.'
    }

    return {
        system: REPORT_SYSTEM_PROMPT,
        messages: [summary, ...agentMessages, instruction]
    }
}

// generates the report using LLM
export async function generateReport(
    results: RunResult[],
    url: string,
    goal: string,
    llm: LLM
): Promise<{ title: string; report: string }> {
    const prompt = buildReportPrompt(results, url, goal);
    const output = await llm.complete(prompt);
    const cleaned = output.content
        .replace(/^```(?:json)?\n?/m, '')
        .replace(/\n?```$/m, '')
        .trim()
    try {
        const parsed = JSON.parse(cleaned) as { title: string; report: string }
        return parsed
    } catch {
        return { title: 'qlaw-report', report: output.content }
    }
}

// saves report to ./qlaw-reports/
export function saveReport(title: string, content: string): string {
    const reportsDir = path.join(process.cwd(), 'qlaw-reports')

    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true })
    }
    const safeTitle = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '')
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `report-${safeTitle}-${timestamp}.md`
    const filepath = path.join(reportsDir, filename)

    fs.writeFileSync(filepath, content)
    return filepath
}