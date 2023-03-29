export abstract class CustomMarkdownRenderer {
  abstract renderHtmlFromMarkdown(markdown: string): Promise<string>;
}
