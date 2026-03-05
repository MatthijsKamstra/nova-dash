/**
 * Ollama API Helper
 * Provides functions to interact with the local Ollama service at localhost:11434
 */

const OLLAMA_BASE_URL = 'http://localhost:11434';

/**
 * Check if Ollama service is running
 * @returns {Promise<boolean>}
 */
async function checkOllamaStatus() {
	try {
		const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
			method: 'GET'
		});
		return response.ok;
	} catch (error) {
		console.error('Ollama not reachable:', error);
		return false;
	}
}

/**
 * Get list of installed Ollama models
 * @returns {Promise<Array<{name: string, size: number, modified_at: string}>>}
 */
async function getInstalledModels() {
	try {
		const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
		if (!response.ok) throw new Error('Failed to fetch models');
		const data = await response.json();
		return data.models || [];
	} catch (error) {
		console.error('Failed to get models:', error);
		return [];
	}
}

/**
 * Filter models by category based on name patterns
 * @param {Array} models - Array of model objects
 * @param {string} category - 'chat'|'translate'|'image'|'vision'|'code'|'embed'
 * @returns {Array}
 */
function filterModelsByCategory(models, category) {
	const patterns = {
		chat: /llama|mistral|qwen|gemma|deepseek|kimi|glm|gemini|phi|openchat|neural/i,
		translate: /translate|gemma/i,
		image: /flux|stable|diffusion|image|dall|midjourney|z-image/i,
		vision: /moondream|llava|vision|bakllava/i,
		code: /coder|codellama|deepseek-coder|starcoder|qwen.*coder/i,
		embed: /embed/i
	};

	const pattern = patterns[category];
	if (!pattern) return models;

	return models.filter(model => {
		const name = model.name || '';
		// Include if matches pattern, or if category is 'chat' and no specific pattern matches
		if (pattern.test(name)) return true;
		if (category === 'chat') {
			// Exclude specialized models from general chat
			const isSpecialized = /translate|flux|stable|diffusion|image|moondream|llava|vision|coder|embed/i.test(name);
			return !isSpecialized;
		}
		return false;
	});
}

/**
 * Get suggested models for a specific use case
 * @param {string} category - 'chat'|'translate'|'image'|'vision'|'code'
 * @returns {Promise<Array>}
 */
async function getSuggestedModels(category) {
	const allModels = await getInstalledModels();
	return filterModelsByCategory(allModels, category);
}

/**
 * Chat completion with streaming
 * @param {Object} options
 * @param {string} options.model - Model name
 * @param {Array} options.messages - Chat messages [{role, content}]
 * @param {Function} options.onChunk - Callback for each streamed chunk
 * @param {Function} options.onComplete - Callback when done
 * @param {Function} options.onError - Error callback
 */
async function chatStream({ model, messages, onChunk, onComplete, onError }) {
	try {
		const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				model,
				messages,
				stream: true
			})
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let fullResponse = '';

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			const chunk = decoder.decode(value);
			const lines = chunk.split('\n').filter(line => line.trim());

			for (const line of lines) {
				try {
					const data = JSON.parse(line);
					if (data.message?.content) {
						fullResponse += data.message.content;
						if (onChunk) onChunk(data.message.content);
					}
					if (data.done && onComplete) {
						onComplete(fullResponse);
					}
				} catch (parseError) {
					console.error('Parse error:', parseError);
				}
			}
		}
	} catch (error) {
		console.error('Chat stream error:', error);
		if (onError) onError(error);
	}
}

/**
 * Generate image from prompt
 * @param {Object} options
 * @param {string} options.model - Image generation model
 * @param {string} options.prompt - Image description
 * @param {Function} options.onProgress - Progress callback
 * @returns {Promise<string>} Base64 image data
 */
async function generateImage({ model, prompt, onProgress }) {
	try {
		const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				model,
				prompt,
				stream: true
			})
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let imageData = null;

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			const chunk = decoder.decode(value);
			const lines = chunk.split('\n').filter(line => line.trim());

			for (const line of lines) {
				try {
					const data = JSON.parse(line);
					if (onProgress && data.status) {
						onProgress(data.status);
					}
					if (data.response) {
						imageData = data.response;
					}
				} catch (parseError) {
					console.error('Parse error:', parseError);
				}
			}
		}

		return imageData;
	} catch (error) {
		console.error('Image generation error:', error);
		throw error;
	}
}

/**
 * Analyze image with vision model
 * @param {Object} options
 * @param {string} options.model - Vision model (e.g., 'moondream')
 * @param {string} options.prompt - Question about the image
 * @param {string} options.image - Base64 encoded image
 * @param {Function} options.onChunk - Callback for streamed response
 * @returns {Promise<string>}
 */
async function analyzeImage({ model, prompt, image, onChunk }) {
	try {
		const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				model,
				prompt,
				images: [image],
				stream: true
			})
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let fullResponse = '';

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			const chunk = decoder.decode(value);
			const lines = chunk.split('\n').filter(line => line.trim());

			for (const line of lines) {
				try {
					const data = JSON.parse(line);
					if (data.response) {
						fullResponse += data.response;
						if (onChunk) onChunk(data.response);
					}
				} catch (parseError) {
					console.error('Parse error:', parseError);
				}
			}
		}

		return fullResponse;
	} catch (error) {
		console.error('Image analysis error:', error);
		throw error;
	}
}

// Export for use in browser (window) or Node.js (module.exports)
if (typeof window !== 'undefined') {
	window.OllamaAPI = {
		checkOllamaStatus,
		getInstalledModels,
		filterModelsByCategory,
		getSuggestedModels,
		chatStream,
		generateImage,
		analyzeImage
	};
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = {
		checkOllamaStatus,
		getInstalledModels,
		filterModelsByCategory,
		getSuggestedModels,
		chatStream,
		generateImage,
		analyzeImage
	};
}
