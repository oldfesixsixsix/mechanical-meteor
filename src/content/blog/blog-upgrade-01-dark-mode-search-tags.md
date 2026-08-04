---
title: '從功能發想到落地：暗色模式、全文搜尋、標籤與系列文章'
description: '記錄替這個部落格加上暗色模式切換、Pagefind 全文搜尋、標籤分類與系列文章導覽的決策與實作過程。'
pubDate: 2026-08-04
tags: ['Astro', '暗色模式', 'Pagefind', '部落格架設']
series: '打造更好用的 Astro 部落格'
---

## 起因：三篇文章之後，發現的三個問題

部落格上線、發了三篇文章之後，冒出幾個實際的使用體驗問題：

1. 沒有暗色模式，晚上看白底刺眼
2. 沒有搜尋功能，文章一多就只能靠捲動找
3. 那三篇「建立 Astro 部落格」系列文章雖然日期是連續的，但單看列表頁完全看不出來它們是一組，讀者得自己猜

在動手之前，先把每一項拆成具體決策，逐一確認：暗色模式要不要手動切換、搜尋要搜多深、標籤需不需要獨立頁面、系列文章要用什麼機制串起來。這篇記錄決策落地後的實作，下一篇則專門講實作過程中抓到的一個 CSS 陷阱。

## 暗色模式：系統偏好 + 手動覆蓋

決定是「預設跟隨系統，但提供手動切換，選擇要記住」。這個組合在實作上比單純的「只跟系統」多了兩個要處理的東西：切換按鈕的狀態要和系統設定不衝突，而且要避免「先看到亮色、一瞬間才變暗」的閃爍（FOUC）。

第一步是把 `global.css` 裡原本寫死的顏色值，改成一組 CSS 變數：

```css
:root {
	--black: 15, 18, 25;
	--gray-dark: 34, 41, 57;
	--bg: 255, 255, 255;
	--surface: 255, 255, 255;
	/* ...其餘變數 */
}

@media (prefers-color-scheme: dark) {
	:root:not([data-theme='light']) {
		--black: 237, 239, 244;
		--gray-dark: 214, 219, 229;
		--bg: 13, 15, 20;
		--surface: 22, 25, 33;
		/* ...對應的暗色版本 */
	}
}

:root[data-theme='dark'] {
	/* 跟上面 media query 內容相同，處理手動切換成暗色的情況 */
}
```

這裡的關鍵是 `:root:not([data-theme='light'])` 這個寫法：如果使用者手動選了「亮色」，就算系統本身是暗色，`data-theme="light"` 這個屬性也要能蓋過 `prefers-color-scheme` 的判斷。反過來，`:root[data-theme='dark']` 則是讓手動選擇「暗色」在亮色系統上也生效。兩條規則搭配，四種組合（系統亮/系統暗 × 手動亮/手動暗/不覆蓋）都能正確對應。

避免閃爍的做法，是在 `BaseHead.astro` 最前面塞一段同步執行的 inline script，搶在 CSS 套用、畫面繪製之前先把 `data-theme` 設定好：

```html
<script is:inline>
	const storedTheme = localStorage.getItem('theme');
	if (storedTheme === 'dark' || storedTheme === 'light') {
		document.documentElement.dataset.theme = storedTheme;
	}
</script>
```

切換按鈕本身是一個獨立元件 `ThemeToggle.astro`，用純 vanilla JS 處理點擊事件，不需要引入任何前端框架：

```js
document.getElementById('theme-toggle')?.addEventListener('click', () => {
	const next = currentTheme() === 'dark' ? 'light' : 'dark';
	document.documentElement.dataset.theme = next;
	localStorage.setItem('theme', next);
});
```

## 全文搜尋：Pagefind

