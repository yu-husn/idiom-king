# 成語王者 · 會考巔峰對決

臺灣國中成語 RPG。本次交付為 P0 資料盤點與 P1 本機可玩原型，另依使用者追加要求，製作八位角色的 16 格戰鬥動作素材。不是已上線的全班即時系統。

## 開啟

需要 Node.js 22+ 與 pnpm。

```powershell
pnpm install
pnpm dev
```

瀏覽器開啟終端列出的 `http://127.0.0.1:5173/`。沒有真實登入，也不需任何 AI key。使用虛構練習生 A/B。
這台電腦也可在 PowerShell 執行 `.\啟動遊戲.ps1`，會尋找可用的 Node.js（包括 Codex 隨附版本）。

- 冒險大廳：選八位英雄、人機或同機雙人、選對手、選擇103～115年度練習（前一關60分且無待複核題解鎖）。
- 每場12題：8道選擇題各10分、4道看解釋填正確成語各5分，滿分100分。每題10秒，逾時只提交尚未鎖定的一方。
- 雙方提交後顯示結果及動畫；連擊不加分。完成後各自判斷60分門檻，PK結果獨立。
- 填成語須與標準答案逐字一致；不接受錯字、同義詞、額外空白或標點，不使用 AI。舊版歷史保留，含解釋意思題的舊未完成練習不再續玩。
- 我的戰績：本瀏覽器虛構學生的歷次、首次、最高與逐題紀錄；已完成題目可重新整理後續玩，尚未送出的當題輸入不保存。
- 動畫直接呈現在戰鬥中；學生介面沒有動作室、動畫下載或音樂試聽入口。

## 測試與建置

```powershell
pnpm test
pnpm test:e2e
pnpm build
pnpm preview
```

E2E 使用本機 Microsoft Edge headless。若電腦沒有 Edge，可在 playwright.config.ts 調整 channel，並安裝對應 Playwright 瀏覽器。測試伺服器可自動啟動。
實際執行結果見 docs/驗收紀錄.md，驗收截圖在 docs/screenshots/；失敗除錯輸出在 test-results/（不提交 Git）。

## 檔案

- docs/P0開發計畫.md：附件盤點、資料矛盾、分期開發與驗收。
- docs/資料模型.md：完整實體關係、權限、權威提交與重連契約。
- data/annual-summary.csv：年度來源列與候選詞條統計。
- data/question-review.csv：原文審核表；data/source-records.json、idiom-candidates.json：機器可讀資料。
- tools/audit_sources.py、tools/build_catalog.py：重跑附件盤點（Python + openpyxl）；不修改來源。
- public/art：八位動作圖與角色設定圖；src/animations.ts：序列與速度。
- public/art/character-*-preview.webp：八位各自的合成動畫；tools/pack_sprites.py 可重建。
- db/001_draft.sql：尚未執行的 P2 schema 骨架，不是完整後端 migration。
- .env.example：P2 可公開前端設定範本。

## GitHub Pages

前端使用相對 base，沒有需要伺服器重寫的路徑路由。建置產物只有 dist/，不可把根目錄所有附件當網站發布。
已提供手動觸發 `.github/workflows/pages.yml`。建立 GitHub repository、提交程式碼、在 Settings → Pages 選 GitHub Actions，再執行 workflow。已建立儲存庫 https://github.com/yu-husn/idiom-king ，遊戲網址：https://yu-husn.github.io/idiom-king/ 。推送 main 會自動測試、建置與部署。
公開展示只限虛構資料。正式班級使用必須先完成 P2 Supabase Auth、RLS、私人房間、伺服器判分，及 P4 教師後臺。

## 安全與目前限制

localStorage 可被修改；不是安全資料庫。虛構身分選單不是登入驗證，同機雙人不是兩台平板連線。
學生名冊與原始附件被 .gitignore 排除；真實名冊解析結果只在 private/。不要使用 `git add -f` 強制加入。
目前正式核准題數是0。P1明確允許示範題，正式題庫選取器拒絕未核准題；全量來源仍待教師校對與授權確認。
103～115年各30題已加入改編練習；最終魔王、真人跨裝置配對、雲端儲存、教師權限及正式報表尚未完成。
動畫為16格關鍵姿勢的原型；部分武器／光效邊緣與姿勢連續性仍需美術打磨。未宣稱完成商業級高幀動畫或學校平板效能驗收。

## 使用者已確認修訂

男女四組對應紅、藍、紫、黃。星璃使用藍色，第四位女生改名「映曦」，使用黃色，職業疾風射手，技能千羽風暴。



## 年度隨機題庫

13年度共390題，每年24選擇、6填成語。每場抽8/4共12題，滿分100、60分通關，題組及選項順序隨存檔保存。每年度先涵蓋8個候選詞條，不代表已完成全部來源成語。

題目為新增改編練習，非官方歷屆原題，所有題目狀態仍為 needs_review。審核資料在 docs/question-bank/；執行 `node scripts/export-question-bank.mjs` 可重建。

目前題型不需 AI API 或金鑰，不產生 AI 判題費用。
