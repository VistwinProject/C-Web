
## TouchDesigner OSC 測試
啟動：`python tools/osc_bridge.py`（Python 標準函式庫，HTTP 127.0.0.1:8766）。網頁左下角可改轉送服務、TD 私有 IPv4、UDP Port、OSC 位址；預設同機 9000，設定保留於瀏覽器。
第 15 秒進入熱區扫描送 `/c/heat/active` int32 `1`，第 30 秒離開送 int32 `0`。跳幕、重新開始也依進出狀態送出；暫停保留目前狀態；關閉自動模式送 0。手動測試只送訊號；「預覽熱區」跳至 15 秒並播放。失敗不自動重送，以免延後觸發舊事件。
TD 使用 OSC In DAT，Active 開、Network Port 9000（或介面指定值），收到 `/c/heat/active 1` 開始熱區、0 離開。官方參考：https://derivative.ca/UserGuide/OSC_In_DAT 。UDP 已送出僅代表本機轉送成功，不代表 TD 已接收。
轉送服務只監聽本機；允許來源為 localhost:8765、127.0.0.1:8765 和此專案 GitHub Pages。GitHub Pages 本身不提供 UDP，現場仍需此服務；瀏覽器可能另需允許本機網路存取。跨電腦時 TD 端需允許所設定的 UDP 接收埠。關閉網頁前可按「測試離開」清除 TD 狀態。
