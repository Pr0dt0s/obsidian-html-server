import { MarkdownView, Plugin, WorkspaceLeaf } from 'obsidian';
import { PluginSettings, DEFAULT_SETTINGS } from './settings';
import { ServerController } from './serverController';
import { setupUiElements } from './uiSetup';
import { HtmlServerSettingsTab as HtmlServerPluginSettingsTab } from './settingsTab';

export default class HtmlServerPlugin extends Plugin {
  public settings!: PluginSettings;

  serverController?: ServerController;

  async onload() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());

    // Create New Leaf
    //@ts-ignore
    const leaf = new WorkspaceLeaf(app);

    const el = document.body.createDiv();
    leaf.containerEl = el;

    const view = new MarkdownView(leaf);
    leaf.view = view;

    view.currentMode.type = 'preview';

    const originalQueueRenderFn =
      view.currentMode.renderer.__proto__.queueRender;

    view.currentMode.renderer.__proto__.queueRender = function () {
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

    //@ts-ignore
    // Object.defineProperty(view.currentMode.renderer.previewEl,'offsetParent',{configurable: true, enumerable: true, get(){return true}})
    // view.currentMode.renderer.previewEl = new Proxy(el, {
    //   get(target, property) {
    //     if (property == 'offsetParent') {
    //       return true;
    //     } else {
    //       if(typeof target[property] === 'function') {
    //         return target[property].bind(target);
    //       }
    //     };
    //   },
    // });

    let n = 0;

    view.currentMode.onRenderComplete = () => {
      console.log('rendered', ++n, view.currentMode.renderer.queued);
      console.log(performance.now());

      console.log(view.currentMode.renderer.previewEl.innerHTML);
      setTimeout(() => {}, 0);

      view.currentMode.renderer.__proto__.queueRender = originalQueueRenderFn;
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
    // @ts-ignore
    // view.currentMode.renderer.onRender();

    // setTimeout(() => {
    // @ts-ignore
    // view.currentMode.renderer.onRender();
    // }, 2000);

    // view.containerEl.innerHTML = '';

    // view.containerEl = view.leaf.view.containerEl;
    //@ts-ignore
    // view.contentEl = view.leaf.view.contentEl;
    // view.contentEl.innerHTML = '';

    // console.log();
    // const parent = document.querySelector('body')?.createDiv();
    // parent!.style.display = 'none';

    // const el = parent.createDiv();
    // if (!el) console.log('!!!');

    // const file = this.app.vault.getFiles().find((file) => {
    //   return '/' + file.path == '/file1.md';
    // });

    // //@ts-ignore
    // const view = this.app.viewRegistry.viewByType.markdown(app);

    // const MT = new WeakMap();

    // function TT(e) {
    //   if (MT.has(e)) return MT.get(e);
    //   const de = /&(amp|lt|gt|quot);/g,
    //     fe = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"' };
    //   function me(e: keyof typeof fe): string {
    //     return fe[e];
    //   }
    //   function ge(e) {
    //     return e.replace(de, me);
    //   }
    //   const t = ge(e.innerHTML);
    //   return MT.set(e, t), t;
    // }

    // let IB = new WeakMap();
    // function FB(e) {
    //   for (; e; ) {
    //     if (IB.has(e)) return IB.get(e);
    //     e = e.parentElement;
    //   }
    //   return 0;
    // }

    // // //@ts-ignore
    // const info = MarkdownPreviewView.call(
    //   {
    //     //@ts-ignore
    //     updateOptions: () => {},
    //     onResize: () => {},
    //     onRenderComplete: () => {},
    //     postProcess: function (e, t, n) {
    //       const i = this;
    //       const r = (function (e, t) {
    //         for (
    //           let n = t.sourcePath,
    //             i = t.promises,
    //             r = t.el,
    //             o = t.displayMode,
    //             a = 0,
    //             s = r.findAll('code.language-query');
    //           a < s.length;
    //           a++
    //         ) {
    //           let l = s[a],
    //             c = TT(l).trim(),
    //             u = l.parentElement;
    //           t.addChild(lO(e, c, u, n));
    //         }
    //         for (
    //           let h = 0, p = MarkdownPreviewRenderer.postProcessors;
    //           h < p.length;
    //           h++
    //         ) {
    //           let d = p[h](r, t);
    //           d && d.then && i.push(d);
    //         }
    //         let f = FB(t.containerEl),
    //           m = r.findAll('.internal-embed:not(.is-loaded)');
    //         if (m.length > 0)
    //           for (let g = 0, v = m; g < v.length; g++) {
    //             let y = v[g],
    //               b = y.getAttribute('src'),
    //               w = qB.load({
    //                 app: e,
    //                 linktext: b,
    //                 sourcePath: n,
    //                 containerEl: y,
    //                 displayMode: o,
    //                 showInline: !0,
    //                 depth: f,
    //               });
    //             w && (t.addChild(w), i.push(w.loadFile()));
    //           }
    //         return t;
    //       })(this.app, {
    //         docId: this.docId,
    //         sourcePath: this.path,
    //         frontmatter: n,
    //         promises: t,
    //         addChild: function (e) {
    //           return i.addChild(e);
    //         },
    //         getSectionInfo: function (e) {
    //           return i.renderer.getSectionInfo(e);
    //         },
    //         containerEl: this.renderer.sizerEl,
    //         el: e.el,
    //       });
    //       (e.usesFrontMatter = !!r.usesFrontMatter), this.resolveLinks(e.el);
    //     },
    //   },
    //   { app, contentEl: el }
    // );

    // //@ts-ignore
    // const renderer = new MarkdownPreviewRenderer(
    //   info,
    //   { info },
    //   el,
    //   'worker.js',
    //   true
    // );
    // console.log(performance.now());
    //@ts-ignore
    // info.onRenderComplete = () => {
    //   console.log(performance.now());
    //   console.log(el.innerHTML);
    // };
    //@ts-ignore
    //     info.renderer.set(`## Example markdown file # 2

    // ![[Pasted image 20230320190050.png]]

    // ![[file1]]

    // asdasd
    // `);
    //     console.log(el.innerHTML);

    //@ts-ignore
    // window.t = info;
    //@ts-ignore
    // window.el = el;

    if (process) return;

    await this.saveData(this.settings);

    await new Promise<void>((resolve) =>
      this.app.workspace.onLayoutReady(resolve)
    );

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
