import { _electron as electron, expect, test } from '@playwright/test'
import path from 'path'

/**
 * NovaDash E2E Tests — STT Plugin
 *
 * Tests for Speech-to-Text plugin functionality:
 * - Navigation to STT page works
 * - UI elements render correctly
 * - Controls are functional
 */

let electronApp
let window

test.beforeAll(async () => {
	electronApp = await electron.launch({
		args: [path.join(process.cwd(), 'main.js')],
		env: {
			...process.env,
			NODE_ENV: 'test'
		}
	})

	window = await electronApp.firstWindow()
	await window.waitForLoadState('domcontentloaded')
})

test.afterAll(async () => {
	await electronApp.close()
})

test.describe('STT Plugin', () => {
	test.beforeEach(async () => {
		// Navigate to STT page before each test
		const sttBtn = await window.locator('.nd-nav-btn[data-page="stt"]')

		// Check if STT button exists (might be disabled on some platforms)
		const isVisible = await sttBtn.isVisible().catch(() => false)

		if (!isVisible) {
			test.skip('STT plugin not available on this platform')
		}

		await sttBtn.click()
		await window.waitForTimeout(500)
	})

	test('should navigate to STT page', async () => {
		const content = await window.locator('#content')
		await expect(content).toBeVisible()

		// Check if STT-specific content loaded
		const heading = await window.locator('h2:has-text("Speech to Text")')
		await expect(heading).toBeVisible()
	})

	test('should show record button', async () => {
		const recordBtn = await window.locator('#record-btn')
		await expect(recordBtn).toBeVisible()
		await expect(recordBtn).toBeEnabled()
	})

	test('should show model selector', async () => {
		const modelSelect = await window.locator('#model-size-select')
		await expect(modelSelect).toBeVisible()
	})

	test('should show language selector', async () => {
		const langSelect = await window.locator('#language-select')
		await expect(langSelect).toBeVisible()
	})

	test('should show voice activity indicator', async () => {
		const voiceIndicator = await window.locator('#voice-indicator')
		await expect(voiceIndicator).toBeVisible()
	})

	test('should show history section', async () => {
		const historySection = await window.locator('#history-list')
		await expect(historySection).toBeVisible()
	})

	test('should have search input for history', async () => {
		const searchInput = await window.locator('#history-search')
		await expect(searchInput).toBeVisible()
	})

	test('should not show errors on page load', async () => {
		// Check for any error messages
		const errorMsg = await window.locator('text=/error|fout|failed/i').count()
		expect(errorMsg).toBe(0)
	})
})
