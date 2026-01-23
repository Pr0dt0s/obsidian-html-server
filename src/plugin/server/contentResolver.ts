import { INTERNAL_CSS_ENPOINT, INTERNAL_LOGIN_ENPOINT } from './pathResolver';
import HtmlServerPlugin from 'plugin/main';
import { CustomMarkdownRenderer } from 'plugin/markdownRenderer/customMarkdownRenderer';
import mime from 'mime-types';
import { ReplaceableVariables } from 'plugin/settings/settings';
import { App, TFile, TFolder } from 'obsidian';

export const contentResolver = async (
  path: string,
  referer: string,
  plugin: HtmlServerPlugin,
  markdownRenderer: CustomMarkdownRenderer,
  extraVars: ReplaceableVariables[] = []
) => {
  if (path == INTERNAL_CSS_ENPOINT) {
    const fullCssText =
      Array.from(document.styleSheets)
        .flatMap((styleSheet) =>
          Array.from(styleSheet.cssRules).map((cssRule) => cssRule.cssText)
        )
        .join('\n') +
      `\n.markdown-preview-view, .markdown-embed-content {height: unset !important;}`;

    return {
      contentType: 'text/css',
      payload: fullCssText,
    };
  }
  if (path == INTERNAL_LOGIN_ENPOINT) {
    const loginForm = parseHtmlVariables(
      `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport"
    content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>#VAR{HTML_TITLE}</title>
  <link rel="shortcut icon" href="#VAR{FAVICON_URL}">
  <link href="#VAR{CSS_FILE_URL}" type="text/css" rel="stylesheet">
</head>
<body
  class="#VAR{THEME_MODE} mod-windows is-frameless is-maximized is-hidden-frameless obsidian-app show-inline-title show-view-header"
  style="--zoom-factor:1; --font-text-size:16px;">
  <div class="app-container">
    <div class="horizontal-main-container">
      <div class="workspace">
        <div class="workspace-split mod-vertical mod-root">
          <div class="workspace-tabs mod-top mod-top-left-space mod-top-right-space">
            <div class="workspace-tab-container">
              <div class="workspace-leaf">
                <div class="workspace-leaf-content" data-type="markdown" data-mode="preview">
                  <div class="view-content">
                    <div class="markdown-reading-view" style="width: 100%; height: 100%;">
                      <div
                        class="markdown-preview-view markdown-rendered node-insert-event is-readable-line-width allow-fold-headings show-indentation-guide allow-fold-lists"
                        tabindex="-1" style="tab-size: 4; height: 100% !important;">
                        <div class="markdown-preview-sizer markdown-preview-section" style="min-height: calc(100% - var(--file-margins) - var(--file-margins));">
                          <div class="markdown-preview-pusher" style="width: 1px; height: 0.1px; margin-bottom: 0px;"></div>
                          <div class="mod-header"></div>
                          <div class="prompt">
                            <div class="html-form-container">
                              <h1>#VAR{HTML_TITLE}</h1>
                              <div class="html-login-form">
                                <div class="html-login-form-label"><label for="username">Username:</label></div>
                                <div class="setting-item-control">
                                  <input placeholder="Username" id="username" type="text" name="username" spellcheck="false">
                                </div>
                                <br>
                                <div class="html-login-form-label"><label for="password">Password:</label></div>
                                <div class="setting-item-control">
                                <input placeholder="Password" id="password" type="password" name="password" spellcheck="false">
                                </div>
                                <input style="display: none;" id="redirectUrl" type="text" name="redirectUrl" spellcheck="false">
                                <br>
                                <span class="settings-error-element" hidden id="error"></span>
                                <div class="html-form-button">
                                  <button class="mod-cta" id="loginBtn">Login</button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <script nonce="#VAR{NONCE}" type="text/javascript">
    function test() {
      try {

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        if(!username || !password) {
          error.innerText = 'You need to fill the Username and Password fields.';
          error.hidden = false;
          return;
        }
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
          if (this.readyState == 4 && this.status == 200) {
            window.location = redirectUrl.value;
          } else {
            error.innerText = 'Worng credentials.';
            error.hidden = false;
          }
        };
        xhttp.open("POST", "/login", true);
        xhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        
        xhttp.send(\`username=\${encodeURIComponent(username)}&password=\${encodeURIComponent(password)}\`);
      }
      catch (err){
        error.innerText = 'Something went wrong.';
        error.hidden = false;
        console.error(err);
      }
    }

    loginBtn.addEventListener('click',test);

  </script>
</body>
</html>
`,
      [
        {
          varName: 'THEME_MODE',
          varValue: document.body.classList.contains('theme-dark')
            ? 'theme-dark'
            : 'theme-light',
        },
        ...plugin.settings.htmlReplaceableVariables,
        ...extraVars,
      ]
    );

    return {
      contentType: 'text/css',
      payload: loginForm,
    };
  }

  const file = plugin.app.metadataCache.getFirstLinkpathDest(path, referer);
  if (!file) return null;
  console.log(file.path, file.name);

  if (file.extension === 'md') {
    const frontmatterData = await readFrontmatter(file, plugin.app);
    console.log('[HTML-Server] frontmatterData:', JSON.stringify(frontmatterData, null, 2));

    // Build internal variables list
    const internalVariables: { varName: string; varValue: string }[] = [
      {
        varName: 'RENDERED_CONTENT_FILE_NAME',
        varValue: file.basename,
      },
      {
        varName: 'THEME_MODE',
        varValue: document.body.classList.contains('theme-dark')
          ? 'theme-dark'
          : 'theme-light',
      },
    ];

    const markdown = await file.vault.read(file);
    const renderedMarkdown = await markdownRenderer.renderHtmlFromMarkdown(
      markdown
    );

    internalVariables.push({
      varName: 'RENDERED_CONTENT',
      varValue: renderedMarkdown,
    });

    // Add settings variables
    const allVariables = [
      ...internalVariables,
      ...plugin.settings.htmlReplaceableVariables,
    ];

    // Dynamic title: use file basename (higher priority than settings default)
    if (plugin.settings.useDynamicTitle) {
      allVariables.push({
        varName: 'HTML_TITLE',
        varValue: file.basename,
      });
    }

    // Frontmatter properties panel
    if (plugin.settings.showFrontmatterProperties) {
      const frontmatterHtml = generateFrontmatterHtml(frontmatterData.rawFrontmatter);
      allVariables.push({
        varName: 'FRONTMATTER_HTML',
        varValue: frontmatterHtml,
      });
    } else {
      // Empty string to remove the placeholder from template
      allVariables.push({
        varName: 'FRONTMATTER_HTML',
        varValue: '',
      });
    }

    // Frontmatter variables have highest priority
    allVariables.push(...frontmatterData.variables);

    return {
      contentType: 'text/html',
      payload: parseHtmlVariables(
        plugin.settings.indexHtml || '<html></html>',
        allVariables
      ),
    };
  }
  const payload = await plugin.app.vault.readBinary(file);

  return {
    contentType: mime.lookup(file.extension) || 'text',
    payload: Buffer.from(payload),
  };
};

