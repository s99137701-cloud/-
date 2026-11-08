# Build All Assets to pure Base64 Data URI
$curDir = (Get-Item -LiteralPath .).FullName

# 1. Read 4 JPGs to Base64
$pWhiteTiger = [System.IO.Path]::Combine($curDir, "assets", "white_tiger.jpg")
$pVermilionBird = [System.IO.Path]::Combine($curDir, "assets", "vermilion_bird.jpg")
$pBlueDragon = [System.IO.Path]::Combine($curDir, "assets", "blue_dragon.jpg")
$pBlackTortoise = [System.IO.Path]::Combine($curDir, "assets", "black_tortoise.jpg")

$b64WhiteTiger = "data:image/jpeg;base64," + [Convert]::ToBase64String([System.IO.File]::ReadAllBytes($pWhiteTiger))
$b64VermilionBird = "data:image/jpeg;base64," + [Convert]::ToBase64String([System.IO.File]::ReadAllBytes($pVermilionBird))
$b64BlueDragon = "data:image/jpeg;base64," + [Convert]::ToBase64String([System.IO.File]::ReadAllBytes($pBlueDragon))
$b64BlackTortoise = "data:image/jpeg;base64," + [Convert]::ToBase64String([System.IO.File]::ReadAllBytes($pBlackTortoise))

# 2. Generate 4 Season Background SVGs to Base64
function Get-BgBase64($skyTop, $skyMid, $skyBot, $mountainColor) {
  $svg = "<svg xmlns='http://www.w3.org/2000/svg' width='1280' height='720' viewBox='0 0 1280 720'>" +
    "<defs>" +
      "<linearGradient id='sky' x1='0%' y1='0%' x2='0%' y2='100%'>" +
        "<stop offset='0%' stop-color='$skyTop'/>" +
        "<stop offset='60%' stop-color='$skyMid'/>" +
        "<stop offset='100%' stop-color='$skyBot'/>" +
      "</linearGradient>" +
      "<linearGradient id='ground' x1='0%' y1='0%' x2='0%' y2='100%'>" +
        "<stop offset='0%' stop-color='#3d2f23'/>" +
        "<stop offset='100%' stop-color='#140f0b'/>" +
      "</linearGradient>" +
    "</defs>" +
    "<rect width='1280' height='720' fill='url(#sky)'/>" +
    "<path d='M0,380 Q320,180 640,320 T1280,260 L1280,720 L0,720 Z' fill='$mountainColor' opacity='0.35'/>" +
    "<path d='M0,430 Q280,280 580,390 T1280,340 L1280,720 L0,720 Z' fill='$mountainColor' opacity='0.65'/>" +
    "<g transform='translate(520, 310)'>" +
      "<rect x='0' y='100' width='240' height='170' fill='#2d2822' stroke='#120f0c' stroke-width='3'/>" +
      "<path d='M70,270 A50,50 0 0,1 170,270 Z' fill='#120f0c'/>" +
      "<path d='M-30,100 Q120,40 270,100 L250,118 Q120,70 -10,118 Z' fill='#181410'/>" +
      "<rect x='75' y='125' width='90' height='26' fill='#0d0b09' stroke='#c59b27' stroke-width='2'/>" +
      "<text x='120' y='143' fill='#f5efe2' font-family='sans-serif' font-size='12' font-weight='bold' text-anchor='middle'>사방문 (四方門)</text>" +
    "</g>" +
    "<rect x='0' y='580' width='1280' height='140' fill='url(#ground)'/>" +
    "<line x1='0' y1='580' x2='1280' y2='580' stroke='#120f0c' stroke-width='6'/>" +
  "</svg>"
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($svg.Trim())
  return "data:image/svg+xml;base64," + [Convert]::ToBase64String($bytes)
}

$b64BgSpring = Get-BgBase64 "#fbf6ec" "#eedbc9" "#ddc3ae" "#3d464d"
$b64BgSummer = Get-BgBase64 "#f2f8ee" "#d4e8d2" "#b2d6b4" "#223824"
$b64BgAutumn = Get-BgBase64 "#fbf2e2" "#ebd0b6" "#d6b293" "#52341d"
$b64BgWinter = Get-BgBase64 "#f0f4f8" "#d6e0ea" "#bcccdb" "#1e2838"

