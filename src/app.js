/**
 * NovaDash — Frontend router & app logic
 * Loads page fragments into #content and manages sidebar state.
 */

; (function () {
	'use strict'

	// ── State ──────────────────────────────────────────────────────────────
	let currentPage = 'home'
	const isElectron = typeof window.novaDash !== 'undefined'

	// ── Boot ───────────────────────────────────────────────────────────────
	document.addEventListener('DOMContentLoaded', async () => {
		await applyPlatformClass()
		restoreTheme()
		bindSidebar()
		bindThemeToggle()
		await navigateTo('home')
	})

	// ── Platform ───────────────────────────────────────────────────────────
	async function applyPlatformClass() {
		let platform = 'unknown'
		if (isElectron) {
			platform = await window.novaDash.getPlatform()
		} else {
			// Browser fallback: detect macOS via user agent
			platform = navigator.platform.toLowerCase().includes('mac') ? 'darwin' : 'win32'
		}
		// Set on <html> so it's available as an ancestor selector for all children
		document.documentElement.classList.add('platform-' + platform)
		window.__platform = platform
	}

	// ── Sidebar ────────────────────────────────────────────────────────────
	function bindSidebar() {
		document.querySelectorAll('.nd-nav-btn[data-page]').forEach(btn => {
			btn.addEventListener('click', () => navigateTo(btn.dataset.page))
		})
	}

	function setActiveBtn(page) {
		document.querySelectorAll('.nd-nav-btn[data-page]').forEach(btn => {
			btn.classList.toggle('active', btn.dataset.page === page)
		})
	}

	// ── Router ─────────────────────────────────────────────────────────────
	async function navigateTo(page) {
		currentPage = page
		setActiveBtn(page)

		const content = document.getElementById('content')
		content.innerHTML = '<div class="d-flex align-items-center justify-content-center h-100 text-secondary"><div class="spinner-border spinner-border-sm me-2"></div> Loading…</div>'

		try {
			// Pages live at pages/<page>.html relative to index.html
			const res = await fetch('pages/' + page + '.html')
			if (!res.ok) throw new Error('Page not found: ' + page)
			const html = await res.text()
			content.innerHTML = html

			// Run any inline init function the page exposes
			if (typeof window['initPage_' + page] === 'function') {
				window['initPage_' + page]()
			}
		} catch (err) {
			content.innerHTML = notFoundTemplate(page)
			console.warn(err)
		}
	}

	function notFoundTemplate(page) {
		return `
      <div class="nd-placeholder h-100">
        <i class="bi bi-exclamation-triangle"></i>
        <h2>Page not found</h2>
        <p>Could not load <code>pages/${page}.html</code></p>
      </div>`
	}

	// ── Theme ──────────────────────────────────────────────────────────────
	function restoreTheme() {
		const saved = localStorage.getItem('nd-theme') || 'dark'
		applyTheme(saved)
	}

	function applyTheme(theme) {
		document.documentElement.setAttribute('data-bs-theme', theme)
		const icon = document.getElementById('theme-icon')
		if (icon) {
			icon.className = theme === 'dark' ? 'bi bi-moon-stars-fill' : 'bi bi-sun-fill'
		}
		localStorage.setItem('nd-theme', theme)
		if (isElectron) {
			window.novaDash.settings.set('theme', theme).catch(() => { })
		}
	}

	function bindThemeToggle() {
		const btn = document.getElementById('theme-toggle')
		if (!btn) return
		btn.addEventListener('click', () => {
			const current = document.documentElement.getAttribute('data-bs-theme')
			applyTheme(current === 'dark' ? 'light' : 'dark')
		})
	}

	// ── Expose for page scripts ────────────────────────────────────────────
	window.novaDashApp = { navigateTo }
})()
