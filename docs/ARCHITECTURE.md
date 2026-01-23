# Obsidian HTML Server - Architecture Documentation

## Overview

**obsidian-html-server** is an Obsidian plugin that transforms your vault into a read-only HTTP server, making it accessible through any web browser on your local network. The plugin maintains styling and theme consistency with Obsidian while handling file resolution, markdown rendering, and optional authentication.

**Key Characteristics:**
- Version: 1.0.8
- Author: Pr0dt0s
- License: GPL 3.0
- Desktop only plugin
- Minimum Obsidian version: 0.15.0

---

## Project Structure

```
obsidian-html-server/
├── src/plugin/
│   ├── main.ts                           # Plugin entry point
│   ├── uiSetup.ts                        # Ribbon button UI setup
│   ├── typings.ts                        # Obsidian API extensions
│   ├── server/
│   │   ├── controller.ts                 # Express.js HTTP server & routing
│   │   ├── contentResolver.ts            # Content generation & variable replacement
│   │   └── pathResolver.ts               # File path resolution logic
│   ├── markdownRenderer/
│   │   ├── customMarkdownRenderer.ts     # Abstract renderer interface
│   │   └── obsidianMarkdownRenderer.ts   # Obsidian markdown rendering implementation
│   └── settings/
│       ├── settings.ts                   # Settings type definitions
│       ├── settingsTab.ts                # Settings UI panel
│       └── suggester/
│           ├── FileSuggester.ts          # File autocomplete widget
│           └── suggest.ts                # Generic suggestion dropdown component
├── manifest.json                         # Plugin metadata
├── package.json                          # Dependencies & build scripts
├── tsconfig.json                         # TypeScript configuration
├── rollup.config.mjs                     # Build configuration
├── jest.config.js                        # Testing configuration
└── __tests__/                            # Test files
```

---

## Core Components

### 1. Plugin Entry Point (`main.ts`)

**Class:** `HtmlServerPlugin extends Plugin`

**Responsibilities:**
- Load and persist plugin settings
- Initialize server controller and UI elements
- Manage server lifecycle (start/stop)
- Register Obsidian commands
- Emit workspace events for UI state synchronization

**Key Methods:**
- `onload()` - Initialize on plugin load
- `onunload()` - Cleanup on plugin unload
- `startServer()` / `stopServer()` - Server lifecycle
- `saveSettings()` - Persist configuration

---

### 2. Server Controller (`server/controller.ts`)

**Class:** `ServerController`

**Responsibilities:**
- Create and manage Express.js HTTP server
- Set up middleware (sessions, passport authentication)
- Define request routing
- Handle authentication if enabled
- Manage markdown renderer

**Architecture:**
```typescript
app.use(expressSession)        // Session management
app.use(passport.initialize)   // Authentication
app.post('/login')             // Login endpoint
app.use('/', authenticateIfNeeded, mainHandler)  // Protected routes
```

**Request Flow:**
1. Decode request path
2. Resolve file path using pathResolver
3. Redirect if path normalization needed
4. Resolve content via contentResolver
5. Return appropriate content type and payload

---

### 3. Content Resolver (`server/contentResolver.ts`)

**Function:** `contentResolver(path, referer, plugin, markdownRenderer, extraVars)`

**Responsibilities:**
- Route special endpoints (CSS, login page)
- Extract frontmatter from markdown files
- Render markdown to HTML using ObsidianMarkdownRenderer
- Replace template variables in HTML
- Serve binary files with correct MIME types

**Content Types Handled:**

| Type | Description |
|------|-------------|
| CSS Endpoint | `/.obsidian/plugins/obsidian-http-server/app.css` - Dynamic CSS from Obsidian |
| Login Page | `/.obsidian/plugins/obsidian-http-server/login.html` - Login form |
| Markdown Files | `.md` files - Rendered to HTML with template |
| Binary Files | Images, PDFs, etc. - Served with MIME type detection |

---

### 4. Path Resolver (`server/pathResolver.ts`)

**Function:** `tryResolveFilePath(requestedUrl, resolveFrom, app)`

**Strategy:**
1. Check if path matches special internal endpoints
2. Use Obsidian's `metadataCache.getFirstLinkpathDest()` for file resolution
3. Handle relative path resolution from referrer context
4. Fall back to direct file manager lookup

**Features:**
- Obsidian-style link resolution (handles spaces, extensions)
- Context-aware resolution (referrer-based)
- Path normalization for redirects

---

### 5. Markdown Renderer (`markdownRenderer/`)

**Abstract Class:** `CustomMarkdownRenderer`
```typescript
abstract renderHtmlFromMarkdown(markdown: string): Promise<string>
```

**Implementation:** `ObsidianMarkdownRenderer extends CustomMarkdownRenderer`

