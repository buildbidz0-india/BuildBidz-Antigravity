@echo off
set "BRAIN_DIR=c:\Users\user\.gemini\antigravity\brain\834b0a94-389b-4de9-bdd9-32706a000c96"
set "REPO_DOCS_DIR=docs\agent_history\session_%date:~-4%_%date:~4,2%_%date:~7,2%"

echo Archiving planning artifacts...
if not exist "%REPO_DOCS_DIR%" mkdir "%REPO_DOCS_DIR%"
copy /Y "%BRAIN_DIR%\task.md" "%REPO_DOCS_DIR%\"
copy /Y "%BRAIN_DIR%\implementation_plan.md" "%REPO_DOCS_DIR%\"
copy /Y "%BRAIN_DIR%\walkthrough.md" "%REPO_DOCS_DIR%\"

echo Syncing with remote...
git add .
git commit -m "Auto sync %date% %time% [with docs]"
git pull --rebase origin main
git push origin main
echo Done.
pause