# 3. Generate 4 Seonbi Characters (7 motions each) to Base64
function Get-SeonbiBase64($robeColor, $sashColor, $motion) {
  $swordColor = "#e2e8f0"
  $skinColor = "#fed7aa"
  $hatColor = "#121417"
  
  $bodyX = 0; $bodyY = 0; $bodyRot = 0
  $armFront = ""; $armBack = ""; $robeExtra = ""
  
  if ($motion -eq "idle") {
    $armBack = "<path d='M-8,10 Q-20,25 -28,32' stroke='$robeColor' stroke-width='14' stroke-linecap='round' fill='none'/>"
    $armFront = "<path d='M12,12 Q28,24 35,16' stroke='$robeColor' stroke-width='14' stroke-linecap='round' fill='none'/><circle cx='36' cy='15' r='5' fill='$skinColor'/>"
    $armFront += "<path d='M36,15 L68,-15' stroke='$swordColor' stroke-width='4.5' stroke-linecap='round'/><line x1='33' y1='18' x2='40' y2='12' stroke='#d97706' stroke-width='6'/>"
  }
  elseif ($motion -eq "run") {
    $bodyRot = 16
    $bodyX = 8
    $robeExtra = "<path d='M-22,35 Q-48,45 -60,25 Q-40,65 -15,55 Z' fill='$robeColor' opacity='0.9'/>"
    $armBack = "<path d='M-5,10 Q-35,0 -50,-10' stroke='$robeColor' stroke-width='14' stroke-linecap='round' fill='none'/>"
    $armFront = "<path d='M10,12 Q25,28 40,20' stroke='$robeColor' stroke-width='14' stroke-linecap='round' fill='none'/><circle cx='41' cy='19' r='5' fill='$skinColor'/>"
    $armFront += "<path d='M41,19 L75,2' stroke='$swordColor' stroke-width='4.5' stroke-linecap='round'/>"
  }
  elseif ($motion -eq "attack1") {
    $bodyX = 26
    $bodyRot = 8
    $armFront = "<path d='M8,10 L52,10' stroke='$robeColor' stroke-width='14' stroke-linecap='round'/><circle cx='54' cy='10' r='5.5' fill='$skinColor'/>"
    $armFront += "<line x1='54' y1='10' x2='115' y2='10' stroke='$swordColor' stroke-width='5' stroke-linecap='round'/><polygon points='115,6 126,10 115,14' fill='#fff'/><circle cx='120' cy='10' r='8' fill='rgba(255,255,255,0.7)'/>"
  }
  elseif ($motion -eq "attack2") {
    $bodyX = 14
    $bodyRot = -15
    $robeExtra = "<path d='M-15,30 Q-35,60 -5,68 Q15,60 25,40 Z' fill='$robeColor'/>"
    $armFront = "<path d='M10,12 Q30,-10 45,-30' stroke='$robeColor' stroke-width='14' stroke-linecap='round'/><circle cx='46' cy='-31' r='5.5' fill='$skinColor'/>"
    $armFront += "<line x1='46' y1='-31' x2='85' y2='-75' stroke='$swordColor' stroke-width='6' stroke-linecap='round'/><path d='M20,40 A65,65 0 0,0 95,-70' fill='none' stroke='rgba(255,255,255,0.8)' stroke-width='7' stroke-linecap='round'/>"
  }
  elseif ($motion -eq "attack3") {
    $bodyY = -18
    $bodyRot = 24
    $robeExtra = "<path d='M-25,25 Q-45,15 -55,-5 Q-30,45 -10,50 Z' fill='$robeColor'/>"
    $armFront = "<path d='M12,5 L32,25' stroke='$robeColor' stroke-width='14' stroke-linecap='round'/><circle cx='34' cy='26' r='6' fill='$skinColor'/>"
    $armFront += "<line x1='34' y1='26' x2='65' y2='78' stroke='$swordColor' stroke-width='7' stroke-linecap='round'/><circle cx='68' cy='80' r='14' fill='#ffd166' opacity='0.8'/>"
  }
  elseif ($motion -eq "guard") {
    $bodyX = -6
    $armFront = "<path d='M10,14 L22,8' stroke='$robeColor' stroke-width='14' stroke-linecap='round'/><circle cx='23' cy='8' r='5.5' fill='$skinColor'/>"
    $armFront += "<line x1='23' y1='-35' x2='23' y2='45' stroke='$swordColor' stroke-width='6' stroke-linecap='round'/><circle cx='23' cy='5' r='40' fill='none' stroke='#ffd166' stroke-width='3' opacity='0.6'/>"
  }
  elseif ($motion -eq "hit") {
    $bodyX = -18
    $bodyRot = -18
    $armFront = "<path d='M5,12 L-15,30' stroke='$robeColor' stroke-width='14' stroke-linecap='round'/><circle cx='-16' cy='31' r='5.5' fill='$skinColor'/>"
    $armFront += "<line x1='-16' y1='31' x2='10' y2='55' stroke='$swordColor' stroke-width='4.5'/>"
  }

  $svg = "<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220' viewBox='-110 -110 220 220'>" +
    "<ellipse cx='0' cy='74' rx='42' ry='12' fill='rgba(0,0,0,0.35)'/>" +
    "<g transform='translate($bodyX, $bodyY) rotate($bodyRot)'>" +
      $armBack +
      "<rect x='-16' y='52' width='12' height='20' rx='5' fill='#181512'/>" +
      "<rect x='6' y='52' width='12' height='20' rx='5' fill='#181512'/>" +
      "<path d='M-24,18 L24,18 L34,60 Q0,72 -34,60 Z' fill='$robeColor' stroke='#12100d' stroke-width='3'/>" +
      $robeExtra +
      "<rect x='-20' y='-8' width='40' height='32' rx='8' fill='$robeColor' stroke='#12100d' stroke-width='3'/>" +
      "<path d='M-10,-8 L0,12 L10,-8' fill='none' stroke='#ffffff' stroke-width='3.5' stroke-linecap='round'/>" +
      "<rect x='-21' y='14' width='42' height='6' fill='$sashColor' stroke='#12100d' stroke-width='1.5'/>" +
      "<circle cx='0' cy='-28' r='18' fill='$skinColor'/>" +
      "<path d='M2,-30 L10,-28' stroke='#111' stroke-width='2.5' stroke-linecap='round'/>" +
      "<path d='M2,-22 Q6,-18 10,-22' fill='none' stroke='#222' stroke-width='1.5'/>" +
      "<path d='M-14,-38 L-10,-65 L10,-65 L14,-38 Z' fill='$hatColor' stroke='#0a0908' stroke-width='2'/>" +
      "<ellipse cx='0' cy='-38' rx='38' ry='7' fill='$hatColor' stroke='#0a0908' stroke-width='2.5'/>" +
      "<path d='M-12,-38 Q-24,-10 -16,15' fill='none' stroke='#1a1a1a' stroke-width='2' stroke-linecap='round'/>" +
      "<path d='M12,-38 Q2,-15 8,12' fill='none' stroke='#1a1a1a' stroke-width='2' stroke-linecap='round'/>" +
      $armFront +
    "</g></svg>"

  $bytes = [System.Text.Encoding]::UTF8.GetBytes($svg.Trim())
  return "data:image/svg+xml;base64," + [Convert]::ToBase64String($bytes)
}