**Rendering Process:**
1. Create hidden DOM elements (WorkspaceLeaf, MarkdownView)
2. Set markdown content via `renderer.set(markdown)`
3. Wait for `onRenderComplete` callback
4. Remove Obsidian-specific UI elements (callout icons)
5. Post-process internal links and embeds
6. Extract innerHTML from preview element

**Post-Processing:**
- Removes callout icon SVG elements
- Removes `target` attribute from internal links
- Updates image embed `src` attributes
- Fixes positioning for inline embeds

---

### 6. Settings System (`settings/`)

**Type Definition:** `PluginSettings`
```typescript
{
  port: number                          // Listening port (1-65535)
  hostname: string                      // Listening address
  defaultFile: string                   // Initial file path
  startOnLoad: boolean                  // Auto-start server
  useRibbonButons: boolean             // Show toolbar buttons
  indexHtml: string                     // Template HTML
  htmlReplaceableVariables: ReplaceableVariables[]  // Custom variables
  showAdvancedOptions: boolean          // UI toggle
  useSimpleAuth: boolean                // Enable auth
  simpleAuthUsername: string
  simpleAuthPassword: string
}
```

---

### 7. UI Setup (`uiSetup.ts`)

**Function:** `setupUiElements(plugin)`

**UI Components:**
- Start button (wifi-off icon) - Visible when server stopped
- Stop button (wifi icon) - Visible when server running
- Real-time state synchronization via workspace events

---

## Data Flow

### Request Handling Flow

```
Browser Request
    │
    ▼
HTTP Server (Express.js)
    │
    ▼
[Route Handler in ServerController]
    │
    ▼
Decode URL path
    │
    ▼
pathResolver.tryResolveFilePath()
    ├─ Check special endpoints (CSS, login)
    ├─ Use Obsidian metadataCache.getFirstLinkpathDest()
    └─ Normalize path for redirects
    │
    ▼
[Path Resolution Complete]
    │
    ▼
contentResolver(path, referer, plugin, renderer)
    │
    ▼
[Content Type Determination]
    ├─ Special: CSS Endpoint
    │   └─ Extract CSS from document.styleSheets
    │       └─ Return text/css
    │
    ├─ Special: Login Page
    │   └─ Load login HTML template
    │       └─ Replace #VAR{...} variables
    │           └─ Return text/html
    │
    ├─ Markdown File (.md)
    │   ├─ Read file from vault
    │   ├─ Extract frontmatter (YAML)
    │   ├─ Parse htmlvars from frontmatter
    │   ├─ ObsidianMarkdownRenderer.renderHtmlFromMarkdown()
    │   │   ├─ Create temporary WorkspaceLeaf + MarkdownView
    │   │   ├─ Set markdown content
    │   │   ├─ Wait for async render completion
    │   │   ├─ Post-process HTML (remove icons, fix links)
    │   │   └─ Return rendered HTML string
    │   ├─ Load indexHtml template from settings
    │   ├─ Merge variables (priority: frontmatter > settings > internal)
    │   ├─ Replace #VAR{...} and [...] patterns
    │   └─ Return text/html + rendered content
    │
    └─ Binary File
        ├─ Read binary from vault
        ├─ Detect MIME type via file extension
        └─ Return binary payload + MIME type
    │
    ▼
[Response Generation]
    │
    ▼
Response sent to browser
```

---

## Variable Replacement System

### Template Syntax
```html
#VAR{VARIABLE_NAME}  or  [VARIABLE_NAME]
```

### Resolution Priority
1. **Frontmatter `htmlvars`** (highest priority)
2. **Settings `htmlReplaceableVariables`**
3. **Internal computed variables** (lowest priority)

### Internal Variables

| Variable | Description |
|----------|-------------|
| `RENDERED_CONTENT_FILE_NAME` | Current file name (basename) |
| `RENDERED_CONTENT` | Rendered markdown HTML |
| `THEME_MODE` | `theme-dark` or `theme-light` |
| `FAVICON_URL` | Icon URL |
| `HTML_TITLE` | Page title (defaults to file basename, can be overridden) |
| `CSS_FILE_URL` | Stylesheet URL |
| `FRONTMATTER_HTML` | Auto-generated collapsible HTML table with all YAML properties |

### Frontmatter Array Support

Arrays in frontmatter are now fully supported:
- For template variables (`FM:*`): Arrays are converted to comma-separated strings
- For `FRONTMATTER_HTML`: Arrays are rendered as unordered lists (`<ul><li>...</li></ul>`)

### Frontmatter Example
```yaml
---
tags: Test File, development
htmlvars:
  LANG: en
  HTML_TITLE: Custom Tab Title!
---
```

