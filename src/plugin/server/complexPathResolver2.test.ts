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
    page.setExtraHTTPHeaders({
      referer: `http://${
        config.hostname === '0.0.0.0' ? 'localhost' : config.hostname
      }:${config.port}/this/is/b/file%20resolver%20test.md`,
    });
    await page.goto(
      `http://${
        config.hostname === '0.0.0.0' ? 'localhost' : config.hostname
      }:${config.port}/Test`
    );
  });

  it('Should redirect to the full path acording to the correct referrer.', async () => {
    const pathname = await page.$eval<string>('body', (body) => {
      return window.location.pathname;
    });

    await expect(pathname).toEqual(encodeURI('/this/is/b/Test.md'));
  });
});
