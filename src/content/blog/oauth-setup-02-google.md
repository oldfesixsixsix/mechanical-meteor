---
title: 'Google OAuth 第三方登入：Google Cloud 憑證設定與 JavaScript 來源到底要填什麼？'
description: '記錄串接 Google OAuth 第三方登入時，Google Cloud 憑證與已授權 JavaScript 來源的實際設定步驟，以及誤觸 redirect_uri_mismatch 錯誤的除錯過程。'
pubDate: '2026-07-07T08:01:54.000-07:00'
updatedDate: '2026-07-12T06:26:21.240-07:00'
tags: ['Google', 'OAuth', 'Supabase']
series: '第三方登入 OAuth 全紀錄'
draft: false
---

相信不少開發者在串接 Google 登入時，都曾被 Google Cloud 繁複的後台搞得懷疑人生。

好不容易開好了 OAuth 專案，卻卡在最魔王的一關：到底哪條 Callback URL 該填在 Google？哪條該放 Supabase？更別提那個動不動就報錯的「已授權的 JavaScript 來源」...

別擔心，這篇文章會帶你從頭走一遍完整配置，帶你繞過所有常見的配置坑洞，輕鬆完成 Supabase + Google 第三方登入！

---

## 核心運作流程

Google OAuth 的配置本質上是一個**雙向綁定**的過程。請緊記以下這個三步驟黃金金三角：

1. **第一步（去 Google）：** 登入 _Google Cloud Console_ ➔ 建立凭证 (OAuth 2.0 用户端 ID) ➔ 取得本站專屬的 `Client ID` 與 `Client Secret`。

2. **第二步（回 Supabase）：** 進入 _Supabase Dashboard_ (Auth -> Providers -> Google) ➔ 填入剛剛取得的兩個欄位並將狀態切換為 **ON** ➔ 複製 Supabase 自動生成的 `Redirect URL`（回呼網址）。

3. **第三步（回 Google）：** 再度回到 _Google Cloud Console_ ➔ 把剛剛從 Supabase 複製的那條 `Redirect URL`，填入該憑證的「已授權的重新導向 URI」中。

---

## 已授權的 JavaScript 來源要填什麼？

在 Google Cloud Console 配置憑證時，會有一個叫做**「已授權的 JavaScript 來源 (Authorized JavaScript origins)」**的必填欄位。很多人會卡在這裡不知道該如何填寫。

### 這個欄位的作用是什麼？

這是一道關鍵的安全防線。它的作用是明確告訴 Google：「**只有從這些網址發出的登入請求，你才可以受理。**」如果有人惡意盜用你的 Client ID，但在非允許的網域下發起請求，Google 會直接回傳錯誤並封鎖該次登入。

### 實戰推薦填寫清單

因為在使用 Supabase 時，你的前端網頁會直接呼叫 Google 的 SDK 或觸發跳轉，因此你需要把**所有可能運行前端專案的網址**通通填進去：

- **1. 本地開發測試環境：** 填入 `http://localhost:3000`（如果您使用的是 Vite、Next.js 或 Nuxt，請根據實際跑出來的埠號填寫，例如 `http://localhost:5173` 或 `http://localhost:8080`）。

- **2. 線上生產環境（正式環境）：** 如果你的前端網站已經部署上線，請務必填入你的正式網域（例如 `https://www.yourdomain.com`）。

- **3. Supabase 專案網址（保險起見）：** 強烈建議也把你的 Supabase Project URL（例如 `https://your-project-id.supabase.co`）一起加進去，確保後端握手時不會因為網域校驗而失敗。

---

## 取得途徑與配置指南

### 前往 Google Cloud Console 建立專案

首先，前往 [Google Cloud Console](https://console.cloud.google.com/)。如果你是第一次使用，需要先建立一個新專案。接著完成「OAuth 同意畫面 (OAuth consent screen)」的基礎設定（通常選擇外部 External，並填寫應用程式名稱與技術支援 Email 即可）。

### 建立憑證

在左側選單點選「憑證 (Credentials)」，點擊上方的「+ 建立憑證」，選擇**「OAuth 用户端 ID」**。應用程式類型請選擇「網頁應用程式 (Web application)」。

### 雙向填回並啟用

建立完成後，彈出視窗會顯示你的 `Client ID` 與 `Client Secret`。請將它們複製，貼回 Supabase 的 Google Provider 設定中。最後別忘了將 Supabase 提供的 `Redirect URL` 複製，回填到 Google 憑證下方的「已授權的重新導向 URI」欄位中，點擊儲存！

---

## 結語與除錯小叮嚀

配置完成後，我把 Redirect URI 改到跟 Supabase 給的一模一樣，滿心以為大功告成，結果重新測試登入還是一樣噴 `Error 400: redirect_uri_mismatch`。當下第一反應是懷疑自己哪裡打錯字，把 Google Cloud Console 跟 Supabase 兩邊的網址一個字一個字比對了好幾次，確認完全一致，卻還是不斷失敗。我當時猜測可能是 Google 那邊的憑證設定還沒同步生效（存檔不代表立刻生效），於是放著沒動、過幾分鐘再測一次，結果就通過了。

搞懂了這套雙向綁定的邏輯，未來不論是要對接 Facebook、LINE 還是 Apple 登入，底層的配置邏輯都是完全相通的。祝大家串接順利！
