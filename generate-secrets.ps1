# Generate Secrets for .env file
Write-Host "=== GENERATE SECRETS FOR .ENV ===" -ForegroundColor Green
Write-Host ""

# Generate NEXTAUTH_SECRET (32 chars)
$nextauthSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
Write-Host "NEXTAUTH_SECRET (copy this):" -ForegroundColor Yellow
Write-Host $nextauthSecret -ForegroundColor Cyan
Write-Host ""

# Generate POSTGRES_PASSWORD (16 chars)
$postgresPassword = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 16 | ForEach-Object {[char]$_})
Write-Host "POSTGRES_PASSWORD (copy this):" -ForegroundColor Yellow
Write-Host $postgresPassword -ForegroundColor Cyan
Write-Host ""

# Generate REDIS_PASSWORD (16 chars)
$redisPassword = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 16 | ForEach-Object {[char]$_})
Write-Host "REDIS_PASSWORD (copy this):" -ForegroundColor Yellow
Write-Host $redisPassword -ForegroundColor Cyan
Write-Host ""

Write-Host "=== COPY THESE TO YOUR .ENV FILE ===" -ForegroundColor Green
Write-Host ""

Write-Host "For Development (.env):" -ForegroundColor Yellow
Write-Host "NEXTAUTH_SECRET=`"$nextauthSecret`""
Write-Host "NEXTAUTH_URL=`"http://localhost:3000`""
Write-Host "REDIS_URL=`"`""
Write-Host ""

Write-Host "For Production Docker (.env):" -ForegroundColor Yellow
Write-Host "NEXTAUTH_SECRET=`"$nextauthSecret`""
Write-Host "NEXTAUTH_URL=`"https://yourdomain.com`""
Write-Host "POSTGRES_PASSWORD=`"$postgresPassword`""
Write-Host "REDIS_PASSWORD=`"$redisPassword`""
Write-Host "DATABASE_URL=`"postgresql://construction_user:$postgresPassword@postgres:5432/construction_materials_store`""
Write-Host "REDIS_URL=`"redis://:$redisPassword@redis:6379`""
Write-Host ""

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
