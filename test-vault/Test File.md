---
tags: Test File, development
htmlvars:
  LANG: en
  HTML_TITLE: Custom Tab Title!
  RENDERED_CONTENT_FILE_NAME: '<div style="position= sticky; padding:10; background-color: #a455a1; top: 10px; width: 100%;"> Custom File Name Content from FrontMatter! </div>'
---
# Current Working Features
  
- [x] External Link

[https://obsidian.md/](https://obsidian.md/)

- [x] Link to local File

[test file 1 link](/file1)


- [x] File link Embed

[[file1]]

- [x] Inline Local Image

![Local Inline Image](img.png)

- [x] Inline Local Image Embed

![[img.png]]

- [x] Inline Remote Image

![this is a remote image](https://obsidian.md/images/screenshot-1.0-hero-combo.png)
- [x] Codeblock with Language Sintax

```typescript
type StringFn: () => string
const test: StringFn = () => 'Testing Sintax, this is working...';
```

- [x] Code without sintax
```
asdasd
asd
s
s

s


ssa
a
a
s

```

- [x] Tables

|A|B|
|-|-|
|1|2|

- [x] Mermaid Diagram

```mermaid
stateDiagram-v2
direction LR
[*] --> Even
Even --> Mermaid
Mermaid --> Is
Is --> Working!
Working! --> [*]
```

- [x] Custom Css Snippets
# Css Snippet

- [x] Theme

- [x] Callout

> [!tip] Callout
> Callout Contents

- [x] Callout Icon

>[!example] Test
>this is another callout

- [x] Callout in Embedded File

![[Callouts]]

- [x] Embedded File

![[file1]]

- [x]  Canvas
![[test.canvas]]

- [x] File resolver
[[teST]]
[[file resolver test]]

