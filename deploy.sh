#!/bin/bash

# ==============================================================================
# InsightRAG - Git & GitHub Automated Deployment Script
# ==============================================================================

# Ensure macOS command line tools are installed
if ! xcode-select -p &>/dev/null; then
    echo "⚠️  macOS Command Line Developer Tools not detected!"
    echo "Starting automated install... Please click 'Install' on the macOS system pop-up."
    xcode-select --install
    echo "----------------------------------------------------------------------"
    echo "👉 Once the macOS installation completes successfully, please re-run:"
    echo "   bash deploy.sh"
    echo "----------------------------------------------------------------------"
    exit 1
fi

echo "🚀 Starting InsightRAG Git Initialization..."

# Initialize git if not already done
if [ ! -d ".git" ]; then
    git init
    echo "✅ Git repository initialized locally."
else
    echo "ℹ️  Git repository is already initialized."
fi

# Connect remote repository
if ! git remote | grep -q "origin"; then
    git remote add origin https://github.com/GuruyuganKarthik8377/InsightRAG.git
    echo "✅ Remote origin connected to: https://github.com/GuruyuganKarthik8377/InsightRAG.git"
else
    git remote set-url origin https://github.com/GuruyuganKarthik8377/InsightRAG.git
    echo "✅ Remote origin URL updated to: https://github.com/GuruyuganKarthik8377/InsightRAG.git"
fi

# Set active branch to main
git branch -M main

# Stage all files
echo "📦 Staging files for commit..."
git add .

# Commit changes
echo "💾 Creating initial release commit..."
git commit -m "Initial release: InsightRAG"

# Push to remote main
echo "⚡ Pushing repository to GitHub..."
echo "----------------------------------------------------------------------"
echo "ℹ️  If prompted for credentials, please enter:"
echo "   - Username: GuruyuganKarthik8377"
echo "   - Password: [Your GitHub Personal Access Token (PAT)]"
echo "----------------------------------------------------------------------"
git push -u origin main

echo "🎉 InsightRAG successfully deployed to GitHub!"
