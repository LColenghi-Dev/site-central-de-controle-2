import { chromium } from 'playwright'

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()

await page.goto('http://localhost:5199/')
await page.evaluate(() => sessionStorage.setItem('marazul_auth', '1'))
await page.goto('http://localhost:5199/dashboard')

// Aguarda loader sumir
await page.waitForFunction(() => !document.querySelector('.loader'), { timeout: 8000 }).catch(() => {})
await page.waitForTimeout(600)

// Clica na aba Automações
await page.click('button:has-text("Automações")')

// Aguarda os dados do n8n carregarem (até 5s)
await page.waitForFunction(() => {
  const dot = document.querySelector('.cc-n8n-conn-dot')
  const statVals = document.querySelectorAll('.cc-n8n-stat__val')
  return dot && statVals.length > 0
}, { timeout: 5000 }).catch(() => {})

await page.waitForTimeout(800)
await page.screenshot({ path: 'c:/Users/User/Downloads/auto-final.png', fullPage: false })
console.log('✓ Screenshot salvo: Downloads/auto-final.png')

await browser.close()
