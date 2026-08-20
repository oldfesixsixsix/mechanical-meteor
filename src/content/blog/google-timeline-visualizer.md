---
title: 'Google Timeline Visualizer'
description: '教你用開源工具 Google Timeline Visualizer 將 Google 地圖時間軸（Timeline）資料轉換為旅行軌跡動畫影片（MP4）。本文記錄 macOS 環境實操過程，並提供 Python 虛擬環境與常見錯誤排除教學。'
pubDate: '2026-08-20'
tags: ['Google', 'Python', '旅遊', '開源工具']
draft: false
---

讓 Google 地圖紀錄變成動態軌跡影片：Google Timeline Visualizer 實操教學

**Google Timeline Visualizer** 是一款能將 Google 地圖「時間軸（Timeline / 定位紀錄）」資料轉換為旅行軌跡動態影片（MP4）的開源工具。

隨著 Google 調整時間軸的儲存政策，目前定位資料已改為預設儲存在使用者個人裝置上記錄。本文將帶你完成資料匯出，並在 macOS/Linux 環境下透過 Python 腳本成功生成軌跡影片。

> **提示**：若不想使用命令列，作者也有提供 Android App 與 iPhone 網頁版，直接上傳 `Timeline.json` 即可生成影片，可參考 [Google Timeline Visualizer 官方 Repo](https://github.com/mahlernim/google-timeline-visualizer)。

---

## 匯出 Google 時間軸資料 (`Timeline.json`)

先從行動裝置將定位資料匯出至本機：

### Android 手機
1. 開啟手機 **設定 (Settings)**。
2. 進入 **位置** → **定位服務** → **時間軸 (Timeline)**。
3. 點選 **匯出時間軸資料 (Export Timeline data)** → **繼續**。
4. 將取得的 `Timeline.json` 儲存至手機（例如 Downloads 資料夾）。

### iPhone (iOS)
1. 開啟 **Google 地圖 App** → 點擊右上角頭像 → **設定** → **個人內容**。
2. 選擇 **匯出時間軸資料**，並將 `Timeline.json` 傳輸至電腦。

---

## 電腦版 Python 環境建置與避坑指南

### 環境需求
* **Python** 3.9+
* **FFmpeg**（須加入系統 PATH 環境變數）

### 1. 取得專案與解決 `python3` 指令問題
在 macOS（zsh）或許多 Linux 系統中，預設並沒有 `python` 的別名，執行會跳出 `zsh: command not found: python`。請統一改用 `python3`：

```bash
git clone https://github.com/mahlernim/google-timeline-visualizer.git
cd google-timeline-visualizer
```

### 2. 解決 PEP 668 保護機制 (`externally-managed-environment`)
透過 Homebrew 安裝的 Python 啟用了 PEP 668 保護機制，直接執行 `python3 -m pip install` 會被系統阻擋。**標準解決方式是建立 Python 虛擬環境 (venv)：**

```bash
# 1. 建立虛擬環境 (.venv)
python3 -m venv .venv

# 2. 啟用虛擬環境 (終端機提示字元前方出現 (.venv) 即表示成功)
source .venv/bin/activate

# 3. 在虛擬環境內安裝依賴套件
pip install -r requirements.txt
```

---

## 執行生成影片

將匯出的 `Timeline.json` 放入專案根目錄下，執行 Python 腳本（可透過 `--year` 指定年份）：

```bash
python visualizer.py --input Timeline.json --year 2026 --output my_trip_2026.mp4
```

### 實際執行紀錄

```text
(.venv) hi@poc google-timeline-visualizer % python visualizer.py --input Timeline.json --year 2026 --output my_trip_2026.mp4
Loading Timeline.json...
Parsing 1807 segments for year 2026...
Found 1701 valid points.
Total distance: 2948.3 km
Target: 90s @ 30fps. Compression: balanced
Calculating steady camera path...
Setting up animation...
Generating 2700 frames...
Saving to my_trip_2026.mp4...
Done!
```

---

## 後續維護與感想

* **退出虛擬環境**：輸入 `deactivate` 即可離開虛擬環境（或直接關閉終端機）。
* **保留 `.venv` 資料夾**：環境檔案通常僅占用數百 MB，建議保留該資料夾。下次要再製作新影片時，直接執行 `source .venv/bin/activate` 即可使用，無需重新安裝套件。

---

## 總結

跑完 2026 年的影片後，畫面呈現在家與公司之間來回畫線——兩點一線、總計近 3,000 公里的軌跡，看似驚人，卻也是日常最真實的縮影。