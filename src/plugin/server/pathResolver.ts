import { App, TFile, TFolder } from 'obsidian';

export const INTERNAL_CSS_ENPOINT =
  '/.obsidian/plugins/obsidian-http-server/app.css';
export const INTERNAL_LOGIN_ENPOINT =
  '/.obsidian/plugins/obsidian-http-server/login.html';

export type PathResolutionResult = {
  type: 'file';
  path: string;
  file: TFile;
} | {
  type: 'folder';
  path: string;
  folder: TFolder;
} | {
  type: 'special';
  path: string;
} | null;

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

export const resolvePathWithType: (
  requestedUrl: string,
  resolveFrom: string,
  app: App
) => PathResolutionResult = (requestedUrl, resolveFrom, app) => {
  // Check for internal endpoints
  if ([INTERNAL_CSS_ENPOINT, INTERNAL_LOGIN_ENPOINT].includes(requestedUrl)) {
    return { type: 'special', path: requestedUrl };
  }

  const pathWithoutSlash = requestedUrl.substring(1);

  // Try to resolve as file first
  const requestedFile = app.metadataCache.getFirstLinkpathDest(
    pathWithoutSlash,
    resolveFrom
  );

  if (requestedFile) {
    return { type: 'file', path: requestedFile.path, file: requestedFile };
  }

  // Check if it's a folder
  const abstractFile = app.vault.getAbstractFileByPath(pathWithoutSlash);
  if (abstractFile instanceof TFolder) {
    return { type: 'folder', path: abstractFile.path, folder: abstractFile };
  }

  // Check root folder case
  if (requestedUrl === '/' || pathWithoutSlash === '') {
    const rootFolder = app.vault.getRoot();
    return { type: 'folder', path: '', folder: rootFolder };
  }

  //@ts-ignore
  const fallbackPath = global.app.fileManager[pathWithoutSlash];
  if (fallbackPath) {
    // Check if the fallback is a file or folder
    const fallbackFile = app.vault.getAbstractFileByPath(fallbackPath);
    if (fallbackFile instanceof TFile) {
      return { type: 'file', path: fallbackPath, file: fallbackFile };
    }
    if (fallbackFile instanceof TFolder) {
      return { type: 'folder', path: fallbackPath, folder: fallbackFile };
    }
  }

  return null;
};
