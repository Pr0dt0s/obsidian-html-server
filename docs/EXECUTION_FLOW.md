# Obsidian HTML Server - Execution Flow

This document describes the detailed execution flow of the plugin from initialization to request handling.

---

## Plugin Lifecycle

### Initialization Flow

```
Plugin Initialization
│
├─ onload()
│   ├─ Load settings from disk
│   │   └─ Uses Obsidian's plugin.loadData()
│   │
│   ├─ Wait for workspace layout ready
│   │   └─ app.workspace.onLayoutReady()
│   │
│   ├─ setupUiElements()
│   │   ├─ Create ribbon start button (wifi-off icon)
│   │   ├─ Create ribbon stop button (wifi icon)
│   │   └─ Register event listeners for state changes
│   │
│   ├─ Add settings tab
│   │   └─ new HtmlServerPluginSettingsTab(app, plugin)
│   │
│   ├─ Create ServerController
│   │   ├─ Initialize Express app
│   │   ├─ Configure middleware
│   │   └─ Set up routes
│   │
│   ├─ If startOnLoad enabled:
│   │   └─ startServer()
│   │
│   └─ Register Obsidian commands
│       ├─ "Start HTML Server"
│       └─ "Stop HTML Server"
```

### Shutdown Flow

```
Plugin Unload
│
├─ onunload()
│   ├─ Stop server if running
│   │   └─ serverController.stop()
│   │
│   ├─ Clean up UI elements
│   │   └─ Remove ribbon buttons
│   │
│   └─ Restore patched Obsidian methods
│       └─ MarkdownPreviewRenderer.queueRender
```

---

## Server Controller Initialization

```
ServerController Constructor
│
├─ Create Express Application
│   └─ const app = express()
│
├─ Configure Session Middleware
│   └─ app.use(expressSession({
│       secret: crypto.randomBytes(32),
│       resave: false,
│       saveUninitialized: false
│   }))
│
├─ Configure Passport Authentication
│   ├─ app.use(passport.initialize())
│   ├─ app.use(passport.session())
│   │
│   ├─ passport.use(new LocalStrategy(
│   │   (username, password, done) => {
│   │       // Validate against settings
│   │   }
│   │ ))
│   │
│   ├─ passport.serializeUser((user, done) => {
│   │   done(null, user.username)
│   │ })
│   │
│   └─ passport.deserializeUser((username, done) => {
│       done(null, { username })
│   │ })
│
├─ Configure Login Route
│   └─ app.post('/login',
│       passport.authenticate('local'),
│       (req, res) => redirect to original URL
│   │ )
│
└─ Configure Main Route Handler
    └─ app.use('/',
        authenticateIfNeeded,
        mainRequestHandler
    │ )
```

---

## Request Handling Flow

### Main Request Handler

```
HTTP Request Arrives
│
├─ Express Middleware Chain
│   ├─ Session Middleware
│   │   └─ Load/create session
│   │
│   ├─ Passport Initialize
│   │   └─ Setup req.user
│   │
│   └─ Passport Session
│       └─ Deserialize user if authenticated
│
├─ Route Matching
│   │
│   ├─ POST /login
│   │   ├─ Validate credentials
│   │   ├─ Create session
│   │   └─ Redirect to original URL
│   │
│   └─ ALL /*
│       │
│       ├─ authenticateIfNeeded Middleware
│       │   ├─ Check if useSimpleAuth enabled
│       │   ├─ If enabled and not authenticated:
│       │   │   └─ Serve login page
│       │   └─ If disabled or authenticated:
│       │       └─ Continue to handler
│       │
│       └─ Main Handler
│           ├─ Decode URL path
│           │   └─ decodeURIComponent(req.path)
│           │
│           ├─ Handle root path
│           │   └─ Redirect to defaultFile
│           │
│           ├─ Resolve file path
│           │   └─ pathResolver.tryResolveFilePath()
│           │
│           ├─ Check if redirect needed
│           │   └─ If resolved path !== requested path
│           │       └─ Send 301 redirect
│           │
│           └─ Resolve and serve content
│               └─ contentResolver()
```

### Path Resolution Details

