Add-Type -AssemblyName System.Drawing
$sourcePath = "c:\Users\MSI\OneDrive - POLYTECH INTL\Desktop\project\public\IMG_4612.png"
$srcImg = [System.Drawing.Image]::FromFile($sourcePath)

function Resize-Image($src, $w, $h, $destPath) {
    $bmp = New-Object System.Drawing.Bitmap $w, $h
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($src, 0, 0, $w, $h)
    $bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Output "Generated $destPath"
}

# iOS Icon
$iosIconPath = "c:\Users\MSI\OneDrive - POLYTECH INTL\Desktop\project\ios\App\App\Assets.xcassets\AppIcon.appiconset\AppIcon-512@2x.png"
Resize-Image $srcImg 1024 1024 $iosIconPath

# Android Mipmap Icons
$sizes = @{
    'mipmap-mdpi' = 48
    'mipmap-hdpi' = 72
    'mipmap-xhdpi' = 96
    'mipmap-xxhdpi' = 144
    'mipmap-xxxhdpi' = 192
}

foreach ($folder in $sizes.Keys) {
    $sz = $sizes[$folder]
    $baseDir = "c:\Users\MSI\OneDrive - POLYTECH INTL\Desktop\project\android\app\src\main\res\$folder"
    Resize-Image $srcImg $sz $sz "$baseDir\ic_launcher.png"
    Resize-Image $srcImg $sz $sz "$baseDir\ic_launcher_round.png"
    Resize-Image $srcImg $sz $sz "$baseDir\ic_launcher_foreground.png"
}

$srcImg.Dispose()
Write-Output "All native Android and iOS app icons updated successfully!"
