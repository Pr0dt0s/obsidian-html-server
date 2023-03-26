import 'obsidian';

declare module 'obsidian' {
  interface Workspace {
    on(
      name: 'html-server-event',
      callback: (data: { isServerRunning: boolean }) => void
    ): EventRef;
  }

  interface DataAdapter {
    basePath: string;
  }
}
