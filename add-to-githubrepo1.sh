#!/bin/bash

# Script to add TrouPriv as a submodule to githubrepo1
# This script should be run from within the githubrepo1 repository

set -e

echo "Adding TrouPriv as a submodule to githubrepo1..."

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "Error: This script must be run from within the githubrepo1 git repository"
    exit 1
fi

# Check if working directory is clean
if ! git diff-index --quiet HEAD --; then
    echo "Error: Your working directory is not clean. Please commit or stash your changes first."
    exit 1
fi

# Check if TrouPriv submodule already exists
if [ -f ".gitmodules" ] && grep -q "TrouPriv" .gitmodules; then
    echo "TrouPriv submodule already exists in .gitmodules"
    echo "Would you like to update it? (y/n)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo "Updating TrouPriv submodule..."
        git submodule update --remote TrouPriv
        git add TrouPriv
        if git diff-index --quiet --cached HEAD --; then
            echo "TrouPriv submodule is already up-to-date."
        else
            git commit -m "Update TrouPriv submodule"
            echo "TrouPriv submodule updated successfully!"
        fi
    fi
    exit 0
fi

# Add TrouPriv as a submodule
echo "Adding TrouPriv submodule..."
git submodule add https://github.com/TroupeCrypto/TrouPriv.git TrouPriv

# Stage the changes
echo "Staging changes..."
git add .gitmodules TrouPriv

# Commit the changes
echo "Committing changes..."
git commit -m "Add TrouPriv as a submodule

This adds the TrouPriv asset management system as a Git submodule.

TrouPriv is a real-time, client-side asset management system that unifies
digital and physical portfolios under a single elegant, encrypted interface."

echo ""
echo "✅ TrouPriv has been successfully added as a submodule!"
echo ""
echo "Next steps:"
echo "1. Review the changes: git show HEAD"
echo "2. Push to remote: git push origin main"
echo ""
echo "For more information, see TrouPriv/SUBMODULE_INTEGRATION.md"
