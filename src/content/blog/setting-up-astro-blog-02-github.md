---
title: '差點被自己的 SSH 金鑰擋在門外：接上 GitHub'
description: '記錄把專案推上 GitHub 時，因為本機多組 SSH 身份設定而卡關、最後找到根因的過程。'
pubDate: 2026-08-02
tags: ['GitHub', '部落格架設']
series: '建立 Astro 部落格'
---

## 用 gh CLI 建 repo

本機已經裝好 `gh` CLI 而且登入過，確認身份：

```bash
gh auth status
# ✓ Logged in to github.com account my-account
```

照理說接下來一行指令就能把專案建成 repo 並推上去：

```bash
gh repo create mechanical-meteor --public --source=. --remote=origin --push
```

結果 repo 真的建好了（`https://github.com/my-account/mechanical-meteor` 都拿得到），但 push 卻失敗：

```
ERROR: Permission to my-account/mechanical-meteor.git denied to other-account.
fatal: Could not read from remote repository.
```

`other-account`？我從沒聽過這個帳號會出現在這裡。

## 根因：gh CLI 跟 git push 走的是兩條不同的認證路

問題出在這裡——`gh auth status` 顯示的是 `gh` 這支 CLI 工具自己的登入狀態（它用的是 OAuth token），但 `git push` 走的是另一條路：如果 remote URL 是 `git@github.com:...` 這種 SSH 形式，實際認證身份是由**本機的 SSH 金鑰**決定的，跟 `gh` 有沒有登入完全無關。

用 `ssh -T` 測了一下本機預設的 SSH 身份：

```bash
ssh -T git@github.com
# Hi other-account! You've successfully authenticated...
```

答案揭曉：這台機器上配置了不只一組 GitHub 帳號的 SSH 金鑰，而 `git@github.com` 這個預設 host 綁定的，剛好是另一個帳號的金鑰，不是 `my-account`。

## 先用 HTTPS 頂著

當下想先確認整個流程通不通，於是先用 `gh` 的憑證機制繞過 SSH 問題：

```bash
gh auth setup-git
git remote set-url origin https://github.com/my-account/mechanical-meteor.git
git push -u origin main
```

`gh auth setup-git` 會把 git 設定成用 `gh` 已登入的 token 當作 HTTPS 的憑證來源，這樣 push 認證就跟 SSH 金鑰徹底脫鉤，直接用 `gh` 登入的帳號身份操作。這一步先讓程式碼順利推上去，網站流程可以先往下走。

## 真正的解法：找到對的 SSH host 別名

HTTPS 能動，但總覺得不是長久之計——這台機器顯然是刻意設定了多組 SSH 身份，代表應該有一個「對的」用法，只是我一開始沒用對。回頭查了 `~/.ssh/config`：

```
Host github.com-my
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_my-account
  AddKeysToAgent yes
  UseKeychain yes

Host github.com-other
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_other-account
  AddKeysToAgent yes
  UseKeychain yes
```

謎底解開：這台機器上 `github.com` 這個 host 名稱本身沒有專屬設定，會落到 SSH 的預設行為（通常抓第一把可用的金鑰），而真正對應到 `my-account` 帳號的，是 `github.com-mac` 這個自訂別名。多帳號情境下這是常見的 SSH 設定方式——用不同的 host 別名區分「用哪一把鑰匙開門」，而不是依賴預設值。

改回用 SSH，但這次用對別名：

```bash
git remote set-url origin git@github.com-mac:my-account/mechanical-meteor.git
ssh -T git@github.com-mac
# Hi my-account! You've successfully authenticated...
```

這次認證的身份對了。之後在這台機器上對這個 repo 做任何 `git push`，都會是用正確的帳號。

## 小結

這件事給我的提醒是：`gh auth status` 顯示的登入帳號，不等於 `git push` 實際使用的身份——尤其是這台機器上配置過不只一組 SSH 金鑰的時候。遇到權限被拒但帳號「看起來」是對的時候，值得先用 `ssh -T git@<host>` 確認一下實際認證出來的是誰。

程式碼安全上了 GitHub 之後，下一篇要處理的是讓 Vercel 接手自動部署，以及驗證 `draft` 機制真的有把未完成的文章擋在正式網站外面。
