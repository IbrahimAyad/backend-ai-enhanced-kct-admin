#!/bin/bash

# Script to remove sensitive data from git history
# WARNING: This will rewrite git history!

echo "⚠️  WARNING: This will rewrite git history!"
echo "Make sure you have a backup of your repository."
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

# Create backup branch
git branch backup-before-clean

# Remove the file containing credentials from history
# This was in the initial commit in src/lib/supabase.ts
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch src/lib/supabase.ts" \
  --prune-empty --tag-name-filter cat -- --all

# Alternative: Use BFG Repo-Cleaner (faster, need to install first)
# bfg --replace-text passwords.txt

echo ""
echo "✅ Git history cleaned!"
echo ""
echo "Next steps:"
echo "1. Review the changes: git log --oneline"
echo "2. Force push to remote: git push origin --force --all"
echo "3. Tell any collaborators to re-clone the repository"
echo ""
echo "Backup branch created: backup-before-clean"