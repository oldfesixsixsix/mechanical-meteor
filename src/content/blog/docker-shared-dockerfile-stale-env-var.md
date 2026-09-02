---
title: 'Docker 部署踩坑:共用 Dockerfile 把環境變數烤死,害服務吃到舊值'
description: '記錄部署時服務噴錯,追查到容器吃到共用 Dockerfile 烤進去的舊環境變數,回頭釐清 Docker build-time 寫死變數的風險與正確的 runtime 注入做法。'
pubDate: 2026-09-02
tags: ['Docker', 'Docker Compose', '環境變數', '部署']
draft: false
---

### 現象:服務噴錯,追到容器吃到舊的環境變數

最近部署更新時,用的是 `docker-compose-backend.yml` 搭配 `.env.backend` 的組合來配置環境變數。這次更新後服務噴錯,查看 log 發現是某個環境變數的值對不上——追查下去,才發現容器裡吃到的其實是**舊值**,不是 `.env.backend` 裡設定的新值。

進一步查看已啟動容器裡實際的環境變數,確認這個舊值就是公司共用的 Dockerfile 在 build 階段就寫死烤進去的——`docker-compose-backend.yml` 雖然有指定 `.env.backend`,但沒有真正蓋過這個值。

### 為什麼會這樣:回頭看共用的 Dockerfile

理論上 docker-compose 的 `env_file`/`environment` 設定應該會蓋過 Dockerfile 裡的 `ENV`——Dockerfile 那個只是「沒有外部設定時的預設值」,不是寫死不能改。所以這次「明明指定了 `.env.backend`,容器卻還是吃到舊值」這件事本身就不正常,具體是 compose 設定哪個環節沒吃到,這次沒有完全查清楚。

但這次踩到的坑點出一個更根本的問題:**公司的共用 Dockerfile,在 build 階段就把一些參數用 `ARG`/`ENV` 寫死烤進 image 裡了**。這是反模式,原因有兩個:

- **機密直接固化在 Image Layer 中**:即使在後續指令刪除,Docker image 每一層的歷史(`docker history` 或 `docker inspect`)都能完整還原當初 build 出來的金鑰與密碼,用 `RUN rm` 想清掉也沒用,前面的 layer 還是在。
- **破壞「一次建置,到處運行(Build Once, Deploy Anywhere)」**:若把 Dev/UAT/Prod 的配置寫死在 image 內,等於每個環境都要重新 build 一次 image,無法保證在 UAT 測過的映像檔與 Prod 完全一致。

跟同事討論後,共同的結論是:即使 runtime 覆蓋理論上有效,只要中間有一個環節沒接上,就會不動聲色地退回 Dockerfile 裡烤死的舊值——不會噴出明顯的警告,通常要等到值真的錯到讓服務掛掉,才會被發現。

### 正確的實作配置流程

架構分工應該是:Dockerfile 只定義結構與預設佔位符 → `application.yml` 讀取系統環境變數 → `docker-compose.yml` / `.env` 在執行期動態注入。

**Spring Boot `application.yml`(透過佔位符讀取)**

使用 `${ENV_NAME:default_value}` 語法,讓 Spring Boot 自動去抓系統環境變數:

```yaml
spring:
  datasource:
    url: ${DATABASE_URL:jdbc:postgresql://localhost:5432/mydb}
    username: ${DB_USER:postgres}
    password: ${DB_PASSWORD}
  ai:
    openai:
      api-key: ${OPENAI_API_KEY}
```

**Dockerfile(只負責打包,不放任何 Secrets)**

```dockerfile
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
```

**docker-compose.yml(執行期注入)**

直接搭配同目錄下的 `.env`(或透過 `env_file` 指令指定檔案):

```yaml
services:
  backend:
    image: my-app:latest
    restart: always
    # 方式 1:直接引入 .env 檔案中的所有變數
    env_file:
      - .env
    # 方式 2:明確宣告要透傳給 container 的變數
    # environment:
    #   - DATABASE_URL=${DATABASE_URL}
    #   - DB_PASSWORD=${DB_PASSWORD}
```

### 沒有上雲的地端 VM,額外的安全防護建議

在地端機器無法直接呼叫雲端 Secrets Manager 時,依然可以保留 `.env`,但建議落實以下最小權限控管:

- **嚴格限制檔案存取權限**,僅允許運行 docker 的 user 讀寫,阻斷其他 local user:

  ```bash
  chmod 600 .env
  chown deployer:deployer .env
  ```

- **隔離 Production 目錄**:將 Production 的 `docker-compose.yml` 與 `.env` 放在非公開目錄(如 `/opt/app/`),且該目錄權限設為 `700`。
- **CI/CD 部署管線動態派發**:`.env` 依然不進 Git,由部署 Pipeline(例如 GitLab CI / Jenkins Secret Variables)在部署當下將內容寫入目標機器的 `.env`,隨後立即拉起 `docker compose up -d`。

### 小結

這次討論完,共用 Dockerfile 目前還沒有真的去改,先把這套「正確做法」記錄下來,之後要推動修改時有依據可以討論。

### 附帶討論:能不能用 top-level env_file 少打幾次?

因為每個 service 都要重複寫一次 `env_file: .env.backend`,有同事提議乾脆改回預設的 `.env` 就不用額外宣告——但我們前後端的環境變數是分開管理的(`.env.backend` / `.env.frontend`),不想為了省這幾行設定犧牲掉這個區隔。

另一個想法是:在 `docker-compose.yml` 最外層(跟 `services` 平級)直接寫:

```yaml
env_file:
  - .env.backend
```

讓所有 service 自動套用,不用每個都寫一次。查了官方 Compose Spec 文件跟幾個相關 GitHub issue,沒有找到證據證明這樣寫是被支援、而且會自動套用到所有 service 的合法功能——唯一查到「top-level」跟 `env_file` 放在一起討論的,是 `include:` 這個頂層元素底下自己的子屬性,用途是引入其他 compose 檔案時的變數插值,跟「把值注入到 container 裡」是不同機制。

比較確定有效、也還沒實際採用的替代方案,是用 YAML anchor 共用同一份設定來源:

```yaml
x-env-backend: &env_file
  - .env.backend

services:
  backend:
    env_file: *env_file
  worker:
    env_file: *env_file
```

每個 service 底下還是要寫 `env_file: *env_file`,但只有一個真正的資料來源,要改只改一個地方。這部分目前還停在討論階段,如果你知道 Compose Spec 真的有支援 top-level `env_file` 直接套用到所有 service,歡迎跟我聊聊。
