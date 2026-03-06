/**
 * Model Selector Component
 * Reusable UI component for selecting Ollama models
 */

/**
 * Create a model selector dropdown
 * @param {Object} options
 * @param {string} options.containerId - ID of container element
 * @param {string} options.category - Model category ('chat'|'translate'|'image'|'vision'|'code')
 * @param {string} options.settingKey - Key to store preference in settings
 * @param {Function} options.onChange - Callback when model changes
 * @param {string} options.defaultModel - Default model if none selected
 * @returns {Promise<HTMLElement>} The selector element
 */
async function createModelSelector({ containerId, category, settingKey, onChange, defaultModel }) {
	const container = document.getElementById(containerId)
	if (!container) {
		console.error('Container not found:', containerId)
		return null
	}

	// Create selector HTML
	const wrapper = document.createElement('div')
	wrapper.className = 'mb-3'
	wrapper.innerHTML = `
		<label for="${containerId}-select" class="form-label">
			<i class="bi bi-cpu me-1"></i> Model
		</label>
		<div class="input-group">
			<select id="${containerId}-select" class="form-select">
				<option value="">Loading models...</option>
			</select>
			<button class="btn btn-outline-secondary" type="button" id="${containerId}-refresh" title="Refresh models">
				<i class="bi bi-arrow-clockwise"></i>
			</button>
			<button class="btn btn-outline-secondary" type="button" id="${containerId}-status" title="Check Ollama status">
				<i class="bi bi-circle-fill text-secondary" style="font-size: 0.7rem;"></i>
			</button>
		</div>
		<div id="${containerId}-error" class="form-text text-danger d-none"></div>
	`

	container.innerHTML = ''
	container.appendChild(wrapper)

	const select = document.getElementById(`${containerId}-select`)
	const refreshBtn = document.getElementById(`${containerId}-refresh`)
	const statusBtn = document.getElementById(`${containerId}-status`)
	const errorDiv = document.getElementById(`${containerId}-error`)

	// Load models
	async function loadModels() {
		try {
			// Check Ollama status
			const isRunning = await window.OllamaAPI.checkOllamaStatus()
			const statusIcon = statusBtn.querySelector('i')

			if (!isRunning) {
				statusIcon.className = 'bi bi-circle-fill text-danger'
				statusBtn.title = 'Ollama not running'
				errorDiv.textContent = 'Ollama is not running. Please start Ollama and try again.'
				errorDiv.classList.remove('d-none')
				select.innerHTML = '<option value="">Ollama not available</option>'
				return
			}

			statusIcon.className = 'bi bi-circle-fill text-success'
			statusBtn.title = 'Ollama is running'
			errorDiv.classList.add('d-none')

			// Get suggested models for this category
			const models = await window.OllamaAPI.getSuggestedModels(category)

			if (models.length === 0) {
				select.innerHTML = '<option value="">No models installed</option>'
				errorDiv.textContent = `No models found for ${category}. Install models using: ollama pull <model-name>`
				errorDiv.classList.remove('d-none')
				return
			}

			// Get saved preference
			let savedModel = defaultModel
			if (window.novaDash && settingKey) {
				try {
					savedModel = await window.novaDash.getSetting(settingKey) || defaultModel
				} catch (err) {
					console.warn('Could not load setting:', err)
				}
			}

			// Check if saved model exists in available models
			const modelExists = models.find(m => m.name === savedModel)

			// Populate select
			select.innerHTML = ''
			let selectedModel = null

			models.forEach(model => {
				const option = document.createElement('option')
				option.value = model.name
				option.textContent = model.name

				// Select if matches saved model, or first model if saved doesn't exist
				if (modelExists && model.name === savedModel) {
					option.selected = true
					selectedModel = model.name
				} else if (!modelExists && !selectedModel) {
					option.selected = true
					selectedModel = model.name
				}

				select.appendChild(option)
			})

			// If no model selected yet, select first
			if (!selectedModel && models.length > 0) {
				select.value = models[0].name
				selectedModel = models[0].name
			}

			// Show warning if saved model not found
			if (savedModel && !modelExists) {
				errorDiv.textContent = `Model '${savedModel}' not found. Using '${selectedModel}' instead.`
				errorDiv.classList.remove('d-none')
				// Auto-hide after 5 seconds
				setTimeout(() => errorDiv.classList.add('d-none'), 5000)
			}

			// Trigger onChange with initial value
			if (onChange && selectedModel) {
				onChange(selectedModel)
			}
		} catch (error) {
			console.error('Failed to load models:', error)
			errorDiv.textContent = 'Error loading models: ' + error.message
			errorDiv.classList.remove('d-none')
			select.innerHTML = '<option value="">Error loading models</option>'
		}
	}

	// Event listeners
	select.addEventListener('change', async () => {
		const model = select.value

		// Save preference
		if (window.novaDash && settingKey && model) {
			try {
				await window.novaDash.setSetting(settingKey, model)
			} catch (err) {
				console.warn('Could not save setting:', err)
			}
		}

		// Call onChange callback
		if (onChange) {
			onChange(model)
		}
	})

	refreshBtn.addEventListener('click', loadModels)

	statusBtn.addEventListener('click', async () => {
		const isRunning = await window.OllamaAPI.checkOllamaStatus()
		alert(isRunning ? 'Ollama is running ✓' : 'Ollama is not running ✗\n\nPlease start Ollama and try again.')
	})

	// Initial load
	await loadModels()

	return wrapper
}

/**
 * Get currently selected model
 * @param {string} containerId - Container ID
 * @returns {string|null}
 */
function getSelectedModel(containerId) {
	const select = document.getElementById(`${containerId}-select`)
	return select ? select.value : null
}

// Export
if (typeof window !== 'undefined') {
	window.ModelSelector = {
		createModelSelector,
		getSelectedModel
	}
}
