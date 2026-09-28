$tempDir = "$env:TEMP\ipa_build"
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
$payloadDir = "$tempDir\Payload\TaskAndEventManager.app"
New-Item -ItemType Directory -Force -Path $payloadDir | Out-Null

Copy-Item -Path "ios\App\App\public\*" -Destination $payloadDir -Recurse -Force
Copy-Item -Path "scripts\Info-Production.plist" -Destination "$payloadDir\Info.plist" -Force
Copy-Item -Path "ios\App\App\capacitor.config.json" -Destination $payloadDir -Force
Copy-Item -Path "ios\App\App\Assets.xcassets\AppIcon.appiconset\AppIcon-512@2x.png" -Destination "$payloadDir\AppIcon60x60@2x.png" -Force
Copy-Item -Path "public\IMG_4612.png" -Destination "$payloadDir\AppIcon.png" -Force

$zipPath = "$env:TEMP\TaskAndEventManager.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

Compress-Archive -Path "$tempDir\Payload" -DestinationPath $zipPath -Force

$finalIpa = "C:\Users\MSI\OneDrive - POLYTECH INTL\Desktop\TaskAndEventManager.ipa"
if (Test-Path $finalIpa) { Remove-Item $finalIpa -Force }
Move-Item -Path $zipPath -Destination $finalIpa -Force

Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue

Get-Item $finalIpa | Select-Object Name, Length, LastWriteTime
