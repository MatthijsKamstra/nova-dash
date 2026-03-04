/**
 * NovaDash — Frontend router & app logic
 * Loads page fragments into #content and manages sidebar state.
 */

; (function () {
	'use strict'

	// ── State ──────────────────────────────────────────────────────────────
	let currentPage = 'home'
	const isElectron = typeof window.novaDash !== 'undefined'
	let sidebarBound = false

	// ── Boot ───────────────────────────────────────────────────────────────
	document.addEventListener('DOMContentLoaded', async () => {
		await applyPlatformClass()
		restoreTheme()
		await window.loadPlugins()           // Load plugin manifests
		await renderPluginsSidebar()
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
	/**
	 * Render sidebar buttons based on enabled plugins
	 */
	async function renderPluginsSidebar() {
		const top = document.querySelector('.nd-sidebar-top')
		if (!top) {
			return
		}

		// Ensure plugins are loaded
		if (!window.PLUGINS || window.PLUGINS.length === 0) {
			await window.loadPlugins()
		}

		const enabledPlugins = await window.getEnabledPlugins()

		const homeBtn = top.querySelector('.nd-nav-btn[data-page="home"]')
		if (!homeBtn) {
			return
		}

		// Keep home & divider, remove old plugin buttons
		const oldButtons = top.querySelectorAll('.nd-nav-btn[data-page]:not([data-page="home"])')
		oldButtons.forEach(btn => btn.remove())

		const oldDividers = top.querySelectorAll('.nd-sidebar-divider')
		oldDividers.forEach(div => div.remove())

		// Insert divider after home
		if (homeBtn && homeBtn.nextSibling) {
			const divider = document.createElement('div')
			divider.className = 'nd-sidebar-divider'
			homeBtn.parentNode.insertBefore(divider, homeBtn.nextSibling)
		}

		// Add enabled plugin buttons
		enabledPlugins.forEach(plugin => {
			const btn = document.createElement('button')
			btn.className = 'nd-nav-btn'
			btn.setAttribute('data-page', plugin.page)
			btn.setAttribute('title', plugin.label)
			btn.innerHTML = `<i class="bi ${plugin.icon}"></i>`
			top.appendChild(btn)
		})

		// Add another divider before settings
		const divider = document.createElement('div')
		divider.className = 'nd-sidebar-divider'
		top.appendChild(divider)
	}

	function bindSidebar() {
		if (sidebarBound) return
		const sidebar = document.getElementById('sidebar')
		if (!sidebar) return

		sidebar.addEventListener('click', (event) => {
			const btn = event.target.closest('.nd-nav-btn[data-page]')
			if (!btn) return
			navigateTo(btn.dataset.page)
		})

		sidebarBound = true
	}

	function executePageScripts(container) {
		const scripts = container.querySelectorAll('script')
		scripts.forEach(oldScript => {
			const newScript = document.createElement('script')
			for (const attr of oldScript.attributes) {
				newScript.setAttribute(attr.name, attr.value)
			}
			newScript.textContent = oldScript.textContent
			oldScript.replaceWith(newScript)
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
			// Ensure plugins are loaded
			if (!window.PLUGINS || window.PLUGINS.length === 0) {
				await window.loadPlugins()
			}

			// SPECIAL PAGES (handleiden niet als plugins):
			// - 'home' -> pages/home/page.html
			// - 'settings' -> pages/settings/page.html
			const specialPages = ['home', 'settings']
			const isSpecialPage = specialPages.includes(page)

			// Check if it's a plugin
			const isPlugin = !isSpecialPage && window.PLUGINS && window.PLUGINS.some(p => p.page === page)

			const path = isPlugin
				? `plugins/${page}/plugin.html`
				: `pages/${page}/page.html`

			const res = await fetch(path)
			if (!res.ok) {
				throw new Error('Page not found: ' + path)
			}

			const html = await res.text()
			content.innerHTML = html
			executePageScripts(content)

			// Run any inline init function the page exposes
			// Replace hyphens with underscores for function name
			const funcName = 'initPage_' + page.replace(/-/g, '_')
			if (typeof window[funcName] === 'function') {
				await window[funcName]()
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
	window.renderPluginsSidebar = renderPluginsSidebar
	window.bindSidebar = bindSidebar
	window.novaDashApp = { navigateTo }
})()
