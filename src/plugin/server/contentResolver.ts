import { INTERNAL_CSS_ENPOINT } from './pathResolver';
import HtmlServerPlugin from 'plugin/main';
import { CustomMarkdownRenderer } from 'plugin/markdownRenderer/customMarkdownRenderer';
import mime from 'mime-types';
import { ReplaceableVariables } from 'plugin/settings/settings';
import { App, TFile } from 'obsidian';

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
  if (path == INTERNAL_CSS_ENPOINT) {
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
        
        xhttp.send(\`username=\${username}&password=\${password}\`);
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
    const frontmatterVariables = await readFrontmatter(file, plugin.app);
    const markdown = await file.vault.read(file);
    const renderedMarkdown = await markdownRenderer.renderHtmlFromMarkdown(
      markdown
    );
    return {
      contentType: 'text/html',
      payload: parseHtmlVariables(
        plugin.settings.indexHtml || '<html></html>',
        [
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
          {
            varName: 'RENDERED_CONTENT',
            varValue: renderedMarkdown,
          },
          ...plugin.settings.htmlReplaceableVariables,
          ...frontmatterVariables,
        ]
      ),
    };
  }
  const payload = await plugin.app.vault.readBinary(file);

  return {
    contentType: mime.lookup(file.extension) || 'text',
    payload: Buffer.from(payload),
  };
};

//   if (requestedUrl == '/') {
//     const data = parseHtmlVariables(
//       plugin.settings.indexHtml || '<html></html>',
//       [
//         ...plugin.settings.htmlReplaceableVariables,
//         {
//           varName: 'RENDERED_CONTENT_FILE_NAME',
//           varValue: 'No file loaded...',
//         },
//         {
//           varName: 'RENDERED_CONTENT',
//           varValue: '',
//         },
//         {
//           varName: 'THEME_MODE',
//           varValue: document.body.classList.contains('theme-dark')
//             ? 'theme-dark'
//             : 'theme-light',
//         },
//       ]
//     );

//     return {
//       contentType: 'text/html; charset=UTF-8',
//       payload: data,
//     };
//   } else {

//     // const file = plugin.app.vault.getFiles().find((file) => {
//     //   return (
//     //     '/' + file.path == requestedUrl ||
//     //     '/' + file.path == requestedUrl + '.md'
//     //   );
//     // });

//     if (file?.extension && file.extension === 'md') {
//       const frontmatterVariables = await readFrontmatter(
//         file,
//         plugin.app
//       );
//       const markdown = await file.vault.read(file);
//       const renderedMarkdown =
//         await markdownRenderer.renderHtmlFromMarkdown(markdown);
//       return {
//         contentType: 'text/html',
//         payload: parseHtmlVariables(
//           plugin.settings.indexHtml || '<html></html>',
//           [
//             {
//               varName: 'RENDERED_CONTENT_FILE_NAME',
//               varValue: file.basename,
//             },
//             {
//               varName: 'THEME_MODE',
//               varValue: document.body.classList.contains('theme-dark')
//                 ? 'theme-dark'
//                 : 'theme-light',
//             },
//             {
//               varName: 'RENDERED_CONTENT',
//               varValue: renderedMarkdown,
//             },
//             ...plugin.settings.htmlReplaceableVariables,
//             ...frontmatterVariables,
//           ]
//         ),
//       };
//     } else if (file) {
//       const payload = await plugin.app.vault.readBinary(file);

//       return {
//         contentType: mime.lookup(file.extension) || 'text',
//         payload: Buffer.from(payload),
//       };
//     }
//   }

//   return null;
// };

async function readFrontmatter(file: TFile, app: App) {
  return new Promise<{ varName: string; varValue: string }[]>((resolve) => {
    app.fileManager
      .processFrontMatter(file, (frontMatter) => {
        const parsedVariables: { varName: string; varValue: string }[] = [];

        Object.entries(frontMatter || {}).forEach(([key, value]) => {
          if (typeof value === 'object') return;
          parsedVariables.push({
            varName: 'FM:' + key,
            varValue: String(value),
          });
        });

        Object.entries(frontMatter.htmlvars || {}).forEach(([key, value]) => {
          parsedVariables.push({ varName: key, varValue: String(value) });
        });
        resolve(parsedVariables);
      })
      .catch((error) => {
        console.error('Error Parsing Frontmatter');
        console.error(error);
        resolve([]);
      });
  });
}

function parseHtmlVariables(
  html: string,
  _htmlVariables: { varName: string; varValue: string }[]
) {
  const varMap = new Map();
  _htmlVariables.forEach(({ varName, varValue }) => {
    varMap.set(varName, varValue);
  });
  return html.replace(/(#VAR{(\S+)})/g, (_substring, _group1, variableName) => {
    let output = variableName;
    if (varMap.has(variableName)) {
      output = varMap.get(variableName);
    }
    return output;
  });
}