$seonbiDefs = @{
  "WHITE_TIGER" = @{ robe = "#f1f5f9"; sash = "#cbd5e1" };
  "BLUE_DRAGON" = @{ robe = "#1d4ed8"; sash = "#60a5fa" };
  "VERMILION_BIRD" = @{ robe = "#b91c1c"; sash = "#f87171" };
  "BLACK_TORTOISE" = @{ robe = "#15803d"; sash = "#4ade80" }
}
$motions = @("idle", "run", "attack1", "attack2", "attack3", "guard", "hit")

# Build JavaScript manifest string
$manifestSb = [System.Text.StringBuilder]::new()
[void]$manifestSb.AppendLine("    var IMAGE_MANIFEST = {")
[void]$manifestSb.AppendLine("      bg_SPRING: '$b64BgSpring',")
[void]$manifestSb.AppendLine("      bg_SUMMER: '$b64BgSummer',")
[void]$manifestSb.AppendLine("      bg_AUTUMN: '$b64BgAutumn',")
[void]$manifestSb.AppendLine("      bg_WINTER: '$b64BgWinter',")
[void]$manifestSb.AppendLine("      WHITE_TIGER_portrait: '$b64WhiteTiger',")
[void]$manifestSb.AppendLine("      VERMILION_BIRD_portrait: '$b64VermilionBird',")
[void]$manifestSb.AppendLine("      BLUE_DRAGON_portrait: '$b64BlueDragon',")
[void]$manifestSb.AppendLine("      BLACK_TORTOISE_portrait: '$b64BlackTortoise',")
[void]$manifestSb.AppendLine("      cutscene_WHITE_TIGER: '$b64WhiteTiger',")
[void]$manifestSb.AppendLine("      cutscene_VERMILION_BIRD: '$b64VermilionBird',")
[void]$manifestSb.AppendLine("      cutscene_BLUE_DRAGON: '$b64BlueDragon',")
[void]$manifestSb.AppendLine("      cutscene_BLACK_TORTOISE: '$b64BlackTortoise',")

