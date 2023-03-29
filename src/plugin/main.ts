import {
  MarkdownPreviewRenderer,
  MarkdownView,
  Plugin,
  WorkspaceLeaf,
} from 'obsidian';
import { PluginSettings, DEFAULT_SETTINGS } from './settings';
import { ServerController } from './serverController';
import { setupUiElements } from './uiSetup';
import { HtmlServerSettingsTab as HtmlServerPluginSettingsTab } from './settingsTab';

export default class HtmlServerPlugin extends Plugin {
  public settings!: PluginSettings;

  serverController?: ServerController;

  async onload() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());

    await new Promise<void>((resolve) =>
      this.app.workspace.onLayoutReady(resolve)
    );

    const originalQueueRenderFn = MarkdownPreviewRenderer.prototype.queueRender;
    console.log(
      'Patching queueRender Function to be able to render even when the main Obsidian window is minimized/not focused'
    );
    MarkdownPreviewRenderer.prototype.queueRender =
      function alteredQueueRender() {
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

    this.register(() => {
      console.log('Restoring the original queueRenderFunction');
      MarkdownPreviewRenderer.prototype.queueRender = originalQueueRenderFn;
    });

    // Create New Leaf
    //@ts-ignore
    const leaf = new WorkspaceLeaf(app);

    const el = document.body.createDiv();
    leaf.containerEl = el;

    const view = new MarkdownView(leaf);
    leaf.view = view;

    view.currentMode.type = 'preview';

    let n = 0;

    view.currentMode.onRenderComplete = () => {
      console.log('rendered', ++n, view.currentMode.renderer.queued);
      console.log(performance.now());

      console.log(view.currentMode.renderer.previewEl.innerHTML);
      view.currentMode.onRenderComplete = () => {};
      leaf.detach();
    };
    console.log(performance.now());

    view.currentMode.renderer.set(`## Example markdown file # 2

    
![[Pasted image 20230320190050.png]]
![[file1]]
![[Pasted image 20230320190050.png]]
![[file1]]
![[Pasted image 20230320190050.png]]
![[file1]]
![[Pasted image 20230320190050.png]]
![[file1]]
![[Pasted image 20230320190050.png]]
![[file1]]
![[Pasted image 20230320190050.png]]
![[file1]]
![[Pasted image 20230320190050.png]]
![[file1]]
![[Pasted image 20230320190050.png]]
![[file1]]
![[Pasted image 20230320190050.png]]
![[file1]]
![[Pasted image 20230320190050.png]]

asdasd
`);

    // if (process) return;

    setupUiElements(this);

    this.addSettingTab(new HtmlServerPluginSettingsTab(this.app, this));

    this.serverController = new ServerController(this);

    if (this.settings.startOnLoad) {
      await this.startServer();
    } else {
      this.app.workspace.trigger('html-server-event', {
        isServerRunning: false,
      });
    }
  }

  async onunload() {
    await this.stopServer();
  }

  async saveSettings() {
    await this.saveData(this.settings);
    await this.serverController?.reload();
  }

  async startServer() {
    await this.serverController?.start();
    if (this.serverController?.isRunning()) {
      this.app.workspace.trigger('html-server-event', {
        isServerRunning: true,
      });
    }
    return !!this.serverController?.isRunning();
  }

  async stopServer() {
    await this.serverController?.stop();
    this.app.workspace.trigger('html-server-event', { isServerRunning: false });
    return !this.serverController?.isRunning();
  }
}
