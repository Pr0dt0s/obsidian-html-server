import { App, PluginSettingTab, Setting } from 'typings';
import HtmlServerPlugin from '../main';
import * as obsidian from 'obsidian';
import { DEFAULT_SETTINGS, PluginSettings } from './settings';
import { FileSuggest } from './suggester/FileSuggester';

export class HtmlServerPluginSettingsTab extends PluginSettingTab {
  constructor(app: App, private plugin: HtmlServerPlugin) {
    super(app, plugin);
  }

  async saveAndReload() {
    await this.plugin.saveSettings();
    const serverIsRunning = !!this.plugin.serverController?.isRunning();
    if (serverIsRunning) {
      await this.plugin.stopServer();
      await this.plugin.startServer();
    }
  }

  display() {
    const { containerEl } = this;

    containerEl.empty();
    containerEl.createEl('h2', {
      text: `${this.plugin.manifest.name} ${this.plugin.manifest.version}`,
    });

    // export type PluginSettings = {
    //   indexHtml: string;
    //   htmlVariables: { varName: string; varValue: string }[];
    // };

    new Setting(containerEl)
      .setName('Start Server automatically.')
      .setTooltip('Default: False')
      .setDesc(
        'If true the server will start inmediately after loading the plugin.'
      )
      .addToggle((cb) => {
        cb.setValue(this.plugin.settings.startOnLoad);
        cb.onChange(async (value) => {
          this.plugin.settings.startOnLoad = value;
          await this.saveAndReload();
        });
      });

    new Setting(containerEl)
      .setName('Create Ribbon Button.')
      .setTooltip('Default: true')
      .setDesc(
        'If true a ribbon button will be created in Obsidian to start/stop the server.'
      )
      .addToggle((cb) => {
        cb.setValue(this.plugin.settings.useRibbonButons);
        cb.onChange(async (value) => {
          this.plugin.settings.useRibbonButons = value;
          this.plugin.ReloadUiElements();
          await this.saveAndReload();
        });
      });

    const portSetting = new Setting(containerEl)
      .setName('Listening port.')
      .setTooltip('Default: 8080')
      .setDesc('Port to listen for Http requests.');

    const invalidPortElement = portSetting.infoEl.createDiv();
    invalidPortElement.hide();
    invalidPortElement.innerHTML =
      '<span style="font-weight: bold; color: var(--background-modifier-error)">Must be a valid port number (1 - 65535)</span>';

    portSetting.addText((cb) => {
      cb.setValue(String(this.plugin.settings.port));
      cb.onChange(async (value) => {
        const numValue = Number(value);
        if (isNaN(numValue) || numValue < 1 || numValue > 65535) {
          invalidPortElement.show();
          return;
        }
        invalidPortElement.hide();
        this.plugin.settings.port = numValue;
        await this.saveAndReload();
      });
    });

    new Setting(containerEl)
      .setName('Index File.')
      .setDesc(
        'File to render initially, i.e. when no file is being requested.'
      )
      .addSearch((cb) => {
        new FileSuggest(cb.inputEl);
        cb.setValue(this.plugin.settings.defaultFile);
        cb.onChange(async (value) => {
          value ? advancedSettings.show() : advancedSettings.hide();
          this.plugin.settings.defaultFile = value;
          await this.saveAndReload();
        });
      });

    new Setting(containerEl)
      .setName('Show Advanced Settings.')
      .addToggle((cb) => {
        cb.setValue(this.plugin.settings.showAdvancedOptions);
        cb.onChange(async (value) => {
          value ? advancedSettings.show() : advancedSettings.hide();
          this.plugin.settings.showAdvancedOptions = value;
          await this.saveAndReload();
        });
      });

    const advancedSettings = containerEl.createDiv();
    this.plugin.settings.showAdvancedOptions
      ? advancedSettings.show()
      : advancedSettings.hide();
    // advancedSettings.hide();

    advancedSettings.createDiv().classList.add('setting-item');

    const hostNameDescription = new DocumentFragment();
    hostNameDescription
      .createDiv()
      .setText('Hostname/Ip Address to listen for Http requests.');
    hostNameDescription.createDiv().setText('Commoly used:');
    hostNameDescription
      .createDiv()
      .setText('- localhost (Only locally accessible)');
    hostNameDescription
      .createDiv()
      .setText(
        '- {LAN Ip Address} or Hostname (Accessible in the local network)'
      );
    hostNameDescription
      .createDiv()
      .setText('- 0.0.0.0 (Listen on all interfaces)');

    const hostSetting = new Setting(advancedSettings)
      .setName('Listening Hostname/Ip Address.')
      .setTooltip('Default: localhost (Only locally accessible)')
      .setDesc(hostNameDescription);

    const invalidHostElement = hostSetting.infoEl.createDiv();
    invalidHostElement.hide();
    invalidHostElement.innerHTML =
      '<span style="font-weight: bold; color: var(--background-modifier-error)">Must be a valid a non empty hostname/ip address</span>';

    hostSetting.addText((cb) => {
      cb.setValue(String(this.plugin.settings.hostname));
      cb.onChange(async (value) => {
        if (!value) {
          return invalidHostElement.show();
        }
        invalidHostElement.hide();
        this.plugin.settings.hostname = value;
        await this.saveAndReload();
      });
    });

    /* const _htmlSettingItem =  */ new Setting(advancedSettings)
      .setName('Custom index.html file.')
      .addExtraButton((cb) => {
        cb.setIcon('refresh-ccw');
        cb.setTooltip('Restore Default Value');
        cb.onClick(() => {
          const modal = new obsidian.Modal(app);
          modal.titleEl.setText(
            'Are you sure you want to restore this setting to the default value?'
          );
          new Setting(modal.contentEl)
            .addButton((cb) => {
              cb.setButtonText('Restore');
              cb.setClass('mod-warning');
              cb.onClick(async () => {
                this.plugin.settings.indexHtml = DEFAULT_SETTINGS.indexHtml;
                textAreaComponent.setValue(this.plugin.settings.indexHtml);
                await this.saveAndReload();
                modal.close();
              });
            })
            .addButton((cb) => {
              cb.setButtonText('Cancel');
              cb.onClick(() => {
                modal.close();
              });
            });
          modal.open();
        });
      });

    // htmlSettingItem.createDiv('setting-item-name').setText('Custom index.html file.');
    // htmlSettingItem.createDiv('setting-item-name').setText('Custom index.html file.');

    const indexHtmlSetting = new Setting(advancedSettings);
    // .setName()
    // .setDesc(hostNameDescription);

    const invalidHtmlSettingElement = indexHtmlSetting.infoEl.createDiv();
    invalidHtmlSettingElement.hide();
    invalidHtmlSettingElement.innerHTML =
      '<span style="font-weight: bold; color: var(--background-modifier-error)">Must be a valid a non empty string</span>';

    indexHtmlSetting.settingEl.removeClass('setting-item');
    //   .createDiv('setting-item-name')
    //   .setText('Custom index.html file.');
    let textAreaComponent: obsidian.TextAreaComponent;
    indexHtmlSetting.addTextArea((cb) => {
      textAreaComponent = cb;
      cb.setValue(this.plugin.settings.indexHtml);
      cb.onChange(async (value) => {
        if (!value) {
          return invalidHtmlSettingElement.show();
        }
        invalidHtmlSettingElement.hide();
        this.plugin.settings.indexHtml = value;
        await this.saveAndReload();
      });
    });

    /* const _htmlReplacableVariablesSettings =  */ new Setting(
      advancedSettings
    )
      .setName('Replaceable Variables')
      .addButton((cb) => {
        cb.setIcon('refresh-ccw');
        cb.setTooltip('Restore Default Values');
        cb.onClick(() => {
          const modal = new obsidian.Modal(app);
          modal.titleEl.append(
            'Are you sure you want to restore the default values?',
            document.createElement('br'),
            'Will restore only the default vars, i.e. not deleting any custom variables.'
          );
          new Setting(modal.contentEl)
            .addButton((cb) => {
              cb.setButtonText('Restore');
              cb.setClass('mod-warning');
              cb.onClick(async () => {
                const defaultSettingsNames =
                  DEFAULT_SETTINGS.htmlReplaceableVariables.map(
                    (a) => a.varName
                  );
                this.plugin.settings.htmlReplaceableVariables = [
                  ...DEFAULT_SETTINGS.htmlReplaceableVariables,
                  ...this.plugin.settings.htmlReplaceableVariables.filter(
                    (htmlVariable) => {
                      return !defaultSettingsNames.includes(
                        htmlVariable.varName
                      );
                    }
                  ),
                ];
                // TODO
                setVars(htmlVarsContainer, this.plugin, onChangeVar);
                await this.saveAndReload();
                modal.close();
              });
            })
            .addButton((cb) => {
              cb.setButtonText('Cancel');
              cb.onClick(() => {
                modal.close();
              });
            });
          modal.open();
        });
      });

    indexHtmlSetting.controlEl.style.width = '100%';
    const textareaElement = indexHtmlSetting.controlEl
      .firstChild as HTMLTextAreaElement;

    textareaElement.style.width = '100%';
    textareaElement.style.height = '350px';

    const htmlVarsContainer = advancedSettings.createDiv('settings-table');

    const onChangeVar: OnChangeVariable = async (
      newValue,
      type,
      _currentVariableValue,
      index
    ) => {
      console.table(this.plugin.settings.htmlReplaceableVariables);
      if (!newValue) {
        return { status: 'Error' };
      }

      if (index >= this.plugin.settings.htmlReplaceableVariables.length) {
        this.plugin.settings.htmlReplaceableVariables[index] = {
          varName: '',
          varValue: '',
        };
      }
      switch (type) {
        case 'name':
          this.plugin.settings.htmlReplaceableVariables[index].varName =
            newValue;
          break;
        case 'value':
          this.plugin.settings.htmlReplaceableVariables[index].varValue =
            newValue;
          break;
      }

      await this.saveAndReload();
      return { status: 'OK' };
    };

    setVars(htmlVarsContainer, this.plugin, onChangeVar);

    containerEl.createEl('hr');
    const div1 = containerEl.createEl('div', {
      text: 'Developed by ',
    });
    div1.createEl('a', {
      text: `Pr0dt0s`,
      href: `https://github.com/Pr0dt0s`,
    });
    containerEl.createEl('br');
    const div2 = containerEl.createEl('div', {
      text: 'If you want to see the documentation, submit a bug, or a feature request you can do so ',
    });
    div2.createEl('a', {
      text: 'here',
      href: 'https://github.com/Pr0dt0s/obsidian-html-server',
    });
    div2.appendText('.');
  }
}

