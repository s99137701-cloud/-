$curDir = (Get-Item -LiteralPath .).FullName
$illustJs = [System.IO.File]::ReadAllText([System.IO.Path]::Combine($curDir, "assets", "illust_data.js"), [System.Text.Encoding]::UTF8)
$seonbiJs = [System.IO.File]::ReadAllText([System.IO.Path]::Combine($curDir, "assets", "seonbi_sprites.js"), [System.Text.Encoding]::UTF8)

# Read base HTML template and integrate Seonbi Sprites and Sound.roar and Signature Effects
$html = @"
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>사방신 무림전 (四方神 武林傳) - 선비 검술 & 사신수 궁극기</title>
  <script src="https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;600;900&display=swap" rel="stylesheet">

  <style>
    :root {
      --hanji-bg: #f5efe2;
      --border-gold: #c59b27;
      --border-gold-glow: rgba(197, 155, 39, 0.45);
      --seal-red: #c92a2a;
      --font-wuxia: 'Noto Serif KR', 'Batang', serif;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; -webkit-user-select: none; }

    body {
      background-color: #0d0b09;
      color: #f7ede2;
      font-family: var(--font-wuxia);
      overflow: hidden;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: radial-gradient(circle at center, #231b14 0%, #050403 100%);
    }

    #game-container {
      position: relative;
      width: min(1280px, 100vw, 177.78vh);
      height: min(720px, 56.25vw, 100vh);
      aspect-ratio: 16 / 9;
      box-shadow: 0 25px 80px rgba(0, 0, 0, 0.95), 0 0 50px rgba(197, 155, 39, 0.25);
      border: 4px solid var(--border-gold);
      border-radius: 8px;
      overflow: hidden;
      background: #000;
    }

    canvas#gameCanvas {
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      display: block;
    }

    .ui-layer {
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      pointer-events: none;
    }
    .ui-layer * { pointer-events: auto; }

    /* 로딩 화면 */
    #preload-screen {
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background: #110e0b;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 100;
      transition: opacity 0.4s ease;
    }

    .preload-title {
      font-size: 38px;
      font-weight: 900;
      color: var(--border-gold);
      letter-spacing: 6px;
      margin-bottom: 20px;
      text-shadow: 0 0 20px var(--border-gold-glow);
    }

    .preload-bar-box {
      width: 480px; height: 18px;
      background: #251e18;
      border: 2px solid var(--border-gold);
      border-radius: 9px;
      overflow: hidden;
      box-shadow: inset 0 2px 6px rgba(0,0,0,0.8);
    }

    .preload-bar-fill {
      width: 0%; height: 100%;
      background: linear-gradient(90deg, #c59b27, #f4a261, #ffd166);
      transition: width 0.1s ease-out;
    }

    .preload-status-text {
      font-size: 14px;
      color: #decbb3;
      margin-top: 14px;
      letter-spacing: 1px;
    }

    /* 전투 HUD */
    #battle-hud {
      display: none;
      position: absolute;
      top: 0; left: 0;
      width: 100%;
      padding: 22px 36px;
      justify-content: space-between;
      align-items: flex-start;
      z-index: 10;
      pointer-events: none;
    }

    .hud-player { display: flex; flex-direction: column; width: 440px; }
    .hud-player.p2 { align-items: flex-end; }

    .player-profile-row { display: flex; align-items: center; gap: 12px; margin-bottom: 6px; }
    .hud-player.p2 .player-profile-row { flex-direction: row-reverse; }

    .portrait-avatar-frame {
      width: 58px; height: 58px;
      border-radius: 50%;
      border: 2.5px solid var(--border-gold);
      background: #1e1913;
      box-shadow: 0 4px 12px rgba(0,0,0,0.6);
      overflow: hidden;
    }
    .portrait-avatar-frame img { width: 100%; height: 100%; object-fit: cover; display: block; }

    .name-title-box { display: flex; flex-direction: column; }
    .hud-player.p2 .name-title-box { text-align: right; }

    .player-name-kr {
      font-size: 19px; font-weight: 900; color: #fff;
      text-shadow: 0 2px 4px rgba(0,0,0,0.9);
      display: flex; align-items: center; gap: 8px;
    }
    .hud-player.p2 .player-name-kr { justify-content: flex-end; }

    .player-title-tag { font-size: 11px; color: #d4a373; font-weight: 600; letter-spacing: 1px; }

    .bar-frame {
      width: 100%; height: 22px;
      background: rgba(18, 14, 11, 0.9);
      border: 2px solid var(--border-gold);
      border-radius: 4px;
      position: relative; overflow: hidden;
      box-shadow: inset 0 2px 6px rgba(0,0,0,0.9);
    }

    .hp-fill {
      height: 100%; width: 100%;
      background: linear-gradient(90deg, #9b2226, #c92a2a, #ff6b6b);
      transition: width 0.15s ease-out;
    }
    .hud-player.p2 .hp-fill { float: right; background: linear-gradient(270deg, #9b2226, #c92a2a, #ff6b6b); }

    .hp-text {
      position: absolute; top: 50%; transform: translateY(-50%);
      font-size: 11px; font-weight: 900; color: #fff; text-shadow: 1px 1px 3px #000;
      padding: 0 8px;
    }
    .hud-player.p1 .hp-text { left: 4px; }
    .hud-player.p2 .hp-text { right: 4px; }

    .sp-frame {
      width: 82%; height: 12px; margin-top: 5px;
      background: rgba(18, 14, 11, 0.9);
      border: 1.5px solid var(--border-gold);
      border-radius: 3px; position: relative; overflow: hidden;
    }
    .sp-fill {
      height: 100%; width: 0%;
      background: linear-gradient(90deg, #c59b27, #f4a261, #ffd166);
      box-shadow: 0 0 10px rgba(255, 209, 102, 0.7);
      transition: width 0.2s ease-out;
    }
    .hud-player.p2 .sp-fill { float: right; }
    .sp-tag { position: absolute; top: -1px; font-size: 9px; font-weight: 900; color: #fff; line-height: 12px; padding: 0 6px; }
    .hud-player.p1 .sp-tag { right: 4px; }
    .hud-player.p2 .sp-tag { left: 4px; }

    #round-timer-box { display: flex; flex-direction: column; align-items: center; position: relative; top: -4px; }
    .timer-circle {
      width: 66px; height: 66px; border-radius: 50%;
      background: radial-gradient(circle, #2d241c 0%, #15110d 100%);
      border: 3px solid var(--border-gold);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.6);
      display: flex; align-items: center; justify-content: center;
      font-size: 30px; font-weight: 900; color: #ffd166;
    }
    .season-stamp {
      margin-top: 6px; background: rgba(18, 14, 11, 0.9); color: #f7ede2;
      border: 1px solid var(--border-gold); padding: 3px 12px; border-radius: 12px;
      font-size: 11px; font-weight: 600; letter-spacing: 1px;
    }

    .combo-display {
      position: absolute; top: 110px; font-size: 26px; font-weight: 900; color: #ffd166;
      text-shadow: 2px 2px 0 #c92a2a, 0 0 12px rgba(201, 42, 42, 0.8);
      opacity: 0; transition: opacity 0.2s, transform 0.2s; transform: scale(0.8); pointer-events: none;
    }
    .combo-display.active { opacity: 1; transform: scale(1.1); }
    #combo-p1 { left: 45px; }
    #combo-p2 { right: 45px; text-align: right; }

    /* 로비 */
    #select-screen {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      background: radial-gradient(circle at center, rgba(35, 27, 20, 0.96) 0%, rgba(13, 10, 8, 0.98) 100%);
      display: flex; flex-direction: column; align-items: center; justify-content: space-between;
      padding: 24px 40px; z-index: 20;
    }

    .game-logo-title {
      font-size: 44px; font-weight: 900; color: #fff; letter-spacing: 4px;
      text-shadow: 0 0 25px rgba(197, 155, 39, 0.6), 2px 2px 0 #000;
    }
    .game-subtitle { font-size: 14px; color: #decbb3; letter-spacing: 3px; margin-top: 4px; font-weight: 600; }

    .char-card-grid {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;
      width: 100%; max-width: 1160px; margin: 12px 0;
    }

    .char-card {
      background: rgba(30, 24, 18, 0.9);
      border: 2px solid #5a4938; border-radius: 8px; padding: 16px 14px;
      display: flex; flex-direction: column; align-items: center; cursor: pointer;
      transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1); position: relative;
      box-shadow: 0 6px 18px rgba(0,0,0,0.5); overflow: hidden;
    }
    .char-card:hover { transform: translateY(-8px); border-color: var(--border-gold); }
    .char-card.selected {
      border-color: var(--seal-red); background: rgba(45, 30, 24, 0.95);
      box-shadow: 0 12px 30px rgba(201, 42, 42, 0.4), 0 0 0 2px var(--seal-red);
      transform: translateY(-6px);
    }
    .char-card.selected::after {
      content: '선택됨 (1P)'; position: absolute; top: 10px; right: 10px;
      background: var(--seal-red); color: #fff; font-size: 10px; font-weight: 900;
      padding: 2px 7px; border-radius: 10px;
    }

    .char-card-img-preview {
      width: 120px; height: 140px; object-fit: cover; border-radius: 6px;
      margin-bottom: 10px; border: 1.5px solid var(--border-gold);
      box-shadow: 0 4px 10px rgba(0,0,0,0.6);
    }

    .char-name-kr { font-size: 20px; font-weight: 900; color: #fff; margin-bottom: 2px; }
    .char-title { font-size: 12px; font-weight: 600; color: #ffd166; margin-bottom: 8px; }
    .char-tagline { font-size: 11px; color: #decbb3; text-align: center; line-height: 1.4; height: 32px; margin-bottom: 8px; word-break: keep-all; }

    .select-footer {
      width: 100%; max-width: 1160px; display: flex; justify-content: space-between;
      align-items: center; padding-top: 10px; border-top: 2px solid #5a4938;
    }
    .controls-preview { font-size: 12px; color: #decbb3; line-height: 1.6; }
    .key-pill {
      display: inline-block; background: #2f251c; border: 1px solid #7c6853;
      padding: 1px 7px; border-radius: 4px; font-weight: 900; color: #ffd166; margin: 0 2px;
    }

    .room-actions { display: flex; gap: 12px; }
    .btn-wuxia {
      font-family: var(--font-wuxia); font-size: 15px; font-weight: 900;
      padding: 12px 24px; border-radius: 6px; cursor: pointer;
      border: 2px solid var(--border-gold); background: #251e18; color: #ffd166;
      transition: all 0.2s ease; letter-spacing: 1px;
    }
    .btn-wuxia:hover { background: #392f25; transform: translateY(-2px); }
    .btn-wuxia.primary { background: linear-gradient(135deg, #c92a2a 0%, #9e1f1f 100%); color: #fff; }

    /* 모달 */
    .modal-overlay {
      display: none; position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(8, 6, 4, 0.85); backdrop-filter: blur(5px);
      justify-content: center; align-items: center; z-index: 50;
    }
    .modal-content {
      background: #1c1611; border: 3px solid var(--border-gold); border-radius: 8px;
      padding: 32px 42px; width: 440px; text-align: center;
    }
    .modal-title { font-size: 24px; font-weight: 900; color: #ffd166; margin-bottom: 12px; }
    .room-code-display {
      font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #ff6b6b;
      background: #110e0b; border: 2px dashed #7c6853; border-radius: 6px; padding: 14px; margin-bottom: 18px; font-family: monospace;
    }
    .room-code-input {
      font-size: 28px; font-weight: 900; letter-spacing: 6px; text-align: center; color: #ffd166;
      background: #110e0b; border: 2px solid var(--border-gold); border-radius: 6px; padding: 10px; width: 80%; margin: 0 auto 18px; outline: none; font-family: monospace;
    }

    #result-screen {
      display: none; position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(10, 8, 6, 0.88); backdrop-filter: blur(6px);
      flex-direction: column; align-items: center; justify-content: center; z-index: 40;
    }
    .victory-title { font-size: 64px; font-weight: 900; color: #ffd166; text-shadow: 0 0 30px rgba(255, 209, 102, 0.8); margin-bottom: 12px; }
  </style>
</head>
<body>

  <div id="game-container">
    <canvas id="gameCanvas" width="1280" height="720"></canvas>

    <!-- 로딩 화면 -->
    <div id="preload-screen">
      <h2 class="preload-title">선비 검술 & 사신수 에셋 로딩 중...</h2>
      <div class="preload-bar-box">
        <div class="preload-bar-fill" id="preload-fill"></div>
      </div>
      <div class="preload-status-text" id="preload-status">고화질 선비 스프라이트와 사신수 일러스트 로딩 중... (0%)</div>
    </div>

    <!-- 상단 HUD -->
    <div id="battle-hud" class="ui-layer">
      <div class="hud-player p1">
        <div class="player-profile-row">
          <div class="portrait-avatar-frame"><img id="img-avatar-p1" src="" alt="1P 초상화"></div>
          <div class="name-title-box">
            <div class="player-name-kr"><span id="name-p1">백호</span><span style="font-size: 11px; background: #c59b27; color:#fff; padding:1px 5px; border-radius:3px;">1P</span></div>
            <div class="player-title-tag" id="title-p1">하얀 도포의 백호선비</div>
          </div>
        </div>
        <div class="bar-frame"><div class="hp-fill" id="hp-p1"></div><div class="hp-text" id="hp-txt-p1">1150 / 1150</div></div>
        <div class="sp-frame"><div class="sp-fill" id="sp-p1"></div><div class="sp-tag">기력 (SP)</div></div>
      </div>

      <div id="round-timer-box">
        <div class="timer-circle" id="timer-text">99</div>
        <div class="season-stamp" id="season-text">봄 · 滿花方暢</div>
      </div>

      <div class="hud-player p2">
        <div class="player-profile-row">
          <div class="portrait-avatar-frame"><img id="img-avatar-p2" src="" alt="2P 초상화"></div>
          <div class="name-title-box">
            <div class="player-name-kr"><span style="font-size: 11px; background: #6c584c; color:#fff; padding:1px 5px; border-radius:3px;">2P</span><span id="name-p2">청룡</span></div>
            <div class="player-title-tag" id="title-p2">푸른 도포의 청룡선비</div>
          </div>
        </div>
        <div class="bar-frame"><div class="hp-fill" id="hp-p2"></div><div class="hp-text" id="hp-txt-p2">1000 / 1000</div></div>
        <div class="sp-frame"><div class="sp-fill" id="sp-p2"></div><div class="sp-tag">기력 (SP)</div></div>
      </div>

      <div class="combo-display" id="combo-p1">0단 연계!</div>
      <div class="combo-display" id="combo-p2">0단 연계!</div>
    </div>

    <!-- 로비 / 캐릭터 선택창 -->
    <div id="select-screen" class="ui-layer">
      <div style="text-align: center;">
        <h1 class="game-logo-title">사방신 무림전</h1>
        <p class="game-subtitle">四方神 武林傳 · 선비 검술 & 사신수 강림</p>
      </div>

      <div class="char-card-grid">
        <!-- 1. 백호 선비 (하얀 도포) -->
        <div class="char-card selected" data-char="WHITE_TIGER">
          <img class="char-card-img-preview" id="card-img-WHITE_TIGER" src="" alt="백호">
          <div class="char-name-kr">백호 (白虎)</div>
          <div class="char-title">하얀 도포 선비 · 뇌전 벽력</div>
          <div class="char-tagline">묵직한 환도 검술과 백호의 포효, 천둥 벼락의 강타</div>
        </div>

        <!-- 2. 주작 선비 (빨간 도포) -->
        <div class="char-card" data-char="VERMILION_BIRD">
          <img class="char-card-img-preview" id="card-img-VERMILION_BIRD" src="" alt="주작">
          <div class="char-name-kr">주작 (朱雀)</div>
          <div class="char-title">빨간 도포 선비 · 겁화 유성</div>
          <div class="char-tagline">화려한 도포자락의 공중 2단점프와 타오르는 불새 유성우</div>
        </div>

        <!-- 3. 청룡 선비 (파란 도포) -->
        <div class="char-card" data-char="BLUE_DRAGON">
          <img class="char-card-img-preview" id="card-img-BLUE_DRAGON" src="" alt="청룡">
          <div class="char-name-kr">청룡 (靑龍)</div>
          <div class="char-title">파란 도포 선비 · 질풍 용권</div>
          <div class="char-tagline">날렵한 신법과 쾌속 찌르기, 천지를 가르는 청룡의 폭풍</div>
        </div>

        <!-- 4. 현무 선비 (초록 도포) -->
        <div class="char-card" data-char="BLACK_TORTOISE">
          <img class="char-card-img-preview" id="card-img-BLACK_TORTOISE" src="" alt="현무">
          <div class="char-name-kr">현무 (玄武)</div>
          <div class="char-title">초록 도포 선비 · 명부 해일</div>
          <div class="char-tagline">철벽의 방어와 반격 검술, 대지를 집어삼키는 심해 해일</div>
        </div>
      </div>

      <div class="select-footer">
        <div class="controls-preview">
          <div><strong>1P 선비 조작키 (역동적 검술 3단 콤보):</strong></div>
          <div>
            <span class="key-pill">A</span><span class="key-pill">D</span> 이동 · 
            <span class="key-pill">W</span> 점프 (주작 2단점프) · 
            <span class="key-pill">S</span> 방어 · 
            <span class="key-pill">J</span> 3단 콤보 (1타 찌르기 → 2타 올려치기 → 3타 내리찍기) · 
            <span class="key-pill">K</span> 특수 스킬 · 
            <span class="key-pill">L</span> 사신수 풀스크린 궁극기 컷씬 & 시그니처 딜링 (SP 100%)
          </div>
        </div>
        <div class="room-actions">
          <button class="btn-wuxia" id="btn-practice-mode">연습 모드 (vs AI)</button>
          <button class="btn-wuxia" id="btn-join-modal">방 참가하기</button>
          <button class="btn-wuxia primary" id="btn-create-room">방 만들기 (P2P)</button>
        </div>
      </div>
    </div>

    <!-- 모달 -->
    <div id="modal-create-room" class="modal-overlay">
      <div class="modal-content">
        <h3 class="modal-title">대전 방 생성 완료</h3>
        <p style="font-size: 13px; color: #baa591; margin-bottom: 20px;">아래의 6자리 방 코드를 상대방에게 전달하세요.</p>
        <div class="room-code-display" id="display-room-code">------</div>
        <button class="btn-wuxia" id="btn-copy-code">코드 복사</button>
        <button class="btn-wuxia" id="btn-cancel-create" style="margin-left: 10px;">취소</button>
      </div>
    </div>

    <div id="modal-join-room" class="modal-overlay">
      <div class="modal-content">
        <h3 class="modal-title">대전 방 참가</h3>
        <p style="font-size: 13px; color: #baa591; margin-bottom: 20px;">전달받은 6자리 방 코드를 입력하세요.</p>
        <input type="text" id="input-join-code" class="room-code-input" maxlength="6" placeholder="A7X9P2">
        <div>
          <button class="btn-wuxia primary" id="btn-confirm-join">참가하기</button>
          <button class="btn-wuxia" id="btn-cancel-join" style="margin-left: 10px;">취소</button>
        </div>
      </div>
    </div>

    <!-- 승패 결과 화면 -->
    <div id="result-screen">
      <h2 class="victory-title" id="victory-title">승리 (VICTORY)</h2>
      <p style="font-size: 20px; color: #decbb3; margin-bottom: 36px;">사신수 무림의 승패가 갈렸습니다.</p>
      <div>
        <button class="btn-wuxia primary" id="btn-rematch">다시 대전</button>
        <button class="btn-wuxia" id="btn-to-select" style="margin-left: 16px;">캐릭터 선택으로</button>
      </div>
    </div>
  </div>

  <script>
    /* =========================================================================
       1. 사용자 업로드 사신수 일러스트 & 4색 선비 스프라이트 데이터 (INLINED)
    ========================================================================= */
$illustJs

$seonbiJs

    // 사계절 배경 SVG 생성
    function createSeasonalBgSvg(skyGrad, mountainColor) {
      const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
        <defs>
          <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="${skyGrad[0]}"/>
            <stop offset="60%" stop-color="${skyGrad[1]}"/>
            <stop offset="100%" stop-color="${skyGrad[2]}"/>
          </linearGradient>
          <linearGradient id="ground" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#3d2f23"/>
            <stop offset="100%" stop-color="#140f0b"/>
          </linearGradient>
        </defs>
        <rect width="1280" height="720" fill="url(#sky)"/>
        <path d="M0,380 Q320,180 640,320 T1280,260 L1280,720 L0,720 Z" fill="${mountainColor}" opacity="0.35"/>
        <path d="M0,430 Q280,280 580,390 T1280,340 L1280,720 L0,720 Z" fill="${mountainColor}" opacity="0.65"/>
        <g transform="translate(520, 310)">
          <rect x="0" y="100" width="240" height="170" fill="#2d2822" stroke="#120f0c" stroke-width="3"/>
          <path d="M70,270 A50,50 0 0,1 170,270 Z" fill="#120f0c"/>
          <path d="M-30,100 Q120,40 270,100 L250,118 Q120,70 -10,118 Z" fill="#181410"/>
          <rect x="75" y="125" width="90" height="26" fill="#0d0b09" stroke="#c59b27" stroke-width="2"/>
          <text x="120" y="143" fill="#f5efe2" font-family="'Noto Serif KR', serif" font-size="12" font-weight="bold" text-anchor="middle">四方門 (사방문)</text>
        </g>
        <rect x="0" y="580" width="1280" height="140" fill="url(#ground)"/>
        <line x1="0" y1="580" x2="1280" y2="580" stroke="#120f0c" stroke-width="6"/>
      </svg>`;
      return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg.trim());
    }

    const IMAGE_MANIFEST = {
      bg_SPRING: createSeasonalBgSvg(['#fbf6ec', '#eedbc9', '#ddc3ae'], '#3d464d'),
      bg_SUMMER: createSeasonalBgSvg(['#f2f8ee', '#d4e8d2', '#b2d6b4'], '#223824'),
      bg_AUTUMN: createSeasonalBgSvg(['#fbf2e2', '#ebd0b6', '#d6b293'], '#52341d'),
      bg_WINTER: createSeasonalBgSvg(['#f0f4f8', '#d6e0ea', '#bcccdb'], '#1e2838'),

      // 사신수 4종 일러스트 (로비 카드 & 컷씬)
      WHITE_TIGER_portrait: USER_ILLUST.WHITE_TIGER,
      VERMILION_BIRD_portrait: USER_ILLUST.VERMILION_BIRD,
      BLUE_DRAGON_portrait: USER_ILLUST.BLUE_DRAGON,
      BLACK_TORTOISE_portrait: USER_ILLUST.BLACK_TORTOISE,

      cutscene_WHITE_TIGER: USER_ILLUST.WHITE_TIGER,
      cutscene_VERMILION_BIRD: USER_ILLUST.VERMILION_BIRD,
      cutscene_BLUE_DRAGON: USER_ILLUST.BLUE_DRAGON,
      cutscene_BLACK_TORTOISE: USER_ILLUST.BLACK_TORTOISE
    };

    // 4색 선비 캐릭터 스프라이트 등록
    const CHAR_KEYS = ['WHITE_TIGER', 'BLUE_DRAGON', 'VERMILION_BIRD', 'BLACK_TORTOISE'];
    const MOTIONS = ['idle', 'run', 'attack1', 'attack2', 'attack3', 'guard', 'hit'];

    CHAR_KEYS.forEach(ck => {
      MOTIONS.forEach(m => {
        IMAGE_MANIFEST[`${ck}_${m}`] = SEONBI_SPRITES[ck][m];
      });
    });

    /* =========================================================================
       2. 이미지 프리로더 (렉 방지)
    ========================================================================= */
    const AssetManager = {
      images: {},
      loadedCount: 0,
      totalCount: 0,

      init(onComplete) {
        const keys = Object.keys(IMAGE_MANIFEST);
        this.totalCount = keys.length;
        this.loadedCount = 0;

        const fillBar = document.getElementById('preload-fill');
        const statusText = document.getElementById('preload-status');

        keys.forEach(key => {
          const img = new Image();
          img.onload = () => {
            this.images[key] = img;
            this.loadedCount++;
            const pct = Math.round((this.loadedCount / this.totalCount) * 100);
            if (fillBar) fillBar.style.width = pct + '%';
            if (statusText) statusText.innerText = `선비 검술 & 사신수 에셋 로딩 중... (${pct}%) [${this.loadedCount}/${this.totalCount}]`;

            if (this.loadedCount >= this.totalCount) {
              setTimeout(() => {
                const screen = document.getElementById('preload-screen');
                if (screen) {
                  screen.style.opacity = '0';
                  setTimeout(() => screen.style.display = 'none', 400);
                }
                if (onComplete) onComplete();
              }, 200);
            }
          };
          img.onerror = () => {
            this.loadedCount++;
            if (this.loadedCount >= this.totalCount && onComplete) onComplete();
          };
          img.src = IMAGE_MANIFEST[key];
        });
      },

      getImage(k) { return this.images[k] || null; }
    };

    /* =========================================================================
       3. Web Audio 사운드 & 사신수 포효음 엔진
    ========================================================================= */
    const Sound = {
      ctx: null,
      init() {
        if (!this.ctx) {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (AudioContext) this.ctx = new AudioContext();
        }
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
      },
      playTone(freq, type, duration, gainStart = 0.25) {
        if (!this.ctx) return;
        try {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = type;
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
          gain.gain.setValueAtTime(gainStart, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start();
          osc.stop(this.ctx.currentTime + duration);
        } catch(e) {}
      },
      jump() { this.playTone(320, 'sine', 0.15, 0.2); },
      thrust() { this.playTone(480, 'triangle', 0.12, 0.28); },
      spin() { this.playTone(300, 'sawtooth', 0.2, 0.25); },
      slam() { this.playTone(110, 'sine', 0.35, 0.45); },
      hit(heavy) { this.playTone(heavy ? 100 : 250, 'square', 0.2, 0.35); },

      // 사신수별 고유 포효 사운드 (Roar Sound)
      roar(charId) {
        if (!this.ctx) return;
        try {
          const now = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          if (charId === 'WHITE_TIGER') {
            // 백호 포효: 묵직한 호랑이 저주파 그르렁 + 벼락
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(140, now);
            osc.frequency.exponentialRampToValueAtTime(50, now + 0.9);
            gain.gain.setValueAtTime(0.5, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
          } else if (charId === 'VERMILION_BIRD') {
            // 주작 포효: 높은 피치의 불새 울음소리
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(450, now);
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.3);
            osc.frequency.exponentialRampToValueAtTime(250, now + 1.0);
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 1.1);
          } else if (charId === 'BLUE_DRAGON') {
            // 청룡 포효: 울부짖는 용의 천둥소리
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(85, now);
            osc.frequency.linearRampToValueAtTime(170, now + 0.4);
            osc.frequency.exponentialRampToValueAtTime(60, now + 1.2);
            gain.gain.setValueAtTime(0.55, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 1.3);
          } else if (charId === 'BLACK_TORTOISE') {
            // 현무 포효: 깊은 심해의 파동음
            osc.type = 'sine';
            osc.frequency.setValueAtTime(60, now);
            osc.frequency.exponentialRampToValueAtTime(35, now + 1.4);
            gain.gain.setValueAtTime(0.6, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);
          }

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start();
          osc.stop(now + 1.5);
        } catch(e) {}
      }
    };

    /* =========================================================================
       4. 조작 입력 (1P)
    ========================================================================= */
    const Input = {
      keys: {},
      justPressed: {},
      init() {
        window.addEventListener('keydown', (e) => {
          Sound.init();
          const k = e.key.toLowerCase();
          if (!this.keys[k]) this.justPressed[k] = true;
          this.keys[k] = true;
          if (['w','a','s','d','j','k','l',' '].includes(k)) e.preventDefault();
        });
        window.addEventListener('keyup', (e) => {
          this.keys[e.key.toLowerCase()] = false;
        });
      },
      isDown(key) { return !!this.keys[key.toLowerCase()]; },
      isJustPressed(key) {
        const k = key.toLowerCase();
        if (this.justPressed[k]) {
          this.justPressed[k] = false;
          return true;
        }
        return false;
      }
    };

    /* =========================================================================
       5. 선비 캐릭터 클래스 (정통 스프라이트 렌더링)
    ========================================================================= */
    const SF = {
      WIDTH: 1280, HEIGHT: 720, FLOOR_Y: 580, ARENA_LEFT: 80, ARENA_RIGHT: 1200,
      GRAVITY: 0.85, ROUND_TIME: 99,
      SEASONS: {
        SPRING: { id: 'SPRING', name: '봄 · 만화방창 (滿花方暢)' },
        SUMMER: { id: 'SUMMER', name: '여름 · 청록농음 (靑綠濃陰)' },
        AUTUMN: { id: 'AUTUMN', name: '가을 · 만홍단풍 (滿紅丹楓)' },
        WINTER: { id: 'WINTER', name: '겨울 · 백설한산 (白雪寒山)' }
      },
      CHARACTERS: {
        WHITE_TIGER: {
          id: 'WHITE_TIGER', nameKr: '백호 선비', title: '하얀 도포 · 뇌전 벽력',
          speed: 5.2, jump: -16.2, maxHp: 1150, defense: 0.85, canDoubleJump: false,
          lightDmg: 50, spinDmg: 65, heavyDmg: 135
        },
        VERMILION_BIRD: {
          id: 'VERMILION_BIRD', nameKr: '주작 선비', title: '빨간 도포 · 겁화 유성',
          speed: 6.4, jump: -16.8, maxHp: 900, defense: 1.0, canDoubleJump: true,
          lightDmg: 40, spinDmg: 52, heavyDmg: 90
        },
        BLUE_DRAGON: {
          id: 'BLUE_DRAGON', nameKr: '청룡 선비', title: '파란 도포 · 질풍 용권',
          speed: 6.8, jump: -17.5, maxHp: 1000, defense: 0.95, canDoubleJump: false,
          lightDmg: 38, spinDmg: 48, heavyDmg: 95
        },
        BLACK_TORTOISE: {
          id: 'BLACK_TORTOISE', nameKr: '현무 선비', title: '초록 도포 · 명부 해일',
          speed: 4.8, jump: -15.8, maxHp: 1200, defense: 0.80, canDoubleJump: false,
          lightDmg: 44, spinDmg: 56, heavyDmg: 85
        }
      }
    };

    class SeonbiCharacter {
      constructor(config, x, facingRight = true) {
        this.cfg = config;
        this.x = x;
        this.y = SF.FLOOR_Y;
        this.vx = 0;
        this.vy = 0;
        this.facingRight = facingRight;
        this.hp = config.maxHp;
        this.maxHp = config.maxHp;
        this.sp = 0;
        this.maxSp = 100;

        this.isGrounded = true;
        this.isGuarding = false;
        this.isAttacking = false;
        this.isHit = false;
        this.isDead = false;
        this.doubleJumped = false;

        this.currentMotion = 'idle'; // idle, run, attack1, attack2, attack3, guard, hit
        this.comboStep = 0;
        this.comboTimer = 0;
        this.attackDuration = 0.25;
        this.attackProgress = 0;
        this.hitStunTimer = 0;
        this.hitbox = null;
      }

      update(dt) {
        if (this.hitStunTimer > 0) {
          this.hitStunTimer -= dt;
          if (this.hitStunTimer <= 0) {
            this.isHit = false;
            this.currentMotion = 'idle';
          }
        }

        if (this.comboTimer > 0) {
          this.comboTimer -= dt;
          if (this.comboTimer <= 0) this.comboStep = 0;
        }

        if (this.isAttacking) {
          this.attackProgress += dt / this.attackDuration;
          if (this.attackProgress >= 1.0) {
            this.isAttacking = false;
            this.attackProgress = 0;
            this.hitbox = null;
            this.currentMotion = 'idle';
          }
        }

        this.vy += SF.GRAVITY;
        this.x += this.vx;
        this.y += this.vy;

        if (this.y >= SF.FLOOR_Y) {
          this.y = SF.FLOOR_Y;
          this.vy = 0;
          this.isGrounded = true;
          this.doubleJumped = false;
        } else {
          this.isGrounded = false;
        }

        if (this.x < SF.ARENA_LEFT + 30) this.x = SF.ARENA_LEFT + 30;
        if (this.x > SF.ARENA_RIGHT - 30) this.x = SF.ARENA_RIGHT - 30;

        this.vx *= 0.82;
        if (Math.abs(this.vx) < 0.1) {
          this.vx = 0;
          if (!this.isAttacking && !this.isHit && !this.isGuarding) this.currentMotion = 'idle';
        }
      }

      move(dir) {
        if (this.isAttacking || this.isHit || this.isGuarding) return;
        this.vx = dir * this.cfg.speed;
        this.facingRight = dir > 0;
        this.currentMotion = 'run';
      }

      jump() {
        if (this.isHit || this.isGuarding) return;
        if (this.isGrounded) {
          this.vy = this.cfg.jump;
          this.isGrounded = false;
          Sound.jump();
        } else if (this.cfg.canDoubleJump && !this.doubleJumped) {
          this.vy = this.cfg.jump * 0.9;
          this.doubleJumped = true;
          Sound.jump();
        }
      }

      guard(active) {
        if (this.isAttacking || this.isHit) return;
        this.isGuarding = active;
        if (active) {
          this.vx = 0;
          this.currentMotion = 'guard';
        } else if (this.currentMotion === 'guard') {
          this.currentMotion = 'idle';
        }
      }

      // 선비 3단 검술 콤보
      attackCombo() {
        if (this.isAttacking || this.isHit || this.isGuarding) return;

        if (this.comboStep === 0 || this.comboTimer <= 0) this.comboStep = 1;
        else if (this.comboStep === 1) this.comboStep = 2;
        else if (this.comboStep === 2) this.comboStep = 3;
        else this.comboStep = 1;

        this.comboTimer = 0.85;
        this.isAttacking = true;
        this.attackProgress = 0;
        const forward = this.facingRight ? 1 : -1;

        if (this.comboStep === 1) {
          // 1타: 전방 쾌속 찌르기
          this.currentMotion = 'attack1';
          this.attackDuration = 0.22;
          this.vx = forward * 5.5;
          Sound.thrust();
          this.createHitbox(this.cfg.lightDmg, 85, 45, false);
        } else if (this.comboStep === 2) {
          // 2타: 회전하며 올려치기
          this.currentMotion = 'attack2';
          this.attackDuration = 0.28;
          this.vx = forward * 7.0;
          Sound.spin();
          this.createHitbox(this.cfg.spinDmg, 100, 65, false);
        } else if (this.comboStep === 3) {
          // 3타: 공중 도약 후 지면 내리찍기
          this.currentMotion = 'attack3';
          this.attackDuration = 0.38;
          this.vy = -7.5;
          this.vx = forward * 8.0;
          Sound.slam();
          this.createHitbox(this.cfg.heavyDmg, 125, 80, true);
        }
      }

      specialSkill() {
        if (this.isAttacking || this.isHit || this.isGuarding) return;
        this.isAttacking = true;
        this.attackProgress = 0;
        this.attackDuration = 0.35;
        this.currentMotion = 'attack2';
        const forward = this.facingRight ? 1 : -1;
        this.vx = forward * 11;
        Sound.spin();
        this.createHitbox(85, 120, 60, true);
      }

      createHitbox(dmg, w, h, isHeavy) {
        this.hitbox = {
          x: this.facingRight ? this.x + 10 : this.x - w - 10,
          y: this.y - h - 10,
          w: w, h: h, damage: dmg, isHeavy: isHeavy, owner: this
        };
      }

      takeDamage(amount, isHeavy, attackerX) {
        if (this.isDead) return;
        if (this.isGuarding) {
          amount *= 0.25;
        } else {
          Sound.hit(isHeavy);
          this.isHit = true;
          this.currentMotion = 'hit';
          this.hitStunTimer = isHeavy ? 0.35 : 0.2;
          const push = this.x > attackerX ? 1 : -1;
          this.vx = push * (isHeavy ? 10 : 5);
        }
        this.hp -= Math.round(amount * this.cfg.defense);
        this.sp = Math.min(this.maxSp, this.sp + 15);
        if (this.hp <= 0) {
          this.hp = 0;
          this.isDead = true;
        }
      }

      // 선비 스프라이트 렌더링 (ctx.drawImage)
      render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        if (!this.facingRight) ctx.scale(-1, 1);

        const assetKey = `${this.cfg.id}_${this.currentMotion}`;
        const img = AssetManager.getImage(assetKey) || AssetManager.getImage(`${this.cfg.id}_idle`);

        if (img) {
          ctx.drawImage(img, -110, -145, 220, 220);
        }
        ctx.restore();
      }
    }

    /* =========================================================================
       6. 사신수 컷씬 & 시그니처 딜링 이펙트 매니저
    ========================================================================= */
    const StageRenderer = {
      seasonKey: 'SPRING',
      cutscene: null, // { charId, time, duration, caster, target }
      signatureEffect: null, // { charId, time, duration, target }
      screenShake: 0,

      setSeason(k) { this.seasonKey = k; },

      // 사신수 궁극기 발동 (L키)
      triggerUltimate(charId, caster, target) {
        Sound.roar(charId); // 사신수 고유 포효음 재생!
        this.screenShake = 25;
        this.cutscene = {
          charId: charId,
          time: 0,
          duration: 1.8,
          caster: caster,
          target: target
        };
      },

      // 컷씬 직후 시그니처 딜링 이펙트 발동!
      triggerSignatureEffect(charId, target) {
        this.screenShake = 35;
        this.signatureEffect = {
          charId: charId,
          time: 0,
          duration: 1.5,
          target: target
        };
        // 전체 시그니처 타격 대미지 (210 데미지)
        if (target) {
          target.takeDamage(210, true, SF.WIDTH / 2);
        }
      },

      update(dt) {
        if (this.screenShake > 0) {
          this.screenShake -= dt * 45;
          if (this.screenShake < 0) this.screenShake = 0;
        }

        // 컷씬 진행
        if (this.cutscene) {
          this.cutscene.time += dt;
          if (this.cutscene.time >= this.cutscene.duration) {
            const finishedCutscene = this.cutscene;
            this.cutscene = null;
            // 컷씬 직후 시그니처 이펙트 발동!
            this.triggerSignatureEffect(finishedCutscene.charId, finishedCutscene.target);
          }
        }

        // 시그니처 딜링 이펙트 진행
        if (this.signatureEffect) {
          this.signatureEffect.time += dt;
          if (this.signatureEffect.time >= this.signatureEffect.duration) {
            this.signatureEffect = null;
          }
        }
      },

      render(ctx) {
        ctx.save();

        if (this.screenShake > 0) {
          const sx = (Math.random() - 0.5) * this.screenShake;
          const sy = (Math.random() - 0.5) * this.screenShake;
          ctx.translate(sx, sy);
        }

        // 1. 배경 이미지
        const bgImg = AssetManager.getImage(`bg_${this.seasonKey}`);
        if (bgImg) ctx.drawImage(bgImg, 0, 0, SF.WIDTH, SF.HEIGHT);

        // 2. 사신수 시그니처 딜링 이펙트 (컷씬 직후 전 화면 타격)
        if (this.signatureEffect) {
          this.renderSignatureEffect(ctx, this.signatureEffect);
        }

        // 3. 풀스크린 궁극기 컷씬 (암전 & 웅장한 줌인)
        if (this.cutscene) {
          this.renderCutscene(ctx, this.cutscene);
        }

        ctx.restore();
      },

      renderCutscene(ctx, cs) {
        const cutsceneImg = AssetManager.getImage(`cutscene_${cs.charId}`);
        if (!cutsceneImg) return;

        ctx.save();
        const prog = cs.time / cs.duration;
        const alpha = Math.min(1.0, (1 - Math.abs(prog - 0.5) * 2) * 2.0);
        ctx.globalAlpha = alpha;

        // 화면 암전
        ctx.fillStyle = 'rgba(5, 4, 3, 0.92)';
        ctx.fillRect(0, 0, SF.WIDTH, SF.HEIGHT);

        // 사신수 일러스트 대각 줌인 컷인 연출
        const imgAspect = cutsceneImg.width / cutsceneImg.height;
        const targetH = SF.HEIGHT * 1.05;
        const targetW = targetH * imgAspect;
        const zoom = 1.0 + (prog * 0.15);

        ctx.translate(SF.WIDTH / 2, SF.HEIGHT / 2);
        ctx.scale(zoom, zoom);
        ctx.drawImage(cutsceneImg, -targetW / 2, -targetH / 2, targetW, targetH);

        // 붉은 낙관 도장
        ctx.restore();
      },

      // 사신수별 시그니처 딜링 이펙트
      renderSignatureEffect(ctx, ef) {
        ctx.save();
        const prog = ef.time / ef.duration;

        if (ef.charId === 'WHITE_TIGER') {
          // 백호: 거대한 천둥 벼락과 지면 파쇄
          ctx.strokeStyle = '#ffd166';
          ctx.lineWidth = 10;
          for (let i = 0; i < 7; i++) {
            ctx.beginPath();
            const bx = 120 + i * 160 + (Math.random() - 0.5) * 40;
            ctx.moveTo(bx, 0);
            ctx.lineTo(bx + (Math.random() - 0.5) * 80, 240);
            ctx.lineTo(bx + (Math.random() - 0.5) * 80, 440);
            ctx.lineTo(bx, SF.FLOOR_Y);
            ctx.stroke();
          }
          // 지면 파열
          ctx.fillStyle = 'rgba(255, 209, 102, 0.4)';
          ctx.fillRect(0, SF.FLOOR_Y - 30, SF.WIDTH, 50);

        } else if (ef.charId === 'VERMILION_BIRD') {
          // 주작: 하늘에서 쏟아지는 화염 유성우 (Meteor Rain)
          ctx.fillStyle = '#ef4444';
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 15;
          for (let m = 0; m < 20; m++) {
            const mx = (m * 70 + prog * 500) % SF.WIDTH;
            const my = (prog * 900 + m * 55) % SF.HEIGHT;
            ctx.beginPath();
            ctx.arc(mx, my, 18, 0, Math.PI * 2);
            ctx.fill();
          }

        } else if (ef.charId === 'BLUE_DRAGON') {
          // 청룡: 화면 전체를 가로지르는 질풍 검기 난무
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 14;
          for (let g = 0; g < 10; g++) {
            const gy = 100 + g * 50;
            const gx = -100 + (prog * 1800 + g * 120) % (SF.WIDTH + 300);
            ctx.beginPath();
            ctx.moveTo(gx - 180, gy - 20);
            ctx.lineTo(gx, gy + 20);
            ctx.stroke();
          }

        } else if (ef.charId === 'BLACK_TORTOISE') {
          // 현무: 바닥에서 솟구치는 거대한 명부 해일
          ctx.fillStyle = 'rgba(34, 197, 94, 0.7)';
          ctx.beginPath();
          ctx.moveTo(0, SF.HEIGHT);
          for (let wx = 0; wx <= SF.WIDTH; wx += 40) {
            const wy = SF.FLOOR_Y - 260 + Math.sin(wx * 0.02 + prog * 12) * 90;
            ctx.lineTo(wx, wy);
          }
          ctx.lineTo(SF.WIDTH, SF.HEIGHT);
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();
      }
    };

    /* =========================================================================
       7. 네트워크 & 메인 컨트롤러
    ========================================================================= */
    const Network = {
      peer: null, conn: null, isHost: false, isConnected: false, roomCode: '',
      initHost(onReady, onGuestJoin) {
        this.isHost = true;
        this.roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        this.peer = new Peer(`murim-seonbi-${this.roomCode}`);
        this.peer.on('open', () => onReady(this.roomCode));
        this.peer.on('connection', (c) => {
          this.conn = c;
          this.setupDataChannel(onGuestJoin);
        });
      },
      initGuest(code, onSuccess, onError) {
        this.isHost = false;
        this.roomCode = code.toUpperCase();
        this.peer = new Peer();
        this.peer.on('open', () => {
          this.conn = this.peer.connect(`murim-seonbi-${this.roomCode}`);
          this.setupDataChannel(onSuccess);
        });
        this.peer.on('error', (e) => { if (onError) onError(e); });
      },
      setupDataChannel(onReady) {
        this.conn.on('open', () => {
          this.isConnected = true;
          if (onReady) onReady();
        });
        this.conn.on('data', (d) => Game.handleNetworkMessage(d));
      },
      send(data) {
        if (this.conn && this.conn.open) this.conn.send(data);
      }
    };

    const Game = {
      canvas: null, ctx: null,
      player1: null, player2: null,
      isPractice: false, selectedCharId: 'WHITE_TIGER',
      roundTimer: 99, timerInterval: null, isGameOver: false, lastTime: 0,

      init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        Input.init();

        AssetManager.init(() => {
          this.setupLobbyCards();
          this.setupUIEvents();
          this.lastTime = performance.now();
          requestAnimationFrame((t) => this.loop(t));
        });
      },

      setupLobbyCards() {
        CHAR_KEYS.forEach(id => {
          const imgEl = document.getElementById(`card-img-${id}`);
          if (imgEl) imgEl.src = IMAGE_MANIFEST[`${id}_portrait`];
        });
      },

      setupUIEvents() {
        document.querySelectorAll('.char-card').forEach(card => {
          card.addEventListener('click', () => {
            document.querySelectorAll('.char-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            this.selectedCharId = card.dataset.char;
            Sound.thrust();
          });
        });

        document.getElementById('btn-practice-mode').addEventListener('click', () => {
          this.isPractice = true;
          const p2Id = CHAR_KEYS[Math.floor(Math.random() * CHAR_KEYS.length)];
          this.startBattle(this.selectedCharId, p2Id);
        });

        document.getElementById('btn-create-room').addEventListener('click', () => {
          this.isPractice = false;
          document.getElementById('modal-create-room').style.display = 'flex';
          Network.initHost((code) => {
            document.getElementById('display-room-code').innerText = code;
          }, () => {
            document.getElementById('modal-create-room').style.display = 'none';
            Network.send({ type: 'START', hostChar: this.selectedCharId });
          });
        });

        document.getElementById('btn-cancel-create').addEventListener('click', () => {
          document.getElementById('modal-create-room').style.display = 'none';
        });

        document.getElementById('btn-copy-code').addEventListener('click', () => {
          const c = document.getElementById('display-room-code').innerText;
          navigator.clipboard.writeText(c).then(() => alert('코드가 복사되었습니다!'));
        });

        document.getElementById('btn-join-modal').addEventListener('click', () => {
          document.getElementById('modal-join-room').style.display = 'flex';
        });

        document.getElementById('btn-cancel-join').addEventListener('click', () => {
          document.getElementById('modal-join-room').style.display = 'none';
        });

        document.getElementById('btn-confirm-join').addEventListener('click', () => {
          const code = document.getElementById('input-join-code').value.trim();
          if (code.length !== 6) return alert('6자리 코드를 입력하세요.');
          Network.initGuest(code, () => {
            document.getElementById('modal-join-room').style.display = 'none';
            Network.send({ type: 'GUEST_READY', guestChar: this.selectedCharId });
          });
        });

        document.getElementById('btn-rematch').addEventListener('click', () => {
          document.getElementById('result-screen').style.display = 'none';
          const p2Id = CHAR_KEYS[Math.floor(Math.random() * CHAR_KEYS.length)];
          this.startBattle(this.selectedCharId, p2Id);
        });

        document.getElementById('btn-to-select').addEventListener('click', () => {
          document.getElementById('battle-hud').style.display = 'none';
          document.getElementById('result-screen').style.display = 'none';
          document.getElementById('select-screen').style.display = 'flex';
          this.player1 = null;
          this.player2 = null;
        });
      },

      startBattle(p1Id, p2Id) {
        document.getElementById('select-screen').style.display = 'none';
        document.getElementById('battle-hud').style.display = 'flex';
        document.getElementById('result-screen').style.display = 'none';

        const seasons = ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER'];
        const chosen = seasons[Math.floor(Math.random() * seasons.length)];
        StageRenderer.setSeason(chosen);
        document.getElementById('season-text').innerText = SF.SEASONS[chosen].name;

        this.player1 = new SeonbiCharacter(SF.CHARACTERS[p1Id], 360, true);
        this.player2 = new SeonbiCharacter(SF.CHARACTERS[p2Id], 920, false);

        document.getElementById('img-avatar-p1').src = IMAGE_MANIFEST[`${p1Id}_portrait`];
        document.getElementById('name-p1').innerText = this.player1.cfg.nameKr;
        document.getElementById('title-p1').innerText = this.player1.cfg.title;

        document.getElementById('img-avatar-p2').src = IMAGE_MANIFEST[`${p2Id}_portrait`];
        document.getElementById('name-p2').innerText = this.player2.cfg.nameKr;
        document.getElementById('title-p2').innerText = this.player2.cfg.title;

        this.roundTimer = SF.ROUND_TIME;
        this.isGameOver = false;

        clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
          if (!this.isGameOver && this.roundTimer > 0) {
            this.roundTimer--;
            document.getElementById('timer-text').innerText = this.roundTimer;
            if (this.roundTimer <= 0) this.handleTimeout();
          }
        }, 1000);
      },

      handleTimeout() {
        this.isGameOver = true;
        let title = this.player1.hp > this.player2.hp ? `${this.player1.cfg.nameKr} 판정승!` : `${this.player2.cfg.nameKr} 판정승!`;
        this.showResult(title);
      },

      showResult(title) {
        this.isGameOver = true;
        clearInterval(this.timerInterval);
        document.getElementById('victory-title').innerText = title;
        document.getElementById('result-screen').style.display = 'flex';
      },

      handleNetworkMessage(d) {
        if (d.type === 'START') this.startBattle(d.hostChar, this.selectedCharId);
        else if (d.type === 'GUEST_READY') this.startBattle(this.selectedCharId, d.guestChar);
        else if (d.type === 'SYNC') {
          const r = Network.isHost ? this.player2 : this.player1;
          if (r) {
            r.x = d.x; r.y = d.y; r.facingRight = d.facingRight;
            r.hp = d.hp; r.sp = d.sp; r.currentMotion = d.currentMotion;
          }
        }
      },

      loop(timestamp) {
        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
        this.lastTime = timestamp;

        this.update(dt);
        this.render();

        requestAnimationFrame((t) => this.loop(t));
      },

      update(dt) {
        StageRenderer.update(dt);

        if (!this.player1 || !this.player2) return;

        // 1P 조작키 (WASD + JKL)
        if (!this.isGameOver && !this.player1.isDead) {
          if (Input.isDown('a')) this.player1.move(-1);
          else if (Input.isDown('d')) this.player1.move(1);

          if (Input.isJustPressed('w')) this.player1.jump();
          this.player1.guard(Input.isDown('s'));

          if (Input.isJustPressed('j')) this.player1.attackCombo();
          if (Input.isJustPressed('k')) this.player1.specialSkill();
          if (Input.isJustPressed('l') && this.player1.sp >= 100) {
            this.player1.sp = 0;
            // 사신수 궁극기 컷씬 & 딜링 트리거!
            StageRenderer.triggerUltimate(this.player1.cfg.id, this.player1, this.player2);
          }
        }

        // AI 봇
        if (this.isPractice && !this.player2.isDead && !this.isGameOver) {
          const dist = Math.abs(this.player2.x - this.player1.x);
          const fwd = this.player1.x > this.player2.x ? 1 : -1;
          if (dist > 150) {
            this.player2.move(fwd);
          } else {
            if (this.player2.sp >= 100) {
              this.player2.sp = 0;
              StageRenderer.triggerUltimate(this.player2.cfg.id, this.player2, this.player1);
            } else if (Math.random() < 0.04) {
              this.player2.attackCombo();
            }
          }
        }

        this.player1.update(dt);
        this.player2.update(dt);

        this.checkHit(this.player1, this.player2);
        this.checkHit(this.player2, this.player1);

        this.updateHUD();

        if (this.player1.isDead) this.showResult(`${this.player2.cfg.nameKr} 승리!`);
        else if (this.player2.isDead) this.showResult(`${this.player1.cfg.nameKr} 승리!`);
      },

      checkHit(atk, def) {
        if (!atk.hitbox || def.isDead) return;
        const h = atk.hitbox;
        if (h.x + h.w > def.x - 28 && h.x < def.x + 28 && h.y + h.h > def.y - 80 && h.y < def.y) {
          def.takeDamage(h.damage, h.isHeavy, atk.x);
          atk.sp = Math.min(atk.maxSp, atk.sp + 18);
          atk.hitbox = null;
        }
      },

      updateHUD() {
        document.getElementById('hp-p1').style.width = (this.player1.hp / this.player1.maxHp * 100) + '%';
        document.getElementById('hp-txt-p1').innerText = `${this.player1.hp} / ${this.player1.maxHp}`;
        document.getElementById('sp-p1').style.width = this.player1.sp + '%';

        document.getElementById('hp-p2').style.width = (this.player2.hp / this.player2.maxHp * 100) + '%';
        document.getElementById('hp-txt-p2').innerText = `${this.player2.hp} / ${this.player2.maxHp}`;
        document.getElementById('sp-p2').style.width = this.player2.sp + '%';

        const c1 = document.getElementById('combo-p1');
        if (this.player1.comboStep > 1 && this.player1.isAttacking) {
          c1.innerText = `${this.player1.comboStep}단 연계!`;
          c1.classList.add('active');
        } else {
          c1.classList.remove('active');
        }
      },

      render() {
        this.ctx.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
        StageRenderer.render(this.ctx);

        if (this.player1) this.player1.render(this.ctx);
        if (this.player2) this.player2.render(this.ctx);
      }
    };

    window.addEventListener('DOMContentLoaded', () => Game.init());
  </script>
</body>
</html>
"@

[System.IO.File]::WriteAllText([System.IO.Path]::Combine($curDir, "index.html"), $html, [System.Text.Encoding]::UTF8)
[System.IO.File]::WriteAllText([System.IO.Path]::Combine($curDir, "dist", "index.html"), $html, [System.Text.Encoding]::UTF8)
Write-Output "Integrated Seonbi & Four Gods successfully! Final size: $((Get-Item ([System.IO.Path]::Combine($curDir, "index.html"))).Length)"