async function readFrontmatter(file: TFile, app: App): Promise<{
  variables: { varName: string; varValue: string }[];
  rawFrontmatter: Record<string, unknown>;
  title?: string;
}> {
  console.log('[HTML-Server] readFrontmatter called for file:', file.path);
  return new Promise((resolve) => {
    app.fileManager
      .processFrontMatter(file, (frontMatter) => {
        console.log('[HTML-Server] Raw frontMatter:', JSON.stringify(frontMatter, null, 2));
        const parsedVariables: { varName: string; varValue: string }[] = [];
        const rawFrontmatter: Record<string, unknown> = {};
        let title: string | undefined;

        Object.entries(frontMatter || {}).forEach(([key, value]) => {
          // 跳过 htmlvars，它是特殊处理的
          if (key === 'htmlvars') return;

          // 保存原始数据用于 HTML 生成
          rawFrontmatter[key] = value;

          // Track title for HTML_TITLE
          if (key === 'title' && typeof value === 'string') {
            title = value;
          }

          // Handle arrays by joining them (用于模板变量替换)
          if (Array.isArray(value)) {
            parsedVariables.push({
              varName: 'FM:' + key,
              varValue: value.map((v) => String(v)).join(', '),
            });
            return;
          }

          // Skip non-array objects (but allow null)
          if (typeof value === 'object' && value !== null) return;

          parsedVariables.push({
            varName: 'FM:' + key,
            varValue: String(value),
          });
        });

        Object.entries(frontMatter.htmlvars || {}).forEach(([key, value]) => {
          parsedVariables.push({ varName: key, varValue: String(value) });
        });

        console.log('[HTML-Server] Final parsed variables count:', parsedVariables.length);
        resolve({ variables: parsedVariables, rawFrontmatter, title });
      })
      .catch((error) => {
        console.error('[HTML-Server] Error Parsing Frontmatter:', error);
        resolve({ variables: [], rawFrontmatter: {}, title: undefined });
      });
  });
}

