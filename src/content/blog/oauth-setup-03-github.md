---
title: 'GitHub OAuth 第三方登入：從 Developer Settings 到金鑰回填全紀錄'
description: '記錄串接 GitHub OAuth 第三方登入的實際設定步驟，比較它與 Google OAuth 設定邏輯的異同，以及第一次弄丟 Client Secret 重新產生金鑰的踩坑經驗。'
pubDate: '2026-07-07T08:24:54.000-07:00'
updatedDate: '2026-07-12T06:35:49.898-07:00'
tags: ['GitHub', 'OAuth', 'Supabase']
series: '第三方登入 OAuth 全紀錄'
draft: false
---

如果你的網站定位偏向技術社群、工具類專案，或者像本站一樣專注於技術與 AI 的實踐記錄，那麼 GitHub 登入絕對是你的首選。相比於 Google 繁複的後台設定，GitHub 的 OAuth 設定流程相對防呆、單純很多，不過雙向綁定的邏輯依然互通。本篇將帶你一步步搞定 Supabase 與 GitHub 的無縫對接。

---

## 核心配置

配置 GitHub 第三方登入，同樣遵循我們的「雙向綁定金三角」邏輯：

1. **去 GitHub：** 進入 GitHub 的 Developer Settings ➔ 建立一個全新的 OAuth App ➔ 取得本站專屬的 `Client ID` 與 `Client Secret`。

2. **填入 Supabase：** 登入 Supabase Dashboard (Auth -> Providers -> GitHub) ➔ 把從 GitHub 拿到的兩個密鑰填進去，並打開啟用開關 ➔ 同時複製 Supabase 自動生成的 `Redirect URL`。

3. **回 GitHub：** 再度回到 GitHub 的 OAuth App 管理後台 ➔ 把這條 `Redirect URL` 貼進 GitHub 的 "Authorization callback URL" 欄位中存檔。

---

## 實操指南

### 進入 GitHub 開發者設定

1. 登入你的 GitHub 帳號。

2. 點擊右上角的**個人頭像**，在下拉選單中選擇 **Settings（設定）**。

3. 進入設定頁面後，將左側選單滑到**最下方**，點擊 **<> Developer settings（開發者設定）**。

### 建立 OAuth 應用程式

1. 在左側選單中，點選 **OAuth Apps**。

2. 點擊右上角的 **New OAuth App（新建 OAuth 應用程式）** 按鈕。

### 填寫應用程式資訊（填寫 Callback URL）

這時候會出現一個標準表單，請依序填入：

- **Application name：** 你的專案名稱（例如：`My Supabase App`，可自由命名）。

- **Homepage URL：** 你的網站主頁網址（開發測試階段可以先填 `http://localhost:3000` 或你本地跑 Vite/Next.js 的前端網址）。

- **Application description：** 應用程式描述（非必填，可留空）。

- **Authorization callback URL：** ⚠ **這裡是最關鍵的細節！** 請在這裡貼上你從 Supabase 複製下來的 Redirect URL。它的基本格式通常為：`https://<你的專案ID>.supabase.co/auth/v1/callback`

填寫完畢後，點擊下方的 **Register application（註冊應用程式）**。

### 取得金鑰並回填至 Supabase

註冊成功後，頁面會跳轉到該應用程式的管理介面，你會看到：

1. **Client ID：** 一串公開的字串，直接複製它。

2. **Client Secret：** 預設為了安全不會顯示。你需要點擊 **Generate a new client secret（生成新的客戶端密鑰）** 按鈕，這時候畫面上會出現一串長密鑰。

這一串密鑰只會出現一次！我第一次操作時手滑重新整理了頁面，畫面上的 Client Secret 瞬間消失、再也叫不回來，只好回到這個頁面點擊 **Generate a new client secret** 重新產生一組。所以強烈建議：金鑰一出現，先複製貼到 Supabase 後台存好，再做任何其他動作。

---

## 觀念盲點釐清

### 為什麼 GitHub 不需要確認「已授權的 JavaScript 來源」？

串接完 Google 再來串接 GitHub 的工程師，通常會產生一個疑問：「咦？為什麼 GitHub 這裡找不到地方讓我填 `localhost:3000` 或正式網域的 JavaScript 來源（origins）？」

**原因在於底層安全設計的思維不同：**

GitHub 的 OAuth 機制走的是相對純粹的後端重定向校驗。GitHub 認為：「只要前端請求被核准後，最終要重新導向的 **Authorization callback URL**，與後台設定的那條網址完全一模一樣，那麼這一次的憑證交換就是安全的。」

因此，GitHub 在建立 OAuth App 時，**只需要填寫 Homepage URL 和 Authorization callback URL 即可**，不需要像 Google 一樣分開宣告 JavaScript 的前端請求來源。這讓設定手續少了一道，也降低了本地開發（Localhost）測試時的卡關機率。

---

## 結語與小叮嚀

相較於 Google Cloud 繁複的專案與憑證管理，GitHub 的配置體驗對工程師來說非常友善。當你順利拿到兩邊的 Client ID 與 Secret 並完成回填，前端的呼叫程式碼完全不需要改變，只需要將 `provider` 改為 `'github'`，就能無縫享受極速登入的體驗了。

下一篇文章，我們再來看看其他 OAuth 平台的對接細節，繼續擴充我們的 AI 開發實驗室！
