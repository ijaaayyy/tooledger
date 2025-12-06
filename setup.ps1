Write-Host "Tool-Ledger minimal setup script" -ForegroundColor Cyan

Write-Host "Installing npm dependencies..." -ForegroundColor Cyan
try {
    npm install
    Write-Host "npm install completed" -ForegroundColor Green
} catch {
    Write-Host "npm install failed. Please run 'npm install' manually and inspect errors." -ForegroundColor Red
    exit 1
}

Write-Host "\nStarting dev server (npm run dev). Press Ctrl+C to stop." -ForegroundColor Cyan
# Run npm run dev in the current shell so logs are visible
try {
    npm run dev
} catch {
    Write-Host "Failed to start dev server. Run 'npm run dev' manually to see errors." -ForegroundColor Red
    exit 1
}
