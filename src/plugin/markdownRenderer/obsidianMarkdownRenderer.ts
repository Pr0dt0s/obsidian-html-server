import {
  App,
  MarkdownPreviewRenderer,
  MarkdownView,
  WorkspaceLeaf,
} from 'typings';
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

  async renderHtmlFromMarkdown(markdown: string): Promise<string> {
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

        this.postProcess(view.currentMode.renderer.previewEl);

        const html = view.currentMode.renderer.previewEl.innerHTML;
        // view.currentMode.renderer.previewEl.detach();

        // view.currentMode.onRenderComplete = () => {};

        // leaf.detach();
        resolve(html);
      };
    });

    view.currentMode.renderer.set(markdown);

    return renderedPromise;
  }

  private postProcess(el: Element) {
    const links = el.querySelectorAll<HTMLAnchorElement>('a.internal-link');

    links.forEach((link) => {
      link.target = '';
    });

    const embeds = el.querySelectorAll<HTMLSpanElement>(
      'span.internal-embed.markdown-embed.inline-embed'
    );

    embeds.forEach((embed) => {
      if (embed.parentElement && embed.parentElement.parentElement) {
        embed.parentElement.parentElement.style.position = 'relative';
      }
      //TODO: change link to anchor
    });

    const imagesContainers = el.querySelectorAll<HTMLDivElement>(
      '.internal-embed.media-embed.image-embed'
    );

    imagesContainers.forEach((imageContainer) => {
      const src = imageContainer.getAttribute('src') || '';
      const imageElement = imageContainer.querySelector('img');
      if (imageElement) imageElement.src = src;
    });
  }
}
