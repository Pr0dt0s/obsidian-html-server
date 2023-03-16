//@ts-ignore
import * as asdasd from "http";

if (process.argv[2] == "--server") {
  console.log(process.argv);
  console.log("this is the server running in nodejs!!!");

  const http = require("http");
  const server: asdasd.Server = http.createServer(function (
    _req: asdasd.IncomingMessage,
    res: asdasd.OutgoingMessage
  ) {
    console.log("Responded to http request!!!.");
    res.write("Hello World!"); //write a response to the client
    res.end(); //end the response
  });

  server.listen(8080, () => {
    console.log("Server is listening on port 8080");
  }); //the server object listens on port 8080
  const ipc = require("node-ipc");

  ipc.config.id = "hello";
  ipc.config.retry = 1500;

  ipc.connectTo("world", function () {
    ipc.of.world.on("connect", function () {
      // ipc.log("## connected to world ##".rainbow, ipc.config.delay);
      console.log("client connect");
      ipc.of.world.emit(
        "message", //any event or message type your server listens for
        "hello"
      );
    });
    ipc.of.world.on("disconnect", function () {
      console.log("client disconnect");
      // ipc.log("disconnected from world".notice);
    });
    ipc.of.world.on(
      "message", //any event or message type your server listens for
      function (data: any) {
        console.log("client", data);
        // ipc.log("got a message from world : ".debug, data);
      }
    );
  });

  // process.exit(0);

  //@ts-ignore
  require = (test) => ({ Plugin: function () {} });
}

import {
  App,
  // MarkdownView,
  // Modal,
  // Notice,
  Plugin,
  PluginManifest,
  // PluginSettingTab,
  // Setting,
} from "obsidian";
import { join, resolve } from "path";

//@ts-ignore
// import ipc from "node-ipc";

// Remember to rename these classes and interfaces!
interface MyPluginSettings {
  mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
  mySetting: "default",
};

