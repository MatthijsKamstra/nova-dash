const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('novaDash', {
	// Platform — exposed synchronously so index.html can apply CSS class before first paint
	platform: process.platform,
	getPlatform: () => ipcRenderer.invoke('get-platform'),

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
	}
})
