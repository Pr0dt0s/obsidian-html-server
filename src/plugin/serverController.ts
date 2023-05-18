import express, { Handler } from 'express';
import expressSession from 'express-session';

import { IncomingMessage, Server, ServerResponse } from 'http';
import HtmlServerPlugin from './main';
import mime from 'mime-types';
import { CustomMarkdownRenderer } from './markdownRenderer/customMarkdownRenderer';
import { ObsidianMarkdownRenderer } from './markdownRenderer/obsidianMarkdownRenderer';
import * as passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { randomBytes } from 'crypto';

export class ServerController {
  app: express.Application;
  server?: Server<typeof IncomingMessage, typeof ServerResponse>;
  markdownRenderer: CustomMarkdownRenderer;

  constructor(private plugin: HtmlServerPlugin) {
    this.app = express();

    this.app.use(
      expressSession({ secret: randomBytes(16).toString('base64') })
    );
    this.app.use(passport.initialize());
    this.app.use(passport.session());

    passport.serializeUser(function (user, done) {
      done(null, user);
    });

    passport.deserializeUser(function (username, done) {
      done(null, { username });
    });

    this.markdownRenderer = new ObsidianMarkdownRenderer(plugin, plugin.app);

    passport.use(
      new LocalStrategy((username, password, done) => {
        if (
          username === this.plugin.settings.simpleAuthUsername &&
          password === this.plugin.settings.simpleAuthPassword
        ) {
          done(null, { username });
          return;
        }
        done('Wrong Credentials');
      })
    );

    this.app.use(express.urlencoded());

    this.app.post('/login', passport.authenticate('local', {}), (req, res) => {
      res.redirect(req.body.redirectUrl || '/');
    });

    this.app.use('/', this.authenticateIfNeeded, async (req, res) => {
      let path = req.path;
      if (!path || path === '/') {
        path = '/' + plugin.settings.defaultFile;
      }

      const r = await this.createFileResolver()(decodeURI(path));

      if (!r) {
        res.status(404).write(`Couldn't resolve file at path '${req.path}'`);
        res.end();
        return;
      }

      res.contentType(r.contentType);
      res.write(r.payload);
      res.end();
    });
  }

  async start() {
    if (!this.server || !this.server.listening) {
      this.server = await new Promise<
        Server<typeof IncomingMessage, typeof ServerResponse> | undefined
      >((resolve) => {
        try {
          if (this.server?.listening) return resolve(this.server);
          const server = this.app.listen(
            this.plugin.settings.port,
            this.plugin.settings.hostname,
            () => {
              resolve(server);
            }
          );
        } catch (error) {
          console.error('error trying to start the server', error);
          resolve(undefined);
        }
      });
    }
  }

  async stop() {
    if (this.server && this.server.listening) {
      await new Promise<void>((resolve) => {
        this.server?.close((err) => {
          err && console.error(err);
          resolve();
        });
      });
    }
  }

  async reload() {
    if (!this.isRunning()) return;
    await this.stop();
    await this.start();
  }

  isRunning() {
    return this.server?.listening;
  }

  authenticateIfNeeded: Handler = (req, res, next) => {
    if (!this.plugin.settings.useSimpleAuth) return next();

    if (req.user) return next();

    if (req.url.endsWith('.css') || req.url.endsWith('.ico')) return next();

    const nonce = randomBytes(16).toString('base64');
    res.contentType('text/html; charset=UTF-8');
    res.setHeader('Content-Security-Policy', `script-src 'nonce-${nonce}'`);

    const loginForm = parseHtmlVariables(
      `
<html>
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
                              <form action="login" method="POST" class="html-login-form">
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
                                <div class="html-form-button">
                                  <button class="mod-cta" action="submit">Login</button>
                                </div>
                              </form>
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
  <script nonce="#VAR{NONCE}"> redirectUrl.value = "#VAR{REDIRECT_URL}"; </script>
</body>
</html>
`,
      [
        ...this.plugin.settings.htmlReplaceableVariables,
        {
          varName: 'THEME_MODE',
          varValue: document.body.classList.contains('theme-dark')
            ? 'theme-dark'
            : 'theme-light',
        },
        {
          varName: 'REDIRECT_URL',
          varValue: req.url,
        },
        {
          varName: 'NONCE',
          varValue: nonce,
        },
      ]
    );

    res.send(loginForm);
  };