```
pathResolver.tryResolveFilePath(requestedUrl, resolveFrom, app)
│
├─ Check Special Endpoints
│   ├─ /.obsidian/plugins/obsidian-http-server/app.css
│   │   └─ Return as-is (CSS endpoint)
│   │
│   └─ /.obsidian/plugins/obsidian-http-server/login.html
│       └─ Return as-is (Login page)
│
├─ Remove Leading Slash
│   └─ requestedUrl.slice(1)
│
├─ Try Obsidian Link Resolution
│   │
│   ├─ metadataCache.getFirstLinkpathDest(url, resolveFrom)
│   │   │
│   │   ├─ If found:
│   │   │   └─ Return { file, originalPath, resolvedPath }
│   │   │
│   │   └─ If not found:
│   │       └─ Continue to fallback
│   │
│   └─ Fallback: Direct File Lookup
│       └─ fileManager.getNewFileParent(url)
│
└─ Return Resolution Result
    ├─ { file: TFile, originalPath, resolvedPath }
    └─ or { notFound: true }
```

### Content Resolution Details

```
contentResolver(path, referer, plugin, markdownRenderer, extraVars)
│
├─ Check Content Type
│   │
│   ├─ CSS Endpoint
│   │   │
│   │   ├─ Extract CSS from Obsidian
│   │   │   └─ Array.from(document.styleSheets)
│   │   │       .flatMap(ss => Array.from(ss.cssRules))
│   │   │       .map(rule => rule.cssText)
│   │   │       .join('\n')
│   │   │
│   │   ├─ Add height unset rule
│   │   │   └─ '.markdown-preview-view { height: unset !important; }'
│   │   │
│   │   └─ Return { contentType: 'text/css', content }
│   │
│   ├─ Login Page
│   │   │
│   │   ├─ Load login template
│   │   │
│   │   ├─ Generate nonce for CSP
│   │   │   └─ crypto.randomBytes(16).toString('base64')
│   │   │
│   │   ├─ Replace variables
│   │   │   ├─ #VAR{REDIRECT_URL}
│   │   │   └─ #VAR{NONCE}
│   │   │
│   │   └─ Return { contentType: 'text/html', content }
│   │
│   ├─ Markdown File (.md)
│   │   │
│   │   ├─ Read file content
│   │   │   └─ vault.read(file)
│   │   │
│   │   ├─ Extract frontmatter
│   │   │   └─ fileManager.processFrontMatter(file, fm => ...)
│   │   │
│   │   ├─ Parse htmlvars from frontmatter
│   │   │   └─ frontmatter.htmlvars || {}
│   │   │
│   │   ├─ Render markdown to HTML
│   │   │   └─ markdownRenderer.renderHtmlFromMarkdown(content)
│   │   │
│   │   ├─ Build variable map
│   │   │   │
│   │   │   ├─ Internal variables (lowest priority)
│   │   │   │   ├─ RENDERED_CONTENT_FILE_NAME
│   │   │   │   ├─ RENDERED_CONTENT
│   │   │   │   ├─ THEME_MODE
│   │   │   │   ├─ FAVICON_URL
│   │   │   │   ├─ HTML_TITLE
│   │   │   │   └─ CSS_FILE_URL
│   │   │   │
│   │   │   ├─ Settings variables (medium priority)
│   │   │   │   └─ settings.htmlReplaceableVariables
│   │   │   │
│   │   │   └─ Frontmatter variables (highest priority)
│   │   │       └─ frontmatter.htmlvars
│   │   │
│   │   ├─ Load HTML template
│   │   │   └─ settings.indexHtml
│   │   │
│   │   ├─ Replace all variables
│   │   │   ├─ Pattern: #VAR{VARIABLE_NAME}
│   │   │   └─ Pattern: [VARIABLE_NAME]
│   │   │
│   │   └─ Return { contentType: 'text/html', content }
│   │
│   └─ Binary File
│       │
│       ├─ Read binary content
│       │   └─ vault.readBinary(file)
│       │
│       ├─ Detect MIME type
│       │   └─ mimeTypes.lookup(file.extension)
│       │
│       └─ Return { contentType, content: Buffer }
│
└─ Return Content Object
    └─ { contentType, content }
```

---

## Markdown Rendering Flow

