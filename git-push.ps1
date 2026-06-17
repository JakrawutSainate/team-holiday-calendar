# HolidayHQ Git Auto Add & Push Utility
Write-Host "Staging all changes..." -ForegroundColor Cyan
git add .

# Check if there are changes to commit
$status = git status --porcelain
if ($status) {
    Write-Host "Committing changes..." -ForegroundColor Cyan
    git commit -m "Auto commit: Unified dashboard & Go GraphQL backend with Prisma"
    
    Write-Host "Pushing to remote repository..." -ForegroundColor Cyan
    git push
    Write-Host "Push completed successfully!" -ForegroundColor Green
} else {
    Write-Host "No changes detected. Nothing to push." -ForegroundColor Yellow
}