  createFileResolver() {
    const fullCssText =
      Array.from(document.styleSheets)
        .flatMap((styleSheet) =>
          Array.from(styleSheet.cssRules).map((cssRule) => cssRule.cssText)
        )
        .join('\n') +
      `\n.markdown-preview-view, .markdown-embed-content {height: unset !important;}`;

    const tryResolveFile: (requestedUrl: string) => Promise<{
      contentType: string;
      payload: string | Buffer;
    } | null> = async (requestedUrl: string) => {
      if (requestedUrl == '/.obsidian/plugins/obsidian-http-server/app.css') {
        return {
          contentType: 'text/css',
          payload: fullCssText,
        };
      }

      if (requestedUrl == '/') {
        const data = parseHtmlVariables(
          this.plugin.settings.indexHtml || '<html></html>',
          [
            ...this.plugin.settings.htmlReplaceableVariables,
            {
              varName: 'RENDERED_CONTENT_FILE_NAME',
              varValue: 'No file loaded...',
            },
            {
              varName: 'RENDERED_CONTENT',
              varValue: '',
            },
            {
              varName: 'THEME_MODE',
              varValue: document.body.classList.contains('theme-dark')
                ? 'theme-dark'
                : 'theme-light',
            },
          ]
        );

        return {
          contentType: 'text/html; charset=UTF-8',
          payload: data,
        };
      } else {
        const requestedFile = this.plugin.app.vault.getFiles().find((file) => {
          return (
            '/' + file.path == requestedUrl ||
            '/' + file.path == requestedUrl + '.md'
          );
        });
        if (requestedFile?.extension && requestedFile.extension === 'md') {
          const markdown = await requestedFile.vault.read(requestedFile);

          return {
            contentType: 'text/html',
            payload: parseHtmlVariables(
              this.plugin.settings.indexHtml || '<html></html>',
              [
                ...this.plugin.settings.htmlReplaceableVariables,
                {
                  varName: 'RENDERED_CONTENT_FILE_NAME',
                  varValue: requestedFile.basename,
                },
                {
                  varName: 'RENDERED_CONTENT',
                  varValue: await this.markdownRenderer.renderHtmlFromMarkdown(
                    markdown
                  ),
                },
                {
                  varName: 'THEME_MODE',
                  varValue: document.body.classList.contains('theme-dark')
                    ? 'theme-dark'
                    : 'theme-light',
                },
              ]
            ),
          };
        } else if (requestedFile) {
          const payload = await this.plugin.app.vault.readBinary(requestedFile);

          return {
            contentType: mime.lookup(requestedFile.extension) || 'text',
            payload: Buffer.from(payload),
          };
        }
      }

      return null;
    };
    return tryResolveFile;
  }
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

/**
 * @deprecated
 */
export function renderFileInBrowserWindow(requestedUrl: string) {
  return new Promise<{
    payload: string;
    contentType: string;
  } | null>(
    //@ts-ignore
    (resolve) => {
      //@ts-ignore
      const bw = new electron.remote.BrowserWindow({
        show: false,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
        },
      });

      //@ts-ignore
      const eventListener = (
        _event: string,
        {
          renderedUrl,
          contentType,
          data,
        }: {
          renderedUrl: string;
          contentType: string;
          data: string;
        }
      ) => {
        if (renderedUrl == requestedUrl) {
          //@ts-ignore
          bw.close();
          //@ts-ignore
          electron.remote.ipcMain.removeListener('test', eventListener);

          resolve({
            contentType,
            payload: data,
          });
        }
      };

      //@ts-ignore
      electron.remote.ipcMain.on('test', eventListener);

      //@ts-ignore
      bw.loadURL('app:obsidian.md' + requestedUrl).then(() => {
        //@ts-ignore
        bw.webContents.executeJavaScript(`
              const data = {renderedUrl:'${requestedUrl}', contentType: document.contentType, data: document.querySelector('pre').textContent};
              console.log('sending data: ', data);
              require('electron').ipcRenderer.send('test',data);
              `);
      });
    }
  );
}
