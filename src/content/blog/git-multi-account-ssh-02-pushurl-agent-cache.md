---
title: '明明有權限,為什麼 git push 一直說 Repository not found?'
description: '記錄用 SourceTree push 私有 repo 時持續遇到 Repository not found,即使改對 pushurl 依然卡關,最終定位到 ssh-agent 快取舊金鑰蓋過 IdentityFile 的排查過程。'
pubDate: 2026-09-02
tags: ['Git', 'GitHub', 'SSH']
series: 'Git 多帳號 SSH'
draft: false
---

### 現象

某天要用 SourceTree push 一個叫 `some-repo` 的 repo,結果吃了這個錯誤:

```
Pushing to github.com-account-a:account-b/some-repo.git
ERROR: Repository not found.
fatal: Could not read from remote repository.

Please make sure you have the correct access rights
and the repository exists.
Completed with errors, see above
```

第一直覺通常是「repo 是不是被刪了」或「網址是不是打錯了」。但 `git remote -v` 看起來完全正常,repo 也確實存在於 GitHub 上,自己也明明有權限 —— 於是就卡在這個看似矛盾的錯誤訊息上。

### 關鍵:GitHub 對「repo 不存在」跟「沒權限」用同一句話回覆

這是這次踩坑最容易誤導人的地方。GitHub 基於安全考量(避免讓人用錯誤訊息去探測私有 repo 是否存在),**對「repo 真的不存在」跟「你的身份沒有存取權限」回傳的是同一句 `Repository not found`**。

所以看到這個錯誤,不能只檢查 repo URL 對不對,還要往下確認:**當下這次連線,GitHub 到底把你認成誰**。

### 排查過程

#### 1. 先檢查 SSH config 本身有沒有問題

因為以前就踩過多帳號 SSH 認錯人的坑,看到這個錯誤的當下,不是先懷疑 repo URL,而是先翻開 `~/.ssh/config`,確認這個專案用的 host alias 有沒有指到對的 `IdentityFile`:

```
Host github.com-account-a
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_account-a
  AddKeysToAgent yes
  UseKeychain yes

Host github.com-account-b
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_account-b
  AddKeysToAgent yes
  UseKeychain yes
```

兩組設定都在,對應的金鑰檔也都存在,乍看沒有問題。但這只證明「設定寫得對」,不代表「這次連線真的用了這把金鑰」。

#### 2. 用 ssh -T 測試登入身份,發現認錯人

在 terminal 用 `ssh -T` 直接確認這次連線 GitHub 到底認成誰:

```bash
ssh -T git@<host-alias>
```

```
Hi account-a! You've successfully authenticated, but GitHub does not provide shell access.
```

問題就在這一行。這次要 push 的 repo 屬於 `account-b`,但 SSH 連線卻是用 `account-a` 的身份認證成功的 —— 兩個不同 GitHub 帳號,`account-a` 自然對 `account-b/some-repo` 沒有任何存取權限,才會被 GitHub 用「repo not found」擋下來。

#### 3. 改了 pushurl,理論上該對了——結果還是推不上去

在 terminal 用 `git config` 把 `pushurl` 明確指到對的帳號 host alias:

```bash
git config remote.origin.pushurl git@github.com-account-b:account-b/some-repo.git
```

改完之後,`~/.ssh/config` 指到對的 `IdentityFile`、`pushurl` 也指到對的 host alias,照理說每一項設定都對了。結果用 SourceTree 重新 push,跳出來的還是同一句 `Repository not found`。

這是整個排查過程最困惑的一刻——一度懷疑是不是 SourceTree 跟 Terminal 用的是不同 `ssh-agent`,才會出現「設定明明對,兩邊表現卻不一致」的狀況。但這個猜測後來被推翻了(見下一節),真正的原因比這個更根本。

#### 4. 深入 SSH 金鑰協商順序,才找到真正的根因

