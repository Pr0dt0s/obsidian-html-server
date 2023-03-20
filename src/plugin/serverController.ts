import express from 'express';
import { IncomingMessage, Server, ServerResponse } from 'http';
import HtmlServerPlugin from './main';

export class ServerController {
  app: express.Application;
  server?: Server<typeof IncomingMessage, typeof ServerResponse>;

  constructor(private plugin: HtmlServerPlugin) {
    this.app = express();

    this.app.use('/', async (req, res) => {
      const r = await this.createFileResolver()(req.path);

      if (r) {
        res.contentType(r.contentType);
        res.send(r.payload);
        res.end();
        return;
      }

      res.status(404).write(`Couldn't resolve file at path '${req.path}'`);
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
          console.log('Server Stopped!');
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
    const fullCssText = Array.from(document.styleSheets)
      .flatMap((styleSheet) =>
        Array.from(styleSheet.cssRules).map((cssRule) => cssRule.cssText)
      )
      .join('\n');

    const tryResolveFile = async (requestedUrl: string) => {
      // if (requestedUrl.endsWith('.js')) {
      //   return { contentType: 'text/javascript', payload: '' };
      // }

      if (requestedUrl == '/.obsidian/plugins/obsidian-http-server/app.css') {
        console.log('handling css');
        return {
          contentType: 'text/css',
          payload: fullCssText,
        };
      }

      if (requestedUrl == '/') {
        console.log('handling index');

        let html = parseHtmlVariables(
          this.plugin.settings.indexHtml || '<html></html>',
          this.plugin.settings.htmlVariables
        );

        return {
          contentType: 'text/html; charset=UTF-8',
          payload: html,
        };
      }

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

          console.log('Requesting url app:obsidian.md' + requestedUrl);
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
    };
    return tryResolveFile;
  }
}
function parseHtmlVariables(
  html: string,
  _htmlVariables: { varName: string; varValue: string }[]
) {
  return html.replace(/(#VAR{(\S)})/g, (_substrs, ...other) => {
    console.log(other);
    return '';
  });
}
