const { app, BrowserWindow, ipcMain, session, systemPreferences } = require('electron')
const path = require('path')
const fs = require('fs')

// Enable hot reload in development
if (process.env.NODE_ENV !== 'production') {
	try {
		require('electron-reload')(__dirname, {
			electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
			hardResetMethod: 'exit'
		})
	} catch (err) {
		console.log('electron-reload not available')
	}
}

// Setup SQLite database
const db = require('./src/db/database')

const pluginManifestCache = new Map()

function getPluginManifest(pluginId) {
	if (!pluginId) return null
	if (pluginManifestCache.has(pluginId)) {
		return pluginManifestCache.get(pluginId)
	}

	try {
		const manifestPath = path.join(__dirname, 'src', 'plugins', pluginId, 'manifest.json')
		const raw = fs.readFileSync(manifestPath, 'utf8')
		const manifest = JSON.parse(raw)
		pluginManifestCache.set(pluginId, manifest)
		return manifest
	} catch (err) {
		console.warn(`[permissions] Failed to load manifest for plugin: ${pluginId}`, err.message)
		return null
	}
}

function pluginDeclaresCapability(pluginId, capability) {
	const manifest = getPluginManifest(pluginId)
	if (!manifest) return false
	const capabilities = Array.isArray(manifest.capabilities) ? manifest.capabilities : []
	return capabilities.includes(capability)
}

function createWindow() {
	const win = new BrowserWindow({
		width: 1200,
		height: 800,
		minWidth: 800,
		minHeight: 600,
		titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
		// Position traffic lights at top-left corner, sidebar icons just below
		...(process.platform === 'darwin' ? { trafficLightPosition: { x: 12, y: 12 } } : {}),
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			contextIsolation: true,
			nodeIntegration: false
		},
		icon: path.join(__dirname, 'assets', 'icons', 'icon.png'),
		show: false
	})

	win.loadFile('src/index.html')

	win.once('ready-to-show', () => {
		win.show()
	})

	if (process.env.NODE_ENV !== 'production') {
		win.webContents.openDevTools({ mode: 'detach' })
	}
}

app.whenReady().then(() => {
	// Allow geolocation permissions for weather plugin
	session.defaultSession.setPermissionRequestHandler((webContents, permission, callback, details) => {
		// Auto-approve geolocation for local weather
		if (permission === 'geolocation') {
			callback(true)
			return
		}

		// Allow microphone capture for Speech-to-Text plugin
		if (permission === 'media') {
			const mediaTypes = details?.mediaTypes || []
			const requestsAudio = mediaTypes.length === 0 || mediaTypes.includes('audio')
			callback(requestsAudio)
			return
		} else {
			callback(false)
		}
	})

	// Also handle permission checks
	session.defaultSession.setPermissionCheckHandler((webContents, permission, _requestingOrigin, details) => {
		if (permission === 'geolocation') {
			return true
		}

		if (permission === 'media') {
			const mediaType = details?.mediaType
			const mediaTypes = details?.mediaTypes || []
			return mediaType === 'audio' || mediaTypes.includes('audio')
		}

		return false
	})

	createWindow()

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow()
	})
})

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit()
})

// ── IPC handlers ────────────────────────────────────────────────────────────

// Platform detection
ipcMain.handle('get-platform', () => process.platform)

ipcMain.handle('permissions:get-microphone-status', () => {
	if (process.platform !== 'darwin') return 'granted'
	return systemPreferences.getMediaAccessStatus('microphone')
})

ipcMain.handle('permissions:request-microphone', async () => {
	if (process.platform !== 'darwin') return true
	return systemPreferences.askForMediaAccess('microphone')
})

ipcMain.handle('permissions:request-capability', async (_event, pluginId, capability) => {
	if (!pluginId || !capability) {
		return { granted: false, reason: 'invalid-request' }
	}

	if (!pluginDeclaresCapability(pluginId, capability)) {
		return { granted: false, reason: 'capability-not-declared' }
	}

	if (capability === 'microphone') {
		if (process.platform !== 'darwin') {
			return { granted: true, reason: 'granted' }
		}

		const status = systemPreferences.getMediaAccessStatus('microphone')
		if (status === 'granted') {
			return { granted: true, reason: 'already-granted' }
		}

		const granted = await systemPreferences.askForMediaAccess('microphone')
		return {
			granted,
			reason: granted ? 'granted' : 'denied'
		}
	}

	return { granted: false, reason: 'unsupported-capability' }
})

// ── To-Do ──
ipcMain.handle('todo:getAll', () => db.getAllTodos())
ipcMain.handle('todo:add', (_e, text) => db.addTodo(text))
ipcMain.handle('todo:toggle', (_e, id) => db.toggleTodo(id))
ipcMain.handle('todo:delete', (_e, id) => db.deleteTodo(id))

// ── Pomodoro ──
ipcMain.handle('pomodoro:getSessions', () => db.getPomodoroSessions())
ipcMain.handle('pomodoro:addSession', (_e, session) => db.addPomodoroSession(session))

// ── Settings ──
ipcMain.handle('settings:get', (_e, key) => db.getSetting(key))
ipcMain.handle('settings:set', (_e, key, value) => db.setSetting(key, value))

// ── Notes / Obsidian ──
ipcMain.handle('notes:getAll', () => db.getAllNotes())
ipcMain.handle('notes:save', (_e, note) => db.saveNote(note))
ipcMain.handle('notes:delete', (_e, id) => db.deleteNote(id))
