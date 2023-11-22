export {};
import { readFile } from 'fs/promises';
import { PluginSettings } from '../settings/settings';

let config: PluginSettings;

const getBasePath = () => `${config.hostname === '0.0.0.0' ? 'localhost' : config.hostname}:${config.port}`;

const getPagePathName = (pg: typeof page) => {
  return pg.$eval<string>('body', (body) => {
    return decodeURI(window.location.pathname);
  });
};

describe('Path Resolver', () => {
  beforeAll(async () => {
    const fileContents = await readFile('./test-vault/.obsidian/plugins/html-server/data.json', {
      encoding: 'utf-8',
    });
    config = JSON.parse(fileContents.toString()) as PluginSettings;
  });

  it("Should not find a file that doesn't exists.", async () => {
    const response = await page.goto(`http://${getBasePath()}/Z`);
    expect(response?.status()).toBe(404);

    const pathname = await getPagePathName(page);

    await expect(pathname).toBe('/Z');
  });

  it('Should redirect to the correct full path (Simple 1).', async () => {
    const response = await page.goto(`http://${getBasePath()}/tests/Simple Renderer Test`);
    expect(response?.status()).toBe(200);

    const pathname = await getPagePathName(page);

    await expect(pathname).toBe('/tests/Simple Renderer Test.md');
  });

  it('Should redirect to the correct full path (Simple 2).', async () => {
    const response = await page.goto(`http://${getBasePath()}/Simple Renderer Test`);
    expect(response?.status()).toBe(200);

    const pathname = await getPagePathName(page);

    await expect(pathname).toBe('/tests/Simple Renderer Test.md');
  });

  it('Should redirect to the correct full path (Image Simple).', async () => {
    const response = await page.goto(`http://${getBasePath()}/Pasted image 20231122200402.png`);
    expect(response?.status()).toBe(200);

    const pathname = await getPagePathName(page);

    await expect(pathname).toBe('/this/is/b/Pasted image 20231122200402.png');
  });

  it('Should redirect to the correct full path (Complex 1).', async () => {
    const response = await page.goto(`http://${getBasePath()}/Test.md`);
    expect(response?.status()).toBe(200);

    const pathname = await getPagePathName(page);

    await expect(pathname).toBe('/this/is/a/Test.md');
  });

  it('Should redirect to the correct full path (Complex 2).', async () => {
    page.setExtraHTTPHeaders({
      referer: `http://${getBasePath()}/this/is/b/file%20resolver%20test.md`,
    });
    const response = await page.goto(`http://${getBasePath()}/Test`);
    expect(response?.status()).toBe(200);

    const pathname = await getPagePathName(page);

    await expect(pathname).toBe('/this/is/b/Test.md');
  });
});
