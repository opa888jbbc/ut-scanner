\# UT Simulator 專案開發規範



1\. 底波（Back wall）必須實作「線性比例衰減」（移多少、消多少）。當聲束與缺陷重疊時，底波必須平滑縮小，完全對準缺陷時完全歸零。嚴禁開關式的突兀消失！

2\. 聲波（0°直探頭與斜探頭）在工件內必須實作至少 3 次的 V-Path 反射（Leg 1, Leg 2, Leg 3）。

3\. 碰撞截斷機制：聲束在任何一個 Leg 碰撞到缺陷時，該線條必須在碰撞座標處立即截斷，絕對不允許繪製出後續的反射路徑。

4\. 移除或極度淡化（透明度 5% 以下）原本過黑、干擾視線的重陰影，視覺重點必須完全放在高對比度、帶發光效果（Glow）的青色或橘色聲束線條上。



（以下規則 5\~14 由使用者於 2026-05-18 EDT「全部同意加入」`AI優化與改善建議書.md` A\~J 條後納入）



5\. 【聲束衰減 / Per-Leg Attenuation（建議 B）】聲束（不只底波）在每個 Leg 內必須依物理衰減：`ALPHA_DB_PER_MM = 0.025`（碳鋼 5 MHz 典型，50 dB/m）+ `REFL_LOSS_DB = 0.5`/Leg。每多一個反射 Leg，視覺亮度與 A-Scan 振幅按 `10^(-(α·SP·2 + REFL_LOSS·legIdx)/20)` 衰減。缺陷回波亦適用。10 MHz 採 `ALPHA_DB_PER_MM = 0.10`。

6\. 【缺陷取向 / Defect Orientation Sensitivity（建議 C）】每個缺陷必須宣告 `type`（`crack` / `lof` / `porosity` / `sdh`）與 `normalAngle`（°）。回波振幅 `A(θ_in) = A_iso · exp(-((θ_in - θ_def)/Δ)²)`：平面缺陷（`crack`、`lof`）Δ=8°；體積缺陷（`porosity`、`sdh`）Δ=60°。當 Skew 90° / 270° 時平面缺陷自動近乎消失。

7\. 【Corner Trap（建議 D）】偵測「缺陷底部觸及底面 + 缺陷取向接近垂直（|angle - 90°| < 10°）」時，A-Scan 振幅 × 2（+6 dB）。對應 LOP、根部裂縫的真實放大機制（ASNT 教材必教）。

8\. 【Tip Diffraction（建議 E）】裂縫類缺陷（`type === 'crack'`）必須在主峰前後各 0.5 mm 等效聲程位置加入 −12 \~ −18 dB 的繞射小峰，模擬上下尖端繞射。為日後 TOFD 模式奠基。

9\. 【Dead Zone（建議 F）】A-Scan 最左側 `0..DZ` 範圍必須塗淺灰色底並標籤「Dead Zone」。`DZ = 5 mm @ 5 MHz`、`3 mm @ 10 MHz`。工件視圖中對應深度也以同色帶標示。

10\. 【DAC 曲線疊加（建議 G）】A-Scan 必須可疊加紅色 DAC 曲線（4 校驗點：SP = 12 / 25 / 50 / 100 mm，對應 100 / 50 / 25 / 10 % FSH）。提供 toggle 控制顯示。Level 1\~2 訓練核心觀念。

11\. 【臨界角警告（建議 I）】refracted < 27° 顯示「⚠ 第一臨界角警告：縱橫波並存」；refracted > 78° 顯示「⚠ 第二臨界角警告：轉為表面波」。位置在 info 面板，紅／黃高亮。

12\. 【耦合品質（建議 J）】UI 提供「Couplant Quality 0\~100%」滑桿。所有 echo 整體 × `(Quality/100)`，並在 A-Scan 加入 ±5 % 隨機振幅雜訊。預設 95 %。

13\. 【近場 / 聲束擴散（建議 A）】聲束必須畫成錐形而非無寬度直線。`Near Field N = D²·f / (4c)`（5 MHz、D=12 mm、鋼 → N ≈ 30.5 mm）；半擴散角 `sinθ = 1.08·λ/D`（−6 dB main lobe）。BIP 起算 0\~N 範圍標示近場色帶（半透明黃，提示振幅不穩）。遠場以線性張角邊界線包夾中軸線。A-Scan 振幅必須 × `1/SP`（球面擴散，遠場部分）。

14\. 【B-Scan / S-Scan 副視窗（建議 H，分階段路線圖 V45\~V50）】加入兩個 200 × 60 px 副視窗：1. **B-Scan** 條：探頭沿 X 軸掃時把每位置 A-Scan 寫成垂直線堆疊；2. **S-Scan** 扇：PAUT (EX04) 模式下顯示 −30°\~+30° 共 13 條 ray 振幅彩色扇圖。本條為長期目標，**單一版本不必同時完成兩個視窗**。



（以下規則 15\~24 由使用者於 2026-05-22 EDT「同意加入除了 O 之外的建議 → 全採納（含 α 附錄）」後納入。原條目對應建議書 K\~U；O 條（縮寫 hover tooltip）否決，學生應自學縮寫。）



15\. 【A-Scan Inline Legend（建議 K）】A-Scan 卡片頂部 header 加一行 inline 圖例：`[●T] initial · [●D] defect · [●B] back wall · [—] gate`，顏色對應 `--green / --red / --yellow / --red(dashed)`，字級 9 px。原 `info-grid` 底部詳細圖例保留作補充說明。目的：學生第一眼看到 A-scan 峰時就能直接對照三字母意義，不需捲頁到底。

16\. 【First-time Drag Hint（建議 L）】首次載入時 TX 探頭加 1.5 秒 pulsing 黃綠色發光環 + 探頭上方浮 `👆 Drag me` chip 3 秒後淡出。`sessionStorage` flag `ut_seen_drag_hint` 確保只顯示一次；學生第一次成功拖動後立即清除提示並寫旗標。`.scan-hint` 文字同步加箭頭強化：`👆 Drag transducer (the grey block) along the surface ←→`。

17\. 【BASIC Mode Hide DAC/PH（建議 M）】BASIC 模式下 DAC 與 PEAK HOLD 兩個 `ctrl-cell` 整格 `display: none` 隱藏（不是 grey-out）。ADVANCED 模式才顯示。理由：BASIC 模式下兩按鈕無視覺反應會誤判按鈕壞了；隱藏比沉默 no-op 更乾淨，符合漸進式揭露原則。`side-panels` (B-Scan / S-Scan) 原本就已 BASIC 隱藏，本條對齊同一標準。

18\. 【EX04 Auto-Enable ADVANCED（建議 N）】`setExercise('grating')` 內若當下為 BASIC 模式，自動呼叫 `toggleMode()` 切到 ADVANCED，並在 `ex-desc` 上方浮一行 toast：`"EX04 needs ADVANCED mode — enabled automatically. Toggle off in header anytime."` 3 秒後淡出。EX01/EX02/EX03 切回時不自動降回 BASIC（尊重使用者選擇）。理由：S-Scan 副視窗只在 ADVANCED 出現，BASIC 進 EX04 看不到 PAUT 扇圖等於核心教學素材失蹤。

19\. 【Expected Result `<details>` per Step（建議 P）】每個 EX 的 step 卡末尾加一個 `<details><summary>💡 Show expected result</summary><p>...</p></details>` 摺疊區。摺疊預設關閉，學生主動展開才看答案。內容範例（EX01）：`At 5 MHz: 1 broad merged peak ... At 10 MHz: 5 separated peaks P1-P5 ... Trade-off: higher resolution but ×4 attenuation, see EX02`。`<details>` 原生 HTML 零 JS 成本，不破壞「先思考再驗證」的學習節奏。

20\. 【Reset Exercise Button（建議 Q）】`controls-row` 末端加一個小按鈕 `[↺ Reset]`。點下去把當前 EX 的所有 slider / toggle 拉回預設：GAIN=40、CQ=95、PH=OFF、DAC=OFF、freq=5MHz、skew=0°、pitch=0.60mm、nElements=8。不切 EX、不重 load 頁面。理由：學生亂滑後沒有快速復原機制會卡住。

21\. 【GAIN Recommended Range Gradient（建議 R）】`#gain-slider` track 用 CSS gradient 標示 30\~50 dB 綠色「training-recommended」色帶（對齊 ASNT Level 1 教材）。color stops: 0\~37% (gray) → 37\~62% (green-dim) → 62\~100% (gray)。slider 下方加小字 `recommended: 30-50 dB`。

22\. 【Color/Semantic Legend Chip（建議 S）】在 header 下方或 `info-grid` 第三格加一個 inline legend 條：`●5MHz ●10MHz ●skew ●defect ●safe ●back-wall`，6 個彩色點對應 `--orange / --cyan / --purple / --red / --green / --yellow`。font 9 px，字級小不擾視。目的：學生切 EX 切顏色語意時可快速對應。

23\. 【Skew 90°/270° Hover Preview（建議 T）】`#skew-90` 與 `#skew-270` 按鈕加 HTML `title` 屬性：`"Beam parallel to crack — D peak will disappear. This is expected (ISO 17640 dual-angle rule)."` 桌機 hover 預告會發生什麼，學生按下去之前就有預期。Mobile 無 hover 不影響原 teach-banner 教學流程（仍會按下後跳出綠卡詳解）。

24\. 【EX Completion ✓ Markers（建議 U）】學生在某 EX 內完成「至少 1 次拖拉 + 切換 freq 或 skew」後，該 ex-btn 右上角加一個小綠色 `✓` 標記。狀態存 `localStorage`（key `ut_ex_completed`，value 陣列），跨 session 記憶。CSS pseudo-element `.ex-btn.completed::after { content: '✓'; ... }`。不強制完成順序、不阻擋切換，純粹給學生「我玩過了」的視覺成就感。



α 附錄（6 條小修飾，與主規則 15\~24 同批採納）：

α1. TX position 初始顯示 `X: 60 mm`（取初始 `txX = MAT_X + MAT_W*0.25` 換算），不要留 `X: —`。

α2. EX01 5 MHz 標 D1..D5、10 MHz 標 P1..P5 → 統一改用 `P1..P5`（pore）。命名一致避免學生以為「D 跟 P 是不同類型缺陷」。

α3. `info-grid` 的 `CURRENT BEHAVIOUR` 從一段密集文字改為 2-3 條 bullet list（`<ul><li>...</li></ul>`），同樣內容但更好讀。

α4. 鍵盤捷徑：`1/2/3/4` 切 EX、`5/0` 切 freq（5/10 MHz）、`b` 切 BASIC/ADVANCED。`keydown` listener 加在 `document` 上，input/range/textarea 聚焦時略過避免衝突。

α5. `viewport` 的 `user-scalable=no` 與 `maximum-scale=1.0` 移除，放開手機縮放。視障/老花使用者體驗改善，原本鎖死是 v40 前的觸控防誤縮設計，現已過時。

α6. Skew 90°/270° teach-banner 第一句改成更平白的中性英文：`"When the beam runs along the crack instead of into it, almost nothing bounces back. This is real UT physics, not a bug."` 原有 `Gaussian Δ=8°` 等術語下移到「Why this matters」段，給想深入的學生看。



（以下規則 25\~40 由使用者於 2026-05-22 EDT「同意加入全部 → 含中低優先共 16 條」後納入。三視角自玩報告產出 V\~AJ。分批升 v51 = V\~AF，v52 = AG\~AJ。）



25\. 【V · Step Gating in EX01（學生視角）】EX01 ex-desc `<ol>` 加 step-state class，步驟 ② 在學生實際拖過探頭前以淺灰呈現並加紅色 chip `do this first`。完成 ① 後 ② 變為正常顯示。理由：步驟卡 ① 是動作、② 是觀察，沒有 gating 學生會在「還沒拉動探頭」時看不到 P peaks 而困惑「沒有缺陷可數」。

26\. 【W · Meta-Instruction Line（學生視角）】每個 ex-desc 開頭（`<strong>` 標題下）加一句固定 caption：`Try the steps yourself first, then expand 💡 to verify your answer.` 字級 10 px，顏色 muted。解釋 `<details>` 應該何時打開。

27\. 【X · Root Crack Realistic Depth（NDT 專家視角）】`WELD_CRACK.ry` 由 0.72 改為 0.88（88 mm 深，100 mm 厚試片）。對應實務 weld root 位置（≥80% thickness）。教學上 root crack 是 LOP (Lack of Penetration) 的根本位置，必須在試片下緣。Corner Trap §7 已預留 `touchesBackwall` flag，但實際 WELD_CRACK 仍設 false（避免在 v51 一併開啟此機制造成 +6 dB 飆升）。

28\. 【Y · EX02 LOF → SDH 命名糾正（NDT 專家視角）】`DEEP.type` 由 `'lof'` 改 `'sdh'`（Side-Drilled Hole — Level 1 必教 reference reflector）。EX02 試片沒有 weld 環境，叫 LOF 概念誤導；改 SDH 既符合教學標準、又解放命名。ex-desc / drawScan label / planar defect 文字一併更新為 `reference SDH`。`getPlanarSignal()` 物理不變（仍是 planar response），但前端文字一致。

29\. 【Z · Dynamic Color Legend（學生視角）】color-legend chip 改成動態顯示「當前 EX 用得到」的顏色：
- EX01 (Resolution): 5MHz · 10MHz · defect · safe · back-wall
- EX02 (Penetration): 同 EX01
- EX03 (Weld Skew): + skew/weld 紫色點
- EX04 (Grating): + PAUT array 紫色點 + main/grating 標示
切 EX 時 `updateColorLegend()` 重渲染。避免學生在 EX01 看到還沒登場的 skew 紫色點而困惑。

30\. 【AA · T Peak t=0 Annotation（教授視角）】drawAscan 內 T peak label 旁邊加小字 `(t=0)`（或 `t=0`），字級 7 px，offset (+pw, +12) 不擋主標籤。明示 T peak 是時間軸起點 / pulser 觸發時刻 / dead zone 起始參考點。Level 1 必教概念。

31\. 【AB · EX02 Reference SDH at 50 mm（教授視角）】在 EX02 試片加第二個缺陷：`{rx:0.30, ry:0.50, type:'sdh', radius:1.5 mm, label:'Reference SDH (50 mm)'}`。學生可以拖探頭到 X=72 mm（rx=0.30 換算）對比此標準反射體 vs 80 mm 深主 SDH，理解「ASNT Level 1 校驗反射體」概念。A-scan 顯示兩個 D peak：D_ref @ SP=50 mm（100% FSH at default gain）、D_deep @ SP=80 mm（衰減約 25\~30% FSH）。

32\. 【AC · Tutorial / Quiz Mode Toggle（教授視角）】header 加第二個 toggle `MODE: TUTORIAL ↔ QUIZ`：
- TUTORIAL（預設）：顯示所有 hints / teach-banner / `💡 Show expected result` 摺疊 / disclaimer
- QUIZ：隱藏全部上述提示，學生靠自己讀 A-scan 並心算。保留 GATE alarm、% FSH 顯示作為自我評估依據。
模式存 localStorage key `ut_learn_mode`。

33\. 【AD · Simplification Disclaimer Cards（NDT 專家視角）】EX01 / EX02 ex-desc 末尾（在 `<details>` 之後）加小字紅色框：
- EX01: `⚠ Display simplified — real porosity clusters are 3-D distributed, not a single horizontal line.`
- EX02: `⚠ Simulated planar reflector / SDH — real LOF defects occur only in weld fusion zones (see EX03).`
讓學生知道這是教學簡化非實務全貌，避免錯誤類化。

