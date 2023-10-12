export {};
import { readFile } from 'fs/promises';
import { PluginSettings } from '../settings/settings';

let config: PluginSettings;

describe('Basic Html serv.er configuration.', () => {
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

  it('Should render the contents of a simple file correctly.', async () => {
    const bodyText = await page.$eval<string>('body', (body) => {
      //@ts-ignore
      return body.innerText;
    });

    await expect(bodyText).toEqual(
      'Simple Renderer Test\n\nThis is a simple test.'
    );
  });

  it('Should set the correct classes according to settings.', async () => {
    const bodyClasses = await page.$eval<Array<string>>('body', (body) => {
      return Array.from(body.classList);
    });

    await expect(bodyClasses).toHaveLength(8);
    await expect(bodyClasses).toContain('theme-dark');
  });
});
