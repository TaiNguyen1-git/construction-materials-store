@echo off
echo ========================================
echo   ML Prediction Setup Script
echo ========================================
echo.

echo [1/4] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found!
    echo Please install Python from: https://www.python.org/downloads/
    pause
    exit /b 1
)
echo OK: Python is installed
echo.

echo [2/4] Installing Prophet and dependencies...
echo This may take 2-5 minutes...
pip install prophet==1.1.5 pandas==2.1.4 numpy==1.26.3 python-dotenv==1.0.0
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo OK: Dependencies installed
echo.

echo [3/4] Creating models directory...
if not exist "scripts\ml-service\models" (
    mkdir "scripts\ml-service\models"
    echo OK: Models directory created
) else (
    echo OK: Models directory already exists
)
echo.

echo [4/4] Verifying installation...
python -c "from prophet import Prophet; print('Prophet OK')" 2>nul
if errorlevel 1 (
    echo WARNING: Prophet import failed
    echo Try: pip install pystan==2.19.1.1
    pause
    exit /b 1
)
echo OK: Prophet is working
echo.

echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Run: npm run dev
echo 2. Visit: http://localhost:3000/admin/ml-training
echo 3. Click "Train All Models"
echo.
echo See ML_UPGRADE_GUIDE.md for full documentation
pause
