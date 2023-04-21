// Credits go to Liam's Periodic Notes Plugin: https://github.com/liamcain/obsidian-periodic-notes

import { TAbstractFile, TFile, TFolder, normalizePath } from 'obsidian';
import { TextInputSuggest } from './suggest';

export function resolve_tfolder(folder_str: string): TFolder {
  folder_str = normalizePath(folder_str);

  const folder = app.vault.getAbstractFileByPath(folder_str);
  if (!folder) {
    throw new Error(`Folder "${folder_str}" doesn't exist`);
  }
  if (!(folder instanceof TFolder)) {
    throw new Error(`${folder_str} is a file, not a folder`);
  }

  return folder;
}

function get_tfiles_from_folder(): Array<TFile> {
  const files: Array<TFile> = app.vault.getFiles();

  files.sort((a, b) => {
    return a.basename.localeCompare(b.basename);
  });

  return files;
}

export enum FileSuggestMode {
  TemplateFiles,
  ScriptFiles,
}

export class FileSuggest extends TextInputSuggest<TFile> {
  constructor(public inputEl: HTMLInputElement) {
    super(inputEl);
  }

  get_error_msg(mode: FileSuggestMode): string {
    switch (mode) {
      case FileSuggestMode.TemplateFiles:
        return `Templates folder doesn't exist`;
      case FileSuggestMode.ScriptFiles:
        return `User Scripts folder doesn't exist`;
    }
  }

  getSuggestions(input_str: string): TFile[] {
    const all_files = get_tfiles_from_folder();
    if (!all_files) {
      return [];
    }

    const files: TFile[] = [];
    const lower_input_str = input_str.toLowerCase();

    all_files.forEach((file: TAbstractFile) => {
      if (
        file instanceof TFile &&
        file.extension === 'md' &&
        file.path.toLowerCase().contains(lower_input_str)
      ) {
        files.push(file);
      }
    });

    return files;
  }

  renderSuggestion(file: TFile, el: HTMLElement): void {
    el.setText(file.path);
  }

  selectSuggestion(file: TFile): void {
    this.inputEl.value = file.path;
    this.inputEl.trigger('input');
    this.close();
  }
}