34\. 【AE · EX03 Wedge Angle Selector 45/60/70°（NDT 專家視角）】EX03 skew-bar 下方加 wedge-bar：三個 button `45° · 60° · 70°`。`refractAngle` 變數從 hard-coded 45 改成 `wedgeAngle` 全局狀態。對應更新：
- `getWeldCrackSignal()` 內 `var refractAngle = 45;` → `wedgeAngle`
- `drawWeldBeam()` ray casting 方向 `rdx/rdy` 重新計算
- critical-angle warning §11 隨之動態更新（45° 安全 / 60° 安全 / 70° 接近第二臨界角）
- Crack `normalAngle` 一併隨 wedge 更新或 hint 「crack normal 預設 = wedgeAngle」避免每改 wedge 都 D 峰消失
教學用：學生切楔角看到「同個 crack 在不同 wedge 下 D peak 強度不同」→ 對應 ISO 17640 dual-angle 必要性。

35\. 【AF · EX04 Toast Position + Duration（學生視角）】v50 §18 N 的 EX04 ADVANCED toast：
- 位置從 `position:fixed; bottom:48px` 改為錨定 side-panels 正上方（`position:absolute` 在 side-panels container 內 top:-32px 浮現）
- 顯示時間從 3.4s 改 5.5s（給學生時間讀完並對應位置）
這樣學生切到 EX04 看到「toast 在 side-panels 上面 + 多停 2 秒 + 箭頭指向新出現的兩個視窗」，理解 cause-effect。



36\. 【AG · EX02 DAC Calibration Mode（教授視角）】EX02 sub-toggle「DAC CAL」。學生分 4 點 capture (SP=12/25/50/100 mm) 自己連出 DAC 曲線；v47 的 hardcoded DAC overlay 改為「reference theoretical curve」與學生 curve 並列。EX02 同時加 2 個新 SDH (SHALLOW 12 mm + FAR 100 mm)，加上既有 REF (50 mm) + DEEP (80 mm) 共 4 個 SDH 對應 4 校驗點。

37\. 【AH · EX03 IIW V1 BIP Calibration（NDT 專家視角）】EX03 sub-toggle「IIW V1」。掃描畫面切換到 V1 校驗塊（100 mm radius arc + 25 mm SDH at 100 mm depth）。學生拖探頭找到 max echo 位置 → 該位置即實際 BIP / Beam Exit Point；對比 wedge nominal angle 學會「換 wedge 必須重新校驗 BIP」的實務原則。

38\. 【AI · 6 dB Drop Sizing Tool（教授視角）】「📏 Size −6 dB」按鈕加在 controls-row。三步工作流：
- 1st click：capture 當前 max D peak amplitude 為 100% 基準（要求 ≥ 10 % FSH）
- 2nd click：探頭拖到左側 D = 50 % 處 → mark left edge
- 3rd click：探頭拖到右側 D = 50 % 處 → mark right edge → 報告長度 mm
- 4th click：reset
按鈕顏色隨狀態切（idle → yellow → green）。Toast 在每步給指令。適用 EX02/EX03 sizing。

39\. 【AJ · Vault Glossary Link（教授視角）】info-grid 第一格底部加 `📖 Open NDT bilingual glossary (Vault)` link。`href="obsidian://open?vault=Obsidian%20Vault&file=wiki%2Fndt-bilingual-glossary"` 給擁有 Vault 的人（本地）直接開 Obsidian；後備機制：點擊 600 ms 後自動把 fallback 路徑（`C:\\Users\\Jun zhi-PC\\Documents\\Obsidian Vault\\wiki\\ndt-bilingual-glossary.md`）複製到剪貼簿，並 toast 提示。



（以下規則 40\~50 由使用者於 2026-05-23 EDT「A + B + C 區全採」後納入，對應 v51 三視角自玩 AK\~AQ + 大目標 AR\~AT。v53 視 budget 分批落實，無法 ship 的留 v54+。）



40\. 【AK · EX03 Wedge Mismatch Banner（學生視角）】EX03 + skew 0/180 時，若 `wedgeAngle ≠ 45`，跳橙色 teach-banner 解釋：「root crack normal 是 45°（\\ 方向），配 60°/70° wedge 自然失準 — 這就是 ISO 17640 要求 dual angle 的原因。EX07（v54）會有多方向缺陷讓你練 dual scan。」 wedge=45 時不顯示。

41\. 【AL · EX02 Sound-Path Dashed Lines（學生視角）】EX02 試片畫面從探頭中心到 REF_SDH / DEEP / SHALLOW / FAR 各畫一條虛線，line 上標 `~50 mm` / `~80 mm` / `~12 mm` / `~100 mm`。距離 = 探頭到 SDH 中心的直線距離。半透明顯示，beam 上不擋畫。

42\. 【AM · Step Gating Extended（學生視角）】v50 §25 V 的 EX01 step-gating 推廣到：
- EX02 step ②（Move to Deep SDH）— 完成 step ①（drag over Ref SDH，dragMoveSinceEx ≥ 8）才解鎖
- EX03 step ④（Try different wedges）— 完成 step ①\~③ 才解鎖
- 統一用 `.step-locked` + `.locked` class

43\. 【AN · SDH Diameter Realistic（NDT 專家視角）】所有 SDH 的 halfW 從 0.04 → 0.012（≈3 mm 直徑，對齊 ASTM E2491）。視覺上的 SDH 圓圈半徑 `Math.max(5, MAT_W*0.016)` 改為 `Math.max(3, MAT_W*0.005)`。Label 加 `Φ 3 mm SDH per ASTM E2491`。

44\. 【AO · Wedge Change BIP Reminder（NDT 專家視角）】EX03 setWedge() 內若使用者切 wedge 跳 1.5s toast：「Wedge changed — in practice you must re-verify BIP on IIW V1 (see V1 sub-mode below)」。提示 v53 同批新加 V1 sub-mode 的用途。

45\. 【AP · EX02 Δref→deep dB HUD（教授視角）】EX02 A-scan HUD 加即時 `Δ:−X.X dB ref→deep` 顯示（在 met-d 旁邊或下方）。公式：`20·log10(ps.deep.defAmp / ps.ref.defAmp)`，僅在兩個 SDH peak 都 > 0.05 時顯示。教學重點：學生即時看到 30 mm 額外路徑造成的 dB 衰減。

46\. 【AQ · Findings Sheet QUIZ Mode（教授視角）】QUIZ mode 時 ex-desc 區下方多一個 `<form>` 卡片：
- Defect type（dropdown: crack / lof / porosity / sdh / no defect）
- Sound path SP（mm 輸入）
- Amplitude（% FSH 輸入）
- Submit button → 對照當前真實狀態評分（hit/miss/dist），顯示綠/紅 feedback
TUTORIAL mode 時隱藏。狀態本地暫存，不寫入 localStorage（避免 chean state 干擾）。

47\. 【AR · EX07 Multi-Defect Weld（NDT 專家視角）】**\[ambitious / 可能 v54 staged\]** 新 EX 編號 EX 05（在 ex-bar 第 5 個按鈕；EX04 之後）：銲道試片含三個缺陷：
- \-shape crack ry=0.88（rx=0.30），normal 45°（同 v51 WELD_CRACK）
- /-shape crack ry=0.85（rx=0.50），normal 135°（mirror）
- ⊥ vertical crack ry=0.92（rx=0.70），normal 90°
學生用 45/60/70 wedge + 0/180 skew 找全部 3 個。

48\. 【AS · DGS Sizing Tool（NDT 專家視角）】**\[ambitious / 可能 v54 staged\]** 加 `📐 DGS Size` 按鈕。基於 DGS 標準：用 SDH ref 振幅 + 缺陷振幅 + SP 算 equivalent reflector size（直徑 mm）。需要 DGS curve table（內建簡化版：disc reflectors 1-6 mm）。

49\. 【AT · Material Velocity Slider（教授視角）】加 material toggle: Steel (5.9) / Aluminium (6.32) / Copper (4.66) / Cast iron (4.5)。`materialC` 全局取代 5.9 hardcode。教學：演示為何「校驗在鋼塊跑換到鋁塊必須重新校驗」。



（以下規則 50\~63 由使用者於 2026-05-23 EDT「A + B + C + D 全採（14 條）」後納入，對應 v53 三視角自玩 AR-full + AU\~BG。v54 視 budget 落實，超出部分 staged v55。）



50\. 【AR-full · Multi-Defect Weld 完整物理】v53 §47 AR 只 ship visual preview，v54 補完整：
- `WELD_CRACKS` 陣列含 3 個 cracks (原 WELD_CRACK + 2 個 MULTI_CRACKS_PREVIEW)
- `getWeldCrackSignal()` rewrap 為 `getAllWeldCrackSignals()` 回傳陣列
- drawWeldBeam segmentHitsCrack 對每個 crack 各檢一次
- drawAscan EX03 對每個 hit 的 crack 各畫一個 D peak (Dc1/Dc2/Dc3 標籤)
- 學生切 wedge 45 看到 \\ crack 強;切 60 看 / crack 強;切 vertical(skew 90)看 ⊥ crack 強 → ISO 17640 dual angle 必要性 hands-on

51\. 【AU · DAC CAL First-Click Modal】v53 §36 AG `toggleDacCal()` 改成第一次按時跳「大 toast」(顯示時間 4.5s + 多行):
- Line 1: `DAC CAL ON`
- Line 2: `Now drag probe over an SDH (shallow / ref / deep / far)`
- Line 3: `Then click button again to capture this point. Need 4 points total.`
而非簡短一行。

52\. 【AV · IIW V1 Mode ex-desc 返回提示】toggleV1Cal 開啟時 ex-desc 加入持久的綠色卡片提示「You're in calibration mode. Click 'Back to weld' (purple button →) to return to the weld scan piece.」 切回時撤掉。

53\. 【AW · Findings Sheet 容差顯示 + Show Truth】Findings Sheet 加固定的 「Tolerance: SP ±5 mm, amplitude ±15 % FSH」hint。加「Show truth values」按鈕,點下去揭曉當前真實 type/SP/FSH。Submit 之後才允許 Show truth(避免直接看答案)。

54\. 【AX · Material → ToF 同步】v53 §49 AT 改材質沒同步 ToF X 對應(SP→A-scan X 仍用 ry*0.60 hardcoded)。v54 把 ToF X 計算改成 `0.12 + (ry * MAT_THICKNESS_MM / 100) * (5.9 / materialC) * 0.60`。鋁:同 ry 但 ToF X 左移 ~7%;鋼:不變(因 materialC = 5.9 ratio = 1)。

55\. 【AY · DGS Toast 白話化】toast 內容從 ERS 術語改:`Estimated defect size ≈ X mm. This is a Level 2 sizing method comparing your peak amplitude to a calibrated reflector chart. For exam-grade sizing, use the official Krautkrämer DGS chart for your probe.`

56\. 【AZ · Banner Fade Transition】CSS:`.teach-banner` 加 `transition: opacity 0.3s, max-height 0.3s ease;` 改成預設 `opacity:0; max-height:0; overflow:hidden;`,visible class 設 `opacity:1; max-height:300px;`。

57\. 【BA · V1 Mode Thickness 25 mm】v53 §37 AH V1 mode 預設用 MAT_THICKNESS_MM = 100 mm。實際 ISO 2400 V1 是 25 mm 厚。v54 加 `v1ThicknessMm = 25`,V1 mode 啟動時暫存 100,切回 weld 恢復。視覺上 V1 試片畫面 H 比例縮小（取 0.30 × CH 而非 0.62）。

58\. 【BB · Velocity Calibration sub-mode】**\[v55 完整實作\]** EX02 sub-toggle `🔬 VEL CAL`(跟 DAC CAL 並列)。模式啟動後:
- 顯示已知厚度 25 mm 試片(V1-like)
- 探頭固定中央,A-scan 上 T peak 之後第一個明顯回波就是 BW
- 學生量 ToF (μs) → 公式 `c = 2 × 25 / ToF`
- 自動算出 c 跟 material preset 對比;若差 > 5% 提醒「Calibrate before scan」

59\. 【BC · Set Sensitivity Button】加 `🎯 Set sens.` 按鈕在 controls-row。點下去 readout 當前最大 D peak,若 > 5% FSH 就自動微調 gain 讓它 = 80% FSH(`gainDB += 20 * log10(0.8 / current_peak)`)。Toast 報「Gain adjusted to N dB (peak at 80% FSH on Ref SDH)」。

60\. 【BD · Export Scan Plan Button】加 `📄 Export plan` 按鈕。產出 markdown 含當前所有 setup:
```
# UT Scan Plan
- Frequency: 5 MHz
- Wedge: 45°
- Material: Steel (5.90 mm/μs)
- Gain: 40 dB
- Couplant Quality: 95 %
- Mode: BASIC / TUTORIAL
- Exercise: EX02 Penetration
- Sound Path Range: 0..200 mm
```
複製到剪貼簿 + toast 確認。

61\. 【BE · V1 Block Full Features】v53 §37 AH 的 V1 mode 只有 R100 弧。v54 補:
- 1.5 mm SDH at 15 mm depth(shear BIP 校驗用)
- 50 mm 半徑半圓孔(angle 校驗)
- Perspex insert（visual only,velocity calibration 用）
階段一:畫 features + 標籤;階段二（v55+）:加入回波計算。

62\. 【BF · DGS Disclaimer 加重】v53 §48 AS DGS Sizing toast 內 disclaimer 字串加紅色 prefix「⚠ TEACHING-GRADE — NOT FOR CERTIFICATION:」確保學生不會誤用為考試答案。同時 button title hover 加 disclaimer。

63\. 【BG · Material 顯示 Wedge Velocity】material selector 旁加 hint:`Wedge: Perspex (2.34 mm/μs) — refraction follows Snell with this combo`。固定 perspex(因 wedge 不可切),讓學生看到 wedge speed 跟 part speed 的對比比例。



（以下規則 64\~75 由使用者於 2026-05-23 EDT「A + B + C + D 全採（12 條）」後納入,對應 v54 三視角自玩 BB-full + BH\~BS。）



64\. 【BH · A-Scan Peak Tooltip on Hover/Tap】每個 D peak 加 invisible hit-zone,mouse/touch hover 顯示浮動 tooltip「Dc1: SP=85 mm · 32 % FSH · crack c1 /」。對應學生 EX03 多 peak 難分辨疑問。

65\. 【BI · Material Non-Steel A-Scan Notice】material 不是 steel 時,A-scan 旁加小字提示「Peaks shifted: c="+materialC+" mm/μs (steel = 5.9). Physical SDH depth unchanged.」確保學生理解「peak 左移是 ToF 變化不是位置變化」。

66\. 【BJ · Export Plan Reinforced Feedback】toast 延長到 4 s,button 上短暫顯示 `✓ Copied` 2 s。視覺確認 clipboard 寫入成功。

67\. 【BK · DGS Toast Simplification】toast 內容簡化只報 `ERS ≈ X mm at SP Y mm`,完整 disclaimer 移到 button `title` 屬性(hover 才顯示)。減少訊息密度。

68\. 【BL · Set Sens. Peak-Too-Low Red Flash】`setSensitivity` 在 peak < 5 % FSH 時 button 短暫變紅色閃動 1.5 s + 抖動 1-2 像素,強化「按了沒做事」視覺反饋。

