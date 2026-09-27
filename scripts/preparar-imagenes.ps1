# Copia las 54 cartas desde la carpeta de origen, las renombra por número (01.jpg ... 54.jpg)
# y genera dos versiones: impresión (800 px de ancho) y miniatura (220 px) para la vista previa.
#
# Uso:  powershell -ExecutionPolicy Bypass -File scripts\preparar-imagenes.ps1 -Origen "C:\ruta\a\las\cartas"

param(
  [Parameter(Mandatory = $true)][string]$Origen,
  [int]$AnchoImpresion = 800,
  [int]$AnchoMiniatura = 220,
  [int]$Calidad = 85
)

Add-Type -AssemblyName System.Drawing

$raiz = Split-Path -Parent $PSScriptRoot
$destino = Join-Path $raiz "public\cartas"
$destinoMin = Join-Path $destino "min"
New-Item -ItemType Directory -Force $destinoMin | Out-Null

$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$params = New-Object System.Drawing.Imaging.EncoderParameters 1
$params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), ([long]$Calidad)

function Guardar-Redimensionada($img, [int]$ancho, [string]$ruta) {
  $alto = [int][math]::Round($img.Height * $ancho / $img.Width)
  $bmp = New-Object System.Drawing.Bitmap $ancho, $alto
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.DrawImage($img, 0, 0, $ancho, $alto)
  $bmp.Save($ruta, $codec, $params)
  $g.Dispose(); $bmp.Dispose()
}

$encontradas = @{}
Get-ChildItem $Origen -File | Where-Object { $_.Extension -match '^\.jpe?g$' } | ForEach-Object {
  if ($_.Name -match '^(\d+)') {
    $num = [int]$Matches[1]
    if ($num -ge 1 -and $num -le 54) {
      $nombre = '{0:D2}.jpg' -f $num
      $img = [System.Drawing.Image]::FromFile($_.FullName)
      Guardar-Redimensionada $img $AnchoImpresion (Join-Path $destino $nombre)
      Guardar-Redimensionada $img $AnchoMiniatura (Join-Path $destinoMin $nombre)
      if ($img.Width -lt 600) { Write-Warning ("Carta {0} tiene baja resolución ({1}x{2}): {3}" -f $num, $img.Width, $img.Height, $_.Name) }
      $img.Dispose()
      $encontradas[$num] = $_.Name
    }
  }
}

$faltantes = 1..54 | Where-Object { -not $encontradas.ContainsKey($_) }
Write-Host ("Cartas procesadas: {0}/54" -f $encontradas.Count)
if ($faltantes) { Write-Warning ("Faltan: " + ($faltantes -join ', ')) }
