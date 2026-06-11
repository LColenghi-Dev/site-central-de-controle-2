import { chromium } from 'playwright'

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()

// Set auth e navega pro dashboard
await page.goto('http://localhost:5199/')
await page.evaluate(() => sessionStorage.setItem('marazul_auth', '1'))
await page.goto('http://localhost:5199/dashboard')

// Aguarda o loader sumir (ele leva ~3.2s total)
// Espera pelo elemento .loader desaparecer do DOM
await page.waitForFunction(() => !document.querySelector('.loader'), { timeout: 8000 }).catch(() => {})
// Dá mais 1.5s pros contadores animarem
await page.waitForTimeout(1500)
await page.screenshot({ path: 'c:/Users/User/Downloads/dashboard-visao.png' })
console.log('✓ Visão Geral')

// Tráfego Pago
await page.click('button:has-text("Tráfego Pago")')
await page.waitForTimeout(1200)
await page.screenshot({ path: 'c:/Users/User/Downloads/dashboard-trafego.png' })
console.log('✓ Tráfego Pago')

// Projetos
await page.click('button:has-text("Projetos")')
await page.waitForTimeout(800)
await page.screenshot({ path: 'c:/Users/User/Downloads/dashboard-projetos.png' })
console.log('✓ Projetos')

// Automações
await page.click('button:has-text("Automações")')
await page.waitForTimeout(800)
await page.screenshot({ path: 'c:/Users/User/Downloads/dashboard-auto.png' })
console.log('✓ Automações')

await browser.close()
console.log('\nDone — 4 screenshots em Downloads/')
