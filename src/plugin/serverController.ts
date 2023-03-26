import express from 'express';
import { IncomingMessage, Server, ServerResponse } from 'http';
import { Component, MarkdownRenderer } from 'obsidian';
import path from 'path';
import HtmlServerPlugin from './main';
import mime, { contentType } from 'mime-types';
import { readFile } from 'fs/promises';

export class ServerController {
  app: express.Application;
  server?: Server<typeof IncomingMessage, typeof ServerResponse>;

  constructor(private plugin: HtmlServerPlugin) {
    this.app = express();

    this.app.use('/', async (req, res) => {
      const r = await this.createFileResolver()(decodeURI(req.path));

      if (!r) {
        res.status(404).write(`Couldn't resolve file at path '${req.path}'`);
        res.end();
        return;
      }
      console.log(r.contentType);
      res.contentType(r.contentType);
      console.log(res.charset);
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

    const tryResolveFile: (
      requestedUrl: string
    ) => Promise<{
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
            ...this.plugin.settings.htmlVariables,
            {
              varName: 'RENDERED_CONTENT_FILE_NAME',
              varValue: 'No file loaded...',
            },
            {
              varName: 'RENDERED_CONTENT',
              varValue: '',
            },
          ]
        );

        return {
          contentType: 'text/html; charset=UTF-8',
          payload: data,
        };
      } else {
        const requestedFile = this.plugin.app.vault.getFiles().find((file) => {
          console.log(file.path);
          return '/' + file.path == requestedUrl;
        });
        if (requestedFile?.extension && requestedFile.extension === 'md') {
          const markdown = await requestedFile.vault.read(requestedFile);
          const rendererDiv = createDiv();
          const sourcePath = path.dirname('/' + requestedFile.path);
          await MarkdownRenderer.renderMarkdown(
            markdown,
            rendererDiv,
            sourcePath,
            new Component()
          );
          return {
            contentType: 'text/html',
            payload: parseHtmlVariables(
              this.plugin.settings.indexHtml || '<html></html>',
              [
                ...this.plugin.settings.htmlVariables,
                {
                  varName: 'RENDERED_CONTENT_FILE_NAME',
                  varValue: requestedFile.basename,
                },
                {
                  varName: 'RENDERED_CONTENT',
                  varValue: rendererDiv.innerHTML,
                },
              ]
            ),
          };
        } else if (requestedFile) {
          // const payload = await requestedFile.vault.read(requestedFile);
          // console.log(Buffer.from(payload));

          const payload = await readFile(
            path.join(
              this.plugin.app.vault.adapter.basePath,
              '/' + requestedFile.path
            )
          );

          return {
            contentType: mime.lookup(requestedFile.extension) || 'text',
            payload,
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
}
