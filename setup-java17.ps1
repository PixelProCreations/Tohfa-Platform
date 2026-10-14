# Download and setup Java 17 for Android development
$javaUrl = "https://aka.ms/download-jdk/microsoft-jdk-17.0.13-windows-x64.msi"
$installerPath = "$env:TEMP\microsoft-jdk-17.msi"

Write-Host "Downloading Microsoft OpenJDK 17..." -ForegroundColor Cyan
Invoke-WebRequest -Uri $javaUrl -OutFile $installerPath

Write-Host "Installing Java 17..." -ForegroundColor Cyan
Start-Process msiexec.exe -Wait -ArgumentList "/i `"$installerPath`" /quiet /norestart ADDLOCAL=FeatureMain,FeatureEnvironment,FeatureJavaHome"

Write-Host "Java 17 installed successfully!" -ForegroundColor Green
Write-Host "Please restart your terminal and run 'java -version' to verify" -ForegroundColor Yellow

Remove-Item $installerPath -ErrorAction SilentlyContinue
