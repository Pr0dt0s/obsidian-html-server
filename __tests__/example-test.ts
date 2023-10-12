export {};
import { readFile } from 'fs/promises';
import { PluginSettings } from '../src/plugin/settings/settings';

let config: PluginSettings;

describe('Basic Html server configuration.', () => {
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
      }:${config.port}`
    );
  });

  it('Should set the correct title', async () => {
    await expect(await page.title()).toEqual(
      config.htmlReplaceableVariables.find(
        (variable) => variable.varName === 'HTML_TITLE'
      )?.varValue
    );
  });
});
