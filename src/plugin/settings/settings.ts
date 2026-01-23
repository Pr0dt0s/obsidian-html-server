import { randomBytes } from 'crypto';

export type ReplaceableVariables = { varName: string; varValue: string };

export type PluginSettings = {
  port: number;
  defaultFile: string;
  hostname: string;
  startOnLoad: boolean;
  useRibbonButons: boolean;
  indexHtml: string;
  htmlReplaceableVariables: ReplaceableVariables[];
  showAdvancedOptions: boolean;
  useSimpleAuth: boolean;
  simpleAuthUsername: string;
  simpleAuthPassword: string;
  useDynamicTitle: boolean;
  showFrontmatterProperties: boolean;
  enableDirectoryListing: boolean;
};

export const DEFAULT_SETTINGS: PluginSettings = {
  port: 8080,
  hostname: '0.0.0.0',
  defaultFile: '',
  startOnLoad: false,
  useRibbonButons: true,
  indexHtml: `<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport"
    content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>#VAR{HTML_TITLE}</title>
  <link rel="shortcut icon" href="#VAR{FAVICON_URL}">
  <link href="#VAR{CSS_FILE_URL}" type="text/css" rel="stylesheet">
  <base href="/">
  <style>
    /* 覆盖 Obsidian 的宽度限制，设置为 80% 居中 */
    .markdown-preview-sizer {
      max-width: 80% !important;
      width: 80% !important;
      margin: 0 auto !important;
      padding-left: 0 !important;
      padding-right: 0 !important;
    }
    .markdown-preview-view.is-readable-line-width .markdown-preview-sizer {
      max-width: 80% !important;
      width: 80% !important;
    }
    /* 折叠面板样式 */
    .frontmatter-container {
      margin: 1em 0 2em 0;
    }
    .frontmatter-toggle {
      display: flex;
      align-items: center;
      cursor: pointer;
      user-select: none;
      padding: 0.5em 0;
      color: var(--text-muted);
      font-size: 0.9em;
    }
    .frontmatter-toggle:hover {
      color: var(--text-normal);
    }
    .frontmatter-toggle-icon {
      margin-right: 0.5em;
      transition: transform 0.2s;
    }
    .frontmatter-toggle-icon.collapsed {
      transform: rotate(-90deg);
    }
    .frontmatter-content {
      overflow: hidden;
      transition: max-height 0.3s ease-out;
    }
    .frontmatter-content.collapsed {
      max-height: 0 !important;
    }
    .frontmatter-table {
      width: 100%;
      border-collapse: collapse;
    }
    .frontmatter-table td {
      padding: 0.5em 1em;
      border-bottom: 1px solid var(--background-modifier-border);
      vertical-align: top;
    }
    .frontmatter-table tr:last-child td {
      border-bottom: none;
    }
    .frontmatter-key {
      width: 150px;
      color: var(--text-accent);
      white-space: nowrap;
      font-weight: 500;
    }
    .frontmatter-value {
      word-break: break-word;
    }
    .frontmatter-list {
      margin: 0;
      padding-left: 1.2em;
      list-style-type: disc;
    }
    .frontmatter-list li {
      margin: 0.3em 0;
    }
    .frontmatter-empty {
      color: var(--text-muted);
    }
  </style>
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
                        tabindex="-1" style="tab-size: 4;">
                        <div class="markdown-preview-sizer markdown-preview-section">
                          <div class="markdown-preview-pusher" style="width: 1px; height: 0.1px; margin-bottom: 0px;"></div>
                          <div class="mod-header">
                            <div class="inline-title" contenteditable="true" spellcheck="false" tabindex="-1" enterkeyhint="done">#VAR{RENDERED_CONTENT_FILE_NAME}
                            </div>
                            #VAR{FRONTMATTER_HTML}
                            #VAR{RENDERED_CONTENT}
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
  <script>
    document.querySelectorAll('.frontmatter-toggle').forEach(function(toggle) {
      toggle.addEventListener('click', function() {
        var icon = this.querySelector('.frontmatter-toggle-icon');
        var content = this.nextElementSibling;
        icon.classList.toggle('collapsed');
        content.classList.toggle('collapsed');
      });
    });
  </script>
</body>
</html>`,
  htmlReplaceableVariables: [
    {
      varName: 'HTML_TITLE',
      varValue: 'Obsidian Html Server',
    },
    {
      varName: 'FAVICON_URL',
      varValue: '//obsidian.md/favicon.ico',
    },
    {
      varName: 'CSS_FILE_URL',
      varValue: '/.obsidian/plugins/obsidian-http-server/app.css',
    },
  ],
  showAdvancedOptions: false,
  useSimpleAuth: false,
  simpleAuthUsername: 'obsidian',
  simpleAuthPassword: randomBytes(8).toString('hex'),
  useDynamicTitle: true,
  showFrontmatterProperties: true,
  enableDirectoryListing: true,
};
