$targetSdk = "$env:LOCALAPPDATA\Android\Sdk"
if (-not (Test-Path $targetSdk)) {
    New-Item -ItemType Directory -Force -Path $targetSdk | Out-Null
}

$sourceSdk = "C:\Program Files (x86)\Android\android-sdk"
robocopy $sourceSdk $targetSdk /E /R:1 /W:1 /NP /NFL /NDL

$licDir = "$targetSdk\licenses"
if (-not (Test-Path $licDir)) {
    New-Item -ItemType Directory -Force -Path $licDir | Out-Null
}

$licContent = @"
24333f8a63b6825ea9c5514f83c2829b004d1fee
d56f5187479451eabf01fb78ba6edcb7640649cb
8933bad161af4178b1185d1a37fbf41ea5269c55
"@

Set-Content -Path "$licDir\android-sdk-license" -Value $licContent -Encoding ASCII
Set-Content -Path "$licDir\android-sdk-preview-license" -Value "84831b9409646a918e30573bab4c9c91346d8abd" -Encoding ASCII

Write-Output "Android SDK and licenses established at: $targetSdk"
