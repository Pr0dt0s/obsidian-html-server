import { Plugin } from 'typings';
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