function setVars(
  element: HTMLElement,
  pluggin: HtmlServerPlugin,
  onChange: OnChangeVariable
) {
  element.empty();
  const header = element.createDiv('setting-item');

  const info = header.createDiv('setting-item-info');
  info.innerText = 'VARIABLE';
  info.style.textAlign = 'center';
  const control = header.createDiv('setting-item-control');
  control.innerText = 'VALUE';
  control.style.justifyContent = 'center';

  const createEdditable = (
    text: string,
    type: 'name' | 'value',
    eventListener: (
      target: HTMLInputElement,
      type: 'name' | 'value'
    ) => Promise<OnChangeStatus>
  ) => {
    // const el = document.createElement('div');
    // el.className = `setting-item-${className}`;
    // control.style.textAlign = 'center';
    // control.style.justifyContent = 'center';
    const inputEl = document.createElement('input');
    inputEl.value = text;
    inputEl.type = 'text';
    inputEl.style.width = '100%';
    let updateTimeout: NodeJS.Timeout;
    let to: NodeJS.Timeout;
    inputEl.onchange = ({ target }) => {
      clearTimeout(updateTimeout);
      updateTimeout = setTimeout(async () => {
        const { status } = await eventListener(
          target as HTMLInputElement,
          type
        );
        if (status == 'Error') {
          inputEl.style.borderColor = 'var(--text-error)';
        } else {
          inputEl.style.borderColor = 'var(--text-success)';
          clearTimeout(to);
          to = setTimeout(() => {
            //@ts-ignore
            inputEl.style.borderColor = null;
          }, 500);
        }
      }, 100);
    };
    return inputEl;
  };

  pluggin.settings.htmlReplaceableVariables.forEach((variable, index) => {
    // const line = element.createDiv('setting-item');
    const line = new Setting(element);
    const eventListener = async (
      target: HTMLInputElement,
      type: 'name' | 'value'
    ) => {
      const value = target.value;
      return await onChange(
        value,
        type,
        pluggin.settings.htmlReplaceableVariables,
        index
      );
    };

    // const deleteBtn = line.createDiv(
    //   'clickable-icon setting-editor-extra-setting-button'
    // );
    // deleteBtn.append(obsidian.getIcon('x'));
    line.infoEl.append(
      createEdditable(variable.varName, 'name', eventListener)
    );
    line.controlEl.append(
      createEdditable(variable.varValue, 'value', eventListener)
    );
    line.addExtraButton((cb) => {
      cb.setIcon('x');
      cb.setTooltip('Delete Variable');
      cb.onClick(async () => {
        pluggin.settings.htmlReplaceableVariables =
          pluggin.settings.htmlReplaceableVariables.filter(
            (_, i) => i !== index
          );
        await pluggin.saveSettings();
        setVars(element, pluggin, onChange);
      });
    });
  });

  new Setting(element).addExtraButton((cb) => {
    cb.setIcon('add');
    cb.extraSettingsEl.innerText = 'Add a new Variable';
    cb.setTooltip('Add a new Variable');
    cb.extraSettingsEl.style.backgroundColor = '--var(--success)';
    cb.onClick(async () => {
      pluggin.settings.htmlReplaceableVariables.push({
        varName: '',
        varValue: '',
      });
      await pluggin.saveSettings();
      setVars(element, pluggin, onChange);
    });
  });
}

type OnChangeVariable = (
  newValue: string,
  type: 'name' | 'value',
  currentVariableValue: PluginSettings['htmlReplaceableVariables'],
  index: number
) => Promise<OnChangeStatus>;

type OnChangeStatus = { status: 'OK' | 'Error' };