69\. 【BM · V1 Mode Step-by-Step ex-desc】V1 mode 啟動時 ex-desc 直接重寫成 step-by-step:
1. Measure BIP — drag probe over R100 arc until echo peaks
2. Validate angle — drag probe near R50 semicircle, observe angle echo
3. Measure velocity — use the Φ 6 hole at known depth
4. Compare to perspex reference (visual only)

70\. 【BN · Findings Sheet History Export】Findings Sheet 加「累積歷史」陣列,Submit 時將當前 entry push 進 `findingsHistory`。Export plan 同時加 findings table:
```
| # | Type | SP | Amp | Score |
|---|------|----|-----|-------|
```

71\. 【BO · V1 R50 Angle Validation】V1 mode 切到 R50 semicircle 時,探頭在 semi 上方 X 位置時 echo 達 max。學生量得「peak position X」對比預期 BIP 計算實際 wedge angle。差 > 3° 提醒。

72\. 【BP · GATE ALARM Crack Source Detail】gate-alert.trig 時 `ga-detail` 顯示「Triggered by c0 at SP=124 mm, 65% FSH」而非當前的 generic「Depth: ~88 mm」。EX03 多 crack 時尤其重要。

73\. 【BQ · V1 R100 Arc Echo Physics】V1 mode 加 arc echo:探頭到 R100 arc centre 距離 = 100 mm 時 echo max(模擬 BIP calibration)。距離越偏 echo 越弱。A-scan 上看到「BIP echo」peak,學生據此調探頭位置。

74\. 【BR · c1/c2 Multi-Bounce Leg-2 Physics】`getCrackEcho` 擴充計算 Leg-2 反射路徑(底牆反彈後再到 crack)。c1/c2 各加一個 Leg-2 D peak。用 dimmer alpha 區別 Leg-1 主峰。

75\. 【BS · V1 Mode Thickness 25 mm 物理同步】v54 §57 BA 視覺已壓縮但 `MAT_THICKNESS_MM` 仍 100。v55 改:V1 mode 啟動時暫存 100,設 `MAT_THICKNESS_MM = 25`;切回 weld 恢復。或更乾淨:加 `effectiveThicknessMm()` getter,所有 pxToMm 經過它。



（以下規則 76\~86 由使用者於 2026-05-22 EDT「先做 CA-CK 之後再做 CL」後納入,對應 v55 三視角自玩 CA\~CK 全 11 條。）



76\. 【CA · VEL CAL BW Peak 隨材質移動】v55 §58 BB-full 的 BW peak X 用 hard-coded SP=25/200 比例計算,材質切換時 ToF 數字變了但 peak 位置沒動。v57 改 `bwX_vel = W * (0.12 + (25 / 100) * (5.9 / materialC) * 0.60)`,確保 BW peak X 跟 material c 同步左右移。

77\. 【CB · A-Scan Tooltip Touch 支援】v55 §64 BH 只 listen `mousemove`。v57 加 `touchstart` listener 同樣呼叫顯示邏輯,3 秒後自動 hide。手機使用者也能 tap peak 看 source/SP/FSH。

78\. 【CC · Findings Sheet History 可展開】v55 §70 BN 只把 history 寫進 Export Markdown,頁面內看不到。v57 加「📜 History (N)」collapsible 區塊在 Findings Sheet 內,點開展開所有過往 submission 一覽。

79\. 【CD · Leg-2 顯示策略調整】v55 §74 BR c1/c2 Leg-2 限定 ADVANCED 才顯示。v57 改成:BASIC 也顯示 c0 的 Leg-2/Leg-3(主 crack);c1/c2 的 Leg-2 仍 ADVANCED only。讓 BASIC 學生也能學到 V-Path multi-bounce 基礎概念(Level 1 必教)。

80\. 【CE · V1 Mode BIP Read-out HUD】v55 §73 BQ R100 echo peaks 但沒有量化 BIP 結果。v57 加 BIP read-out:V1 mode 下顯示「BIP = X mm (peak X − probe front)」即時更新,echo amplitude 最大時的 probe 位置 = 該 wedge 實際 BIP。

81\. 【CF · VEL CAL ToF Input + 自動評分】v55 §58 BB-full 純展示性。v57 加 input field「Your measured ToF (μs)」+ 「Submit」按鈕。提交後對比 `expected_ToF = 2·25/materialC`,差 ≤ 0.5 μs 綠色「✓ Correct」,>1 μs 紅色「Off by X μs — check your reading」。

82\. 【CG · ALARM Source Visual Highlight】v55 §72 BP ALARM detail 顯示 source label,v57 加視覺紅色虛線從 ALARM card 指向工件上對應 crack(c0/c1/c2 的螢幕座標)。學生視線一眼從 alarm → 缺陷位置。

83\. 【CH · Complete Calibration Suite Wizard】v55 BB-full + AG DAC 是分開兩個 sub-mode。實務「先 VEL CAL 確認 c → 再 DAC CAL 畫曲線」是一個流程。v57 加「🧙 Calibration suite」按鈕,串接:Step 1 VEL CAL(自動切過去,完成 Submit 後)→ Step 2 自動切回 + 啟動 DAC CAL → Step 3 提示 capture 4 points → Step 4 完成 toast「Calibration complete · ready to scan」。

84\. 【CI · VEL CAL Wedge Delay 拆分】v55 §58 BB-full BW ToF 直接 `2·25/c` 沒扣 wedge perspex 傳輸延遲。v57 顯示拆分:`Raw ToF: X μs (incl. wedge delay 10 μs) · Material ToF: X-10 μs · c = 2·25 / Material ToF`。對齊 Level 2 校驗實務。

85\. 【CJ · c1/c2 Cracks Corner Trap + Tip Diffraction】v55 §74 BR getCrackEcho 簡化版只有 Leg-1/Leg-2 specular。v57 加:
- corner trap factor:若 c1 或 c2 的 `touchesBackwall` 為 true 且 angle 接近 90°,echo × 2(+6 dB,§7)
- tip diffraction:若 type === 'crack',主峰前後 ±0.5 mm 加 −15 dB 小峰(§8)
讓 c1/c2 跟 c0 一樣有完整教學物理。

86\. 【CK · V1 R50 Angle 反推顯示】v55 §71 BO R50 semicircle echo 只跳 peak amp,沒算實際 refracted angle。v57 加:R50 peak 時 HUD 顯示「Measured refracted angle: X° (nominal {wedgeAngle}°)」。角度差 > 3° 提醒「BIP / angle 校驗偏差過大」。



（以下規則 87\~94 由使用者於 2026-05-23 EDT「同意 CL + 全部」後納入,對應 v57 三視角自玩產出。）



87\. 【CL · Corrosion Maze EX05 — 新練習模式】**主菜**:新增第 5 個 EX,從 Teachable NDT 課程練習影片(`uploads\2026-05-23-01-14-31.mp4`)抓設計。鋼板從上往下看(俯視,跟 EX01~EX04 側剖面完全不同 paradigm)。
- **試片**:250 × 250 mm 公制方板(對齊既有 metric;影片是 10"×10" inch,使用者授權 A/B/C 我決定 → 選 metric)
- **互動**:拖探頭在 2D 平面任意方向移動,顯示「POSITION X mm, Y mm」+「THICKNESS X.XX mm」(預設 12.7 mm,薄點 6.35 mm)
- **A-Scan**:綠 IP 峰 + back-wall 峰(正常深 / 薄處淺,薄處 label「THIN SPOT」)
- **遊戲化**:Drop Marker(學生標當前 X,Y)/ Undo / Reveal Maze(顯示真實薄點地圖比對)/ 計時器(觸碰探頭起算)
- **難度**:Easy(5 個薄點,大顆 Φ 25 mm)/ Medium(10 個,Φ 15 mm)/ Hard(20 個,Φ 8 mm)— 數量與大小同時用
- **評分**:每個 marker 距最近真實薄點 ≤ 10 mm 算 hit,顯示 hits / total + 用時。預設 hit-rate 為主,用時是 tie-breaker
- **教學重點**:C-Scan / corrosion mapping 概念(Level 1 必教),是第一個有評分閉環的練習

88\. 【CM · ALARM 紅環在 V1 mode 清除】v57 §82 CG ALARM 紅色發光環透過 `window._alarmSourceLabel` 控制。v1CalMode 下 cracks 不存在但 ALARM 可能殘留,v58 在 v1CalMode 啟動時強制 `_alarmSourceLabel = null` + reset gate-alert UI。

89\. 【CN · Findings History Panel 小螢幕 fix】CSS media query `(max-width: 400px)` 時 `.findings-sheet`、`#fs-history-panel` 加 `font-size: 9px` + 縮 padding,避免內容擠出。

90\. 【CO · Wizard Step 1 Pre-Submit Check】v57 §83 CH Calibration suite wizard step 1 等學生 Submit Correct 才進 step 2;但如果學生沒拉動探頭就 Submit,永遠 < 5% FSH 評不過,wizard 卡住。v58 改:Submit 時若 `window._lastMaxDefAmp < 0.05` 直接提示「Drag the probe over the calibration piece first to see the BW echo」+ wizard 不結束 step 1。

91\. 【CP · Tip Diffraction ε ex-desc 說明】EX03 ex-desc 加一行 disclaimer:「ε peaks = tip diffraction signatures (precursor to TOFD sizing technique)」。學生看到 εc1/εc2 在 ADVANCED 模式跳出就知道是什麼。

92\. 【CQ · Wizard 完成「Calibration Record」產出】v57 §83 CH wizard 完成 step 2(4 DAC points captured)後跳產出卡片「✓ Calibration Record · Material c, BW ToF, DAC points」可以複製成 Markdown 進 Export plan。對齊實務「校驗報告」需求。

93\. 【CR · Wedge Delay Lookup by Angle】v57 §84 CI wedge delay hard-coded 10 μs。實際 perspex wedge delay 隨 wedge angle 變(45° ≈ 9.0 μs / 60° ≈ 10.5 μs / 70° ≈ 12.3 μs,Olympus probe handbook 典型值)。v58 加 `WEDGE_DELAY_BY_ANGLE = {45:9.0, 60:10.5, 70:12.3}` lookup,跟 EX03 wedgeAngle 連動;EX02 VEL CAL 用 45° 預設值。

94\. 【CS · V1 R50 Angle 反推近似 disclaimer】v57 §86 CK 用 `atan2(offset, R50)` 簡化計算,未實際 trace ray bouncing。HUD 加 small italic note:「approx; for exam-grade angle verification use IIW V2 wedge cal block」。減少誤用為實作答案的風險。



（以下規則 95\~103 由使用者於 2026-05-24 EDT「同意全部（9 條）」後納入,對應 v58 三視角自玩產出 CT\~DB。全 9 條 ship 進 v59。）



95\. 【CT · Maze 座標 mm-space Clamp】v58 §87 CL `_mazeProbeMm()` 把 canvas-px clamp 之結果除 MAT_W 換算 mm,某些 resize 比例下顯示座標可漂出 0\~250 mm 邊界。v59 改在 mm-space 直接 `Math.max(0, Math.min(MAZE_PLATE_MM, x_mm))`,確保 POSITION 讀值永不離板。

96\. 【CU · Drop Marker 視覺確認】v58 §87 CL `dropMazeMarker()` 只更新計數沒 toast,學生不確定 marker 是否真的記錄。v59 加 `📍 Marker #N dropped at (x, y) mm` 1.6 s toast。

97\. 【CV · 🔄 New Maze 同難度重生】v58 §87 CL 換難度才會 regenerate;同難度想再玩一輪要繞 Easy→Medium→Easy。v59 加 `🔄 New maze` 按鈕呼叫新 `newMaze()` 函式,保留 difficulty 但 reset spots / markers / timer。

98\. 【CW · 隨機 Demo Disclaimer】v58 §87 CL Maze ex-desc 沒解釋「為什麼真實 corrosion 不長這樣」,學生可能誤類化到實務。v59 ex-desc 底部加紅色 dashed 卡片:「Simplified demo: random for training. Real corrosion clusters along drainage paths, weld toes, support contacts, grain boundaries.」

99\. 【CX · Maze 成績寫入 Export Plan】v58 §87 CL Reveal 後的 `mazeScore` 只顯示 HUD 不寫 Export Markdown。v59 `exportScanPlan()` 在 Calibration Record 段前插 `## EX05 Corrosion Maze Result` 區塊(difficulty / hits / markers / time / plate spec);同時 `revealMaze()` 順手把成績 push 進 `findingsHistory`,給 Findings Sheet 也能看。

100\. 【CY · Easy Pass Hint(≥ 80 %)】v58 §87 CL 學生通了 Easy 沒提示升 Medium,可能困在 Easy 不知道下一步。v59 `revealMaze()` 在 `mazeDifficulty==='easy' && hitRate ≥ 0.8` 時延遲 1.2 s 跳第二個 toast 「✓ Easy passed (X%) — try Medium」,並把 `mz-diff-medium` 按鈕加 `pulse-glow` 動畫 3 次當視覺鉤子。

101\. 【CZ · 探頭 Footprint Φ 12 mm】v58 §87 CL `_mazeThicknessAt` 用 point sampling(probe centre 是否在 spot 內),不符合實際探頭 contact area。v59 加 `MAZE_FOOTPRINT_MM = 6`(half-Φ),`_mazeThicknessAt` 計算 `dEff = max(0, d - FOOTPRINT)`,等效在 12 mm 圓 footprint 內找「最薄點」。`drawMazeScan` 同步畫 cyan dashed footprint ring 在探頭周圍(Reveal 前)。

102\. 【DA · Gaussian 厚度漸變】v58 §87 CL 厚度 binary(normal / thin)邊緣突變。v59 改 `thickness = NORMAL - (NORMAL - THIN) · exp(-1.5 · (dEff/r)²)`,中心全 thin、邊緣平滑回 normal。Reveal 視覺同步:每個 spot 從 hard-edge circle 改 `createRadialGradient` 漸層 + dashed 1r outline 標稱半徑。`_mazeIsThin()` helper:thickness < (NORMAL+THIN)/2 才標「THIN SPOT」。

103\. 【DB · Couplant Q 影響 Maze 振幅】v58 §87 CL Maze A-scan 完全不理 `couplantQ` slider。v59 `drawMazeAscan` T peak amp、BW peak amp 各乘 `qFactor = couplantQ/100`,對齊 CLAUDE.md §12 全 EX 一致;`couplantQ < 70` 時 A-scan 右上跳橘色「⚠ couplant Q X% — echoes attenuated」提示,讓學生意識到「沒擠耦合劑就會 missed thin spot」。



（以下規則 104\~113 由使用者於 2026-05-24 EDT「同意全部（9 條）+ 優化 EX5 波段反映」後納入,對應 v59 三視角自玩產出 DC\~DK + 使用者明示要求 DL。全 10 條 ship 進 v60。）



104\. 【DC · Reveal 後保留 Footprint Ring + Scan Trail】v59 §101 CZ footprint ring 只在 reveal 前顯示,學生回顧自己「探頭蓋過哪些區」就沒了。v60 reveal 後保留 footprint ring(alpha 降到 0.18),並新增 `mazeTrail` 陣列(每 6 frame 記一個 (x,y) 點,上限 400),reveal 時把 trail 畫成 0.30 alpha 的青色折線,讓學生看 coverage gap。

