import {
  App,
  MarkdownPreviewRenderer,
  MarkdownView,
  WorkspaceLeaf,
} from 'obsidian';
import HtmlServerPlugin from 'plugin/main';
import { CustomMarkdownRenderer } from './customMarkdownRenderer';

export class ObsidianMarkdownRenderer extends CustomMarkdownRenderer {
  rootElement: HTMLDivElement;

  constructor(private plugin: HtmlServerPlugin, private app: App) {
    super();
    this.patchObisianMarkdownRenderer();
    this.rootElement = this.getOrCreateRootDomElement();
  }

  private patchObisianMarkdownRenderer() {
    const originalQueueRenderFn = MarkdownPreviewRenderer.prototype.queueRender;

    const alteredQueueRenderFn: typeof originalQueueRenderFn = function (
      this: MarkdownPreviewRenderer
    ) {
      this.rendered || (this.rendered = []);
      const e = this.queued;
      const t = !this.parsing;
      if (e && t && !e.high) {
        e.cancel();
        const timeOut = setTimeout(this.onRender.bind(this), 0);
        this.queued = {
          high: true,
          cancel: () => clearTimeout(timeOut),
        };
      } else {
        const n = t ? 0 : 200;
        const timeOut = setTimeout(this.onRender.bind(this), n);
        this.queued = {
          high: !n,
          cancel: () => clearTimeout(timeOut),
        };
      }
    };

    console.log(
      'Patching queueRender Function to be able to render even when the main Obsidian window is minimized/not focused'
    );
    MarkdownPreviewRenderer.prototype.queueRender = alteredQueueRenderFn;

    this.plugin.register(() => {
      console.log('Restoring the original queueRenderFunction');

      MarkdownPreviewRenderer.prototype.queueRender = originalQueueRenderFn;
    });
  }

  private getOrCreateRootDomElement() {
    const maybe = document.querySelector<HTMLDivElement>(
      'body .html-server-rendering-element'
    );
    if (!maybe) {
      const rootEl = document.body.createEl('div');
      rootEl.addClass('html-server-rendering-element');
      return rootEl;
    }
    return maybe;
  }

  async renderHtmlFromMarkdown(_markdown: string): Promise<string> {
    // Create New Leaf
    //@ts-ignore
    const leaf = new WorkspaceLeaf(this.app);

    const el = this.rootElement.createDiv();
    leaf.containerEl = el;

    const view = new MarkdownView(leaf);
    leaf.view = view;

    view.currentMode.type = 'preview';

    const renderedPromise = new Promise<string>((resolve, _reject) => {
      view.currentMode.onRenderComplete = () => {
        if (view.currentMode.renderer.queued) return;

        const html = view.currentMode.renderer.previewEl.innerHTML;
        view.currentMode.renderer.previewEl.detach();
        console.log(html);

        view.currentMode.onRenderComplete = () => {};

        leaf.detach();
        resolve(html);
      };
    });

    view.currentMode.renderer.set(`## Example markdown file # 2
    
![[img.png]]

![[file1]]

asdasd
`);

    return renderedPromise;
  }
}