// 生成 frontmatter 属性的 HTML
function generateFrontmatterHtml(
  rawFrontmatter: Record<string, unknown>
): string {
  const entries = Object.entries(rawFrontmatter);

  if (entries.length === 0) {
    return '';
  }

  // 生成 HTML 表格
  const rows = entries
    .map(([key, value]) => {
      let valueHtml: string;

      if (Array.isArray(value)) {
        // 数组渲染为无序列表
        const listItems = value
          .map((item) => `<li>${escapeHtml(String(item))}</li>`)
          .join('');
        valueHtml = `<ul class="frontmatter-list">${listItems}</ul>`;
      } else if (value === null || value === undefined) {
        valueHtml = '<span class="frontmatter-empty">-</span>';
      } else {
        valueHtml = escapeHtml(String(value));
      }

      return `<tr><td class="frontmatter-key">${escapeHtml(key)}</td><td class="frontmatter-value">${valueHtml}</td></tr>`;
    })
    .join('\n');

  return `<div class="frontmatter-container">
<div class="frontmatter-toggle">
  <span class="frontmatter-toggle-icon">▼</span>
  <span>Properties (${entries.length})</span>
</div>
<div class="frontmatter-content">
  <table class="frontmatter-table">
  <tbody>
  ${rows}
  </tbody>
  </table>
</div>
</div>`;
}

// HTML 转义
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function parseHtmlVariables(
  html: string,
  _htmlVariables: { varName: string; varValue: string }[]
) {
  const varMap = new Map();
  _htmlVariables.forEach(({ varName, varValue }) => {
    varMap.set(varName, varValue);
  });
  return html
    .replace(/(#VAR{(\S+)})/g, (_substring, _group1, variableName) => {
      let output = variableName;
      if (varMap.has(variableName)) {
        output = varMap.get(variableName);
      }
      return output;
    })
    .replace(/(\[(\S+)\])/g, (_substring, _group1, variableName) => {
      let output = variableName;
      if (varMap.has(variableName)) {
        output = varMap.get(variableName);
      }
      return output;
    });
}

// Format date for directory listing
function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Generate breadcrumb navigation HTML
function generateBreadcrumb(currentPath: string): string {
  if (!currentPath || currentPath === '/') {
    return '<nav class="directory-breadcrumb"><span>Home</span></nav>';
  }

  const pathWithoutLeadingSlash = currentPath.startsWith('/') ? currentPath.substring(1) : currentPath;
  const parts = pathWithoutLeadingSlash.split('/').filter(p => p);

  let breadcrumbHtml = '<nav class="directory-breadcrumb"><a href="/">Home</a>';
  let accumulatedPath = '';

  for (let i = 0; i < parts.length; i++) {
    accumulatedPath += '/' + encodeURIComponent(parts[i]);
    if (i === parts.length - 1) {
      // Last item - not a link
      breadcrumbHtml += ` / <span>${escapeHtml(parts[i])}</span>`;
    } else {
      breadcrumbHtml += ` / <a href="${accumulatedPath}">${escapeHtml(parts[i])}</a>`;
    }
  }

  breadcrumbHtml += '</nav>';
  return breadcrumbHtml;
}