105\. 【DD · Easy Pass Toast 加 Action Chain Hint】v59 §100 CY toast「try Medium」沒明示「點 Medium 自動重生 vs 點 🔄 New maze 同 Easy 再玩」差別。v60 toast 文字延長為「✓ Easy passed (X%) — click Medium ▶ auto-regen at harder size · or 🔄 New maze for another Easy round」,並把顯示時間從 4.2 s 拉到 5.4 s。

106\. 【DE · Maze A-Scan THICKNESS ↔ BW Peak X 關聯】v59 BW peak X 隨厚度移動但學生沒明示對應關係。v60 maze plate 的 THICKNESS readout 後面加 cyan 小字「↔ BW peak @ X.X mm on A-scan」即時更新 X 值;同時 maze A-scan 在 BW peak 下方加 cyan dashed 垂直 guide 標 `Δt ∝ thickness`,視覺串連兩 canvas。

107\. 【DF · Reveal 後 Marker 距離量化 + Missed Spot 標示】v59 §99 CX reveal 後 markers / spots 顏色比對沒量化。v60 reveal 時對每個 marker 算 distance to nearest spot edge:若 ≤ TOL(10 mm)+ r 標綠色「✓ X mm」,否則標紅色「✗ nearest X mm」;同時 spots 沒被任一 marker 覆蓋的標紅色「✗ missed」。教 POD(Probability of Detection)概念。

108\. 【DG · 同 Difficulty Best-Score 追蹤】v59 沒 progression motivation。v60 加 `mazeBestScore = { easy: {hitRate, elapsed}, medium: {...}, hard: {...}, general: {...} }` 存 localStorage(key `ut_maze_best`)。HUD 在 score chip 後新增 `🏆 best 5/5 in 1:23` chip;reveal 後若打破 best(hitRate 嚴格 > 前best,或 hitRate 相等但 elapsed 更短)跳 toast「🏆 New best for X!」並更新 localStorage。

109\. 【DH · FindingsHistory 雙軌 Schema】v59 §99 CX 把 maze entry 塞 findings 欄位語意錯亂(type=difficulty / sp=hits / amp=markers)。v60 每筆 entry 加 `kind: 'findings' | 'maze'`,Findings Sheet History panel 與 exportScanPlan 各自過濾;Maze 走獨立「## Maze Rounds」表(difficulty / hits / total / markers / elapsed 五欄)。Findings Sheet History panel 加 sub-tab「Findings · Maze」切換。

110\. 【DI · General Thinning 第 4 難度模式】v59 thin spot 都是 discrete pits,沒模擬「整片漸薄」(tank floor 集水區大面積腐蝕)。v60 加 4th difficulty button「🌊 General」,`MAZE_DIFFICULTIES.general = { count:60, radiusMm:5.5, pattern:'overlap' }`,生成 60 個小半徑 spots 隨機重疊,經 DA Gaussian 疊加後等效成連續漸薄地形。Reveal 視覺退化為 50% alpha heatmap 而非 discrete circles。

111\. 【DJ · Surface Roughness → A-scan Noise + Peak 變寬】真實 corrosion 不只變薄還粗糙化。v60 在 `_mazeThicknessAt` 同時回傳 `{ thickness, roughness ∈ [0,1] }`,roughness = thinAmount(中心最粗糙,邊緣回零)。drawMazeAscan 把 BW peak 三角從固定寬度 5 px 改成 `5 + roughness*10` px,並在 BW peak 上方加 roughness*0.18 高度的 random A-scan noise jitter。

112\. 【DK · Single / Dual Element Probe Toggle】v59 footprint 6 mm 是 1/2" 單晶探頭預設,實務 corrosion mapping 常用 dual-element。v60 maze-controls 加 `Single ↔ Dual` toggle 按鈕,`mazeProbeType` 切「single」(默認, footprint 6 mm, T amp 1.0, T-BW dead zone 短畫面顯示)或「dual」(footprint 7.5 mm, T amp 0.5 — 發收分離降 ringing, BW peak 較易讀)。HUD 多顯示 probe type chip。

113\. 【DL · EX5 BW 波段交叉淡化（使用者明示要求 2026-05-24 EDT）】CLAUDE.md §1 規定 BW「線性比例衰減」、嚴禁開關式突兀消失。v59 §102 DA 雖讓 BW peak X 平滑移動,但仍是「單峰移位」(只有 X 變,amplitude 固定),學生看到的視覺仍像「峰會直接位移」而非「正常 BW 淡出 + 薄處 BW 淡入」。v60 改成 **dual-peak crossfade**:`drawMazeAscan` 同時畫兩個 BW peak — `BW_normal` 在 X(NORMAL_MM)、amp = (1 − thinAmount) × 0.85 × qFactor;`BW_thin` 在 X(THIN_MM)、amp = thinAmount × 0.85 × qFactor。footprint 內 thinAmount 從 0 → 1 平滑變化時,兩峰自然 crossfade,無瞬斷、無靜止,符合「真實 BW 看到 partial coverage 兩段路徑」物理。



（以下規則 114\~122 由使用者於 2026-05-24 EDT「同意全部（9 條）」後納入,對應 v60 三視角自玩產出 DM\~DU。全 9 條 ship 進 v61。）



114\. 【DM · Dual-peak Partial Coverage 提示】v60 §113 DL 雙峰 transition 時學生不知道為什麼會看到兩個 BW peak。v61 在 `drawMazeAscan` 偵測 `0.2 < thinAmount < 0.8` 時 A-scan 底部加 small text 「partial footprint coverage — both BW echoes visible」,thinAmount 接近 0 或 1 時隱藏。

115\. 【DN · 🏆 Best Score Delta】v60 §108 DG best chip 純文字。v61 timer 旁加 cyan/green delta `+12s` 或 `−5s` vs best(只在當前 difficulty 有 best 時顯示);reveal 後 score chip 加同款 delta。

116\. 【DO · General Mode Critical Patches 標示】v60 §110 DI general reveal 是 heatmap 沒最薄點量化。v61 general reveal 時用 footprint 採樣掃 plate,找 thickness < 8 mm 的 critical patches,用紅色虛線圓標示;同時提供「真實最薄區」hits / total 評分輔助 markers 評估。

117\. 【DP · Scan Trail Dot Cloud】v60 §104 DC polyline 順序連點會穿越未走過區。v61 改為每個 trail 點畫 2 px alpha 0.4 cyan dot,避免 false coverage 視覺誤導。

118\. 【DQ · Findings Sub-tab CSS 集中】v60 §109 DH 用 inline JS style switch active tab,小螢幕對比弱。v61 改 `.fs-tab` + `.fs-tab.active` CSS class,active tab 用 `var(--accent)` outline。

119\. 【DR · Maze Avg Stats 累積】v60 只有 single best 沒平均水準。v61 `mazeBestScore[difficulty]` 結構擴充加 `rounds / totalHits / totalTotal / totalElapsed`,reveal 時累積,HUD 加 `📊 avg 65%` 第二 chip。

120\. 【DS · Dual Mode Short Near-Zone】v60 §112 DK dual mode 只動 T peak amp 沒動 dead zone 長度。v61 dual mode `drawMazeAscan` T peak X 從 0.04W 縮到 0.025W,BW 可視範圍從 X(0.10W) 延到 X(0.06W),薄板 6.35 mm BW 更清晰。

121\. 【DT · Per-Spot Roughness Factor】v60 §111 DJ roughness = thinAmount 過於 deterministic。v61 `generateMaze` 給每個 spot 加 `roughnessFactor = 0.3 + Math.random()*0.9` (range 0.3~1.2),`_mazeProbeFootprint` 改回傳「contribution-weighted roughness」= 最近 spot 的 roughnessFactor × thinAmount。

122\. 【DU · Maze BW Multi-Bounce(Leg-2/3)】v60 maze A-scan 只畫 leg-1 BW peak。實際薄板 5 MHz 多次回波明顯。v61 dual-peak 各自疊加 leg-2(X×2, amp×0.55)、leg-3(X×3, amp×0.30)子峰,dimmer alpha;peak X 超出 AXIS_MAX_MM 時自動裁掉。學生可以練「BW peak 間距 = 厚度」實務技巧。



（以下規則 123\~131 由使用者於 2026-05-25 EDT「同意全部（9 條）」後納入,對應 v61 三視角自玩產出 DV\~ED。全 9 條 ship 進 v62。）



123\. 【DV · L2/L3 Multi-Bounce Sub-Toggle】v61 §122 DU L2/L3 子峰一直畫,BASIC 學生跟主 BW peak 混淆 information overload。v62 maze-controls 加 sub-toggle 按鈕「L2/L3 ON ↔ OFF」,狀態存 `mazeMultiBounceOn`(localStorage `ut_maze_multibounce`);ADVANCED 模式進入時預設 ON,BASIC 模式預設 OFF。`drawMazeAscan` 只在 `mazeMultiBounceOn` 為 true 時畫 L2/L3。

124\. 【DW · Critical Patches 推廣至所有 Difficulty】v61 §116 DO critical patches 只在 general reveal 標示。v62 推廣到 Easy/Medium/Hard:reveal 時對每個 spot 用 footprint 採樣計算 `dEff < 8 mm` 中心範圍,以紅色虛線小圓(r ≤ spot.radiusMm × 0.5)標示「最薄核心區」。學生看到自己 marker 落在 spot 哪個 quadrant,理解「marker 對齊精度 ≠ spot 範圍內就好」。

125\. 【DX · Best Delta Percentage】v61 §115 DN delta `+12s` 沒 baseline 感。v62 同位置加百分比版本:`+24%` (delta / best.elapsed × 100),與秒數並列顯示「+12s (+24%)」,讓學生對「12 秒到底是多」有比例感。負值(快於 best)同樣顯示 `−5s (−10%)`。

126\. 【DY · Findings History Maze Sparkline】v61 §119 DR avg stats 只 HUD 顯示。v62 Findings Sheet History panel 的 Maze sub-tab 頂部加 SVG sparkline:取當前 difficulty 最近 10 rounds 的 hitRate(0~1),畫 40 × 20 px mini line chart,線色 `var(--cyan)`,起終點各加小圓點。少於 2 rounds 時隱藏。

127\. 【DZ · Findings Sub-tab sessionStorage 持久化】v61 §118 DQ sub-tab 切換沒在 collapse 後保留狀態。v62 sub-tab 切換時寫 `sessionStorage._fsHistoryTab`('findings' / 'maze'),Findings Sheet 重新展開時依此恢復 active tab。session 結束(關分頁)才重置回預設。

128\. 【EA · `.mz-stat` CSS 統一】v61 §118 DQ 雖統一 `.fs-tab`,但 maze HUD 的 chip(timer / marker / score / best / avg / delta)仍各自 inline style。v62 加 `.mz-stat` base class + modifier(`.mz-stat--best`、`.mz-stat--avg`、`.mz-stat--delta-pos`、`.mz-stat--delta-neg`),HUD chip 統一用 class 取代 inline color/border。視覺語彙集中,小螢幕 contrast 更穩定。

129\. 【EB · Strict Mode (TOL 5 mm)】v61 §87 CL marker hit TOL 固定 10 mm。實務 corrosion mapping 要求 marker 對齊到 spot 中心 ±5 mm。v62 maze-controls 加「🎯 Strict」toggle(預設 OFF):勾起來後 `MAZE_HIT_TOL_MM` 從 10 mm → 5 mm,reveal 評分嚴格化;HUD 加紅色 chip「STRICT」標示。給 Level 2 學生加分挑戰。狀態存 `mazeStrictMode`(localStorage `ut_maze_strict`)。

130\. 【EC · Dual Probe V-path Bias】v61 §112 DK dual mode footprint + dead zone 改了,但厚度量測沒模擬「dual probe roof angle」造成的 V-path:實際 dual 探頭兩晶片有 5\~10° 內傾,beam 在板內走 V 形而非直線,測得厚度系統偏高 ~2%。v62 dual mode 下 `drawMazeAscan` BW peak X(thickness 對應)乘 `DUAL_VPATH_BIAS = 1.02`,使 dual 厚度讀值比 single 偏 ~2%。HUD 加小字提示「dual reads +2% (V-path)」教學「換 probe type 必須重校驗」實務原則。

131\. 【ED · Multi-Bounce L2/L3 Footprint Shifted Sampling】v61 §122 DU L2/L3 只是主峰 X×2/X×3 + amp×0.55/×0.30,沒考慮 V-path 路徑沿線可能再碰到別的 thin spot。實際薄板 multi-bounce 會掃到不同位置(beam 散射 + horizontal spread)。v62 給 L2/L3 各自做一次 footprint 採樣:L2 footprint 中心向 +X 方向位移 `0.5 × thickness`,L3 位移 `1.0 × thickness`,各算出自己的 thinAmount → 決定 L2/L3 各自的 dual-peak crossfade 比例。教 V-path 物理 + horizontal beam spread。



（以下規則 132\~149 由使用者於 2026-05-25 EDT「同意全部（18 條）」後納入,對應 v62 **六視角**自玩產出 EE\~EV。學生 / 教授 / NDT 專家 / 代碼程式員 / 程式開發 / 程式介面優化 各 3 條,全 18 條 ship 進 v63。）



132\. 【EE · L2/L3 Toggle 3-State Visual Distinction（學生視角）】v62 §123 DV L2/L3 sub-toggle 文字只 ON/OFF,沒區分「follow mode (null)」vs「manual override」兩種狀態。v63 button 加小角標:follow mode 顯示「ON · auto」/「OFF · auto」灰色字,manual override 顯示「ON · lock」/「OFF · lock」橘色字,讓 3-state cycle (follow → ON → OFF → follow) 語意一眼看出。

133\. 【EF · Critical Patches 改橘虛線避撞 Missed 紅（學生視角）】v62 §124 DW critical patches 紅虛線小圓跟 §107 DF ✗ missed 標籤同色 rgba(255,90,90)。當 missed spot 剛好在 critical core 上,兩個紅元素疊在一起學生分不清。v63 critical core 改成「橘色虛線」rgba(255,165,0) 跟 marker 同色系,跟 missed 紅色明確區隔(missed = miss,critical = high-risk thinnest area)。

134\. 【EG · Strict Mode 中途切換解釋（學生視角）】v62 §129 EB strict toggle 切換時已 drop 的 markers 評分基準變了,學生不知道「之前 markers 是用哪個 TOL 算的」。v63 `toggleMazeStrict` 內若 `mazeMarkers.length > 0 && !mazeRevealed`,toast 補充「N 個既有 marker 將以新 TOL 評分」;同時 `revealMaze` toast 補「scored with TOL X mm」。

135\. 【EH · Best Delta 百分點 Baseline（教授視角）】v62 §125 DX「+24% / +12s (+24%)」hit-rate 沒給絕對百分點 baseline。學生看「+24%」不知是「20%→44%」還是「70%→94%」。v63 改成「+24%pts (70% → 94%)」提供「從哪到哪」資訊。timer 部分維持 `+12s (+24%)` 不變。

136\. 【EI · Sparkline Midline + Higher-Better Caption（教授視角）】v62 §126 DY sparkline 只有 polyline 沒 y-axis 參考。學生看到線往上走以為是壞(因 chart 越下 y 越小)。v63 sparkline 加極淺 50% mid-line gridline(hitRate = 0.5 水平虛線, gray 20% alpha)+ 線旁加小字「higher = better」。

