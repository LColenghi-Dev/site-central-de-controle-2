import { chromium } from 'playwright'

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()

// Login page
await page.goto('http://localhost:5199/login')
await page.waitForTimeout(1200)
await page.screenshot({ path: 'c:/Users/User/Downloads/layout-review-login.png' })
console.log('✓ login')

// Set auth and go to dashboard
await page.evaluate(() => sessionStorage.setItem('marazul_auth', '1'))
await page.goto('http://localhost:5199/dashboard')
await page.waitForFunction(() => !document.querySelector('.loader'), { timeout: 8000 }).catch(() => {})
await page.waitForTimeout(1800)
await page.screenshot({ path: 'c:/Users/User/Downloads/layout-review-visao.png' })
console.log('✓ Visão Geral')

await page.click('button:has-text("Tráfego Pago")')
await page.waitForTimeout(600)
await page.screenshot({ path: 'c:/Users/User/Downloads/layout-review-trafego.png' })
console.log('✓ Tráfego Pago')

await page.click('button:has-text("Projetos")')
await page.waitForTimeout(600)
await page.screenshot({ path: 'c:/Users/User/Downloads/layout-review-projetos.png' })
console.log('✓ Projetos')

await page.click('button:has-text("Automações")')
await page.waitForTimeout(900)
await page.screenshot({ path: 'c:/Users/User/Downloads/layout-review-auto.png' })
console.log('✓ Automações')

await browser.close()
console.log('\nDone.')
