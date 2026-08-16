---
title: 'Supabase Auth！第三方登入原理與前端初始化配置'
description: '記錄用 Supabase Auth 串接第三方登入的運作原理與前端初始化配置，以及第一次踩到 redirect_uri_mismatch 的除錯過程。'
pubDate: '2026-07-07T07:15:39.000-07:00'
updatedDate: '2026-07-14T06:23:01.815-07:00'
tags: ['OAuth', 'Supabase', 'Google', 'GitHub']
series: '第三方登入 OAuth 全紀錄'
draft: false
---

在現代的 Web 開發中，身分驗證（Authentication）往往是最繁瑣也最容易出錯的一環。傳統上我們需要自己處理 Session、JWT、加密以及第三方的 OAuth 對接。不過，透過 **Supabase Auth**，這一切都被簡化到了極致。只需幾步配置，就能搞定安全的登入系統。

本篇文章將結合我最近與 AI 協作的實戰經驗，為大家完整梳理 Supabase Auth 的**運作原理、配置步驟、憑證取得途徑**以及**前端的初始化配置**。

---

## 運作原理：OAuth 幕後發生了什麼事？

當我們想在 App 中加入「使用 Google/GitHub 登入」時，Supabase 在幕後幫我們處理了最複雜的安全憑證交換。它的基本運作邏輯可以拆解為以下三步：

1. **第三方控制台（如 Google/GitHub）的角色：** 我們需要在這些平台上建立應用程式，告訴它們：「我是某某 App，我想借用你們的用戶登入功能。當用戶登入成功後，請把授權資料送去我的 Supabase 回呼網址（Callback URL）。」

2. **Supabase Dashboard 的中介角色：** 我們將 Google/GitHub 核發的 `Client ID` 和 `Client Secret（密鑰）` 回填至 Supabase。這樣 Supabase 才有憑有據，能代表我們的 App 去跟第三方平台校驗資料的真偽。

3. **前端程式碼的極簡化：** 在前端，我們只需要初始化專案的 `URL` 和 `ANON_KEY`。當用戶點擊登入時，前端只需發出一個簡單的指令（例如指定 `provider: 'github'`），其餘複雜的安全性確認，全部交由 Supabase 在幕後搞定。

---

## 憑證取得途徑

### 取得第三方平台的 Client ID 與 Client Secret

要啟用第三方登入，必須先去對應的開發者後台建立 OAuth 應用程式：

- **GitHub 途徑：** 前往 GitHub 帳號設定中的 Developer Settings -> OAuth Apps 建立。

- **Google 途徑：** 前往 Google Cloud Console 建立憑證，並配置 OAuth 同意畫面。

### 取得 Supabase 前端所需的 Project Keys

回到 Supabase，我們需要拿取前端 initialization 必備的兩個密鑰：

1. 登入 Supabase Dashboard 並點選進入你的專案。

2. 看向左側側邊欄，點擊最下方的 **Settings (齒輪圖示)**。

3. 在 Settings 選單中，找到並點選 **API**。

4. 在 **Project API keys** 區塊中，你會看到：

  - **Project URL：** 專案的專屬後端網址（格式通常為 `https://xxxxx.supabase.co`）。

  - **Publishable key（新版，預設顯示）：** 可安全暴露在前端的公開金鑰，格式為 `sb_publishable_xxx`，在 **Project API keys** 區塊預設顯示。若專案較舊，可能會看到 **Legacy API Keys** 分頁下的 `anon public` 金鑰（功能相同，但 Supabase 預計 2026 年底前淘汰）。

---

## 核心配置

拿到所有金鑰後，接下來是雙向配置的過程：

1. 進入 Supabase 專案，在左側側邊欄點選 **Authentication**（鎖頭圖示）。

2. 點選 **Providers** 清單。

3. 點開你想要啟用的第三方登入平台（例如 Google 或 GitHub），將其切換為 **ON**。

4. 將剛剛在第三方平台申請到的 `Client ID` 和 `Client Secret` 填入 Supabase 對應的欄位中。

5. **關鍵一步：** 複製 Supabase 畫面上提供給你的 `Redirect URL`（回呼網址），並將其填回該第三方平台（GitHub/Google）開發者後台的「Authorized redirect URIs」中。

---

## 前端程式碼配置實戰

配置完後台後，前端的串接變得非常優雅。我們只需要引入 SDK，並傳入 `Project URL` 與 `ANON_KEY` 即可。

以下是以 JavaScript / TypeScript 為例的初始化與登入呼叫範例：

```ts
// 1. 初始化 Supabase Client
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://your-project-id.supabase.co'
const supabaseAnonKey = 'your-anon-public-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 2. 觸發第三方登入的函式
async function signInWithGitHub() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
  })

  if (error) console.error('登入失敗:', error.message)
  else console.log('重定向中...', data)
}
```

---

## 結語與心得

這次配置 Supabase Auth 時，我第一次串接就卡在 `redirect_uri_mismatch` 這個錯誤訊息上——明明照著教學把 Client ID、Secret 都填好了，一按登入卻被打回票。後來才發現問題出在「到底是誰要把網址填給誰」搞混了：我把 Supabase 提供的 Redirect URL 貼錯了地方，一直沒有正確回填到第三方平台（GitHub/Google）後台的 Authorized Redirect URIs 欄位，導致第三方平台收到登入請求後找不到一致的回呼網址可以核對。透過與 AI 的對話引導，把「App、Supabase、第三方平台」三者的信任鏈結梳理清楚後，才終於抓到問題根源——**Callback URL 是雙向綁定，兩邊都要填、而且要填一致**，配置起來就再也不會混淆了。

如果你也正在尋找快速落地、安全性高的身分驗證方案，Supabase Auth 絕對值得一試！
