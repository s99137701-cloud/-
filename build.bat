@echo off
chcp 65001 > nul
echo ====================================================
echo  사방신 무림전 - 배포 번들 및 단일 파일 자동 빌드
echo ====================================================

powershell -NoProfile -ExecutionPolicy Bypass -Command "& { $projDir = '%~dp0'; $distDir = \"$projDir\dist\"; if (!(Test-Path $distDir)) { New-Item -ItemType Directory -Path $distDir -Force }; $css = Get-Content \"$projDir\css\style.css\" -Raw -Encoding UTF8; $jsOrder = @('constants.js','input.js','network.js','audio.js','particles.js','stage.js','characters.js','projectile.js','stickman.js','ai.js','combat.js','main.js'); $combinedJs = ''; foreach ($f in $jsOrder) { $path = if (Test-Path \"$projDir\js\engine\$f\") { \"$projDir\js\engine\$f\" } else { \"$projDir\js\gameplay\$f\" }; if (!(Test-Path $path)) { $path = \"$projDir\js\$f\" }; if (Test-Path $path) { $combinedJs += \"`n/* === $f === */`n\" + (Get-Content $path -Raw -Encoding UTF8) + \"`n\" } }; $html = Get-Content \"$projDir\index.html\" -Raw -Encoding UTF8; $html = $html -replace '<link rel=\"stylesheet\" href=\"css/style.css\">', \"<style>`n$css`n</style>\"; $html = $html -replace '(?s)<script src=\"js/.*?</script>', ''; $bundleScript = \"<script>`n$combinedJs`n</script>\"; $html = $html -replace '</body>', \"$bundleScript`n</body>\"; Set-Content -Path \"$distDir\index.html\" -Value $html -Encoding UTF8; Add-Type -AssemblyName System.IO.Compression.FileSystem; $zipPath = \"$projDir\four_gods_stickman.zip\"; Remove-Item $zipPath -Force -ErrorAction SilentlyContinue; [System.IO.Compression.ZipFile]::CreateFromDirectory(\"$projDir\", $zipPath); Write-Host ' [빌드 완료] dist/index.html (단일 배포 파일) 및 four_gods_stickman.zip 생성 완료!' -ForegroundColor Green }"

echo.
echo 배포용 단일 파일 경로: dist\index.html
echo 배포용 압축 파일 경로: four_gods_stickman.zip
echo ====================================================