foreach ($ck in $seonbiDefs.Keys) {
  $c = $seonbiDefs[$ck]
  foreach ($m in $motions) {
    $b64Spr = Get-SeonbiBase64 $c.robe $c.sash $m
    [void]$manifestSb.AppendLine("      ${ck}_${m}: '$b64Spr',")
  }
}
[void]$manifestSb.AppendLine("    };")

$manifestJs = $manifestSb.ToString()

# Read template.html and replace
$templatePath = [System.IO.Path]::Combine($curDir, "template.html")
$template = [System.IO.File]::ReadAllText($templatePath, [System.Text.Encoding]::UTF8)

# Replace the manifest and placeholders
$targetToReplace = "/*__ILLUST_DATA__*/`r`n`r`n/*__SEONBI_SPRITES__*/"
if (-not $template.Contains($targetToReplace)) {
  $targetToReplace = "/*__ILLUST_DATA__*/`n`n/*__SEONBI_SPRITES__*/"
}

# We replace from "/*__ILLUST_DATA__*/" down to the end of IMAGE_MANIFEST definition
$startIdx = $template.IndexOf("/*__ILLUST_DATA__*/")
$endMarker = "var CHAR_KEYS = ['WHITE_TIGER', 'BLUE_DRAGON', 'VERMILION_BIRD', 'BLACK_TORTOISE'];"
$endIdx = $template.IndexOf($endMarker)

if ($startIdx -ge 0 -and $endIdx -gt $startIdx) {
  $part1 = $template.Substring(0, $startIdx)
  $part2 = $template.Substring($endIdx)
  $finalHtml = $part1 + $manifestJs + "`n    " + $part2
} else {
  Write-Error "Could not find start or end index in template.html"
  exit 1
}

# Also update AssetManager.init in the template to be bulletproof with timeout & complete check
$oldAssetMgr = @"
    var AssetManager = {
      images: {},
      loadedCount: 0,
      totalCount: 0,

      init: function(onComplete) {
        var keys = Object.keys(IMAGE_MANIFEST);
        this.totalCount = keys.length;
        this.loadedCount = 0;

        var self = this;
        var fillBar = document.getElementById('preload-fill');
        var statusText = document.getElementById('preload-status');

        keys.forEach(function(key) {
          var img = new Image();
          img.onload = function() {
            self.images[key] = img;
            self.loadedCount++;
            var pct = Math.round((self.loadedCount / self.totalCount) * 100);
            if (fillBar) fillBar.style.width = pct + '%';
            if (statusText) statusText.innerText = '선비 검술 & 사신수 에셋 로딩 중... (' + pct + '%) [' + self.loadedCount + '/' + self.totalCount + ']';

            if (self.loadedCount >= self.totalCount) {
              setTimeout(function() {
                var screen = document.getElementById('preload-screen');
                if (screen) {
                  screen.style.opacity = '0';
                  setTimeout(function() { screen.style.display = 'none'; }, 400);
                }
                if (onComplete) onComplete();
              }, 200);
            }
          };
          img.onerror = function() {
            self.loadedCount++;
            if (self.loadedCount >= self.totalCount && onComplete) onComplete();
          };
          img.src = IMAGE_MANIFEST[key];
        });
      },

      getImage: function(k) { return this.images[k] || null; }
    };
