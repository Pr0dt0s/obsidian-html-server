import express from 'express';
import { IncomingMessage, Server, ServerResponse } from 'http';
import HtmlServerPlugin from './main';
import mime from 'mime-types';
import { CustomMarkdownRenderer } from './markdownRenderer/customMarkdownRenderer';
import { ObsidianMarkdownRenderer } from './markdownRenderer/obsidianMarkdownRenderer';

export class ServerController {
  app: express.Application;
  server?: Server<typeof IncomingMessage, typeof ServerResponse>;
  markdownRenderer: CustomMarkdownRenderer;

  constructor(private plugin: HtmlServerPlugin) {
    this.app = express();

    this.markdownRenderer = new ObsidianMarkdownRenderer(plugin, plugin.app);

    this.app.use('/', async (req, res) => {
      let path = req.path;
      if (!path || path === '/') {
        path = '/' + plugin.settings.defaultFile;
        console.log(plugin.settings.defaultFile);
      }

      const r = await this.createFileResolver()(decodeURI(path));

      console.log(r);

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
          console.log('Server Started!');
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
        console.log('handling css');
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
          console.log('handling correct data');
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