### Template Usage
```html
<title>#VAR{HTML_TITLE}</title>
<meta name="theme" content="#VAR{THEME_MODE}">
<div>#VAR{RENDERED_CONTENT}</div>
<p>Tags: #VAR{FM:tags}</p>
```

---

## Authentication System

### Flow (when `useSimpleAuth` is enabled)

1. **Initial Request:**
   - User accesses `http://localhost:8080/file`
   - `authenticateIfNeeded` middleware checks `req.user`
   - If not authenticated, renders login page

2. **Login Submission:**
   - Form POSTs to `/login` with credentials
   - Passport LocalStrategy validates credentials
   - On success: Sets session with username

3. **Session Management:**
   - Express-session stores authenticated user
   - Subsequent requests include session cookie

---

## CSS Delivery System

**Endpoint:** `/.obsidian/plugins/obsidian-http-server/app.css`

**Generation Process:**
```typescript
Array.from(document.styleSheets)
  .flatMap(styleSheet =>
    Array.from(styleSheet.cssRules)
      .map(rule => rule.cssText)
  )
  .join('\n')
```

**Features:**
- Extracts all CSS rules from Obsidian's loaded stylesheets
- Includes theme CSS and plugin styles
- Dynamically reflects Obsidian theme changes

---

## Design Patterns

### 1. Strategy Pattern
- `CustomMarkdownRenderer` abstract class allows pluggable rendering implementations
- Currently implements `ObsidianMarkdownRenderer`

### 2. Template Method Pattern
- `contentResolver` determines behavior based on path type
- Variable replacement as consistent final step

### 3. Middleware Chain (Express.js)
```typescript
app.use(expressSession)
app.use(passport.initialize)
app.use(passport.session)
app.post('/login', passport.authenticate)
app.use('/', authenticateIfNeeded, handler)
```

### 4. Observer Pattern
- Obsidian workspace events for UI state synchronization
- `html-server-event` fired on server state changes

---

## Dependencies

### Core Framework
- `obsidian@^1.1.1` - Obsidian API for plugin integration

### HTTP Server
- `express@^4.18.2` - HTTP server framework
- `express-session@^1.17.3` - Session management

### Authentication
- `passport@^0.6.0` - Authentication middleware
- `passport-local@^1.0.0` - Username/password strategy

### Utilities
- `mime-types@^2.1.35` - MIME type detection
- `node-ipc@^11.1.0` - IPC for process communication
- `@popperjs/core@^2.11.7` - Tooltip positioning

### Build Tools
- `rollup@^3.19.1` - Module bundler
- `typescript@^4.9.5` - TypeScript compiler

### Testing
- `jest@^29.7.0` - Test framework
- `puppeteer@^21.3.8` - Headless browser for E2E tests

---

## Build Process

### Rollup Configuration
- **Input:** `src/plugin/main.ts`
- **Output:**
  - Development: `test-vault/.obsidian/plugins/html-server/`
  - Production: `dist/`
- **Format:** CommonJS

### Build Commands
```bash
npm run dev      # Watch mode
npm run build    # Production build
npm run test     # Run tests
```

---

## Security Considerations

### Read-Only Access
- Plugin never writes to vault
- Only reads files via Obsidian's file system API

### Network Security
- Hostname configurable (localhost vs. 0.0.0.0)
- Default binds to 0.0.0.0 (all interfaces)
- Port configurable

### Authentication
- Optional simple auth with username/password
- Session-based with crypto-generated secrets
- CSP (Content-Security-Policy) with nonce on login form

### Limitations
- No HTTPS support (HTTP only)
- Suitable for local network only
- Can be exposed via ngrok for external access

---

## Obsidian API Integration

### Custom Type Extensions
```typescript
App.plugins.disablePlugin(id)
App.plugins.enablePlugin(id)
Workspace.on('html-server-event')
Workspace.on('html-server-settings-change')
DataAdapter.basePath
MarkdownPreviewRenderer.queued
MarkdownPreviewRenderer.queueRender()
```

### Key API Usage
- `metadataCache.getFirstLinkpathDest()` - Resolve links like Obsidian
- `vault.read()` - Read markdown files
- `vault.readBinary()` - Read binary files
- `fileManager.processFrontMatter()` - Extract YAML frontmatter

---

## Technical Insights

### Obsidian Renderer Patching
- Monkey-patches `MarkdownPreviewRenderer.prototype.queueRender()`
- Bypasses focus requirement for markdown rendering
- Allows rendering even when Obsidian window is backgrounded

### Link Resolution Strategy
- Uses Obsidian's native `metadataCache.getFirstLinkpathDest()`
- Supports relative links based on current file context
- Normalizes paths for browser requests

### Performance Optimization
- Dynamic CSS extraction avoids bundling
- Markdown rendering cached per-request
- Binary files served directly with minimal processing
