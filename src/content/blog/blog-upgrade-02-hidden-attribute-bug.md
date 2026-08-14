---
title: '除錯筆記：一個 [hidden] 屬性教我的 CSS cascade 課'
description: '記錄實測搜尋彈窗時發現的 CSS bug：author 樣式蓋過 [hidden] 屬性，讓一個「關閉」的彈窗一直攔截整個網站的點擊。'
pubDate: 2026-08-05
tags: ['Astro', 'CSS', '除錯']
series: '打造更好用的 Astro 部落格'
---

## 表面上，程式碼跟 build 都沒問題

暗色模式、搜尋、標籤、系列文章四個功能寫完後，`npm run build` 一路綠燈通過，`curl` 檢查該有的頁面、該有的 JS/CSS 資源也都回 200。照理說可以直接收工，但因為專案的規範是「前端改動要實際在瀏覽器裡操作過一輪才算數」，所以開了瀏覽器，逐一點過每個新功能。

暗色模式先測：頁面本來就因為系統設定顯示暗色，直接證明「跟隨系統」這件事沒問題。接著想點右上角的切換鈕，手動切回亮色——結果點了沒反應，畫面完全沒變化。

## 第一個假象：以為是點擊座標沒對準

直覺反應是自動化工具的滑鼠座標沒點準一個只有 30x30px 的小圖示，換了幾種方式重試：直接用座標點、用無障礙樹（accessibility tree）抓到的元素參照（ref）點、放大畫面確認圖示實際位置——全部都沒反應。

但用瀏覽器主控台直接執行 `document.getElementById('theme-toggle').click()`，卻是一次就成功，畫面立刻從暗色切成亮色。

這個對比很關鍵：如果是「按鈕本身邏輯有問題」，那不管用什麼方式觸發點擊，結果應該要一樣。但兩種觸發方式給出不同結果，代表問題不在按鈕的事件處理邏輯本身，而在「滑鼠實際點下去的那個座標，命中的到底是不是這個按鈕」。

## 第二個線索：搜尋按鈕也一樣點不到

如果只有暗色模式按鈕怪怪的，可能還可以解讀成單一元件的巧合。但搜尋圖示也是同樣的症狀——滑鼠點擊沒反應，`document.getElementById('search-toggle').click()` 卻正常打開搜尋彈窗。兩個獨立元件、同一個症狀，代表問題出在兩者共通的東西上，而不是各自的程式碼。

用 `document.elementFromPoint(x, y)` 直接問瀏覽器「這個座標實際上點到了什麼元素」，答案是：

```js
document.elementFromPoint(771, 39)
// → <div id="search-modal-backdrop" class="search-modal-backdrop">
```

點在 Header 搜尋圖示座標上，瀏覽器回報的卻是搜尋彈窗的背景遮罩（backdrop）。而這個背景遮罩，照設計應該只在彈窗「打開」的時候才會出現、蓋住整個畫面；彈窗關閉的時候，理論上完全不該出現在畫面上，更不可能擋在 Header 前面。

## 根因：author CSS 蓋過了 [hidden]

檢查 `SearchModal.astro` 的 CSS：

```css
.search-modal {
	position: fixed;
	inset: 0;
	z-index: 100;
	display: flex; /* 問題在這裡 */
	...
}
```

搜尋彈窗預設是關閉的，關閉的狀態是用 HTML 標準的 `hidden` 屬性表示：`<div id="search-modal" hidden>`。瀏覽器內建的樣式表裡，`[hidden]` 對應的規則是：

```css
[hidden] {
	display: none;
}
```

問題就在這裡：CSS 的層疊（cascade）機制決定優先權時，「樣式表的來源」（origin）比「選擇器的特異度」（specificity）更優先比較。瀏覽器內建樣式（user-agent stylesheet）的優先權天生就低於網頁自己寫的樣式（author stylesheet）——不管兩條規則的選擇器特異度誰高誰低，只要沒有 `!important`，author 樣式就是贏。

也就是說，`.search-modal { display: flex; }` 這條我自己寫的規則，會無條件蓋過瀏覽器內建的 `[hidden] { display: none; }`。彈窗的 `hidden` 屬性本身完全沒有失效或寫錯——它一直乖乖地被加到 DOM 上——但因為 CSS 層疊的優先權關係，這個屬性從來沒有真正發揮讓元素消失的效果。彈窗容器一直是 `display: flex`、`position: fixed`、`inset: 0`、`z-index: 100`，只是背景遮罩剛好沒有明顯的視覺對比（截圖看起來像正常頁面），但它確確實實地以看不出來的方式蓋在最上層，把底下 Header 的每一次點擊都攔截走了。

用 `getComputedStyle` 直接驗證這個猜測：

```js
const modal = document.getElementById('search-modal');
getComputedStyle(modal).display
// → "flex"      （即使 modal.hidden === true）
```

證實無誤。

## 修法：把 hidden 的邏輯自己接手

既然不能指望 `[hidden]` 的預設樣式生效，就自己寫一條規則明確處理兩種狀態，不要讓瀏覽器內建樣式跟自訂樣式打架：

```css
.search-modal {
	display: none;
}
.search-modal:not([hidden]) {
	position: fixed;
	inset: 0;
	z-index: 100;
	display: flex;
	...
}
```

預設 `display: none`，只有在沒有 `hidden` 屬性時才切換成 `flex` 並套用彈窗該有的定位樣式。這樣不管瀏覽器內建樣式的優先權邏輯怎麼運作，畫面呈現都完全由這兩條規則自己決定，不會再互相牴觸。

重新 build、重新整理頁面後，`document.elementFromPoint` 在按鈕座標上正確回報按鈕本身，而不是背景遮罩；滑鼠點擊也恢復正常，兩個按鈕都能一次點中。

## 這件事帶來的提醒

`display` 這種版面屬性和 `hidden` 這種語意屬性混用時，很容易忘記兩者其實共用同一個 CSS 屬性、會互相競爭。之後只要某個元件同時用得到 `hidden` 屬性和 `display` 樣式，就會先確認清楚兩者的優先權關係，而不是假設「加了 `hidden` 就一定會消失」。

更根本的提醒是：build 成功、頁面回應 200，只代表程式碼語法沒問題、路由存在，完全不保證功能真的能用。這次的 bug 不會讓 build 失敗、不會讓 `curl` 檢查出錯，甚至截圖乍看之下都是正常的——只有實際在瀏覽器裡用滑鼠點下去，才會發現整個 Header 早就點不動了。這也是為什麼前端改動一定要走一遍真實操作，而不能只看 build log 過關就結案。