"@

$newAssetMgr = @"
    var AssetManager = {
      images: {},
      loadedCount: 0,
      totalCount: 0,

      init: function(onComplete) {
        var keys = Object.keys(IMAGE_MANIFEST);
        this.totalCount = keys.length;
        this.loadedCount = 0;

        var self = this;
        var fillBar = document.getElementById('preload-fill');
        var statusText = document.getElementById('preload-status');
        var isFinished = false;

        function finishLoading() {
          if (isFinished) return;
          isFinished = true;
          if (fillBar) fillBar.style.width = '100%';
          if (statusText) statusText.innerText = '선비 검술 & 사신수 에셋 준비 완료! (100%)';
          setTimeout(function() {
            var screen = document.getElementById('preload-screen');
            if (screen) {
              screen.style.opacity = '0';
              setTimeout(function() { screen.style.display = 'none'; }, 300);
            }
            if (onComplete) onComplete();
          }, 150);
        }

        // 안전 타임아웃: Base64는 로컬 파일이므로 1초 이상 지연될 경우 즉시 게임 시작!
        setTimeout(finishLoading, 1000);

        function checkOne(img, key) {
          if (self.images[key]) return;
          self.images[key] = img;
          self.loadedCount++;
          var pct = Math.round((self.loadedCount / self.totalCount) * 100);
          if (fillBar) fillBar.style.width = pct + '%';
          if (statusText) statusText.innerText = '선비 검술 & 사신수 에셋 로딩 중... (' + pct + '%) [' + self.loadedCount + '/' + self.totalCount + ']';

          if (self.loadedCount >= self.totalCount) {
            finishLoading();
          }
        }

        keys.forEach(function(key) {
          var img = new Image();
          img.onload = function() { checkOne(img, key); };
          img.onerror = function() { checkOne(img, key); };
          img.src = IMAGE_MANIFEST[key];

          // Data URI는 할당 즉시 메모리에 올라와 complete일 수 있음
          if (img.complete) {
            setTimeout(function() { checkOne(img, key); }, 0);
          }
        });
      },

      getImage: function(k) { return this.images[k] || null; }
    };
"@

$finalHtml = $finalHtml.Replace($oldAssetMgr, $newAssetMgr)

# Remove redundant loop if present
$finalHtml = $finalHtml.Replace("    CHAR_KEYS.forEach(function(ck) {`r`n      MOTIONS.forEach(function(m) {`r`n        IMAGE_MANIFEST[ck + '_' + m] = SEONBI_SPRITES[ck][m];`r`n      });`r`n    });`r`n", "")
$finalHtml = $finalHtml.Replace("    CHAR_KEYS.forEach(function(ck) {`n      MOTIONS.forEach(function(m) {`n        IMAGE_MANIFEST[ck + '_' + m] = SEONBI_SPRITES[ck][m];`n      });`n    });`n", "")

$indexPath = [System.IO.Path]::Combine($curDir, "index.html")
$distPath = [System.IO.Path]::Combine($curDir, "dist", "index.html")

[System.IO.File]::WriteAllText($indexPath, $finalHtml, [System.Text.Encoding]::UTF8)
[System.IO.File]::WriteAllText($distPath, $finalHtml, [System.Text.Encoding]::UTF8)

Write-Output "Successfully built 100% Base64 Embedded index.html! Size: $((Get-Item -LiteralPath $indexPath).Length) bytes"
