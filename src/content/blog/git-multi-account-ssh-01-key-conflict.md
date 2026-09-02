---
title: 'Git 多帳號 SSH Key 衝突與認證錯亂完全指南'
description: '記錄本機切換多個 GitHub 帳號時，SSH Key 被快取導致認證錯亂的成因與排查過程，以及用 IdentitiesOnly 徹底解決金鑰衝突的設定方式。'
pubDate: '2026-07-10T08:50:52.000-07:00'
updatedDate: '2026-07-15T08:54:43.565-07:00'
tags: ['Git', 'GitHub', 'SSH']
series: 'Git 多帳號 SSH'
draft: false
---

在日常開發中，我們經常需要在同一台電腦上切換不同的 GitHub 帳號（例如公事帳號與私人帳號）。明明已經在 `~/.ssh/config` 設定了不同的 `Host`，且 `user.email` 也設定正確，但在執行 `git push` 時卻依然狠狠地噴出以下錯誤：

```
ERROR: Repository not found.
fatal: Could not read from remote repository.

Please make sure you have the correct access rights
and the repository exists.
```

最讓人崩潰的是，使用 `ssh -T` 測試連線時，明明指向了新帳號的別名，GitHub 卻依然跟你打招呼說：_「Hi [舊帳號]! You've successfully authenticated...」_

這篇文章將帶你徹底釐清 Git SSH 的認證邏輯，並一秒解決這個經典的「金鑰錯亂」盲點。

---

## 觀念釐清：GitHub 究竟是怎麼認證你的？

很多工程師遇到權限問題時，第一反應是去修改 `git config user.name` 或 `user.email`。

**核心觀念：**

- **`user.email`**：只決定 Commit 紀錄上的**作者欄位與頭像**，跟 Push 權限完全無關。

- **SSH Key**：GitHub 辨識「你是誰」以及「你有沒有權限 Push」，完全取決於你連線時**遞出了哪一把 SSH 私鑰（Private Key）**。

即使你本地專案的 Email 換成了新帳號，只要 SSH 遞出去的是舊金鑰，GitHub 就會把你當成舊帳號。如果舊帳號對新專案沒有存取權限，就會直接回傳 `Repository not found`。

---

## 為新帳號生成專屬金鑰

如果想在同一台電腦切換多帳號，切記**不要覆蓋舊的金鑰**。請為新帳號獨立生成一把新 Key，並給予不同的檔名：

```bash
# 生成新金鑰（以 ed25519 為例，並手動指定檔名為 id_ed25519_my)
ssh-keygen -t ed25519 -C "xxx@example.com" -f ~/.ssh/id_ed25519_my
```

生成後，將新公鑰（`.pub`）的內容複製下來，貼到你新 GitHub 帳號的 **Settings -> SSH and GPG keys** 中：

```bash
cat ~/.ssh/id_ed25519_my.pub
```

---

## 配置 `~/.ssh/config`

打開或建立你的 `~/.ssh/config` 檔案，為新舊帳號設定不同的 `Host` 別名。

此處有一個非常致命的隱藏陷阱：**Mac 或 Linux 的 `ssh-agent` 經常會快取舊的金鑰，導致 SSH 盲目拿舊金鑰去試。** 為了阻斷這個行為，我們必須加上 **`IdentitiesOnly yes`**。

```
# 舊帳號設定（預設）
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519

# 新帳號設定（自訂別名）
Host github.com-my
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_my  # 指向剛建立的新私鑰
    IdentitiesOnly yes                    # 關鍵：強制只使用此處指定的金鑰，拒絕快取
```

---

## 清理快取與連線測試

配置完成後，先強制清除金鑰管理員（`ssh-agent`）的快取記憶體，並重新手動載入新金鑰：

```bash
# 清除記憶體中快取的所有金鑰
ssh-add -D

# 手動加入新私鑰
ssh-add ~/.ssh/id_ed25519_my
```

最後執行測試連線指令，檢查 GitHub 有沒有正確認出你的新身份：

```bash
ssh -T git@github.com-my
```

---

## 預期結果

當看到畫面上正確顯示新帳號的名稱時，代表 SSH 隧道已經完全打通：

```
Hi my! You've successfully authenticated...
```

---

## 總結

解決了 SSH 的身份認證後，回到你的專案目錄，確保 Remote URL 使用的是你在 config 裡設定的別名（例如：`git@github.com-my:user/repo.git`），接下來不管是透過終端機還是 GUI 工具（如 SourceTree），`git push` 就能一路暢通無阻了！

希望這篇筆記能幫到同樣卡在 Git 多帳號地獄的開發者。
