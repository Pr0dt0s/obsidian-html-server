import { App } from 'obsidian';

export const INTERNAL_CSS_ENPOINT =
  '/.obsidian/plugins/obsidian-http-server/app.css';
export const INTERNAL_LOGIN_ENPOINT =
  '/.obsidian/plugins/obsidian-http-server/login.html';

export const tryResolveFilePath: (
  requestedUrl: string,
  resolveFrom: string,
  app: App
) => string | null = (requestedUrl, resolveFrom, app) => {
  if ([INTERNAL_CSS_ENPOINT, INTERNAL_LOGIN_ENPOINT].includes(requestedUrl))
    return requestedUrl;

  const requestedFile = app.metadataCache.getFirstLinkpathDest(
    requestedUrl.substring(1),
    resolveFrom
  );

  if (requestedFile) return requestedFile.path;

  //@ts-ignore
  return global.app.fileManager[requestedUrl.substring(1)];
};