export default class MyPlugin extends Plugin {
  settings: MyPluginSettings;

  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest);
    // console.log(app.workspace);

    // @ts-ignore
    // console.log(app.workspace);
    this.settings = DEFAULT_SETTINGS;
  }

  async onload() {
    await this.loadSettings();

    const noop = () => {};

    const folder =
      this.app.vault.configDir +
      "\\plugins\\obsidian-html-server\\server-folder";

    console.log("Creating Folder");
    await this.app.vault.createFolder(folder).catch(noop);

    console.log("deleting file");
    // @ts-ignore

    const programmStartFile = join(folder, "test.bat");

    await this.app.vault.adapter.remove(programmStartFile).catch(console.log);
    console.log("Deleted?");

    // @ts-ignore
    const electron = window.electron;

    console.log(this.app.vault.configDir);

    console.log("Creating File");
    const data = `
echo This is a test!!
set ELECTRON_RUN_AS_NODE=1
${resolve(electron.remote.process.argv0)} "${join(
      // @ts-ignore
      this.app.vault.adapter.basePath,
      this.app.vault.configDir,
      "plugins",
      this.manifest.id,
      "main.js"
    )}" --server --ASDASD
pause
      `;
    await this.app.vault.create(folder + "\\test.bat", data).catch(console.log);

    console.log("Executing");
    // @ts-ignore
    console.log(this.app.vault.adapter.basePath);

    const server = asdasd.createServer((_, res) => {
      console.log("Responded to http request!!!.");
      res.write("Hello from the server 2!!!!!"); //write a response to the client
      res.end(); //end the response
    });
    server.listen(8080);
    this.register(() => {
      console.log("Closing server");
      server.close();
    });

    // ipc.config.id = "world";
    // ipc.config.retry = 1500;

    // ipc.serve(function () {
    //   ipc.server.on("message", function (data: any, socket: any) {
    //     // ipc.log("got a message : ",, data);
    //     ipc.server.emit(
    //       socket,
    //       "message", //this can be anything you want so long as
    //       //your client knows.
    //       data + " world!"
    //     );
    //   });
    //   ipc.server.on(
    //     "socket.disconnected",
    //     function (socket: any, destroyedSocketID: any) {
    //       ipc.log("client " + destroyedSocketID + " has disconnected!");
    //     }
    //   );
    // });

    // ipc.server.start();

    // const m = new Modal(this.app);
    // m.contentEl.setText("asd");
    // m.open();

    // This creates an icon in the left ribbon.
    // const ribbonIconEl = this.addRibbonIcon(
    //   "dice",
    //   "Sample Plugin",
    //   (evt: MouseEvent) => {
    //     // Called when the user clicks the icon.
    //     new Notice("This is a notice!");
    //   }
    // );
    // Perform additional things with the ribbon
    // ribbonIconEl.addClass("my-plugin-ribbon-class");

    // This adds a status bar item to the bottom of the app. Does not work on mobile apps.
    // const statusBarItemEl = this.addStatusBarItem();
    // statusBarItemEl.setText("Status Bar Text");

    // // This adds a simple command that can be triggered anywhere
    // this.addCommand({
    //   id: "open-sample-modal-simple",
    //   name: "Open sample modal (simple)",
    //   callback: () => {
    //     new SampleModal(this.app).open();
    //   },
    // });
    // // This adds an editor command that can perform some operation on the current editor instance
    // this.addCommand({
    //   id: "sample-editor-command",
    //   name: "Sample editor command",
    //   editorCallback: (editor, _ctx) => {
    //     console.log(editor.getSelection());
    //     editor.replaceSelection("Sample Editor Command");
    //   },
    // });
    // // This adds a complex command that can check whether the current state of the app allows execution of the command
    // this.addCommand({
    //   id: "open-sample-modal-complex",
    //   name: "Open sample modal (complex)",
    //   checkCallback: (checking: boolean) => {
    //     // Conditions to check
    //     const markdownView =
    //       this.app.workspace.getActiveViewOfType(MarkdownView);
    //     if (markdownView) {
    //       // If checking is true, we're simply "checking" if the command can be run.
    //       // If checking is false, then we want to actually perform the operation.
    //       if (!checking) {
    //         new SampleModal(this.app).open();
    //       }

    //       // This command will only show up in Command Palette when the check function returns true
    //       return true;
    //     }
    //   },
    // });

    // This adds a settings tab so the user can configure various aspects of the plugin
    // this.addSettingTab(new SampleSettingTab(this.app, this));

    // If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
    // Using this function will automatically remove the event listener when this plugin is disabled.
    this.registerDomEvent(document, "click", (evt: MouseEvent) => {
      // console.log("click", evt);
    });

    // When registering intervals, this function will automatically clear the interval when the plugin is disabled.
    // this.registerInterval(
    //   window.setInterval(() => console.log("setInterval"), 5 * 60 * 1000)
    // );
  }

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

// class SampleModal extends Modal {
//   constructor(app: App) {
//     super(app);
//   }

//   onOpen() {
//     const { contentEl } = this;
//     contentEl.setText("Woah!");
//   }

//   onClose() {
//     const { contentEl } = this;
//     contentEl.empty();
//   }
// }

// class SampleSettingTab extends PluginSettingTab {
//   plugin: MyPlugin;

//   constructor(app: App, plugin: MyPlugin) {
//     super(app, plugin);
//     this.plugin = plugin;
//   }

//   display(): void {
//     const { containerEl } = this;

//     containerEl.empty();

//     containerEl.createEl("h2", { text: "Settings for my awesome plugin." });

//     new Setting(containerEl)
//       .setName("Setting #1")
//       .setDesc("It's a secret")
//       .addText((text) =>
//         text
//           .setPlaceholder("Enter your secret")
//           .setValue(this.plugin.settings.mySetting)
//           .onChange(async (value) => {
//             console.log("Secret: " + value);
//             this.plugin.settings.mySetting = value;
//             await this.plugin.saveSettings();
//           })
//       );
//   }
// }
