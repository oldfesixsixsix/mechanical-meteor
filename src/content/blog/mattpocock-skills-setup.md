---
title: 'mattpocock/skills：解決 Symlink 消失與 grill-with-docs 設定全攻略'
description: '記錄安裝 mattpocock/skills 時遇到的 symlink 消失踩坑過程，以及從 grill-with-docs 到 code-review 的完整 skill 工作流整理。'
pubDate: '2026-07-14T06:21:05.000-07:00'
updatedDate: '2026-07-15T08:52:57.615-07:00'
tags: ['Claude Code', 'Skill', 'Symlink', '實戰踩坑']
draft: false
---

前陣子在 Threads 上刷到 [一篇貼文](https://www.threads.com/@aiposthub/post/Dar7YhTAV4-)，推薦了 [mattpocock/skills](https://github.com/mattpocock/skills/tree/main) 這組給 Claude Code 用的 skills（像是需求訪談、TDD、除錯流程等現成的工作流程）。手癢裝了一輪，中間也真的踩到一個坑，順手把整個「安裝 → 踩坑 → 搞懂完整工作流」的過程記下來，希望能幫到同樣想試試看這組 skills 的人。

這篇筆記分成三段，各自獨立，你可以照順序看，也可以只挑你現在卡住的那一段看：

- **安裝**：三分鐘裝好一組 Claude Code skills
- **踩坑**：明明裝完了，Claude Code 卻看不到 skill
- **搞懂完整工作流**：從 `/grill-with-docs` 到 `/code-review` 的官方主線

---

## 安裝：三分鐘裝好一組 Claude Code skills

根據官方 README，安裝步驟很簡單。

### 1. 執行安裝指令

在你的專案目錄下跑：

```bash
npx skills@latest add mattpocock/skills
```

會跳出一個互動式選單，讓你挑選要安裝哪些 skills，以及要安裝到哪個 coding agent（選 **Claude Code** 就行）。

### 2. 記得勾選 `/setup-matt-pocock-skills`

安裝清單裡有一個特別重要的項目叫 `/setup-matt-pocock-skills`，**一定要選**，這是後續設定用的。

`/setup-matt-pocock-skills` 產生的配置檔是寫在**每個專案的 repo 裡**，不是寫進 global 設定，所以天生就是逐專案分開的。

### 3. Installation scope

skill 本身裝在 global（`~/.claude/skills`）沒問題 —— 那是「工具本身」。裝好之後這些 skill 會連結到 `~/.claude/skills`（以及 `~/.agents/skills`），在 Claude Code 對話裡就可以直接呼叫，例如：

- `/grill-me` — 開案前先被反覆盤問需求，避免做出來的東西跟你想的不一樣
- `/grill-with-docs` — 跟 `grill-me` 類似，但會同時建立 `CONTEXT.md` 專案術語文件跟 ADR（依賴的基礎 skill：`grilling` + `domain-modeling`）
- `/tdd` — red-green-refactor 的測試驅動開發流程
- `/diagnose`（diagnosing-bugs）— 結構化除錯流程
- `/improve-codebase-architecture` — 掃描 codebase 找出可以重構、深化的地方

幾個實務上的提醒：

- 這個 repo 本身**偏向 TypeScript/Node 生態**（假設你用 Husky pre-commit hook、GitHub issue 之類的慣例），技術棧不同的話某些 skill 可能要自己調整
- skill 就是本機的 Markdown 檔案，裝好之後**不會自動更新**，要定期回來 `npx skills@latest add mattpocock/skills` 拉新版本
- 建議先小規模試，挑一兩個常用的 skill（像 `/grill-with-docs` 或 `/tdd`）在低風險任務上跑跑看，確認真的有幫助再全部裝

---

## 踩坑：裝好了，Claude Code 卻看不到

照著步驟裝完，終端機也印出了看起來成功的結果：

```
Installed 3 skills ─
│ ✓ grill-with-docs (copied)
│ → ~/.agents/skills/grill-with-docs
│ ✓ tdd (copied)
│ → ~/.agents/skills/tdd
```

但回到 Claude Code 裡打 `/grill-with-docs`，卻完全找不到這個指令。

### 根本原因：兩個互不相通的目錄

`npx skills` 這個安裝工具把檔案裝到了 `~/.agents/skills/`（這是它自己定義的「通用 agent 目錄」），但 **Claude Code 只認 `~/.claude/skills/`**，兩個目錄互不相通。

`npx skills` 背後的設計邏輯是：

- 它想要「一次安裝、多個 agent 共用」，所以定義了一個 **canonical（標準）目錄** `~/.agents/skills/`，作為所有 skill 檔案實際存放的地方
- 對於支援讀取 `~/.agents/skills/` 的 agent（它稱為「universal agent」），就直接讀那裡，不用額外處理
- 但 **Claude Code 不是這種「universal agent」**——它只認自己的 `~/.claude/skills/`，不會去讀 `~/.agents/skills/`
- 所以照設計，CLI 應該要在你選擇「安裝給 Claude Code」時，額外在 `~/.claude/skills/` 建一個 **symlink** 指回 `~/.agents/skills/` 裡的實際檔案，這樣兩邊都能用到同一份東西

正常情況下，如果你有指定 `-a claude-code`（或互動選單裡選了 Claude Code），安裝工具應該要自動建好這個 symlink，但這一步目前有 bug，沒做這件事——[vercel-labs/skills 的 issue #851](https://github.com/vercel-labs/skills/issues/851) 就是在講這個。所以你的 skill 實際上**裝成功了**，只是 Claude Code 看不到。

特別澄清一下，這件事跟之前的環境無關：

- 不是因為你「之前裝過什麼」造成衝突或污染
- 也不是你操作選錯選項
- 純粹是這個安裝 CLI 目前版本的已知缺陷，對 Claude Code 這種「非 universal」的 agent 少做了一步收尾工作

### 解法：手動建 symlink

跑下面這幾個指令，把 `~/.agents/skills/` 底下每個 skill 都連結到 `~/.claude/skills/`：

```bash
mkdir -p ~/.claude/skills
ln -s ~/.agents/skills/grill-with-docs ~/.claude/skills/grill-with-docs
ln -s ~/.agents/skills/tdd ~/.claude/skills/tdd
ln -s ~/.agents/skills/setup-matt-pocock-skills ~/.claude/skills/setup-matt-pocock-skills
```

### 之後怎麼避免每次都手動補

以後裝新 skill 時，可以在指令加上 `-a claude-code` 明確指定目標，雖然目前這個 bug 還是會發生（symlink 該建沒建），但至少確保安裝工具有意識到你要裝給 Claude Code 用：

```bash
npx skills@latest add mattpocock/skills -a claude-code
```

裝完後養成習慣跑一次 `ls ~/.claude/skills/` 確認有沒有真的連結上，沒有的話就手動補 symlink。

### 更新：這個 bug 是不是已經修好了？

寫這篇筆記的當下，我後來又重新安裝了一次，這次**完全沒遇到 symlink 消失的問題**，裝完就直接能在 Claude Code 裡叫出 skill。查了一下 [issue #851](https://github.com/vercel-labs/skills/issues/851) 目前狀態：

- issue 本身**仍是 open**，對應的修復 PR（#799）也**還沒被 merge**（review 時被抓到 patch 沒辦法乾淨套用、回歸測試沒覆蓋到 bug 路徑）
- issue 標題目前聚焦在**加了 `-g`（global）參數**的安裝情境（`npx skills add -a claude-code -g`），如果你這次安裝沒加 `-g`，有可能剛好走到另一條沒問題的程式碼路徑

換句話說，這個 bug 從官方 issue tracker 的角度**還沒被正式判定修復**，比較像是「特定參數組合下才會發生」，不是「全面修好了」。所以還是建議：裝完先照上面說的跑一次 `ls ~/.claude/skills/` 確認，沒連結上再照這段的解法手動補。

---

## 搞懂完整工作流：從 `/grill-with-docs` 到 `/code-review`

解決了看不到 skill 的問題之後，我把官方文件認真看了一輪，把整條鏈的運作邏輯整理如下。

### 先設定專案：`/setup-matt-pocock-skills`

每次 `cd` 到不同專案，在該專案目錄下跑一次 `/setup-matt-pocock-skills`，它會：

1. **偵測這個 repo 的現況**：看 `git remote -v`、有沒有已存在的 `CLAUDE.md` / `AGENTS.md`、有沒有 `CONTEXT.md`
2. **問你三件事**（針對這個專案）：Issue tracker 用 GitHub / GitLab / 本地 markdown（`.scratch/`）/ 其他；Triage 用的 label 名稱（對應到五個標準角色：`needs-triage`、`needs-info`、`ready-for-agent`、`ready-for-human`、`wontfix`）；Domain 文件是單一 `CONTEXT.md` 還是 monorepo 的多個 context
3. **把答案寫進這個專案的資料夾**：`docs/agents/issue-tracker.md`、`docs/agents/triage-labels.md`（如果有裝 `/triage`）、`docs/agents/domain.md`，並在該專案根目錄的 `CLAUDE.md` 或 `AGENTS.md` 插入一個 `## Agent skills` 區塊

實務上的做法：每個新專案第一次用到 `/triage`、`/to-issues`、`/tdd` 等 skill 前，先在該專案跑一次 `/setup-matt-pocock-skills`。A 專案配置 GitHub issues + 自訂 label，B 專案配置本地 markdown，兩者完全獨立、互不影響。不需要重跑的情況：只有在你想**換 issue tracker**或想**重置配置**時才需要再跑一次；平常想改細節，直接手動編輯該專案的 `docs/agents/*.md` 就行。

### 主線流程

`grill-with-docs` 官方文件明講：「你要打 `/grill-with-docs` 才會啟動它，agent 不會自己主動去用」（user-invoked）。這個特性套用在整條鏈上的每一步，所以 grilling session 結束後，不會自動幫你接下去做 spec、拆票、寫程式——即使對話脈絡看起來已經很完整，agent 也不會自己猜「該換 skill 了」，你要明確下指令切換。

官方定義的主線是：

```
grill-with-docs → to-spec → to-tickets → implement → code-review
```

**1. Grilling 結束後 → 打 `/to-spec`**

它會把你剛才那整段對話直接彙整成一份 spec，發布到你設定好的 issue tracker（GitHub/GitLab/本地 markdown）。這一步**沒有訪談**，純粹是「把已經討論出來的東西寫成正式文件」，不會重問你一次。

**2. Spec 產出後 → 打 `/to-tickets`**

把這份 spec（或任何計畫/對話）拆成一組可執行的小任務（tickets），每張票會宣告自己依賴哪些其他票（blocking edges），方便之後平行處理或按順序執行。

**3. 準備動工 → 打 `/implement`**

這一步才會真正開始寫程式。它會在你們預先約定好的關鍵節點（seam）自動驅動 `/tdd`（紅燈→綠燈的測試驅動循環），完成後自動跑 `/code-review` 做審查再讓你 commit。`tdd`、`code-review` 是 **model-invoked**，也就是 `implement` 執行過程中會自己呼叫它們，你不用手動再打一次 `/tdd`。

執行順序整理起來就是：

```
tdd（紅燈→綠燈，一個 seam 一個 seam 做）→ code-review（內建自動跑）→ commit
```

### ADR 與 Issue Tracker 的差異

**ADR（Architectural Decision Record）回答的問題是：「我們當初為什麼這樣決定？」**

- 內容是一段已經拍板、難以回頭的架構/設計決策，加上決策的理由跟考慮過的取捨
- 寫給未來的人（包含未來的 agent）看，避免有人事後納悶「這裡怎麼會這樣設計」而想去改掉一個其實深思熟慮過的決定
- 只在真的很重要（難以逆轉、沒有上下文會讓人意外、確實經過權衡）的時候才會產生，平常不會亂寫
- 存放位置：`docs/adr/`，是靜態文件，寫完之後大多不會再動，除非決策被推翻，才會新增一篇 ADR 說明推翻了什麼

**Issue Tracker（GitHub Issues / Linear / 本地 tickets.md）回答的問題是：「現在有什麼工作要做、做到哪了？」**

- 內容是可執行的工作項目——一張張 ticket、spec、任務，有狀態（待處理/進行中/完成）、有依賴關係（這張票要等那張票做完才能開始）
- 是當下的工作流程管理，推動實際開發進度用的
- 由 `/to-spec`、`/to-tickets`、`/wayfinder` 這些 skill 產生跟維護，是會一直變動的活文件（開了、關了、更新了）

### 防止意外的 git 操作

如果想徹底防止任何自動推送，mattpocock 的套件裡剛好有一個現成的 skill 專門做這件事：

```bash
npx skills@latest add mattpocock/skills --skill git-guardrails-claude-code -a claude-code
```

裝了之後，`push`、`reset --hard`、`clean -f` 這類危險指令會被 hook 直接攔下來，不管是不是 `implement` 觸發的，一律擋住，比你自己手動介入更保險。

---

## 總結

整套 mattpocock/skills 的設計理念其實很清楚：先把需求盤問清楚、留下術語跟決策紀錄，再一路自動化到寫程式、測試、code review。唯一美中不足的是安裝工具目前對 Claude Code 這種「非 universal agent」的收尾步驟有 bug（issue #851），照著上面的 symlink 解法補一下就能繼續用。

希望這篇筆記能幫到同樣想試試 mattpocock/skills 的開發者，多走一點我踩過的彎路。
