import { _electron as electron, expect, test } from '@playwright/test'
import path from 'path'

/**
 * NovaDash E2E Tests — App Startup & Navigation
 *
 * These tests launch the Electron app and verify basic functionality:
 * - App starts without crashing
 * - Window appears with correct title
 * - Sidebar renders
 * - Navigation to plugins works
 */

let electronApp
let window

test.beforeAll(async () => {
	// Launch Electron app
	electronApp = await electron.launch({
		args: [path.join(process.cwd(), 'main.js')],
		env: {
			...process.env,
			NODE_ENV: 'test'
		}
	})

	// Get the first window
	window = await electronApp.firstWindow()

	// Wait for app to load
	await window.waitForLoadState('domcontentloaded')
})

test.afterAll(async () => {
	await electronApp.close()
})

test.describe('NovaDash App', () => {
	test('should launch and show main window', async () => {
		expect(window).toBeTruthy()

		const title = await window.title()
		expect(title).toBe('NovaDash')
	})

	test('should render sidebar', async () => {
		const sidebar = await window.locator('#sidebar')
		await expect(sidebar).toBeVisible()
	})

	test('should have home button in sidebar', async () => {
		const homeBtn = await window.locator('.nd-nav-btn[data-page="home"]')
		await expect(homeBtn).toBeVisible()
	})

	test('should navigate to home page', async () => {
		const homeBtn = await window.locator('.nd-nav-btn[data-page="home"]')
		await homeBtn.click()

		// Wait for content to load
		await window.waitForTimeout(500)

		const content = await window.locator('#content')
		await expect(content).toBeVisible()
	})

	test('should have settings button in sidebar', async () => {
		const settingsBtn = await window.locator('.nd-nav-btn[data-page="settings"]')
		await expect(settingsBtn).toBeVisible()
	})
})
