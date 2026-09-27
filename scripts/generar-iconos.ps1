# Genera los íconos PNG de la app (misma figura que public/icono.svg).
# Uso: powershell -ExecutionPolicy Bypass -File scripts\generar-iconos.ps1
Add-Type -AssemblyName System.Drawing

$raiz = Split-Path -Parent $PSScriptRoot
$destino = Join-Path $raiz 'public'

function Color($hex) { [System.Drawing.ColorTranslator]::FromHtml($hex) }

function Rectangulo-Redondeado([float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $p.AddArc($x, $y, $d, $d, 180, 90)
  $p.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $p.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $p.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $p.CloseFigure()
  return $p
}

# $redondeado: esquinas del fondo redondeadas (ícono normal) o fondo completo (ícono "maskable")
function Dibujar([int]$tamano, [string]$archivo, [bool]$redondeado, [float]$margen) {
  $bmp = New-Object System.Drawing.Bitmap $tamano, $tamano
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.Clear([System.Drawing.Color]::Transparent)

  $s = $tamano / 512
  if ($redondeado) { $g.FillPath((New-Object System.Drawing.SolidBrush (Color '#2d1206')), (Rectangulo-Redondeado 0 0 $tamano $tamano (96 * $s))) }
  else { $g.Clear((Color '#2d1206')) }

  # El dibujo se reduce hacia el centro según el margen (zona segura de los íconos maskable)
  $k = $s * (1 - 2 * $margen)
  $o = $tamano * $margen
  $R = { param($x, $y, $w, $h, $r) Rectangulo-Redondeado ($o + $x * $k) ($o + $y * $k) ($w * $k) ($h * $k) ($r * $k) }

  $carta = & $R 116 66 280 380 26
  $g.FillPath((New-Object System.Drawing.SolidBrush (Color '#fffaf0')), $carta)
  $g.DrawPath((New-Object System.Drawing.Pen (Color '#f9c74f'), (14 * $k)), $carta)
  $g.FillPath((New-Object System.Drawing.SolidBrush (Color '#e63946')), (& $R 146 98 104 150 10))
  $g.FillPath((New-Object System.Drawing.SolidBrush (Color '#f9c74f')), (& $R 262 98 104 150 10))
  $g.FillPath((New-Object System.Drawing.SolidBrush (Color '#2a9d8f')), (& $R 146 262 104 150 10))
  $g.FillPath((New-Object System.Drawing.SolidBrush (Color '#457b9d')), (& $R 262 262 104 150 10))
  $g.FillEllipse((New-Object System.Drawing.SolidBrush (Color '#7a4a1f')), ($o + 164 * $k), ($o + 139 * $k), (68 * $k), (68 * $k))
  $g.FillEllipse((New-Object System.Drawing.SolidBrush (Color '#c98a4b')), ($o + 178 * $k), ($o + 152 * $k), (20 * $k), (20 * $k))

  $bmp.Save((Join-Path $destino $archivo), [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
}

Dibujar 192 'icono-192.png' $true 0
Dibujar 512 'icono-512.png' $true 0
Dibujar 512 'icono-maskable-512.png' $false 0.1
Dibujar 180 'apple-touch-icon.png' $false 0.06
Write-Host 'Íconos generados en public/'
