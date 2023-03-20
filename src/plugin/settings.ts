export type PluginSettings = {
  port: number;
  hostname: string;
  startOnLoad: boolean;
  useRibbonButon: boolean;
  indexHtml: string;
  htmlVariables: { varName: string; varValue: string }[];
};

export const DEFAULT_SETTINGS: PluginSettings = {
  port: 8080,
  hostname: 'localhost',
  startOnLoad: false,
  useRibbonButon: true,
  indexHtml: `<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport"
    content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>#VAR{HTML_TITLE}</title>
  <link rel="shortcut icon" href="#VAR{FAVICON_URL}">
  <link href="#VAR{CSS_FILE_URL}" type="text/css" rel="stylesheet">
</head>
<body
  class="theme-dark mod-windows is-frameless is-maximized is-hidden-frameless obsidian-app show-inline-title show-view-header"
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
</html>`,
  htmlVariables: [
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
};
