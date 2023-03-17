// import * as http from "http";
import { App, Plugin, PluginManifest } from "obsidian";
/** @type { import('express') } */
import express from "express";

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
    this.settings = DEFAULT_SETTINGS;
  }

  async onload() {
    await this.loadSettings();
    console.log("Hello from rollup!");

    const app = express();

    app.use("/", (_req, res) => {
      console.log("Hit!!!");
      res.status(200).write("Well, hello there, again...");
      res.end();
    });

    const server = app.listen(8080);

    // @ts-ignore
    window.electron.remote.shell.openExternal("http://localhost:8080");

    this.register(() => {
      console.log("Closing http server");
      server.close((err) => {
        console.error(err);
      });
    });
  }

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