137\. 【EJ · Mode Switch L2/L3 Visibility Toast（教授視角）】v62 §123 DV mode 切 BASIC↔ADVANCED 時 L2/L3 視覺立刻變(follow-mode 下),但沒提示「為什麼 A-scan 突然多/少子峰」。v63 `toggleMode` 在 follow-mode 且 EX5 啟動下,加 1.8s toast「Mode → ADVANCED · L2/L3 multi-bounce now visible (follow-mode)」對應的反向。

138\. 【EK · Dual Roof Angle Selector 5/7/10°（NDT 專家視角）】v62 §130 EC `DUAL_VPATH_BIAS = 1.02` hard-coded(等效 ~7° roof angle)。實務 dual 探頭 roof 角 5° (SE) 到 10° (SDR) 都有。v63 dual mode 加 roof-angle sub-selector「5° / 7° / 10°」三 preset,對應 bias = 1.011 / 1.020 / 1.040;HUD 顯示「dual roof X° · reads +Y%」教學「換 dual probe 不只重校驗 c,還要重校驗 V-path 偏差」。

139\. 【EL · Footprint Trail-Direction Shifted Sampling（NDT 專家視角）】v62 §131 ED footprint shift 只往 +X 方向。實務 beam wander 跟探頭運動方向相關。v63 用 mazeTrail 最近 2 點推算 probe 移動方向 vector,L2/L3 shift 沿此方向(往運動 anti-direction 偏移,模擬 trailing edge)。靜止時 fallback 用 +X。

140\. 【EM · Proportional Strict TOL by Spot Size（NDT 專家視角）】v62 §129 EB strict TOL 固定 5 mm。實務 ASNT Level 2 alignment 是 `min(5 mm, spot_diameter × 0.3)` — 大 spot (Easy Φ25) 容許 7.5 mm,小 spot (Hard Φ8) 只容許 2.4 mm。v63 改 strict TOL = `Math.max(3, Math.min(5, spot.r_mm * 0.6))`,反映工業標準 proportional 容差。每個 spot 評分各算自己的 TOL,HUD 加註「TOL ∝ Φ」。

141\. 【EN · Spatial Grid Hash 加速 Footprint 採樣（代碼程式員視角）】**Hot-path O(n×m) 性能瑕疵**:`_mazeProbeFootprint(p)` 每呼叫遍歷 ALL spots。General mode reveal 一幀畫面要 sample 約 80×80 = 6400 個座標 × 60 spots = **384,000 distance 計算 / 幀**。低階手機 60fps 預算 ~16ms 輕鬆超標。v63 加 spatial grid hash(20mm × 20mm bucket),每個 footprint 查詢只比對附近 ~3-9 spots,平均 ~50× 加速。`generateMaze` 時 build `mazeSpatialGrid` Map(`Math.floor(x/20)+","+Math.floor(y/20)` → 該 bucket 內 spots 陣列)。

142\. 【EO · Maze Namespace Object（代碼程式員視角）】**全域變數氾濫**:maze 相關 top-level globals 已超過 15 個,污染 window namespace + 增加碰撞風險。v63 重構為 `var maze = { state:{...}, config:{...}, helpers:{...} }` 單一 namespace object,所有 maze 程式碼透過 `maze.state.spots` 等 access,只暴露 toggle 函式到 global 給 `onclick=` 用。實作以**雙寫過渡**降低風險:保留舊 global 名稱作為 `Object.defineProperty` getter/setter proxy 到 `maze.state.*`,直到下一輪重構。

143\. 【EP · revealMaze 職責拆分（代碼程式員視角）】**revealMaze() 100+ 行職責過雜**:單一函式內混 scoring loop / findings history push / best-score 計算 + migration / localStorage persist / new-best toast / easy-pass toast / pulse-glow animation 啟動。v63 拆分:`_computeMazeScore(markers, spots, TOL)` → `_recordMazeRound(score)` → `_updateBestScore(score)` → `_announceBestIfBeat(score, prevBest)` → `_announceEasyPassIfEligible(score)`,各自單一職責 ≤ 30 行。

144\. 【EQ · Inline Smoke Tests（程式開發視角）】**零 inline assertion / smoke test**:HTML 5300+ 行 / 131 條 CLAUDE.md 規則,任何改動都靠人眼 + 多視角 + tunnel 點擊驗證。v63 在 `<script>` 尾加 `runSmokeTests()` 區塊:檢查 `_mazeStrictTol()` 回傳 ∈ {5, 10}(以及 EM 後的 proportional 範圍)、`_mazeFootprintMm()` ∈ {6, 7.5}、`MAZE_DIFFICULTIES.easy.count === 5`、`mazeBestScore` 結構欄位齊全、`DUAL_VPATH_BIAS > 1` 等 ~15 個 assertion。失敗 `console.error` + 紅色頁面 banner 提示 dev mode。Production-safe(本身不影響功能,純檢查)。預設 ON,可用 `?nosmoke` URL param 關閉。

145\. 【ER · CHANGELOG.md 自動產出機制（程式開發視角）】**無 CHANGELOG / version diff 文件**:CLAUDE.md 條列規則但沒有「哪條規則 → 哪個函式 / 哪個 DOM 元素」對應表。v63 ship 流程加 `CHANGELOG.md` 自動產出機制(放 `今日工作區/`):每升版列出 [新增規則 §N..§M] / [修改函式] / [新增 DOM id] / [新增 localStorage key] / [touched files]。Audit 跟 regression 排查的 single source of truth。v63 為第一筆,記錄 18 條 EE-EV 對應到的所有 touch 點。

146\. 【ES · LS_KEYS 集中管理 + safeLS Wrapper（程式開發視角）】**localStorage key 散落無集中管理**:`ut_maze_best` / `ut_maze_strict` / `ut_maze_multibounce` / `ut_ex_completed` / `ut_learn_mode` / `ut_seen_drag_hint` / `ut_more_tools_open` — 7 個 key 散在各處,任一 typo 都 silent fail。v63 集中為 `const LS_KEYS = Object.freeze({ MAZE_BEST: 'ut_maze_best', MAZE_STRICT: 'ut_maze_strict', MAZE_MULTIBOUNCE: 'ut_maze_multibounce', EX_COMPLETED: 'ut_ex_completed', LEARN_MODE: 'ut_learn_mode', SEEN_DRAG_HINT: 'ut_seen_drag_hint', MORE_TOOLS_OPEN: 'ut_more_tools_open', DUAL_ROOF: 'ut_maze_dual_roof' })`,所有 localStorage 存取走 `LS_KEYS.MAZE_BEST`。同時加 `safeLSGet(key, fallback)` / `safeLSSet(key, value)` wrapper 統一 try-catch + JSON parse 處理。

147\. 【ET · Maze-controls Settings Popup（程式介面優化視角）】**窄螢幕擠成 6 行**:現在 5 個 `.mz-group` (Difficulty / Probe / L2/L3 / Strict / Actions) + HUD bar,在 < 500px 螢幕 wrap 成 6 行,操作面板比主畫面還高。v63 把 L2/L3 + Strict + (EM proportional TOL 顯示)+(EK roof angle) 四項收進「⚙ Settings ▾」popup chip(點開展開小面板),主行只留 Difficulty / Probe / Actions / HUD 四 group,窄螢幕從 6 行壓到 3-4 行。popup 用 `<details>` 元素零 JS,outside-click 不自動收(避免誤關)。

148\. 【EU · 視覺重量階梯化(action / select / stat)（程式介面優化視角）】**chip / button 視覺層次不分**:所有 chip 都用 same border-radius (6-7px) + same padding,主操作 (Drop Marker / Reveal) 跟唯讀 readout (📍 N / ⏱ 0:00) 看起來重量等同。v63 設計 token 重排:主操作 `.mz-action-btn` 大圓角 10 px + filled bg + 強 shadow;mode select `.mz-diff-btn` 中圓角 6 px + outline only;stat chip `.mz-stat` 小圓角 3 px + no border + muted color。視覺重量階梯化。

149\. 【EV · Sparkline Contrast + Scale + Linecap（程式介面優化視角）】v62 §126 DY sparkline dark theme 下 `var(--cyan)` 線 + `rgba(0,0,0,0.18)` bg 對比 ~4.5:1(WCAG AA 邊界),小於 40 × 20 px 視角難看清。沒有 baseline / midline / scale,線本身懸空。v63 改:
- bg → `rgba(255,255,255,0.04)` 提升 line ↔ bg 對比
- 加 midline `y = 50%` 虛線 `rgba(255,255,255,0.10)`
- 加左上角小字「100」、左下角「0」當 scale
- 加 `stroke-linecap="round" stroke-linejoin="round"` 視覺更平順
（EI §136 也加 midline,EV 是 EI 的進階強化版,實作時兩條合併到同一段 SVG render code 內共用 midline 邏輯,caption「higher = better」放 sparkline 右側,scale「0/100」放左側,不會打架。）



（以下規則 150\~167 由使用者於 2026-05-27 EDT「同意全部（18 條）」後納入,對應 v63 **六視角**自玩產出 EW\~FN。學生 / 教授 / NDT 專家 / 代碼程式員 / 程式開發 / 程式介面優化 各 3 條,全 18 條 ship 進 v64。）



150\. 【EW · Settings Popup 首次 Pulse 提示（學生視角）】v63 §147 ET ⚙ Settings popup 預設關閉,學生第一次進 EX5 不知道裡面藏 Strict / L2/L3 / Roof 三個重要 toggle。v64 第一次進 EX5(沒摸過 settings)時 summary 加橘色 pulse 動畫 3 次 + 文字補成「⚙ Settings ▾ (3 hidden)」,點開後 pulse 消失並寫 `sessionStorage._fsSettingsSeen=1`。

151\. 【EX · L2/L3 Cycle Title 動態顯示（學生視角）】v63 §132 EE 3-state badge 區分 auto/lock,但 cycle 順序 (follow→ON→OFF→follow) 沒在 UI 任何地方寫出來。v64 button title 補成「Click cycle: follow-mode → ON · lock → OFF · lock → follow-mode (current: X)」,動態反映當前狀態下一步是什麼。

152\. 【EY · Strict Toast TOL 新舊對比（學生視角）】v63 §134 EG strict toggle warn 訊息用「N existing marker will be scored」但沒說明「之前用什麼 TOL、新 TOL 是多少」。v64 toast 文字補成「N marker(s) will be re-scored: TOL old→new (X mm → Y mm). +Easy=more forgiving · −Strict=tighter alignment.」清楚表達誰利誰弊。

153\. 【EZ · Sparkline Best/Avg 參考線（教授視角）】v63 §136 EI sparkline 加了 midline + 「higher = better」 caption,但 sparkline 本身沒標示 best line 也沒標示 avg line。v64 sparkline 加第二條淺青色 horizontal 虛線標 best.hitRate 位置(只在當前 difficulty 有 best 時畫),加第三條淡橘虛線標 avg.hitRate(rounds ≥ 2 才畫)。Tooltip 「best / avg / midline」對應顏色。

154\. 【FA · Score Chip Delta Flex Wrap（教授視角）】v63 §135 EH delta「+24%pts (70%→94%)」是進步,但兩個數字並列 hit-rate / elapsed 仍長到 score chip 換行。v64 改 score chip 用 `display:flex;flex-wrap:wrap;` 並把 hit-rate delta + elapsed delta 各包成獨立 `<span class="mz-delta-chip">`,允許獨立 wrap。同時兩 chip 用左 border 顏色區分:hit=綠/紅、elapsed=黃/灰。

155\. 【FB · Manual Override Mode Toast 強化（教授視角）】v63 §137 EJ mode toast 在 follow-mode 才跳,但學生 manual override 後切 mode 也會被影響(L2/L3 顯示不變,但所有別的 BASIC/ADVANCED 元素都變了)。v64 manual-override 模式下 toggle mode 時加 toast「Mode → X · L2/L3 stays locked Y (manual override)」確認 lock 還在。

156\. 【FC · Roof Bias Disclaimer 與來源 attribute（NDT 專家視角）】v63 §138 EK roof angle bias 1.011/1.020/1.040 包含 cell-pad delay,跟純幾何 V-path 1.0038/1.0075/1.0152 差約一倍。v64 加 disclaimer text 在 Settings popup「Bias values include cell-pad delay; pure-geometry V-path is ~1/2 of this」,並把實際 hard-coded 值的依據(Olympus Panametrics D790 handbook table 4-1)寫進 title attribute。

157\. 【FD · Trail-Direction Persistent Fallback（NDT 專家視角）】v63 §139 EL trail-direction shift 在 probe 完全靜止時 fallback +X,但 probe 緩慢移動(< 0.5 mm/frame) 時也 fallback +X,造成「慢拖時 L2/L3 雙峰位置永遠跟快拖一致」失真。v64 改 fallback 條件:速度 < 0.5 mm/frame 時用 `direction = last_non_fallback_dir`(persistent vector),只有頭一次靜止才用 +X。需要新 global `_mazeLastDir`。

158\. 【FE · Non-Strict TOL 比例 cap 顯式化（NDT 專家視角）】v63 §140 EM 比例 TOL `Math.max(3, Math.min(5, r * 0.6))` 沒考慮 strict OFF 模式下實務的「fixed 10 mm」也應該 cap by spot.r_mm。v64 改 non-strict 邏輯為 `min(10, r * 2.5)` — Easy 12.5 mm spot 容許 10 mm(同舊行為);Hard 4 mm spot 容許 10 mm(沒變,4 × 2.5 = 10);主要是把「cap 行為」顯式化,避免未來新增 Φ < 4 mm 難度時 silent fail。

159\. 【FF · Spatial Grid 預先 build 拿掉 fallback 分支（代碼程式員視角）】v63 §141 EN spatial grid 在 generateMaze 結束時 build,但 `_mazeProbeFootprint` 偵測 grid 為 null 時 fallback 到 full scan。v64 把 init 路徑也預先 build 一次空 grid(`mazeSpatialGrid = new Map()`),拿掉 footprint 內的 if/else 判斷,熱迴圈少一個 branch。

160\. 【FG · maze namespace seal + iterator helper（代碼程式員視角）】v63 §142 EO 用 `Object.defineProperty` getter/setter proxy 到 window 全域,但語意上 maze.state 是「視窗」非「資料」。v64 提供 namespace iterator helper:`mazeStateKeys()` 回傳全部 state key 陣列,並加 console.log warning 若有人嘗試 `maze.state.somethingNew = x`(via `defineProperty` 把整個 maze.state 設為 sealed object)。

161\. 【FH · `_formatHitRateDelta` / `_formatElapsedDelta` 拆出（代碼程式員視角）】v63 §143 EP `_renderRevealedScore` 內計算 prevPct/nowPct/dHit 等 7 個區域變數混在 one-line 字串組裝,可讀性低。v64 拆出 `_formatHitRateDelta(score, prev)` 與 `_formatElapsedDelta(score, prev)` 兩個 pure function,各回傳 string,`_renderRevealedScore` 變成兩行字串拼接。test 與 audit 點都更小。

162\. 【FI · Smoke Tests 可重跑 + dev mode 週期跑（程式開發視角）】v63 §144 EQ runSmokeTests 在頁面載入時跑一次。v64 加全域 `window.runSmokeTests()` 可在 DevTools console 隨時呼叫,並加 `setInterval` 每 30 秒在 dev mode (URL `?dev`)再跑一次。Production (沒 ?dev) 仍只跑載入一次。

