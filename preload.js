const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('novaDash', {
	// Platform — exposed synchronously so index.html can apply CSS class before first paint
	platform: process.platform,
	getPlatform: () => ipcRenderer.invoke('get-platform'),
	permissions: {
		getMicrophoneStatus: () => ipcRenderer.invoke('permissions:get-microphone-status'),
		requestMicrophone: () => ipcRenderer.invoke('permissions:request-microphone'),
		requestCapability: (pluginId, capability) => ipcRenderer.invoke('permissions:request-capability', pluginId, capability)
	},

	// To-Do
	todo: {
		getAll: () => ipcRenderer.invoke('todo:getAll'),
		add: (text) => ipcRenderer.invoke('todo:add', text),
		toggle: (id) => ipcRenderer.invoke('todo:toggle', id),
		delete: (id) => ipcRenderer.invoke('todo:delete', id)
	},

	// Pomodoro
	pomodoro: {
		getSessions: () => ipcRenderer.invoke('pomodoro:getSessions'),
		addSession: (session) => ipcRenderer.invoke('pomodoro:addSession', session)
	},

	// Settings
	settings: {
		get: (key) => ipcRenderer.invoke('settings:get', key),
		set: (key, value) => ipcRenderer.invoke('settings:set', key, value)
	},

	// Notes / Obsidian
	notes: {
		getAll: () => ipcRenderer.invoke('notes:getAll'),
		save: (note) => ipcRenderer.invoke('notes:save', note),
		delete: (id) => ipcRenderer.invoke('notes:delete', id)
	},

	// STT Transcripts
	stt: {
		save: (transcript) => ipcRenderer.invoke('stt:save', transcript),
		getHistory: (limit, offset) => ipcRenderer.invoke('stt:getHistory', limit, offset),
		search: (query, limit) => ipcRenderer.invoke('stt:search', query, limit),
		delete: (id) => ipcRenderer.invoke('stt:delete', id)
	},

	// Image generation via CLI
	imagegen: {
		generate: (params) => ipcRenderer.invoke('imagegen:generate', params),
		onProgress: (cb) => ipcRenderer.on('imagegen:progress', (_e, msg) => cb(msg)),
		offProgress: () => ipcRenderer.removeAllListeners('imagegen:progress')
	},

	// Tray
	tray: {
		updateStatus: (status) => ipcRenderer.send('tray:update-status', status)
	},

	// Listen to tray commands
	onTrayCommand: (callback) => {
		ipcRenderer.on('stt:start-recording', () => callback('stt-start'))
		ipcRenderer.on('stt:stop-recording', () => callback('stt-stop'))
		ipcRenderer.on('navigate-to', (_event, page) => callback('navigate', page))
	}
})
