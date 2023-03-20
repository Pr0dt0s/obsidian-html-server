import { Component, MarkdownRenderer, PluginSettingTab } from 'obsidian';

export class HtmlServerSettingsTab extends PluginSettingTab {
  display() {
    MarkdownRenderer.renderMarkdown(
      `## Example markdown file

#### Project Milestones:

- [ ] Implement basic funcitionality.
- [ ] Create Unit tests.
- [x] Create Unit tests.
- [x] Document.
- [x] Publish the plugin in the official Obsidian Repository.
- [ ] Create Github actions to publish automatically.




asd
as
d`,
      this.containerEl,
      '.',
      new Component()
    );

    this.containerEl.innerHTML;
  }
}
