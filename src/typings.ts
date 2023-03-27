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

  interface WorkspaceItem {
    containerEl: Element;
  }

  interface MarkdownSubView {
    type: MarkdownViewModeType;
    renderer: MarkdownPreviewRenderer;
    onRenderComplete: () => void;
  }
  interface MarkdownPreviewRenderer {
    queued?: { high: boolean; cancel: () => void };
    previewEl: Element;
    queueRender: () => void;
    set: (markdown: string) => void;
    rendered?: unknown[];
    parsing: boolean;
    onRender: () => void;
    __proto__: MarkdownPreviewRenderer;
  }
}
