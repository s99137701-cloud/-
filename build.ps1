# 사방신 무림전 - 배포 번들 생성 스크립트
$currentDir = (Get-Item -LiteralPath .).FullName
$distDir = Join-Path $currentDir "dist"
if (!(Test-Path -LiteralPath $distDir)) {
    New-Item -ItemType Directory -LiteralPath $distDir -Force | Out-Null
}

$cssPath = Join-Path $currentDir "css\style.css"
$css = Get-Content -LiteralPath $cssPath -Raw -Encoding UTF8

$jsOrder = @(
  "constants.js",
  "input.js",
  "network.js",
  "audio.js",
  "particles.js",
  "stage.js",
  "characters.js",
  "projectile.js",
  "stickman.js",
  "ai.js",
  "combat.js",
  "main.js"
)

$combinedJs = ""
foreach ($f in $jsOrder) {
  $p1 = Join-Path $currentDir "js\engine\$f"
  $p2 = Join-Path $currentDir "js\gameplay\$f"
  $p3 = Join-Path $currentDir "js\$f"
  $target = if (Test-Path -LiteralPath $p1) { $p1 } elseif (Test-Path -LiteralPath $p2) { $p2 } else { $p3 }
  if (Test-Path -LiteralPath $target) {
    $content = Get-Content -LiteralPath $target -Raw -Encoding UTF8
    $combinedJs += "`n/* === $f === */`n" + $content + "`n"
  }
}

$htmlPath = Join-Path $currentDir "index.html"
$html = Get-Content -LiteralPath $htmlPath -Raw -Encoding UTF8
$html = $html -replace '<link rel="stylesheet" href="css/style.css">', "<style>`n$css`n</style>"
$html = $html -replace '(?s)<script src="js/.*?</script>', ''
$bundleScript = "<script>`n$combinedJs`n</script>"
$html = $html -replace '</body>', "$bundleScript`n</body>"

$outHtml = Join-Path $distDir "index.html"
Set-Content -LiteralPath $outHtml -Value $html -Encoding UTF8

Write-Host " [성공] dist/index.html 올인원 단일 배포 파일이 정상 생성되었습니다!" -ForegroundColor Green