163\. 【FJ · `__VERSION_DELTA__` 與 CHANGELOG 自動 audit（程式開發視角）】v63 §145 ER CHANGELOG.md 是手寫 markdown,沒有「自動驗證 §N..§M ↔ 程式碼 grep 命中」的機制。v64 加 inline `__VERSION_DELTA__` JS object,enumerate 本版新加的所有 rule code (EW..FN),smoke test 對每條 code grep `document.documentElement.innerHTML` 是否出現該 rule code(comment 形式 `§N XX —`),不出現就 banner 警告「rule X 未在程式碼中標記」。

164\. 【FK · safeLSGet 型別參數強制宣告（程式開發視角）】v63 §146 ES `safeLSGet` 字串型值跟 JSON 型值靠首字元 `{` / `[` 區分,但 `MAZE_DUAL_ROOF` 存的 '5'/'7'/'10' 全是純數字字串,首字元是數字也是合法 JSON(會被 JSON.parse 成 number)。v64 改 safeLSGet 第三參數 `mode: 'string' | 'json'` 強制宣告型別,呼叫端必須明示。預設 'string'(向前相容);LS_KEYS.MAZE_BEST 等顯式傳 'json'。

165\. 【FL · Settings Popup 浮動定位 + 陰影 + z-index（程式介面優化視角）】v63 §147 ET Settings popup 用 `<details>` 收 3 個 group,但展開後 `.mz-settings-body` 跟主行 .mz-group 視覺脫節,窄螢幕上 popup body 寬度跟 summary chip 寬度一致,完全不夠放 3 個 group。v64 popup body 改為 `position:absolute; top:100%; left:0; min-width:280px;` 浮出在 summary 下方,並加陰影 box-shadow:0 4px 12px rgba(0,0,0,0.4) 跟頁面分層;同時加 z-index:50 蓋過下方 canvas。

166\. 【FM · `.mz-diff-btn` 子類別色相區隔(diff/probe/toggle)（程式介面優化視角）】v63 §148 EU 視覺重量階梯已分,但 .mz-diff-btn 的 `active` 狀態 cyan 淡色同時被 Probe Single/Dual / Difficulty / L2/L3 共用,點哪個都看不出哪行是「probe 行」哪行是「mode 行」。v64 加 `.mz-diff-btn` 變體:`.mz-diff-btn--diff.active` 用 cyan、`.mz-diff-btn--probe.active` 用 purple、`.mz-diff-btn--toggle.active` 用 orange,類別語意 + 色相區隔。

167\. 【FN · Sparkline Scale Label 高 DPI 強化（程式介面優化視角）】v63 §149 EV sparkline scale label「100/0」用 hard-coded `font-size="5"` SVG,但 dark theme 用 `rgba(255,255,255,0.50)` 在某些螢幕(OLED 過高對比)會被截抹角。同時 5 px 字級在高 DPI 螢幕看不清。v64 改 font-size 6 px + 加 SVG `<rect>` background 對比層(寬高跟字面齊,fill:rgba(0,0,0,0.4)),確保所有螢幕都讀得到「100」/「0」。



（以下規則 168\~185 由使用者於 2026-05-28 EDT「同意全部（18 條）」後納入,對應 v64 **六視角**自玩產出 FO\~GF。學生 / 教授 / NDT 專家 / 代碼程式員 / 程式開發 / 程式介面優化 各 3 條,全 18 條 ship 進 v65。）



168\. 【FO · Settings Pulse 6s 自動消除（學生視角）】v64 §150 EW 的 ⚙ Settings pulse 只在 `<details>` toggle 時清 flag,學生沒展開就滑去動別的,pulse 跑完但 `_fsSettingsSeen` 仍空,下次進 EX5 又 pulse。v65 加 6s setTimeout:首次進 EX5 起 6 秒內沒展開就強寫 `_fsSettingsSeen='1'`、移除 pulse、還原 summary 文字,不再重複提醒。

169\. 【FP · L2/L3 (?) Chip 點出 3-state Cycle（學生視角）】v64 §151 EX 的 cycle 順序只在桌機 hover title 可見,手機(EX5 主市場現場 iPad)看不到。v65 在 L2/L3 button 旁加 8px muted `(?)` chip,點下 toast 顯示「follow-mode → ON·lock → OFF·lock → follow-mode... (tap here to see this again)」。

170\. 【FQ · Strict Toast 具體化（學生視角）】v64 §152 EY toast「−Strict=tighter alignment」的「alignment」對未受訓學生抽象。v65 改具體「+Easy = markers may sit farther from the spot centre / −Strict = markers must sit closer to the spot centre」;長 toast 3500→2800ms。

171\. 【FR · Sparkline Best/Avg 命名 + Alpha（教授視角）】v64 §153 EZ best/avg 參考線 alpha 0.55/0.50 難辨,且學生不知哪條是 best/avg。v65 alpha 拉到 0.70/0.65,並在右側 caption(已有「higher = better」)下追加「— best」(青)/「— avg」(橘)小字對應虛線色。

172\. 【FS · Delta Chip Axis Title + Emoji（教授視角）】v64 §154 FA delta sub-chips 無 axis 標籤。v65 每個 mz-delta-chip 加 title(hit-rate Δ / elapsed Δ vs best)+ emoji prefix 🎯 hit / ⏱ elapsed 區隔軸別。

173\. 【FT · Manual-Override Toast 解鎖提示（教授視角）】v64 §155 FB toast「L2/L3 stays locked Y」沒說怎麼解 lock。v65 補「...(manual override · click L2/L3 again to cycle back to follow-mode)」;toast 1800→2400ms。

174\. 【FU · Roof Disclaimer 綁定 Roof Row（NDT 專家視角）】v64 §156 FC roof bias disclaimer 在 popup 底部 italic 小字無分隔,易誤以為屬 Strict toggle。v65 上加 `<hr dashed>` + 灰底 padding,語意綁 Roof row。

175\. 【FV · _mazeLastDir Null 初始 + 持久方向（NDT 專家視角）】v64 §157 FD `_mazeLastDir` 初始 `{dx:1,dy:0}`,第一個 slow frame 回 +X dummy 汙染 L2/L3 footprint shift。v65 改初始 `null`:fallback `_mazeLastDir || {dx:1,dy:0}`,slow frame 用上次有效方向(持久),只有從未測得時才 +X。

176\. 【FW · Non-Strict Cap 可觀察（NDT 專家視角）】v64 §158 FE non-strict TOL `min(10, r·2.5)` cap 對現有難度都=10mm,reveal toast 永遠「10 mm」看不出 cap。v65 reveal toast non-strict 下算各 spot 實際 TOL,min<9.95(Φ<8mm)則顯示「X mm (cap = spot Φ × 2.5)」。smoke test r=2mm→5 已存。

177\. 【FX · Spatial Grid Map Invariant（代碼程式員視角）】v64 §159 FF `mazeSpatialGrid` 永遠 non-null Map 但可 empty,語意未明示。v65 宣告處加 JSDoc invariant 註解(ALWAYS a Map; empty ⇒ no spots; 只 _rebuildMazeSpatialGrid() 重指派);smoke `instanceof Map` 已存。

178\. 【FY · maze.state Proxy Set-Trap（代碼程式員視角）】v64 §160 FG `Object.seal(maze.state)` 在 sloppy mode 未知 key 寫入 silent fail。v65 seal 後再包 Proxy:`set` trap 對非 MAZE_STATE_KEYS 的 key `console.warn` + return false;`try/catch` + `typeof Proxy` 守衛舊瀏覽器;seal 保留(smoke `Object.isSealed` 仍綠)。

179\. 【FZ · Format Helper 輸出斷言（代碼程式員視角）】v64 §161 FH 兩 format helper smoke 只測 typeof。v65 加 3 條輸出斷言覆蓋正/負/零 delta:`_formatHitRateDelta({0.5},{0.4})==='+10%pts (40% → 50%)'`、`({0.3},{0.5}).charAt(0)==='-'`、`({0.5},{0.5})==='+0%pts (50% → 50%)'`。

180\. 【GA · Smoke 可見性 Gate（程式開發視角）】v64 §162 FI dev-mode `setInterval(runSmokeTests,30000)` 背景 tab 也跑,浪費 CPU + 可能 false fail。v65 加 `document.visibilityState==='visible'` gate 只前景跑;`visibilitychange` 切回前景補跑一次。

181\. 【GB · Rule Audit Word-Boundary 正則（程式開發視角）】v64 §163 FJ rule code audit 用 `indexOf(code+' —')` 易 false neg/pos(如 'EW' 在 'newWebSocket')。v65 改 `new RegExp('\\b'+code+'\\b\\s*[·—]')` word-boundary 精準,每條 code 須以「§N CODE ·」或「CODE —」tag 出現。

182\. 【GC · safeLSGet Mode 顯式宣告（程式開發視角）】v64 §164 FK `safeLSGet` mode 可省略走 auto-detect。v65 mode===undefined 時 dev-mode(?dev)`console.debug` 警告;6 個呼叫端全補顯式 mode(MAZE_BEST / EX_COMPLETED='json',MAZE_MULTIBOUNCE/STRICT/DUAL_ROOF/MORE_TOOLS_OPEN/LEARN_MODE='string')。**注意 EX_COMPLETED 存陣列必須 'json',提案原寫「其餘全 string」會壞,已修正。**

183\. 【GD · Settings Popup 寬度 + Backdrop Outside-Click（程式介面優化視角）】v64 §165 FL popup `position:absolute` 在窄手機(<320px)超右界,且 `<details>` 點外不自動 close。v65 加 `max-width:calc(100vw-24px)`;init 建透明 `.mz-settings-backdrop`(fixed inset:0, z-49),popup open 顯示、點 backdrop(popup 外)collapse `<details>`。

184\. 【GE · .mz-diff-btn 形狀 Icon（程式介面優化視角）】v64 §166 FM 的 4 色相變體對色盲無區別。v65 加 `::before` 形狀 icon 第二維度:diff ◇/probe ⊙/toggle ☐/roof △,active 變實心 ◆/⊚/■/▲。

185\. 【GF · Sparkline Scale Label 左 Gutter（程式介面優化視角）】v64 §167 FN 的「100/0」label(x=1.5)與 polyline 起點圓點(pad=1.5)重疊。v65 viewBox「0 0 40 20」→「-12 0 52 20」、width +12,label 移到 -12~0 左 gutter(text-anchor=end, x=-1.5)+ 保留 dark backing rect,polyline/ref lines 仍在 0~40,不打架。



（以下規則 186\~203 由使用者於 2026-05-29 EDT「同意全部（A 區 18 條）」後納入,對應 v65 **六視角**自玩產出 GG\~GX。學生 / 教授 / NDT 專家 / 代碼程式員 / 程式開發 / 程式介面優化 各 3 條,全 18 條 ship 進 v66。）



186\. 【GG · Strict / Roof (?) Chip 一致性（學生視角）】v65 §169 FP 只給 L2/L3 button 加了 `(?)` chip,同一 ⚙ popup 裡的 Strict 與 Roof toggle 一樣有非顯而易見行為(TOL 數值、roof bias),卻沒對應說明。v66 給 Strict / Roof 各補一個同款 8px muted `(?)` chip,點下 toast 解釋該 toggle 作用,保持三者一致(Strict:「marker 命中容差 mm;ON 更嚴格」;Roof:「dual 探頭內傾角造成 V-path 厚度偏高 %」)。

187\. 【GH · Strict 按鈕 Inline TOL 數值（學生視角）】v65 §170 FQ 把 strict toast 文字具體化,但 Strict 按鈕本身仍只顯示「🎯 Strict ON/OFF」,冷看不知容差幾 mm,關掉 toast 後失去資訊。v66 在按鈕加 inline 數值:OFF 顯示「🎯 Strict (≤10 mm)」、ON 顯示「🎯 Strict (≤5 mm)」(EM §140 比例 TOL 時顯示「∝Φ」)。讓容差常駐可見。

188\. 【GI · Settings Backdrop 極淡 Dim + Modal 可感知（學生視角）】v65 §183 GD 的 backdrop 完全透明(`background:transparent`),學生看不出 popup 開著、點外面會關。v66 給 backdrop 一個極淡 dim(`rgba(0,0,0,0.12)`)讓 modal 狀態可感知。與 GX 同源:backdrop 只攔「popup 外的 UI 點擊」用於關閉,但不阻斷 canvas 拖曳(見 §203 GX)。

189\. 【GJ · Sparkline 固定 Pass 線（教授視角）】v65 §171 FR 的 best/avg 參考線只在「已有 best 紀錄」時才畫。第一次玩的學生(無 best)看到的 sparkline 沒有任何參考基準。v66 加一條固定教學 pass 線(hitRate = 0.8 水平虛線,綠,標「pass ≥80%」),即使零紀錄也有目標可對。與 best/avg 線共用同段 SVG render 邏輯。

190\. 【GK · Elapsed Delta Chip 方向字（教授視角）】v65 §172 FS 的 elapsed delta chip(⏱)顯示「+12s (+24%)」,但「+」對時間是「變慢=變差」,方向跟 hit-rate 的「+=變好」相反,學生易混淆。v66 在 ⏱ chip 加明確方向字「(slower)」/「(faster)」(或箭頭),消除正負號的語意衝突;顏色(快=綠)維持。

191\. 【GL · 常駐 attempts/avg HUD Chip（教授視角）】EX5 累積表現目前藏在摺疊的 Findings History。教授希望學生隨時看到本 session 表現。v66 在 maze HUD 常駐一個極簡「attempts: N · avg X%」chip(資料已存在 `mazeBestScore[difficulty].rounds / totalHits / totalTotal`),不必展開 panel 就能自評學習曲線。用既有 `.mz-stat` class。

192\. 【GM · 探頭靜止 → L2/L3 直下取樣（NDT 專家視角）】v65 §175 FV 讓 L2/L3 footprint shift 沿持久移動方向。但探頭靜止細看某 spot 時,持久方向仍是上次橫向 vector — 真實多次回波在定點是沿板厚走直下 V-path,不是橫向漂移。v66 加判斷:trail 靜止(最近數 frame 無位移,速度 < 0.5 mm/frame 持續)時 L2/L3 改採直下取樣(同一 (x,y) 更深等效路徑,shift = 0),只有移動中才用 trail 方向橫移,更貼近物理。

193\. 【GN · Non-Strict Cap 真正可演示 / 教學化（NDT 專家視角）】v65 §176 FW 的 non-strict cap `min(10, r·2.5)` 只在 r<4 mm 才 <10 觸發,而現有四難度最小 r=4(Hard)→ 剛好 10,cap 永遠不 bite,FW toast 實務看不到 = dead feature。v66 把 cap 文案改成「教學說明」而非只在觸發時顯示:在 ⚙ Settings popup TOL 區常駐一行 muted note「Non-strict TOL = min(10 mm, spot Φ × 2.5) — caps forgiveness on small spots」,讓學生不必觸發就理解 cap 邏輯。(不新增 Φ<8mm 難度,避免動到難度平衡。)

194\. 【GO · 6 dB Drop Sizing Beam-Width 警告（NDT 專家視角)〔關聯 RT-1〕】sim 的 6 dB drop sizing 工具(§38 AI / §85 CJ)目前沒有「缺陷小於聲束時,6dB 法量到的是聲束寬度而非缺陷尺寸」的警告(Level 2 必教,Vault `[[ut-6db-drop-sizing]]`)。v66 在 6dB 工具偵測到反射體 < 估計 beam width 時跳 disclaimer「⚠ reflector smaller than beam — 6 dB drop measures beam width, not flaw size; use tip-diffraction / DGS」。beam width 用近場/擴散角估算(§13 sinθ = 1.08λ/D)。