// Generate directory listing HTML
export function generateDirectoryListingHtml(
  folder: TFolder,
  currentPath: string,
  plugin: HtmlServerPlugin
): { contentType: string; payload: string } {
  const themeMode = document.body.classList.contains('theme-dark') ? 'theme-dark' : 'theme-light';
  const isRoot = !currentPath || currentPath === '/' || currentPath === '';

  // Sort children: folders first, then files, both alphabetically
  const children = folder.children.slice().sort((a, b) => {
    const aIsFolder = a instanceof TFolder;
    const bIsFolder = b instanceof TFolder;
    if (aIsFolder && !bIsFolder) return -1;
    if (!aIsFolder && bIsFolder) return 1;
    return a.name.localeCompare(b.name);
  });

  // Build file list rows
  let tableRows = '';

  // Add parent folder link if not root
  if (!isRoot) {
    tableRows += '<tr><td class="directory-name"><a href="..">../</a></td><td class="directory-date">-</td></tr>\n';
  }

  // Add folder and file entries
  for (const child of children) {
    const isFolder = child instanceof TFolder;
    const icon = isFolder ? '📁' : '📄';
    const name = isFolder ? child.name + '/' : child.name;
    const href = '/' + encodeURIComponent(child.path).replace(/%2F/g, '/');

    let dateStr = '-';
    if (child instanceof TFile) {
      dateStr = formatDate(child.stat.mtime);
    } else if (child instanceof TFolder && child.children.length > 0) {
      // For folders, we could show the most recent modification of children
      // But for simplicity, just show "-"
      dateStr = '-';
    }

    tableRows += `<tr><td class="directory-name">${icon} <a href="${href}">${escapeHtml(name)}</a></td><td class="directory-date">${dateStr}</td></tr>\n`;
  }

  // Handle empty folder
  if (children.length === 0 && isRoot) {
    tableRows = '<tr><td colspan="2" class="directory-empty">This folder is empty</td></tr>';
  } else if (children.length === 0) {
    tableRows = '<tr><td class="directory-name"><a href="..">../</a></td><td class="directory-date">-</td></tr>\n';
    tableRows += '<tr><td colspan="2" class="directory-empty">This folder is empty</td></tr>';
  }

  const displayPath = currentPath || '/';
  const breadcrumb = generateBreadcrumb(currentPath);
  const pageTitle = isRoot ? 'Index of /' : `Index of /${folder.path}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>${escapeHtml(pageTitle)}</title>
  <link rel="shortcut icon" href="${plugin.settings.htmlReplaceableVariables.find(v => v.varName === 'FAVICON_URL')?.varValue || '//obsidian.md/favicon.ico'}">
  <link href="${plugin.settings.htmlReplaceableVariables.find(v => v.varName === 'CSS_FILE_URL')?.varValue || '/.obsidian/plugins/obsidian-http-server/app.css'}" type="text/css" rel="stylesheet">
  <style>
    .directory-listing {
      max-width: 80%;
      margin: 2em auto;
      padding: 1em;
    }
    .directory-breadcrumb {
      margin-bottom: 1.5em;
      padding: 0.5em 0;
      font-size: 1.1em;
      color: var(--text-muted);
    }
    .directory-breadcrumb a {
      color: var(--text-accent);
      text-decoration: none;
    }
    .directory-breadcrumb a:hover {
      text-decoration: underline;
    }
    .directory-breadcrumb span {
      color: var(--text-normal);
    }
    .directory-table {
      width: 100%;
      border-collapse: collapse;
    }
    .directory-table th {
      text-align: left;
      padding: 0.75em 1em;
      border-bottom: 2px solid var(--background-modifier-border);
      color: var(--text-muted);
      font-weight: 600;
    }
    .directory-table td {
      padding: 0.5em 1em;
      border-bottom: 1px solid var(--background-modifier-border);
    }
    .directory-table tr:hover {
      background-color: var(--background-modifier-hover);
    }
    .directory-name a {
      color: var(--text-accent);
      text-decoration: none;
    }
    .directory-name a:hover {
      text-decoration: underline;
    }
    .directory-date {
      color: var(--text-muted);
      white-space: nowrap;
      width: 180px;
    }
    .directory-empty {
      color: var(--text-muted);
      font-style: italic;
      text-align: center;
      padding: 2em !important;
    }
    h1 {
      color: var(--text-normal);
      margin-bottom: 0.5em;
    }
  </style>
</head>
<body class="${themeMode} mod-windows is-frameless is-maximized is-hidden-frameless obsidian-app" style="--zoom-factor:1; --font-text-size:16px;">
  <div class="app-container">
    <div class="horizontal-main-container">
      <div class="workspace">
        <div class="workspace-split mod-vertical mod-root">
          <div class="workspace-tabs mod-top mod-top-left-space mod-top-right-space">
            <div class="workspace-tab-container">
              <div class="workspace-leaf">
                <div class="workspace-leaf-content">
                  <div class="view-content">
                    <div class="directory-listing">
                      <h1>${escapeHtml(pageTitle)}</h1>
                      ${breadcrumb}
                      <table class="directory-table">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Modified</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${tableRows}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

  return {
    contentType: 'text/html',
    payload: html,
  };
}