問題出在 **`ssh-agent`**:當 agent 裡已經快取了另一把金鑰(這裡是 `account-a` 的),SSH 在協商身份時,agent 快取的金鑰會被優先攤出來試,而不是乖乖只用 config 裡 `IdentityFile` 指定的那把——只要 agent 裡任何一把金鑰通過 GitHub 驗證,身份就直接定案,根本輪不到 config 裡寫的那把金鑰出場。

驗證方式很直接,強制只用單一把金鑰去連:

```bash
ssh -T -o IdentitiesOnly=yes -i ~/.ssh/id_ed25519_account-b git@github.com
# Hi account-b! ...
```

加上 `IdentitiesOnly=yes` 之後,身份立刻對了。這證明金鑰本身、GitHub 端的設定、`pushurl` 都沒問題,純粹是**本機 SSH 沒有被限制只用指定金鑰**,導致 agent 快取的舊金鑰搶先生效。

把這一行加進 `~/.ssh/config` 之後,Terminal 的 `ssh -T` 跟 SourceTree 的 push 同時恢復正常——即使 SourceTree 的 SSH Client 設定從頭到尾都停在 `Embedded`,沒有另外切到 `System`。這也證明上一步「SourceTree 跟 Terminal 用不同 agent」的懷疑是條岔路:真正的根因只有一個,而且是在 `~/.ssh/config` 這一層就能解決,不受用哪個 git 工具影響。

### 修復

兩個地方都要修:

**1. 修正這個 repo 的 remote(含 pushurl),指到正確帳號的 host alias**

```bash
git remote set-url origin git@github.com-account-b:account-b/some-repo.git
git config remote.origin.pushurl git@github.com-account-b:account-b/some-repo.git
```

**2. 修正 SSH config 的根因,幫每個 host alias 加上 `IdentitiesOnly yes`**

```
Host github.com-account-a
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_account-a
  IdentitiesOnly yes
  AddKeysToAgent yes
  UseKeychain yes

Host github.com-account-b
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_account-b
  IdentitiesOnly yes
  AddKeysToAgent yes
  UseKeychain yes
```

加上這一行之後,SSH 在連線時只會用該 host alias 指定的那把金鑰去嘗試,不會再被 `ssh-agent` 裡快取的其他金鑰蓋過去——不管是走 Terminal 的系統 SSH,還是 SourceTree 這類 GUI 工具,都吃這個設定。

### 結論 / 給多帳號使用者的建議

如果你在同一台電腦上用 SSH host alias 管理多個 GitHub 帳號,務必記得:

1. **每個 host alias 都要加 `IdentitiesOnly yes`**,否則 `ssh-agent` 快取的金鑰可能會覆蓋掉你在 config 裡精心設定的 `IdentityFile`,而且這個問題不會每次發生,只會在 agent 裡剛好快取了「別的」金鑰時才浮現,非常難以重現和排查。
2. 遇到 `Repository not found` 先別急著懷疑 repo 是不是被刪了或改名了,用 `ssh -T git@<host-alias>` 先確認**這次連線 GitHub 到底把你認成哪個帳號**,往往比檢查 remote URL 更快定位問題。
3. 別忘了 `remote.origin.url` 和 `remote.origin.pushurl` 是可以分開設定的兩個值,`git remote set-url` 預設只改 `url`,如果 push 還是失敗,記得用 `git config --get-all remote.origin.pushurl` 檢查是不是還卡著舊設定。
4. **`IdentitiesOnly yes` 是寫在 `~/.ssh/config` 這一層的設定,不管走系統的 `ssh`、Terminal,還是 SourceTree 這類 GUI 工具(即使是它的 Embedded SSH Client),都會被套用**——遇到「同一個帳號問題,不同工具表現不一致」時,不用急著懷疑是不同工具各自用了不同 agent,先確認 `~/.ssh/config` 有沒有把 `IdentitiesOnly` 設好,通常就能一次解決。