195\. 【GP · maze.state Proxy 雙層轉發 Perf 護欄（代碼程式員視角）】v65 §178 FY 把 `maze.state` 包進 Proxy,而 target 本身已是 `_defineMazeProxy` 的 accessor(轉發到 window 全域),`maze.state.mazeSpots` 讀取走 Proxy → accessor getter → window 雙層轉發,而 drawMazeScan 在 60fps 熱迴圈頻繁讀 state。v66 加護欄:(a) smoke 確認有效 key 寫入(`maze.state.X = v`)仍正確穿透 window global;(b) drawMazeScan / drawMazeAscan 熱路徑用 frame-start 局部快取(`var spots = maze.state.mazeSpots;` 等)避免迴圈內重複穿透。

196\. 【GQ · Rule-Code Audit 結果快取（代碼程式員視角）】v65 §181 GB 的 audit 對 `document.documentElement.innerHTML` 跑正則 — innerHTML 會整頁重序列化(大字串),而 §180 GA 讓 dev-mode 每 30s 重跑 → 每次重序列化整頁。HTML 不變、audit 結果恆定。v66 把 rule-code audit 結果算一次快取(`_ruleAuditCached`),後續 re-run 跳過,只重跑會變動的 runtime 斷言。

197\. 【GR · safeSSGet 對齊 safeLSGet（代碼程式員視角）】v65 §182 GC 給 `safeLSGet` 加了顯式 mode,但姊妹函式 `safeSSGet`(sessionStorage)沒同等待遇。目前 sessionStorage 值都是字串(無 JSON),但缺乏明示。v66 對齊:在 `safeSSGet` 註解明確聲明「sessionStorage values are always strings — no JSON path by design」(若已有 mode 參數則加顯式宣告),避免未來誤用。

198\. 【GS · ?smoke=verbose 逐條 Log（程式開發視角）】smoke test 已達 ~30 條斷言,失敗時紅 banner 只列 name、細節在 console.error,triage 要逐條對。v66 加 `?smoke=verbose` URL param:逐條 `console.log` pass/fail + 期望/實際值,加速排查;預設(無 verbose)維持安靜只報失敗。

199\. 【GT · Formatter 斷言改結構性質（程式開發視角）】v65 §179 FZ 的 formatter 輸出斷言把期望字串寫死(含箭頭「→」)。日後 formatter 改箭頭字元,斷言會以難懂方式失敗。v66 改為斷言結構性質(`startsWith('+')`、`contains('%pts')`、含兩個百分比數),或把箭頭抽成單一常數供 formatter 與 test 共用,降低脆性。

200\. 【GU · Smoke 斷言 ruleCodes.length === 18（程式開發視角）】`__VERSION_DELTA__.ruleCodes`(本版 GG~GX)是手動維護,必須與 CLAUDE.md §186-203 數量 + comment tags 一致。GB 只 audit「comment 存在」,沒 audit「數量對」。v66 加 smoke 斷言 `__VERSION_DELTA__.ruleCodes.length === 18`,避免手動清單漂移。

201\. 【GV · Difficulty Icon 只在 Active 顯示（程式介面優化視角）】v65 §184 GE 的 shape icon(◇⊙☐△)加在所有 .mz-diff-btn,包括 4 個 Difficulty 按鈕(Easy/Medium/Hard/General 都是 `--diff` → 全顯示 ◇)。同行 4 顆都掛 ◇ 視覺雜訊,且 ◇ 不區分彼此。v66 改:Difficulty 行只在 active 按鈕顯示實心 ◆,非 active 不顯示 outline icon。其他行(probe ⊙ / toggle ☐ / roof △)維持 §184 GE 行為不變。

202\. 【GW · Sparkline 加寬窄螢幕不破版（程式介面優化視角）】v65 §185 GF 把 sparkline SVG width 從 40 加到 52px(左 gutter)。findings panel 的 sparkline 列是 flex(label + svg + caption)。v66 確認加寬後在窄螢幕(<400px)不把右側 caption(— best / — avg / higher = better)擠出或破版;加 media query 讓 caption 在 <400px wrap 或縮字級。

203\. 【GX · Backdrop 不阻斷 Canvas 拖曳（程式介面優化視角）】v65 §183 GD popup 開啟時 backdrop(z-49)蓋住 canvas 與 HUD,popup body 是 z-50。學生想在 popup 開著時拖探頭(canvas),點擊命中 backdrop → 關 popup,而非拖探頭。v66 評估:popup 開啟時把 maze canvas z-index 提到 backdrop 之上(canvas 仍可拖曳),backdrop 只攔 popup 外的「非 canvas UI」點擊用於關閉。與 GI(§188)同源,實作合併。



（以下規則 204\~206 由使用者於 2026-05-29 EDT「先把 1 處理完再去做 3」採納 D 區 option-1 後納入,對應 `AI優化與改善建議書.md` 的 D-V1 / D-V2 / D8 三條(來源:截圖三模組 + `2026-05-29-22-11-19.mp4` 教學網站 6 dB drop 引導練習)。目標:把 sim 從工具集升級成引導式教學,v67 ship。）



204\. 【HQ · 聲束視覺升級 / Beam Visual Upgrade(D-V1)】影片中 `videolibrary.teachable.com` 的聲束有三個視覺特徵 v66 未到位:(a)cone 外層柔和光暈(outer soft-glow,額外一層同形 cone α≈0.10 + `ctx.shadowBlur≈6`),(b)拖曳中探頭 soft white halo(`txX, beamTop` 畫 12 px `radialGradient` white→transparent),(c)缺陷下方仍有 α≈0.04 的延伸殘影(`ghost continuation` — 不是硬切斷,物理上對應「少量穿透 + 大量反射」)。v67 對 `drawStandardBeam`、`drawWeldBeam` 各補這三層;與 §1「線性比例衰減 / 嚴禁開關式突兀消失」精神一致(部分穿透更貼近真實)。Maze top-down 不畫 cone 故不適用。

205\. 【HR · Guided Walkthrough 框架(D-V2,通用基礎)】影片整段「Step 1 of 5 → … → Step 5 of 5」就是這個框架。v67 建立 **可重用 JS 引擎 + HTML 面板 + CSS 設計 token**,所有日後互動練習(D8 / D5 / D6 / U22 / U23 / TOFD 等)都套這套:
  - 引擎 `gw = { flows, open(flowId), close(), next(), back(), submit(), feedback(type,msg), render() }`;`flows` 是 `{ id, title, steps:[{num,title,body,cta:{label,color,onSubmit}}] }` 設定。
  - HTML `<div id="gw-panel" hidden>` 內含:右上「Step N of M」+ 進度點(●●⊙○○;done=綠、current=大藍、pending=灰)/ 藍框卡片(編號徽章藍圓圈 N + 步驟標題 + 物理說明 body(**含具體目標數值**)+ 步驟內 CTA)/ 即時回饋區(紅 corrective / 綠 success)/ 底部 ← Back 與 Step N of M 標籤 / sticky 紅 "Complete and Continue" 按鈕。
  - CTA 顏色語意 token(`.gw-cta--green / --purple / --blue / --red-filled`):**綠** = set/start/capture reference / **紫** = precise placement(mark edge)/ **藍** = Next Step / **紅 filled** = Complete and Continue(跨步驟最終)。
  - 即時回饋三件套:wrong submit → 紅卡(當前值 + 目標值 + 具體下一步),right submit → 綠卡(含 Next Step → 按鈕)+ 持久畫布標記(青色虛線/tick 跨步驟保留)。
  - flow active 時隱藏 `ex-desc`,gw-panel 取代;close 時恢復。
  - 同時是 `window.gw` 全域,smoke 可斷言 `typeof window.gw.open === 'function'`。

206\. 【HS · 6 dB Drop 5-step 引導練習(D8,首個 HR 落地)】沿用 §38 AI / §85 CJ / §194 GO,在 EX02 加按鈕「🎓 Guided 6dB Sizing」啟動 5 步引導(sim 直接重現該教學網站 1 min 9 s 影片整段):
  - **Step 1 · Set Maximum(綠 CTA)**:拖探頭過缺陷頂峰,按 Set Maximum 捕捉最大 D 振幅作 reference(100 %)。需 ≥10 % FSH 才可繼續;不足跳紅卡「No D peak detected — drag probe over the defect first」。
  - **Step 2 · Mark Left Edge(紫 CTA)**:目標 D = 50 % × refAmp(6 dB drop)。submit 時:|D − 0.5·ref| / ref < 0.10 → 綠卡(Done! Left edge marked at X mm),否則紅卡(三件套:「Echo is at Y % — the 6 dB drop level is Z %. Move further away from center — the echo is still too high / too low.」)+ 留在當步。canvas 上畫青色虛線於該 X 標記,跨步驟保留。
  - **Step 3 · Mark Right Edge(紫 CTA)**:同 step 2 邏輯,反向。canvas 第二條青虛線 + 中間 width 標籤「N.N mm」。
  - **Step 4 · Review measurement(藍 Next + 紅 Complete)**:兩張大數字卡(`Your Measured Defect Size: X mm` / `Actual Defect Size: Y mm`)+ 誤差句 + **教學要點 takeaway 綠卡**:若反射體實際 < 估計 beam width(`_estBeamWidthMm(SP)`,§194 GO),自動顯示「The 6 dB technique measures defects that are larger than the beam width. For smaller defects, the 20 dB drop or DGS method is used instead.」— **把 §194 GO 的 toast 警告升級為有畫面的完整教學閉環**。否則(reflector ≥ beam)顯示常規 takeaway「Within ±N mm — pass / off by X mm — practice more」。actual size 取 EX02 當前 SDH 的直徑(Φ 3 mm per §43 AN ASTM E2491)。
  - **Step 5 · Done(紅 Complete and Continue)**:總結 pass/fail + 給「↺ Try again」與「Close」兩鈕。
  - flow 啟動時自動鎖 EX 為 penetration(EX02),關閉時不切回。



（以下規則 207\~211 由使用者於 2026-05-31 EDT「HT 全 + A 區全 C區做U1,2,6,8,9,11,22 D區做D5,6」採納後納入。v68 ship 範圍 = HT + Stage 1 全(IJ / IK / IL / HU)= 7 條。其餘排隊 v69~v72 循序漸進落實。同時使用者明示:六視角必須**大動作明顯可見**升級,禁止 pixel-tweak;建議書一律緊湊表格 / 一句話格式。）



207\. 【HT · EX 教學入口暴露三件套(EX2 修正)】v67 §206 HS 的「🎓 Guided 6dB Sizing」按鈕被埋在 `#tools-panel` 摺疊面板(預設 `display:none`),學生切到 EX2 完全看不到 5 步教學課入口,等於 D8 白做。v68 三段同時落地:
  - **HT-1 · EX 按鈕 🎓 chip**:`btn-pen` 內加 `<span class="lesson-chip">🎓</span>`(absolute top-right,金色 pill),學生**還沒點 EX2 就看見有 guided lesson**。CSS 已就位,日後其他 EX 也有 guided 時掛同樣 chip。
  - **HT-2 · EX 入口分流卡(EX2 落地)**:在 `#ex-desc` 上方 sibling `<div id="ex-splash-wrap">` 插入兩張**並排大卡**:左藍卡「📚 Guided · 6 dB Drop Sizing(5-step walkthrough)」(primary + pulse 1.8s ×2)+ 右灰卡「⚙️ Free play(All sizing tools available)」。點藍卡 → `gw.open('6db-sizing')`,點灰卡 → 隱藏 splash 留 step list。`sessionStorage` `ut_ex_splash_seen_<ex>` 防止 pulse 每次回 EX 都重觸發。
  - **HT-3 · 首次 EX2 「Start here」浮動箭頭**:`sessionStorage` `ut_ex2_seen_lesson` 沒紀錄時,EX2 開啟 800 ms 後在藍卡上方加 `.start-here-chip`(黃色 pill + bobbing animation),4 s 後 fadeout 自動消;點任一卡都 mark seen 並移除。**新生 1.5 秒內就知道 EX2 有 5 步教學課**。
  - 同步原則:HT-2 三件套(`_renderExSplash` / `_pickExSplash` / sessionStorage 防呆)變成日後新 guided lesson(D5 / D6 / U22)落地的固定模板;新 EX 有 lesson 時只需在 `_EX_LESSON_MAP[ex]` 註冊 `{ flowId, title, sub }`,其餘自動沿用。

208\. 【HU · 全 EX 入口分流卡(framework)】§207 HT-2 的「📚 / ⚙️ 雙卡」推廣到 EX01 / EX03 / EX04 / EX05。沒 guided lesson 的 EX:藍卡 disabled + 標 `coming v69` tag(opacity 0.55,cursor not-allowed),點不下;灰卡 Free play 正常運作。**先建空間 + 視覺一致性**,日後新 lesson 上架只需在 `_EX_LESSON_MAP[ex]` 填值,藍卡自動啟用。`_EX_FREE_PLAY_SUB[ex]` 提供每 EX 客製化的灰卡副標(EX01「Count P peaks at 5/10 MHz」、EX03「skew × wedge × V1 cal」、EX05「difficulty + markers」…),學生看一眼就知道 free play 模式下能玩什麼。

209\. 【IJ · Dark / Light theme toggle】header 加 `.theme-toggle` 按鈕(🌙 Dark / ☀️ Light 切換),`toggleTheme()` 用 `:root.theme-light` class 切換完整 light-mode CSS variables(`--bg #f6f8fc`、`--surface #ffffff`、`--text #1a2230`、`--accent #0a66c2`、`--green / --red / --beam5 / --beam10` 等全套覆寫)。`localStorage` key `ut_theme` 持久化選擇(走 `safeLSGet/Set` 'string' mode per §164 FK)。light theme 對齊**投影機 / PDF print / 教室實況**(白底黑字)。`.mobile-bar` / `.zoom-controls` / `.lesson-chip` / `.ex-splash-card.primary` 各自有 `:root.theme-light` 變體確保 contrast。

210\. 【IK · 手機 sticky 底部 action bar】@media (max-width:640px) 顯示 `#mobile-bar` 固定在底(z-index 80,`env(safe-area-inset-bottom)` for iPhone notch),4 個高頻按鈕一列。`_renderMobileBar()` 依當前 EX 切內容:
  - **All EX**:`↺ Reset` / `🎓 Guided`(有 lesson primary 色)或 `➡️ Next EX`(無 lesson) / `🔧 Tools` / `➡️ Next EX`
  - **EX5 maze**:`↺ Reset` / `📍 Drop` / `👁 Reveal` / `➡️ Next EX`(maze 高頻 action 取代 Tools/Guided)

  `setExercise()` 經 `_onExChanged()` 鉤每次 EX 切換時 re-render(`window.setExercise` wrapper 在 v68 章節定義)。`body { padding-bottom:78px }` @media gate 確保底列不蓋畫面。

