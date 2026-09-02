---
title: 'Zeabur 資安外洩事件後,我怎麼確認自己有沒有中鏢'
description: '記錄看到 Zeabur 資安外洩事件後,在想不起自己是否註冊過的情況下,用 GitHub 與 Google 的第三方授權紀錄反查確認的過程。'
pubDate: 2026-09-02
tags: ['資安', 'Zeabur', 'GitHub', 'Google']
draft: false
---

### 現象

Zeabur 在 2026 年 8 月底(8/27 爆發,8/29 官方公開致歉)證實發生資安外洩事件:攻擊者利用外洩的內部 AWS 高權限憑證,存取了 Zeabur 共用 cluster,進而取得 control-plane 存取權,讀取了使用者專案裡存放的環境變數。大量開發者存放的 OpenAI、Anthropic(Claude)、OpenRouter 等 AI 服務 API 金鑰確定遭到盜用與異常調用。官方發現 AI Hub 使用的 LiteLLM 出現可疑活動後,已暫時停止該服務配合調查;目前排除的範圍是使用者帳號密碼、個資、伺服器內部資料、信用卡付款資訊遭存取的證據。

看到這則消息,第一個念頭是:我到底有沒有在 Zeabur 上放過專案?一時想不起來,又不想為了確認這件事特地去嘗試登入(萬一真的有帳號,存取記錄反而不乾淨)。查了一下,其實不用登入 Zeabur 本身,從第三方授權紀錄反查就能確認。

### 怎麼查:從 GitHub 跟 Google 的第三方授權反查

Zeabur 最主流的登入方式是 GitHub 跟 Google,所以先查這兩個帳號的第三方授權紀錄,而不是直接嘗試登入 Zeabur。

**GitHub**:前往 Settings → Applications,分別檢查 **Authorized OAuth Apps** 跟 **Installed GitHub Apps** 兩個列表,看有沒有 Zeabur。

**Google**:前往 Google 帳戶管理 → 安全性(Security)→「與第三方應用程式和服務的連結」,看列表裡有沒有 Zeabur。

兩邊都查完,都沒看到 Zeabur。確認自己沒有在 Zeabur 註冊過,不在這次外洩的受影響範圍內。

### 小結

這次算虛驚一場,但這個查法本身值得記下來:遇到「某個服務出事了,但我想不起來自己是不是曾經用過」的情況,GitHub 的 Authorized OAuth Apps / Installed GitHub Apps,跟 Google 帳戶的第三方應用程式存取權限,是兩個不用登入該服務本身、就能反查的地方——尤其像 Zeabur 這種主要靠第三方登入(而不是獨立帳密)的服務,這個方法特別有效。