```
ObsidianMarkdownRenderer.renderHtmlFromMarkdown(markdown)
│
├─ Create Temporary DOM Elements
│   │
│   ├─ Create container div
│   │   └─ document.createElement('div')
│   │
│   ├─ Create WorkspaceLeaf
│   │   └─ new WorkspaceLeaf(app)
│   │
│   └─ Create MarkdownView
│       └─ new MarkdownView(leaf)
│
├─ Set Up Render Promise
│   │
│   └─ new Promise((resolve) => {
│       renderer.onRenderComplete = () => {
│           // Post-process and resolve
│       }
│   })
│
├─ Trigger Rendering
│   │
│   ├─ Set markdown content
│   │   └─ renderer.set(markdown, true)
│   │
│   └─ Queue render (patched method)
│       └─ renderer.queueRender()
│
├─ Wait for Render Complete
│   │
│   └─ onRenderComplete callback fires
│       │
│       ├─ Get preview element
│       │   └─ view.previewMode.containerEl
│       │
│       ├─ Post-process HTML
│       │   │
│       │   ├─ Remove callout icons
│       │   │   └─ el.querySelectorAll('.callout-icon svg').remove()
│       │   │
│       │   ├─ Fix internal links
│       │   │   └─ el.querySelectorAll('a.internal-link')
│       │   │       .removeAttribute('target')
│       │   │
│       │   ├─ Fix image embeds
│       │   │   └─ el.querySelectorAll('.internal-embed img')
│       │   │       .setAttribute('src', ...)
│       │   │
│       │   └─ Fix embed positioning
│       │       └─ el.querySelectorAll('.markdown-embed-content')
│       │           .style.position = 'unset'
│       │
│       └─ Extract innerHTML
│           └─ previewEl.innerHTML
│
├─ Clean Up
│   │
│   ├─ Remove temporary elements
│   │   └─ container.remove()
│   │
│   └─ Detach view
│       └─ leaf.detach()
│
└─ Return Rendered HTML String
```

---

## Settings Change Flow

```
User Changes Setting
│
├─ Settings Tab Handler
│   │
│   ├─ Validate input
│   │   ├─ Port: 1-65535
│   │   ├─ Hostname: valid IP/hostname
│   │   └─ Password: minimum length
│   │
│   ├─ Update settings object
│   │   └─ plugin.settings.property = value
│   │
│   └─ Save settings
│       └─ plugin.saveSettings()
│
├─ saveSettings()
│   │
│   ├─ Persist to disk
│   │   └─ this.saveData(this.settings)
│   │
│   └─ Trigger server reload if running
│       └─ serverController.reload()
│
└─ reload()
    │
    ├─ Stop current server
    │   └─ this.stop()
    │
    └─ Start with new settings
        └─ this.start()
```

---

## UI State Synchronization

```
Server State Change
│
├─ Emit Workspace Event
│   └─ app.workspace.trigger('html-server-event', {
│       type: 'server-state-change',
│       running: boolean
│   })
│
└─ UI Event Listeners
    │
    ├─ Start Button Listener
    │   └─ If running: hide button
    │       Else: show button
    │
    └─ Stop Button Listener
        └─ If running: show button
            Else: hide button
```

---

## Error Handling Flow

```
Request Error
│
├─ Path Resolution Error
│   │
│   ├─ File not found
│   │   └─ Return 404 response
│   │
│   └─ Invalid path
│       └─ Return 400 response
│
├─ Content Resolution Error
│   │
│   ├─ File read error
│   │   └─ Return 500 response
│   │
│   └─ Render error
│       └─ Return 500 with error message
│
└─ Authentication Error
    │
    ├─ Invalid credentials
    │   └─ Redirect to login with error
    │
    └─ Session expired
        └─ Redirect to login
```

---

## Performance Considerations

### Request Caching
- Session-based caching for authenticated users
- No file content caching (reads fresh on each request)

### CSS Optimization
- CSS extracted once per request
- Includes all loaded Obsidian stylesheets

### Markdown Rendering
- Creates new DOM elements per request
- Cleans up after each render
- No render result caching

### Binary Files
- Served directly with minimal processing
- MIME type detection per request
