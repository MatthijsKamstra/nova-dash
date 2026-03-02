const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')

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
