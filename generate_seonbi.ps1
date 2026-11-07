function Generate-SeonbiSvg($robeColor, $sashColor, $motion) {
  $swordColor = "#e2e8f0"
  $skinColor = "#fed7aa"
  $hatColor = "#121417"
  
  $bodyX = 0
  $bodyY = 0
  $bodyRot = 0
  $armFront = ""
  $armBack = ""
  $robeExtra = ""
  
  if ($motion -eq "idle") {
    $armBack = '<path d="M-8,10 Q-20,25 -28,32" stroke="' + $robeColor + '" stroke-width="14" stroke-linecap="round" fill="none"/>'
    $armFront = '<path d="M12,12 Q28,24 35,16" stroke="' + $robeColor + '" stroke-width="14" stroke-linecap="round" fill="none"/><circle cx="36" cy="15" r="5" fill="' + $skinColor + '"/>'
    $armFront += '<path d="M36,15 L68,-15" stroke="' + $swordColor + '" stroke-width="4.5" stroke-linecap="round"/><line x1="33" y1="18" x2="40" y2="12" stroke="#d97706" stroke-width="6"/>'
  }
  elseif ($motion -eq "run") {
    $bodyRot = 16
    $bodyX = 8
    $robeExtra = '<path d="M-22,35 Q-48,45 -60,25 Q-40,65 -15,55 Z" fill="' + $robeColor + '" opacity="0.9"/>'
    $armBack = '<path d="M-5,10 Q-35,0 -50,-10" stroke="' + $robeColor + '" stroke-width="14" stroke-linecap="round" fill="none"/>'
    $armFront = '<path d="M10,12 Q25,28 40,20" stroke="' + $robeColor + '" stroke-width="14" stroke-linecap="round" fill="none"/><circle cx="41" cy="19" r="5" fill="' + $skinColor + '"/>'
    $armFront += '<path d="M41,19 L75,2" stroke="' + $swordColor + '" stroke-width="4.5" stroke-linecap="round"/>'
  }
  elseif ($motion -eq "attack1") {
    $bodyX = 26
    $bodyRot = 8
    $armFront = '<path d="M8,10 L52,10" stroke="' + $robeColor + '" stroke-width="14" stroke-linecap="round"/><circle cx="54" cy="10" r="5.5" fill="' + $skinColor + '"/>'
    $armFront += '<line x1="54" y1="10" x2="115" y2="10" stroke="' + $swordColor + '" stroke-width="5" stroke-linecap="round"/><polygon points="115,6 126,10 115,14" fill="#fff"/><circle cx="120" cy="10" r="8" fill="rgba(255,255,255,0.7)"/>'
  }
  elseif ($motion -eq "attack2") {
    $bodyX = 14
    $bodyRot = -15
    $robeExtra = '<path d="M-15,30 Q-35,60 -5,68 Q15,60 25,40 Z" fill="' + $robeColor + '"/>'
    $armFront = '<path d="M10,12 Q30,-10 45,-30" stroke="' + $robeColor + '" stroke-width="14" stroke-linecap="round"/><circle cx="46" cy="-31" r="5.5" fill="' + $skinColor + '"/>'
    $armFront += '<line x1="46" y1="-31" x2="85" y2="-75" stroke="' + $swordColor + '" stroke-width="6" stroke-linecap="round"/><path d="M20,40 A65,65 0 0,0 95,-70" fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="7" stroke-linecap="round"/>'
  }
  elseif ($motion -eq "attack3") {
    $bodyY = -18
    $bodyRot = 24
    $robeExtra = '<path d="M-25,25 Q-45,15 -55,-5 Q-30,45 -10,50 Z" fill="' + $robeColor + '"/>'
    $armFront = '<path d="M12,5 L32,25" stroke="' + $robeColor + '" stroke-width="14" stroke-linecap="round"/><circle cx="34" cy="26" r="6" fill="' + $skinColor + '"/>'
    $armFront += '<line x1="34" y1="26" x2="65" y2="78" stroke="' + $swordColor + '" stroke-width="7" stroke-linecap="round"/><circle cx="68" cy="80" r="14" fill="#ffd166" opacity="0.8"/>'
  }
  elseif ($motion -eq "guard") {
    $bodyX = -6
    $armFront = '<path d="M10,14 L22,8" stroke="' + $robeColor + '" stroke-width="14" stroke-linecap="round"/><circle cx="23" cy="8" r="5.5" fill="' + $skinColor + '"/>'
    $armFront += '<line x1="23" y1="-35" x2="23" y2="45" stroke="' + $swordColor + '" stroke-width="6" stroke-linecap="round"/><circle cx="23" cy="5" r="40" fill="none" stroke="#ffd166" stroke-width="3" opacity="0.6"/>'
  }
  elseif ($motion -eq "hit") {
    $bodyX = -18
    $bodyRot = -18
    $armFront = '<path d="M5,12 L-15,30" stroke="' + $robeColor + '" stroke-width="14" stroke-linecap="round"/><circle cx="-16" cy="31" r="5.5" fill="' + $skinColor + '"/>'
    $armFront += '<line x1="-16" y1="31" x2="10" y2="55" stroke="' + $swordColor + '" stroke-width="4.5"/>'
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

  return "data:image/svg+xml;utf8," + [System.Uri]::EscapeDataString($svg.Trim())
}

$colors = @{
  "WHITE_TIGER" = @{ robe = "#f1f5f9"; sash = "#cbd5e1" };
  "BLUE_DRAGON" = @{ robe = "#1d4ed8"; sash = "#60a5fa" };
  "VERMILION_BIRD" = @{ robe = "#b91c1c"; sash = "#f87171" };
  "BLACK_TORTOISE" = @{ robe = "#15803d"; sash = "#4ade80" }
}

$motions = @("idle", "run", "attack1", "attack2", "attack3", "guard", "hit")
$sb = [System.Text.StringBuilder]::new()
[void]$sb.AppendLine("const SEONBI_SPRITES = {")

foreach ($k in $colors.Keys) {
  $c = $colors[$k]
  [void]$sb.AppendLine("  ${k}: {")
  foreach ($m in $motions) {
    $uri = Generate-SeonbiSvg $c.robe $c.sash $m
    [void]$sb.AppendLine("    ${m}: '$uri',")
  }
  [void]$sb.AppendLine("  },")
}
[void]$sb.AppendLine("};")

$curDir = (Get-Item -LiteralPath .).FullName
$outFile = [System.IO.Path]::Combine($curDir, "assets", "seonbi_sprites.js")
[System.IO.File]::WriteAllText($outFile, $sb.ToString(), [System.Text.Encoding]::UTF8)
Write-Output "Done generating seonbi sprites at $outFile"
