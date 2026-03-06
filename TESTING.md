# Testing Guide — NovaDash

This document explains the testing infrastructure for NovaDash.

---

## Test Stack

| Tool           | Purpose              | Why                                                   |
| -------------- | -------------------- | ----------------------------------------------------- |
| **ESLint**     | Static code analysis | Catches syntax errors, enforces code style            |
| **Playwright** | End-to-end testing   | Tests the full Electron app including UI interactions |

---

## ESLint — Code Quality

### What it catches

- Syntax errors (missing brackets, unterminated strings, etc.)
- Code style violations (indentation, quotes, semicolons)
- Common mistakes (unreachable code, duplicate keys, undefined variables)
- Platform-specific issues (Node.js vs Browser globals)

### Usage

```bash
# Check for lint errors
npm run lint

# Auto-fix fixable issues (formatting, semicolons, etc.)
npm run lint:fix
```

### Configuration

- **Config**: `.eslintrc.json`
- **Ignore**: `.eslintignore`
- **Rules**:
  - No semicolons (`semi: "never"`)
  - Tab indentation
  - Single quotes preferred
  - Console statements allowed
  - Undefined variables are errors

### Integration with VS Code

ESLint automatically integrates with VS Code. Errors appear as red squiggly lines in the editor. To enable auto-fix on save:

1. Install **ESLint extension** (already installed)
2. Add to VS Code settings:
   ```json
   {
     "editor.codeActionsOnSave": {
       "source.fixAll.eslint": true
     }
   }
   ```

---

## Playwright — E2E Testing

### What it tests

- App startup (Electron main process)
- Window rendering
- Sidebar navigation
- Page loading
- Plugin functionality
- UI interactions

### Usage

```bash
# Run all tests (headless)
npm test

# Run with UI mode (interactive, recommended for development)
npm run test:ui

# Run with headed browser (see what's happening)
npm run test:headed

# View test report
npm run test:report
```

### Test Structure

Tests are located in `tests/e2e/`:

```
tests/
├── e2e/
│   ├── app.spec.js       # App startup & navigation tests
│   └── stt.spec.js       # STT plugin tests
```

### Writing Tests

Example test structure:

```javascript
import { test, expect, _electron as electron } from "@playwright/test";
import path from "path";

let electronApp;
let window;

test.beforeAll(async () => {
  // Launch Electron app
  electronApp = await electron.launch({
    args: [path.join(process.cwd(), "main.js")],
  });
  window = await electronApp.firstWindow();
  await window.waitForLoadState("domcontentloaded");
});

test.afterAll(async () => {
  await electronApp.close();
});

test.describe("Feature Name", () => {
  test("should do something", async () => {
    const button = await window.locator("#my-button");
    await expect(button).toBeVisible();
    await button.click();
    // ... assertions
  });
});
```

### Configuration

- **Config**: `playwright.config.js`
- **Reporter**: HTML report in `test-results/html/`
- **Screenshots**: Taken on failure
- **Videos**: Recorded on failure
- **Traces**: Enabled on retry

---

## Workflow Recommendations

### During Development

1. **Run ESLint before committing**

   ```bash
   npm run lint
   ```

2. **Fix issues automatically when possible**

   ```bash
   npm run lint:fix
   ```

3. **Run tests after major changes**
   ```bash
   npm run test:ui
   ```

### Pre-Commit Checklist

- [ ] `npm run lint` passes without errors
- [ ] `npm test` passes all tests
- [ ] No console errors in Electron DevTools

### CI/CD (Future)

For automated testing on GitHub Actions:

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run lint
      - run: npm test
```

---

## Common Issues & Solutions

### ESLint Issues

**Problem**: "Extra semicolon" errors

```bash
npm run lint:fix
```

**Problem**: "Unexpected constant condition" in `while (true)`
**Solution**: Already handled with `// eslint-disable-next-line no-constant-condition`

**Problem**: Undefined global (e.g., `AudioContext`)
**Solution**: Add to `globals` in `.eslintrc.json`

### Playwright Issues

**Problem**: "Cannot find Electron app"
**Solution**: Check `args` path in test setup matches `main.js` location

**Problem**: "Element not found"
**Solution**: Add `await window.waitForTimeout(500)` after navigation

**Problem**: Test hangs forever
**Solution**: Add `timeout: 30000` to test config, check for infinite loops

---

## Future Enhancements

- [ ] **Unit tests** with Vitest for database/utility functions
- [ ] **Pre-commit hooks** with Husky to auto-run linting
- [ ] **GitHub Actions** for automated testing on push
- [ ] **Code coverage** reporting
- [ ] **Visual regression testing** for UI consistency

---

## References

- [ESLint Documentation](https://eslint.org/docs/latest/)
- [Playwright for Electron](https://playwright.dev/docs/api/class-electron)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
