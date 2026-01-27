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

    /* ============================================
       响应式布局 - 移动端优先
       ============================================ */

    /* 移动端 (< 768px) */
    @media screen and (max-width: 767px) {

      /* 1. 内容宽度调整为 95% */
      .markdown-preview-sizer {
        width: 95% !important;
        max-width: 95% !important;
      }
      .markdown-preview-view.is-readable-line-width .markdown-preview-sizer {
        max-width: 95% !important;
        width: 95% !important;
      }

      /* 2. YAML 表格改为堆叠布局 */
      .frontmatter-table,
      .frontmatter-table tbody,
      .frontmatter-table tr,
      .frontmatter-table td {
        display: block;
        width: 100%;
      }

      /* 3. 键（Key）样式 - 加粗显示 */
      .frontmatter-key {
        width: 100% !important;
        font-weight: 600;
        padding: 8px 12px 4px 12px;
        border-bottom: none;
        color: var(--text-accent);
      }

      /* 4. 值（Value）样式 - 缩进显示 */
      .frontmatter-value {
        width: 100%;
        padding: 4px 12px 12px 24px; /* 左侧缩进 24px */
        word-break: break-word;
      }

      /* 5. 每个属性之间添加分隔线 */
      .frontmatter-table tr {
        margin-bottom: 0;
        padding-bottom: 8px;
        border-bottom: 1px solid var(--background-modifier-border);
      }

      .frontmatter-table tr:last-child {
        border-bottom: none;
      }

      .frontmatter-table td {
        border-bottom: none; /* 移除单元格的底部边框，使用 tr 的边框代替 */
      }

      /* 6. 增大折叠按钮的点击区域（触摸优化） */
      .frontmatter-toggle {
        padding: 12px;
        min-height: 44px; /* iOS 推荐的最小触摸目标 */
      }

      /* 7. 调整容器间距 */
      .frontmatter-container {
        margin: 1.5em 0;
      }

      /* 8. 字体大小优化 - 防止 iOS 自动缩放 */
      body {
        font-size: 16px;
      }

      /* 9. 图片响应式 */
      img {
        max-width: 100%;
        height: auto;
      }

      /* 10. 代码块优化 */
      pre {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch; /* iOS 平滑滚动 */
      }
    }

    /* 平板 (768px - 1024px) */
    @media screen and (min-width: 768px) and (max-width: 1024px) {

      /* 内容宽度调整为 85% */
      .markdown-preview-sizer {
        width: 85% !important;
        max-width: 85% !important;
      }
      .markdown-preview-view.is-readable-line-width .markdown-preview-sizer {
        max-width: 85% !important;
        width: 85% !important;
      }

      /* 保持表格布局，无需其他调整 */
    }

    /* 桌面 (> 1024px) */
    /* 保持默认的 80% 宽度，不需要额外样式 */
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
