@echo off
echo Syncing with remote...
git add .
git commit -m "Auto sync %date% %time%"
git pull --rebase origin main
git push origin main
echo Done.
pause
