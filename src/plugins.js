/**
 * NovaDash Plugin System
 *
 * Dynamically loads plugins from src/plugins/[id]/manifest.json files.
 * Each plugin folder contains:
 *   - manifest.json (metadata: name, icon, requirements, etc.)
 *   - plugin.html (the UI content)
 *   - [optional] plugin.js (additional JS logic)
 */

let PLUGINS = []

/**
 * Load all plugins from manifest.json files
 * Called during app initialization
 */
async function loadPlugins() {
	if (PLUGINS.length > 0) {
		return PLUGINS
	}

	// List of plugin folder names to load
	const pluginIds = [
		'chat',
		'image-gen',
		'image-vision',
		'ocr',
		'translator',
		'stt',
		'time',
		'weather',
		'job-hunting',
		'pomodoro',
		'todo',
		'obsidian'
	]

	try {
		for (const pluginId of pluginIds) {
			try {
				const manifestPath = `plugins/${pluginId}/manifest.json`

				const response = await fetch(manifestPath)
				if (!response.ok) {
					console.warn(`[loadPlugins] Failed to load: ${manifestPath} (${response.status})`)
					continue
				}

				const manifest = await response.json()

				// Add page reference (where to load the HTML from)
				manifest.page = pluginId

				PLUGINS.push(manifest)
			} catch (err) {
				console.error(`[loadPlugins] Error loading plugin ${pluginId}:`, err)
			}
		}

		return PLUGINS
	} catch (err) {
		console.error('[loadPlugins] Fatal error:', err)
		return []
	}
}

/**
 * Get all plugins, optionally filtered by enabled status and platform
 */
async function getAllPlugins() {
	if (PLUGINS.length === 0) {
		await loadPlugins()
	}
	return PLUGINS
}

/**
 * Get enabled plugins for current platform
 */
async function getEnabledPlugins() {
	if (PLUGINS.length === 0) {
		await loadPlugins()
	}

	const platform = window.__platform || 'unknown'
	const enabledIds = await getEnabledPluginIds()

	const result = PLUGINS.filter(plugin => {
		// Check if plugin is enabled
		if (!enabledIds.includes(plugin.id)) {
			return false
		}

		// Check if plugin is available on current platform
		if (plugin.requiredPlatform && plugin.requiredPlatform !== platform) {
			return false
		}
		return true
	})
	return result
}

/**
 * Get list of enabled plugin IDs from storage
 */
async function getEnabledPluginIds() {
	let enabled = localStorage.getItem('nd-plugins-enabled')

	if (!enabled && typeof window.novaDash !== 'undefined') {
		// Try to load from Electron settings
		try {
			enabled = await window.novaDash.settings.get('plugins_enabled')
		} catch (err) {
			console.warn('[getEnabledPluginIds] Electron settings error:', err)
		}
	}

	if (!enabled) {
		// Initialize with default enabled plugins
		const defaults = PLUGINS
			.filter(p => p.enabledByDefault)
			.map(p => p.id)
		enabled = JSON.stringify(defaults)
	}

	try {
		return JSON.parse(enabled)
	} catch (e) {
		const defaults = PLUGINS.filter(p => p.enabledByDefault).map(p => p.id)
		return defaults
	}
}

/**
 * Enable/disable a plugin
 */
async function setPluginEnabled(pluginId, enabled) {
	const current = await getEnabledPluginIds()

	const updated = enabled
		? [...new Set([...current, pluginId])]
		: current.filter(id => id !== pluginId)

	const json = JSON.stringify(updated)

	localStorage.setItem('nd-plugins-enabled', json)

	if (typeof window.novaDash !== 'undefined') {
		try {
			await window.novaDash.settings.set('plugins_enabled', json)
		} catch (err) {
			console.warn(`[setPluginEnabled] Electron save error:`, err)
		}
	}
	return updated
}

/**
 * Get a plugin by ID
 */
function getPluginById(id) {
	return PLUGINS.find(p => p.id === id)
}

/**
 * Check if a plugin is available on current platform
 */
function isPluginAvailableOnPlatform(pluginId) {
	const plugin = getPluginById(pluginId)
	if (!plugin) return false
	if (!plugin.requiredPlatform) return true
	return plugin.requiredPlatform === window.__platform
}

// ── Expose to global scope ─────────────────────────────────────────────────
if (typeof window !== 'undefined') {
	window.PLUGINS = PLUGINS
	window.loadPlugins = loadPlugins
	window.getAllPlugins = getAllPlugins
	window.getEnabledPlugins = getEnabledPlugins
	window.getEnabledPluginIds = getEnabledPluginIds
	window.setPluginEnabled = setPluginEnabled
	window.getPluginById = getPluginById
	window.isPluginAvailableOnPlatform = isPluginAvailableOnPlatform
}