搜尋範圍決定要「連文章內文都能搜」，而不是只搜標題。這種需求下，前端手刻一份 JSON 索引配 Fuse.js 不太划算——內文塞進 JSON 檔案大小會爆炸。改用 [Pagefind](https://pagefind.app/)：一個專門給 Astro、Hugo、Eleventy 這類靜態網站生成器用的搜尋工具，在 build 完成之後掃描產生出來的 HTML，直接建立搜尋索引，不需要外部服務或 API key。

安裝跟串接都很單純：

```bash
npm install --save-dev pagefind
```

```json
"scripts": {
	"build": "astro build && pagefind --site dist"
}
```

Pagefind 預設會索引整個 `<body>`，但 Header、Footer、導覽列這些重複性內容不該被搜到。解法是在真正想被索引的區塊加上 `data-pagefind-body` 屬性——一旦頁面上出現這個屬性，Pagefind 就只索引標了這個屬性的區塊，其餘全部忽略：

```astro
<main data-pagefind-body>
	...
</main>
```

搜尋介面則是點擊 Header 的搜尋圖示、彈出一個 modal，裡面動態載入 Pagefind 自帶的 UI（`pagefind-ui.js` / `pagefind-ui.css`）：

```js
async function openModal() {
	modal.hidden = false;
	if (!initialized) {
		initialized = true;
		loadStyle('/pagefind/pagefind-ui.css');
		await loadScript('/pagefind/pagefind-ui.js');
		new PagefindUI({ element: '#pagefind-search', showSubResults: true });
	}
}
```

這裡故意用動態載入而不是直接在頁面固定引入，是因為 Pagefind 產生的索引檔只存在於 `dist/pagefind/`，`astro dev` 開發模式下沒有這個目錄——所以搜尋功能只能在 `npm run build && npm run preview` 之後測試，開發模式下點下去只會拿到 404。這是使用 Pagefind 時一定會遇到的限制，不是 bug。

## 標籤：分類用的，不是導覽用的

標籤的需求很直接：schema 加一個欄位，每篇文章能有多個標籤，點擊標籤能看到同標籤的所有文章。

```ts
tags: z.array(z.string()).optional(),
```

搭配一個動態路由 `src/pages/tags/[tag].astro`，用 `getStaticPaths` 把所有出現過的標籤都各自生成一個頁面：

```ts
export async function getStaticPaths() {
	const posts = await getCollection('blog', ({ data }) => !data.draft);
	const tags = new Set(posts.flatMap((post) => post.data.tags ?? []));

	return Array.from(tags).map((tag) => ({
		params: { tag },
		props: {
			posts: posts.filter((post) => post.data.tags?.includes(tag)),
		},
	}));
}
```

文章列表頁跟文章內頁都補上標籤的小圓角標籤（chip），點擊會連到對應的 `/tags/[tag]/` 頁面。這部分沒有太多技術難度，比較需要注意的反而是 HTML 結構——文章卡片本身已經是一個包住整張卡片的 `<a>` 連結，如果標籤也用 `<a>` 包在同一個卡片裡，會變成瀏覽器不允許的巢狀連結。解法是把標籤區塊移到卡片 `<a>` 的外面、當作 `<li>` 底下的另一個獨立區塊，而不是塞進卡片連結內部。

## 系列文章：跟標籤分開處理

一開始想過乾脆把「系列」也當成一種標籤來用，但這樣會失去「第幾篇、總共幾篇、上一篇下一篇」這種順序關係——標籤本質是分類，沒有順序的概念。於是另外加了一個 `series` 欄位，跟 `tags`分開：

```ts
series: z.string().optional(),
```

在 `BlogPost.astro` layout 裡，只要文章有 `series`，就去撈同系列的所有文章、依發布日期排序，算出目前這篇是第幾篇：

```ts
const seriesEntries = series
	? (await getCollection('blog', ({ data }) => !data.draft && data.series === series))
			.sort((a, b) => a.data.pubDate.valueOf() - b.data.pubDate.valueOf())
	: [];
const seriesIndex = seriesEntries.findIndex((entry) => entry.id === id);
```

文章頁面上方會顯示「系列文章：《OO》第 2/3 篇」，並列出整個系列的連結，目前這篇用粗體標示、不能點擊，其餘篇章可以直接跳轉。

## 小結

四個功能到這裡都實作完成：暗色模式能跟系統走也能手動切、搜尋能挖到文章內文、標籤有自己的分類頁、系列文章有清楚的順序導覽。但這些都只是「寫完程式碼、build 過關」，實際上真的能不能用，還是得在瀏覽器裡一個一個點過一遍才知道——而這一點，下一篇要講的踩坑經驗，就是最好的證明。
