---
title: '從零開始：用 Astro 建立這個部落格'
description: '記錄用 npm create astro@latest 建立部落格模板，並依照自己需求調整內容架構的過程。'
pubDate: 2026-08-01
tags: ['Astro', '部落格架設']
series: '建立 Astro 部落格'
---

## 起點：一行指令

這個部落格的第一步，就是這行指令：

```bash
npm create astro@latest
```

互動式安裝過程中選了官方的 **Blog** 模板。跟從零開始搭一個部落格系統比起來，這個模板已經把大部分基礎建設準備好了：

- 用 [Content Collections](https://docs.astro.build/en/guides/content-collections/) 管理文章，資料夾在 `src/content/blog/`
- 用 `glob()` loader 讀取 `src/content/blog/` 底下所有 `.md` 和 `.mdx` 檔案
- 內建 RSS feed（`src/pages/rss.xml.js`）
- 內建 sitemap（`@astrojs/sitemap`）
- 文章列表頁、文章內頁、about 頁都有現成的 layout

換句話說，只要把 Markdown 檔案丟進 `src/content/blog/`，網站就會自動生出對應的文章頁面。這一點很重要，因為它決定了後續「怎麼發文章」這件事的整個工作流程——不需要後台、不需要資料庫，文章本身就是版本控制系統裡的檔案。

## 看懂 schema：文章的「形狀」

模板內建的 `src/content.config.ts` 定義了每篇文章 frontmatter 該長什麼樣子：

```ts
const blog = defineCollection({
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: z.optional(image()),
		}),
});
```

這是用 Zod 寫的 schema，Astro 會在 build 的時候拿它去驗證每篇文章的 frontmatter，格式不對直接 build 失敗，而不是等到部署上線才發現某篇文章少了 `title`。這種「build 時就先炸」的機制對於後面要接自動部署的流程特別重要——壞掉的東西不會偷偷跑到正式環境。

我在這個 schema 上加了一個欄位：

```ts
draft: z.boolean().optional(),
```

原因很單純：寫文章常常會寫到一半就想先進版本控制，但又還沒準備好公開。有了 `draft` 這個開關，之後在列表頁、文章頁、RSS 三個地方統一過濾掉 `draft: true` 的文章就好（這部分留到第三篇再細講）。

## 清空模板的預設內容

模板本身附了 5 篇範例文章（`first-post.md`、`second-post.md`、`third-post.md`、`markdown-style-guide.md`、`using-mdx.mdx`），還有網站標題預設是 `Astro Blog`、描述是 `Welcome to my website!`。這些東西全部換掉：

```ts
// src/consts.ts
export const SITE_TITLE = 'Mechanical Meteor';
export const SITE_DESCRIPTION = '我這一生如履薄冰，你說我能走到對岸嗎？';
```

5 篇範例文章直接刪除。這一步幾乎不用想，模板的示範內容留著沒有意義，反而容易誤會成是自己網站的真實內容。

## 小結

到這一步，專案本身已經是一個可以 `npm run build` 出乾淨靜態網站的部落格骨架，只是還躺在本機的資料夾裡，沒有版本控制、沒有網域、沒有任何自動化。下一篇會談怎麼把它接上 GitHub——以及過程中踩到的一個意外的坑：SSH 金鑰認錯人。
