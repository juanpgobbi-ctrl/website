@echo off
cd /d %~dp0

git add .
git diff --cached --quiet || git commit -m "update"
git push

pause