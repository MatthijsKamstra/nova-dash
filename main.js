const { app, BrowserWindow, ipcMain, session, systemPreferences, Tray, Menu, nativeImage } = require('electron')
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
let tray = null
let mainWindow = null
let trayMenu = null

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

function createTray() {
	// Create tray without icon initially (macOS supports text-only tray)
	try {
		// Try to load icon if available
		const iconPath = path.join(__dirname, 'assets', 'icons', 'icon.png')
		let trayIcon = null

		if (fs.existsSync(iconPath)) {
			trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })
		}

		// Create tray with or without icon
		tray = new Tray(trayIcon || nativeImage.createEmpty())

		// On macOS, text-based tray is common
		if (process.platform === 'darwin') {
			tray.setTitle('ND')  // "NovaDash" abbreviated
		}
	} catch (err) {
		console.warn('[Tray] Failed to create tray icon:', err)
		return
	}

	const contextMenu = Menu.buildFromTemplate([
		{
			label: '🎤 Start Recording',
			click: () => {
				if (mainWindow) {
					mainWindow.show()
					mainWindow.webContents.send('stt:start-recording')
				}
			}
		},
		{
			label: '⏹ Stop Recording',
			enabled: false,
			id: 'stop-recording',
			click: () => {
				if (mainWindow) {
					mainWindow.webContents.send('stt:stop-recording')
				}
			}
		},
		{ type: 'separator' },
		{
			label: 'Open STT',
			click: () => {
				if (mainWindow) {
					mainWindow.show()
					mainWindow.webContents.send('navigate-to', 'stt')
				}
			}
		},
		{
			label: 'Open Chat',
			click: () => {
				if (mainWindow) {
					mainWindow.show()
					mainWindow.webContents.send('navigate-to', 'chat')
				}
			}
		},
		{ type: 'separator' },
		{
			label: 'Quit',
			click: () => app.quit()
		}
	])

	trayMenu = contextMenu
	tray.setContextMenu(contextMenu)
	tray.setToolTip('NovaDash')
}

function createWindow() {
	mainWindow = new BrowserWindow({
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

	mainWindow.loadFile('src/index.html')

	mainWindow.once('ready-to-show', () => {
		mainWindow.show()
	})

	if (process.env.NODE_ENV !== 'production') {
		mainWindow.webContents.openDevTools({ mode: 'detach' })
	}

	// Don't fully close on macOS, just hide
	if (process.platform === 'darwin') {
		mainWindow.on('close', (event) => {
			if (!app.isQuitting) {
				event.preventDefault()
				mainWindow.hide()
			}
		})
	}
}

app.whenReady().then(() => {
	createWindow()
	createTray()

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

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow()
	})
})

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
	app.isQuitting = true
})

app.on('activate', () => {
	if (mainWindow) {
		mainWindow.show()
	}
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

// ── Image generation (CLI) ──
ipcMain.handle('imagegen:generate', async (event, { model, prompt, width, height, steps, seed, negativePrompt }) => {
	const { spawn } = require('child_process')
	const downloadsPath = app.getPath('downloads')

	// Build the lines to pipe into ollama stdin
	const lines = []
	if (width) lines.push(`/set width ${width}`)
	if (height) lines.push(`/set height ${height}`)
	if (steps) lines.push(`/set steps ${steps}`)
	if (seed !== undefined) lines.push(`/set seed ${seed}`)
	if (negativePrompt) lines.push(`/set negative ${negativePrompt}`)
	lines.push(prompt)
	lines.push('/bye')
	const input = lines.join('\n') + '\n'

	return new Promise((resolve, reject) => {
		// Snapshot files before so we can detect the new one
		const before = new Set(fs.readdirSync(downloadsPath))

		const proc = spawn('ollama', ['run', model], {
			cwd: downloadsPath,
			env: { ...process.env }
		})

		let stderr = ''
		proc.stderr.on('data', (d) => { stderr += d.toString() })

		// Forward stdout lines as progress events to renderer
		proc.stdout.on('data', (d) => {
			const text = d.toString().trim()
			if (text) event.sender.send('imagegen:progress', text)
		})

		proc.stdin.write(input)
		proc.stdin.end()

		const timeout = setTimeout(() => {
			proc.kill()
			reject(new Error('Image generation timed out.'))
		}, 600000)

		proc.on('close', (code) => {
			clearTimeout(timeout)
			if (code !== 0) {
				return reject(new Error(`ollama exited with code ${code}: ${stderr}`))
			}
			// Find the new image file in Downloads
			const after = fs.readdirSync(downloadsPath)
			const newFiles = after.filter(f => !before.has(f) && /\.(png|jpg|jpeg|webp)$/i.test(f))
			if (newFiles.length === 0) {
				return reject(new Error('Generation finished but no image file was found in Downloads.'))
			}
			// Pick the most recently modified one
			newFiles.sort((a, b) => {
				const sa = fs.statSync(path.join(downloadsPath, a)).mtimeMs
				const sb = fs.statSync(path.join(downloadsPath, b)).mtimeMs
				return sb - sa
			})
			resolve(path.join(downloadsPath, newFiles[0]))
		})
	})
})

// ── STT Transcripts ──
ipcMain.handle('stt:save', (_e, transcript) => db.saveSTTTranscript(transcript))
ipcMain.handle('stt:getHistory', (_e, limit, offset) => db.getSTTTranscripts(limit, offset))
ipcMain.handle('stt:search', (_e, query, limit) => db.searchSTTTranscripts(query, limit))
ipcMain.handle('stt:delete', (_e, id) => db.deleteSTTTranscript(id))

// ── Tray Status Updates ──
ipcMain.on('tray:update-status', (_event, status) => {
	if (!tray || !trayMenu) return

	const menu = trayMenu
	const stopItem = menu.getMenuItemById('stop-recording')

	if (status === 'recording') {
		if (process.platform === 'darwin') tray.setTitle('🔴')
		if (stopItem) stopItem.enabled = true
	} else if (status === 'transcribing') {
		if (process.platform === 'darwin') tray.setTitle('⚙️')
		if (stopItem) stopItem.enabled = false
	} else {
		if (process.platform === 'darwin') tray.setTitle('')
		if (stopItem) stopItem.enabled = false
	}

	if (menu && tray) {
		tray.setContextMenu(menu)
	}
})
