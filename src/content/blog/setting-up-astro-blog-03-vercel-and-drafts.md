---
title: 'push 就自動上線：接上 Vercel 與草稿機制'
description: '記錄把網站部署到 Vercel、串接 GitHub 自動部署，以及用一次測試 commit 驗證整個流程真的通了。'
pubDate: 2026-08-04
tags: ['Vercel', '部落格架設']
series: '建立 Astro 部落格'
---

## 用 CLI 先建專案

本機裝好 `vercel` CLI 且已登入同一個帳號，先建立專案並嘗試連結 GitHub repo：

```bash
vercel link --yes
```

Vercel 專案本身建立成功，但自動嘗試連接 GitHub repo 的那一步失敗了：

```
Error: Failed to connect oldfesixsixsix/mechanical-meteor to project.
```

原因跟前一篇的 SSH 問題不一樣，這次是**帳號授權範圍**的問題：Vercel 要能在 push 時自動觸發部署，必須先在 GitHub 上安裝 Vercel 的 GitHub App，並授權它存取這個 repo。這是 GitHub App 安裝的標準機制，一定要在瀏覽器裡手動同意，沒有辦法用 CLI 或 API token 繞過去——這是刻意設計的安全邊界，不是 bug。

## 先手動部署，讓網站能動

授權這件事沒辦法用指令完成，但不代表網站不能先上線。用 CLI 直接部署一次：

```bash
vercel --prod --yes
```

拿到一個正式網址：`https://mechanical-meteor-six.vercel.app`。這時候 `astro.config.mjs` 裡的 `site` 欄位也要跟著更新——這個欄位會影響 RSS feed 和頁面的 canonical URL，一開始隨手填的預測網址（`mechanical-meteor.vercel.app`）跟 Vercel 實際配發的（`mechanical-meteor-six.vercel.app`）並不一樣，修正後又手動部署一次同步上去。

## 到瀏覽器裡按那個「Connect」

到 Vercel 專案的 Settings → Git 頁面，手動點了 Connect Git Repository，選擇 `oldfesixsixsix/mechanical-meteor`，並在跳出的 GitHub 授權頁面同意安裝。這是整個系列裡唯一一個必須人手動點滑鼠、無法自動化的步驟。

## 驗證：一個 draft 測試 commit

授權完成後，需要證明「push 就會自動部署」這件事是真的，而不是自己以為接好了。用一篇 `draft: true` 的文章當測試，一次驗證兩件事：

```markdown
---
title: '測試自動部署'
description: '這是一篇草稿，用來確認 GitHub push 後 Vercel 會自動部署。'
pubDate: 2026-08-04
draft: true
---

如果你在正式網站上看到這篇文章，代表 draft 過濾機制沒有生效。
```

`draft` 欄位在第一篇提到的 schema 裡已經加好了，實際發揮作用的地方是文章列表頁、文章內頁的路由產生、還有 RSS feed，三處都要一致地把 `draft: true` 的文章濾掉：

```ts
// src/pages/blog/index.astro
const posts = await getCollection('blog', ({ data }) => !data.draft);

// src/pages/blog/[...slug].astro
export async function getStaticPaths() {
	const posts = await getCollection('blog', ({ data }) => !data.draft);
	...
}

// src/pages/rss.xml.js
const posts = await getCollection('blog', ({ data }) => !data.draft);
```

`getStaticPaths` 那一處特別關鍵：草稿文章根本不會被產生對應的靜態頁面，所以就算有人猜到網址直接訪問，拿到的也是 404，而不是一個「沒被連結但其實找得到」的頁面。

commit、push：

```bash
git add src/content/blog/test-deploy.md
git commit -m "Add draft test post to verify auto-deploy pipeline"
git push
```

推上去幾秒後，`vercel ls` 就看到一個新的 Production 部署自動進入 Building 狀態——不用再手動下任何 `vercel` 指令。等它 build 完，逐一確認：

```bash
# 列表頁不該出現這篇文章
curl -s https://mechanical-meteor-six.vercel.app/blog/ | ...
# → NOT FOUND

# 直接訪問文章網址
curl -s -o /dev/null -w "%{http_code}\n" https://mechanical-meteor-six.vercel.app/blog/test-deploy/
# → 404

# RSS 也不該出現
curl -s https://mechanical-meteor-six.vercel.app/rss.xml | ...
# → NOT FOUND
```

三個檢查都符合預期。到這裡，整條路徑正式打通：**本機寫 Markdown → git commit → git push → GitHub → Vercel 自動 build → 正式網站更新**，而且草稿文章全程不會外流。

## 完整流程回顧

三篇文章串起來，就是這個部落格從無到有的完整過程：

1. `npm create astro@latest` 選 Blog 模板，調整 schema 加上 `draft` 欄位，清掉範例內容
2. `gh repo create` 建 repo，路上撞見多帳號 SSH 認錯身份的問題，靠 `~/.ssh/config` 裡的 host 別名解決
3. `vercel link` + 手動一次部署把網站先弄上線，瀏覽器裡完成 GitHub App 授權，最後用一篇 draft 測試文章驗證自動部署跟草稿過濾都確實生效

之後要發新文章，就只是在 `src/content/blog/` 裡新增一個 `.md` 檔案、寫好 frontmatter、`git push`——不需要後台、不需要記得再手動部署一次。
