import { chromium } from 'playwright'

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()

await page.goto('http://localhost:5199/')
await page.evaluate(() => sessionStorage.setItem('marazul_auth', '1'))
await page.goto('http://localhost:5199/dashboard')

// Aguarda loader sumir
await page.waitForFunction(() => !document.querySelector('.loader'), { timeout: 8000 }).catch(() => {})

// Aguarda os dados do n8n carregarem no widget (substitui "…" pelos valores reais)
await page.waitForFunction(() => {
  const vals = [...document.querySelectorAll('.vg-widget__row-val')]
  return vals.some(v => v.textContent !== '…')
}, { timeout: 6000 }).catch(() => {})

// Dá tempo pras animações dos KPIs
await page.waitForTimeout(1600)
await page.screenshot({ path: 'c:/Users/User/Downloads/visao-n8n-live.png', fullPage: false })
console.log('✓ Screenshot: Downloads/visao-n8n-live.png')

await browser.close()
