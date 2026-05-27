import type { Page } from 'playwright'
import type { PageState } from '../types/index.js'

export class Extractor {
  async extract(page: Page): Promise<PageState> {
    const url   = page.url()
    const title = await page.title().catch(() => undefined)

    // runs inside the browser - queries DOM directly
    const tree = await page.evaluate(() => {
      const selector = [
        'button', 'a[href]', 'input', 'select', 'textarea',
        '[role="button"]', '[role="link"]', '[role="tab"]',
        '[role="menuitem"]', '[role="checkbox"]', '[role="radio"]',
        '[tabindex]:not([tabindex="-1"])',
      ].join(', ')

      return Array.from(document.querySelectorAll(selector))
        .filter(el => {
          // visible only
          const rect = el.getBoundingClientRect()
          return rect.width > 0 && rect.height > 0
        })
        .slice(0, 60)  // cap at 60
        .map((el, i) => {
          const tag   = el.tagName.toLowerCase()
          const role  = el.getAttribute('role') ?? tag
          const label = (
            el.getAttribute('aria-label') ??
            el.getAttribute('placeholder') ??
            el.getAttribute('title') ??
            el.textContent?.trim().slice(0, 60) ??
            ''
          ).trim()
          const type = el.getAttribute('type') ?? ''
          const name = el.getAttribute('name') ?? ''

          return `[${String(i + 1).padStart(2, '0')}] ${role.padEnd(12)} ${label}${type ? ` (${type})` : ''}${name ? ` name="${name}"` : ''}`
        })
        .join('\n')
    })

    return {
      url,
      title,
      tree:      tree || '(no interactive elements found)',
      timestamp: Date.now(),
    }
  }
}