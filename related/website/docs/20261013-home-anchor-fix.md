# 首頁寬屏定位修正

2026/10/13

手機版切換至桌面版時，首頁的固定區段會重新計算捲動距離。舊實作只在首次載入時校正錨點，重新測量後可能回到頁首，或落在產品區下方。WebKit 也可能在頁面開啟後恢復舊捲動位置。

目前會在版面測量完成後恢復對應區段；鍵盤、滑鼠或觸控開始操作時，立即停止錨點校正。使用者繼續閱讀時，不會被網址中殘留的 `#products` 拉回。

## 本地生產版驗證

- Chrome、Firefox、WebKit：45 項定位回歸通過，涵蓋英語、繁中、日語；檢查跨斷點、刷新、返回、延後恢復位置及手動捲動。
- 定位測試寬度：390、768、1100、1101、1440、1920、2435、3440px。
- 11 個主要頁面、三語、三引擎、六尺寸：594 組排版檢查通過，未發現橫向溢出、產品文字疊壓或舊版首頁回退。
- 30 項單元測試、TypeScript、改動檔案的 ESLint 及正式建置通過。

這些結果來自 macOS 本地測試；WebKit 引擎測試不等同於所有版本的 Safari 實機驗收。Windows、Linux 的結果請以本次 GitHub Actions 執行紀錄為準。會員登入、訂單與裝置服務的接入狀態未因本次排版修正而改變。

## 交付連結

[公開預覽網站](https://lumiq-parallax-collab-public.vercel.app/zh-hant)

[甲方 GitHub 倉庫](https://github.com/arphasmarthome/lumiqwebsite)

[現有合併請求 #2](https://github.com/arphasmarthome/lumiqwebsite/pull/2)

[飛書修改清單](https://hcnbsg6ttb3t.feishu.cn/wiki/NQNuwHA4ZiKpEWkAThEcBSB5nwx)

以上連結保留既有地址。程式碼更新到原修正分支，不改寫甲方歷史，也不自動合併主分支。
