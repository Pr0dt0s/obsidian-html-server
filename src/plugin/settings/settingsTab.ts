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
    invalidPortElement
      .createSpan('settings-error-element')
      .setText('Must be a valid port number (1 - 65535)');

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
          this.plugin.settings.defaultFile = value;
          await this.saveAndReload();
        });
      });

    new Setting(containerEl)
      .setName('Use Simple Authentication (User/Password).')
      .addToggle((cb) => {
        cb.setValue(this.plugin.settings.useSimpleAuth);
        cb.onChange(async (value) => {
          value
            ? simpleAuthSettingsContainer.show()
            : simpleAuthSettingsContainer.hide();
          this.plugin.settings.useSimpleAuth = value;
          await this.saveAndReload();
        });
      });

    const simpleAuthSettingsContainer = containerEl.createDiv();
    this.plugin.settings.useSimpleAuth
      ? simpleAuthSettingsContainer.show()
      : simpleAuthSettingsContainer.hide();

    simpleAuthSettingsContainer.createDiv().classList.add('setting-item');

    const usernameSetting = new Setting(simpleAuthSettingsContainer)
      .setName('Simple Auth Username.')
      .setTooltip('Username used to login.')
      .setDesc("Default: 'obsidian'");

    const invalidUserName = usernameSetting.infoEl.createDiv();
    invalidUserName.hide();
    invalidUserName
      .createSpan('settings-error-element')
      .setText('Must be a non empty string');

    usernameSetting.addText((cb) => {
      cb.setValue(this.plugin.settings.simpleAuthUsername);
      cb.onChange(async (value) => {
        if (!value) {
          invalidUserName.show();
          return;
        }
        invalidUserName.hide();
        this.plugin.settings.simpleAuthUsername = value;
        await this.saveAndReload();
      });
    });

    const passwordSetting = new Setting(simpleAuthSettingsContainer)
      .setName('Simple Auth Password.')
      .setTooltip('Password used to login.')
      .setDesc('Must be at least 6 characthers long');

    const invalidPassword = passwordSetting.infoEl.createDiv();
    invalidPassword.hide();
    invalidPassword
      .createSpan('settings-error-element')
      .setText("The password doesn't meet the minimum required lenght");

    passwordSetting.addText((cb) => {
      cb.inputEl.type = 'password';
      cb.setValue(this.plugin.settings.simpleAuthPassword);
      cb.onChange(async (value) => {
        if (!value || value.length < 6) {
          invalidPassword.show();
          return;
        }
        invalidPassword.hide();
        this.plugin.settings.simpleAuthPassword = value;
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
    invalidHostElement
      .createSpan('settings-error-element')
      .setText('Must be a valid a non empty hostname/ip address');

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

    const invalidHtmlSettingElement = indexHtmlSetting.infoEl.createDiv();
    invalidHtmlSettingElement.hide();
    invalidHtmlSettingElement
      .createSpan('settings-error-element')
      .setText('Must be a valid a non empty string');

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

    indexHtmlSetting.controlEl.addClass('w100');
    const textareaElement = indexHtmlSetting.controlEl
      .firstChild as HTMLTextAreaElement;

    textareaElement.addClass('w100p');
    textareaElement.addClass('h350');

    const htmlVarsContainer = advancedSettings.createDiv('settings-table');

    const onChangeVar: OnChangeVariable = async (
      newValue,
      type,
      _currentVariableValue,
      index
    ) => {
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

    const donateEl = new Setting(this.containerEl)
      .setName('Donate')
      .setDesc(
        'If you like this Plugin, consider donating to support continued development.'
      );

    const github = document.createElement('a');
    github.setAttribute('href', 'https://github.com/sponsors/Pr0dt0s');
    github.addClass('templater_donating');
    const img1 = document.createElement('img');
    img1.src =
      'https://img.shields.io/static/v1?label=Sponsor&message=%E2%9D%A4&logo=GitHub&color=%23fe8e86';
    github.appendChild(img1);

    const paypal = document.createElement('a');
    paypal.setAttribute(
      'href',
      'https://www.paypal.com/donate/?business=JGQK6YQBWZJ4A&currency_code=USD'
    );
    paypal.addClass('templater_donating');
    const img2 = document.createElement('img');
    img2.src = 'https://img.shields.io/badge/paypal-Pr0dt0s-blue?logo=paypal';
    paypal.appendChild(img2);

    donateEl.settingEl.appendChild(github);
    donateEl.settingEl.appendChild(paypal);
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
  info.innerText = 'Name';
  info.addClass('text-align-center');
  const control = header.createDiv('setting-item-control');
  control.innerText = 'Value';
  control.addClass('justify-content-center');

  const createEdditable = (
    text: string,
    type: 'name' | 'value',
    eventListener: (
      target: HTMLInputElement,
      type: 'name' | 'value'
    ) => Promise<OnChangeStatus>
  ) => {
    const inputEl = document.createElement('input');
    inputEl.value = text;
    inputEl.type = 'text';
    inputEl.addClass('w100p');
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
          inputEl.addClass('with-error');
          inputEl.removeClass('with-success');
        } else {
          inputEl.removeClass('with-error');
          inputEl.addClass('with-success');
          clearTimeout(to);
          to = setTimeout(() => {
            inputEl.removeClass('with-success');
            inputEl.removeClass('with-error');
          }, 500);
        }
      }, 100);
    };
    return inputEl;
  };

  pluggin.settings.htmlReplaceableVariables.forEach((variable, index) => {
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

  new Setting(element).addButton((cb) => {
    cb.setIcon('plus');
    cb.setCta();
    cb.setButtonText('Add a new Variable');
    cb.setTooltip('Add a new Variable');
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
