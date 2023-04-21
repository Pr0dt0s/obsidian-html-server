import 'obsidian';
import { PluginSettings } from 'plugin/settings/settings';
export {
  App,
  PluginSettingTab,
  Setting,
  MarkdownPreviewRenderer,
  MarkdownView,
  WorkspaceLeaf,
  Plugin,
} from 'obsidian';

declare module 'obsidian' {
  interface App {
    plugins: {
      disablePlugin: (id: string) => Promise<void>;
      enablePlugin: (id: string) => Promise<void>;
    };
  }

  interface Workspace {
    on(
      name: 'html-server-event',
      callback: (data: { isServerRunning: boolean }) => void
    ): EventRef;
    on(
      name: 'html-server-settings-change',
      callback: (settings: PluginSettings) => void
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
