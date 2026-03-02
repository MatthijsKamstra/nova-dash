/**
 * copy-vendor.js
 * Copies Bootstrap and Bootstrap Icons dist files into src/vendor/
 * so the app works in both Electron (file://) and browser-sync dev mode.
 */
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')

function copy(src, dest) {
	fs.mkdirSync(path.dirname(dest), { recursive: true })
	if (fs.statSync(src).isDirectory()) {
		fs.mkdirSync(dest, { recursive: true })
		for (const f of fs.readdirSync(src)) {
			copy(path.join(src, f), path.join(dest, f))
		}
	} else {
		fs.copyFileSync(src, dest)
	}
}

const vendor = path.join(root, 'src', 'vendor')

const assets = [
	['node_modules/bootstrap/dist/css/bootstrap.min.css', 'bootstrap/css/bootstrap.min.css'],
	['node_modules/bootstrap/dist/js/bootstrap.bundle.min.js', 'bootstrap/js/bootstrap.bundle.min.js'],
	['node_modules/bootstrap-icons/font/bootstrap-icons.min.css', 'bootstrap-icons/font/bootstrap-icons.min.css'],
	['node_modules/bootstrap-icons/font/fonts', 'bootstrap-icons/font/fonts'],
]

let ok = true
for (const [src, dest] of assets) {
	const srcPath = path.join(root, src)
	const destPath = path.join(vendor, dest)
	if (!fs.existsSync(srcPath)) {
		console.warn(`[copy-vendor] SKIP (not found): ${src}`)
		ok = false
		continue
	}
	copy(srcPath, destPath)
	console.log(`[copy-vendor] OK  ${dest}`)
}

if (ok) console.log('[copy-vendor] All vendor assets copied.')
