export {};
import { readFile } from 'fs/promises';
import { PluginSettings } from '../settings/settings';

let config: PluginSettings;

describe('Path Resolver', () => {
  beforeAll(async () => {
    config = JSON.parse(
      (
        await readFile('./test-vault/.obsidian/plugins/html-server/data.json', {
          encoding: 'utf-8',
        })
      ).toString()
    ) as PluginSettings;
    await page.goto(
      `http://${
        config.hostname === '0.0.0.0' ? 'localhost' : config.hostname
      }:${config.port}/Simple Renderer Test`
    );
  });

  it('Should redirect to the full path.', async () => {
    const pathname = await page.$eval<string>('body', (body) => {
      return window.location.pathname;
    });

    await expect(pathname).toEqual(encodeURI('/tests/Simple Renderer Test.md'));
  });
});
