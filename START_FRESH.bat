@echo off
echo ============================================
echo   Clear Cache and Start Fresh
echo ============================================
echo.

echo Step 1: Stopping any running processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 >nul

echo Step 2: Clearing Next.js cache...
if exist .next rmdir /s /q .next
echo    ✓ Cleared .next folder

echo Step 3: Regenerating Prisma Client...
call npx prisma generate
echo    ✓ Prisma Client regenerated

echo Step 4: Starting dev server...
echo.
echo ============================================
echo   Server will start now...
echo   Visit: http://localhost:3000/products
echo ============================================
echo.
call npm run dev