211\. 【IL · Canvas pinch-zoom + drag-pan(scan canvas)】CSS `transform: translate(...) scale(...)`(transform-origin 0 0)**直接套在 `#scan-canvas` 本體**,不另起 wrapper(早期 v68 試過 `.canvas-zoom-wrap` 中介層,造成某些佈局下 `scanCanvas.parentElement.clientWidth` 量到 0 → canvas + ascan 雙崩,使用者抓到立刻改成直接套 canvas,parent 仍是 `.scan-card`,已有 `overflow:hidden`)。**只縮 canvas 本體,UI overlay(drag-hint / scan-hint / HUD)不放大**(per 使用者明示「UI 不放大」)。`#zoom-controls` 用 `position:absolute` 浮在 `.scan-card` 右上角(z-index 30)。
  - 手機:2-finger pinch → scale(1×~4×);2-finger pan → translate
  - 桌機:Ctrl + wheel = zoom;middle-click + drag = pan
  - canvas 右上 `.zoom-controls`(`−` / `100%` 讀值 / `+` / `⟲ reset`)觸控 / 桌機通用
  - 1-finger touch / 左鍵 mousedown 不受影響 → 維持既有探頭拖曳行為
  - 縮回 100% 時 translate 歸零,避免遺留偏移
  - `.canvas-zoom-wrap.zooming > canvas` 暫關 transition 確保 pinch 跟手不延遲

  EX3 multi-crack / EX5 maze 是受益最大的情境(細看 A-scan tip diffraction / 整片試片俯視)。



遠端開發生產與「模糊歷史掃描」規範（加拿大時間基準）



1\. 【歷史掃描與脈絡繼承】每次收到指令，動工前必須先「向上掃描」父目錄中的 `reference/` 教材，以及 `歷史版本與日報庫/`（包含『舊聊天室歷史遺產/』資料夾內成對的舊指令與舊更新檔），深刻理解過去的 Bug 修正邏輯，確保新代碼具備完美延續性，嚴禁產生任何崩潰或 Bug。
2. 【舊聊天室遺產包容】請務必深度掃描『舊聊天室歷史遺產/』資料夾。該資料夾內包含大量過去聊天室產出的原始檔與修正檔（檔名可能包含 vx, vxx, -fixed, vx-fixed 等模糊或不統一的接尾詞）。\*\*請你自主閱讀並解析這些 HTML 檔案內部的代碼邏輯異動與註解，通盤理解過去的 Bug 修正軌跡，確保全新代碼具備完美延續性，嚴禁產生任何崩潰或 Bug。\*\*

3\. 【核心防呆授權】在掃描代碼與教材時，若發現任何「CLAUDE.md 內沒有寫到的全新物理條件、修改限制或物理猜想」，請絕對不要直接改動主程式 HTML！

4\. 請立即在今日工作區內自動生成或更新一份『AI優化與改善建議書.md』，將你發現的新條件、推導公式與潛在 Bug 說明清楚。必須等待使用者在 input.txt 回覆「同意加入」後，你才能將新條件寫入 CLAUDE.md，並正式開始修改 HTML 主程式。







---

📎 **中英術語對照與 Vault 知識庫頁面映射**：見 Vault 內 `wiki/ndt-bilingual-glossary.md`
（`C:\Users\Jun zhi-PC\Documents\Obsidian Vault\wiki\ndt-bilingual-glossary.md`）
下方中文 NDT 大綱每條原理皆已映射到對應 wiki 頁；查詢時用中文或英文皆可命中。

---

非破壞檢測（NDT）與聲波反射原理統整



非破壞檢測（Non-Destructive Testing, NDT）基礎原理



非破壞檢測建立於材料在不破壞其功能與結構的情況下，利用物理場、能量傳遞、波動行為、電磁效應、熱傳導、輻射穿透與機械響應等現象，分析材料內部與表面缺陷之存在、位置、尺寸、形狀與性質。



非破壞檢測的核心原理包括：



材料異質性原理 材料內部之密度、彈性模數、導電率、磁導率、聲阻抗、熱導率與晶粒排列不一致時，會導致能量傳播特性改變。



能量交互作用原理 聲波、電磁波、熱能、輻射與機械能在進入材料後，會與材料產生反射、折射、散射、衰減、吸收、共振、模式轉換與繞射等現象。



缺陷界面原理 裂縫、氣孔、夾渣、未熔合、腐蝕、分層與空洞等缺陷形成不同介面，造成阻抗變化與能量回波。



邊界條件原理 波動在不同介質交界面上遵循邊界連續條件，導致波型轉換與能量分配。



訊號分析原理 藉由振幅、相位、飛行時間、頻率、衰減率與頻譜變化分析材料狀態。



機率與可靠度原理 缺陷檢出率（Probability of Detection, POD）與誤判率建立於統計學與可靠度工程。



超音波檢測（Ultrasonic Testing, UT）核心原理



超音波檢測利用高頻機械波於材料中傳播時產生的反射、折射、散射與衰減特性進行分析。



壓電效應原理（Piezoelectric Effect） 由 Jacques 與 Pierre Curie 發現。壓電材料在施加電場時產生機械振動，機械受力時產生電訊號。



逆壓電效應原理 交變電壓使壓電晶體產生高頻振動形成超音波。



聲阻抗原理（Acoustic Impedance） 由材料密度與聲速乘積構成： Z = ρc 不同介質間阻抗差越大，反射越強。



反射係數原理（Reflection Coefficient） R = (Z2 - Z1) / (Z2 + Z1) 反射能量與兩介質阻抗差相關。



透射係數原理（Transmission Coefficient） T = 2Z2 / (Z2 + Z1) 描述聲波穿透能力。



飛行時間原理（Time of Flight, TOF） 利用聲波往返時間計算缺陷深度與材料厚度。



波長原理 λ = c / f 波長越短解析度越高，但穿透力下降。



衰減原理（Attenuation） 聲波能量因吸收、散射與材料阻尼而衰減。



散射原理（Scattering） 聲波遇到晶粒、孔洞與粗糙界面時產生多方向散射。



共振原理（Resonance） 材料厚度與波長形成特定頻率共振。



模式轉換原理（Mode Conversion） 縱波與橫波在斜入射界面轉換。



干涉原理（Interference） 多重回波相互疊加形成增強或抵消。



相位反轉原理 波由低阻抗射向高阻抗時相位不反轉，由高阻抗射向低阻抗時相位反轉。



耦合原理（Coupling Principle） 利用耦合劑減少空氣阻抗差，提高能量傳遞。



近場與遠場原理（Near Field / Far Field） 近場存在干涉波峰與波谷，遠場波束逐漸擴散。



波束擴散原理（Beam Divergence） 聲束隨距離增加而擴張。



指向性原理（Directivity） 探頭尺寸與頻率影響波束集中程度。



聚焦原理（Focusing） 利用聲學透鏡或曲面晶片集中能量。



聲波傳播原理



胡克定律（Hooke’s Law） 材料彈性變形與應力成正比。



牛頓第二運動定律 波動建立於質點運動與慣性。



彈性波動方程 描述彈性介質中的波傳播。



赫茲接觸理論（Hertz Contact Theory） 探討接觸界面應力分布。



惠更斯原理（Huygens Principle） 每個波前點皆為次級波源。



傅立葉分析原理（Fourier Analysis） 任何複雜訊號皆可分解為正弦波。



頻譜分析原理 分析頻率組成與缺陷特徵。



奈奎斯特取樣定理（Nyquist Theorem） 取樣頻率需大於訊號兩倍頻率。



訊噪比原理（Signal-to-Noise Ratio） 有效訊號與背景雜訊比例。



聲波反射與界面物理原理



史涅耳定律（Snell’s Law） sinθ1 / c1 = sinθ2 / c2 描述折射角與波速關係。



菲涅耳原理（Fresnel Principle） 波前疊加形成干涉。



菲涅耳區原理（Fresnel Zone） 波束近場能量分布區域。



全反射原理（Total Internal Reflection） 入射角超過臨界角時完全反射。



臨界角原理（Critical Angle） 產生模式轉換與表面波。



瑞利波原理（Rayleigh Wave） Lord Rayleigh 提出。表面波沿材料表面傳播。



蘭姆波原理（Lamb Wave） Horace Lamb 提出。薄板中導波模式。



縱波原理（Longitudinal Wave） 粒子振動方向平行波傳播方向。



橫波原理（Shear Wave） 粒子振動方向垂直波傳播方向。



表面波原理（Surface Wave） 波能集中於表面附近。



導波原理（Guided Wave） 波於結構幾何邊界中受限制傳播。



繞射原理（Diffraction） 波繞過障礙物或裂縫尖端。



布拉格散射原理（Bragg Scattering） 晶體與週期結構造成特定方向反射。



相干原理（Coherence） 波之固定相位關係。



非線性聲學原理（Nonlinear Acoustics） 高振幅聲波產生諧波與混頻現象。



二次諧波原理（Second Harmonic Generation） 材料微裂縫產生高次頻率。



卡氏定律（Cagniard-de Hoop Method） 分析瞬態彈性波傳播。



Kirchhoff 繞射理論 描述波與障礙物交互作用。



Born Approximation 小缺陷散射近似理論。



Rayleigh 散射原理 散射體尺寸小於波長時產生頻率相關散射。



Mie 散射理論 散射體尺寸接近波長時之散射行為。



相控陣超音波（PAUT）原理



波束合成原理（Beamforming） 多晶片延遲控制形成聚焦與偏轉。



電子掃描原理（Electronic Scanning） 利用時間延遲控制波束方向。



延遲定律（Delay Law） 不同晶片施加不同時間延遲。



動態聚焦原理（Dynamic Focusing） 根據深度即時調整聚焦。



全矩陣捕獲原理（Full Matrix Capture, FMC） 記錄所有晶片組合訊號。



全聚焦法（Total Focusing Method, TFM） 利用 FMC 重建高解析影像。



合成孔徑聚焦技術（SAFT） 多位置訊號重建缺陷。



飛行時間繞射（TOFD）原理



繞射波原理 裂縫尖端產生繞射訊號。



飛行時間差原理 利用不同波到達時間定位缺陷。



幾何三角定位原理 透過波速與時間推算位置。



渦電流檢測（Eddy Current Testing, ECT）原理



法拉第電磁感應定律（Faraday’s Law） 變化磁場產生感應電流。



楞次定律（Lenz’s Law） 感應電流方向抵抗磁場變化。



集膚效應（Skin Effect） 高頻電流集中於材料表面。



阻抗變化原理 缺陷導致線圈阻抗變化。



磁通耦合原理 線圈與材料磁場交互作用。



磁粒檢測（MT）原理



磁通漏洩原理（Magnetic Flux Leakage） 缺陷造成磁場外漏。



磁畴理論（Magnetic Domain Theory） 材料磁化形成磁畴排列。



磁滯原理（Hysteresis） 材料磁化與退磁特性。



漏磁場吸附原理 磁粉聚集於漏磁區域。



液滲檢測（PT）原理



毛細作用原理（Capillary Action） 液體進入表面開口缺陷。



表面張力原理 液體附著與流動能力。



濕潤原理（Wetting Principle） 滲透液覆蓋材料表面。



顯像原理 顯像劑將滲透液帶回表面。



射線檢測（RT）原理



X 射線穿透原理 不同密度造成吸收差異。



伽馬射線衰減原理 輻射能量隨厚度衰減。



比耳－朗伯定律（Beer-Lambert Law） I = I0e^-μx 描述輻射衰減。



康普頓散射（Compton Scattering） 高能光子與電子碰撞。



光電效應（Photoelectric Effect） 光子能量被電子吸收。



幾何不清晰度原理 焦點尺寸與距離影響影像。



紅外線熱影像檢測（IRT）原理



熱傳導原理（Heat Conduction） 熱量由高溫傳向低溫。



傅立葉熱傳導定律（Fourier’s Law） 熱流與溫度梯度成正比。



熱擴散原理 熱能於材料內擴散。



熱阻原理 缺陷改變熱流路徑。



黑體輻射原理（Blackbody Radiation） 物體依溫度輻射紅外線。



史蒂芬－波茲曼定律（Stefan-Boltzmann Law） 輻射能量與溫度四次方相關。



聲發射檢測（AE）原理



材料釋能原理 裂縫成長時釋放彈性波。



事件定位原理 多感測器分析到達時間差。



凱撒效應（Kaiser Effect） 材料再次加載前不產生新聲發射。



Felicity Ratio 原理 評估材料損傷程度。



雷射超音波原理



熱彈效應（Thermoelastic Effect） 雷射局部加熱產生彈性波。



雷射燒蝕原理（Laser Ablation） 高能雷射產生等離子衝擊波。



光學干涉原理 量測表面振動。



非線性與高階聲學原理



雙頻混頻原理（Wave Mixing） 不同頻率波交互作用形成新頻率。



接觸聲學非線性原理（Contact Acoustic Nonlinearity） 微裂縫接觸造成非線性回應。



諧波失真原理 材料非線性產生高次頻率。



慢動力學效應（Slow Dynamics） 材料受損後恢復特性改變。



記憶效應原理（Memory Effect） 材料歷史載荷影響波傳播。



缺陷回波與幾何原理



角反射原理（Corner Reflection） 垂直缺陷產生強反射。



鏡面反射原理（Specular Reflection） 平滑界面產生定向反射。



漫反射原理（Diffuse Reflection） 粗糙表面產生多方向散射。



端點繞射原理（Tip Diffraction） 裂縫尖端產生弱繞射波。



缺陷方向性原理 缺陷與聲束角度影響回波。



幾何衰減原理（Geometric Spreading） 波能隨距離擴散。



孔洞共振原理 封閉空洞形成共振頻率。



空氣間隙高反射原理 空氣與金屬阻抗差極大，幾乎全反射。



數位訊號與影像重建原理



A-Scan 原理 以振幅與時間顯示回波。



B-Scan 原理 截面影像顯示。



C-Scan 原理 平面缺陷分布影像。



數位濾波原理 消除雜訊與提升訊號。



包絡檢波原理（Envelope Detection） 提取訊號包絡線。



希爾伯特轉換（Hilbert Transform） 分析瞬時振幅與相位。



互相關原理（Cross-Correlation） 分析訊號相似性。



反卷積原理（Deconvolution） 提升解析度。



時頻分析原理（Time-Frequency Analysis） 同時分析時間與頻率特徵。



小波轉換原理（Wavelet Transform） 分析非穩態訊號。



材料與冶金相關聲學原理



晶粒散射原理 粗晶材料增加噪訊。



各向異性原理（Anisotropy） 材料不同方向波速不同。



殘留應力原理（Residual Stress） 應力改變波速與相位。



彈塑性原理 塑性變形改變聲學特性。



蠕變原理（Creep） 長時間高溫導致材料變形。



疲勞裂縫成長原理 循環載荷造成裂縫擴展。



氫脆原理（Hydrogen Embrittlement） 氫原子降低材料韌性。



腐蝕聲學原理 腐蝕改變厚度與界面狀態。



分層原理（Delamination） 層間剝離造成界面反射。



世界科學家與相關理論



Isaac Newton：經典力學與波動運動基礎 Robert Hooke：彈性定律 Christiaan Huygens：惠更斯波動原理 Jean-Baptiste Fourier：傅立葉分析 Lord Rayleigh：表面波理論 Horace Lamb：蘭姆波理論 Pierre Curie / Jacques Curie：壓電效應 Snell：折射定律 Augustin-Jean Fresnel：干涉與菲涅耳理論 Joseph Fourier：熱傳導理論 Michael Faraday：電磁感應 Heinrich Lenz：楞次定律 Gustav Kirchhoff：繞射理論 Albert Einstein：光電效應 Arthur Compton：康普頓散射 Nyquist：取樣定理 Beer / Lambert：輻射衰減定律 Stefan / Boltzmann：熱輻射定律 Hertz：接觸力學 Cagniard / de Hoop：彈性波分析 Mie：散射理論 Born：散射近似理論

