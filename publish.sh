#!/bin/bash

# Fumadocs Transpiler Publishing Script
# This script helps automate the publishing process

set -e  # Exit on any error

echo "Fumadocs Transpiler Publishing Script"
echo "========================================"

# Check if user is logged in to npm
echo "Checking npm authentication..."
if ! npm whoami > /dev/null 2>&1; then
    echo "You are not logged in to npm. Please run 'npm login' first."
    exit 1
fi

echo "Logged in as: $(npm whoami)"

# Check if package name is available
echo "Checking package name availability..."
if npm view fumadocs-transpiler > /dev/null 2>&1; then
    echo "Package 'fumadocs-transpiler' already exists on npm."
    echo "   You may need to choose a different name or update the version."
    read -p "   Do you want to continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo " Publishing cancelled."
        exit 1
    fi
else
    echo "Package name 'fumadocs-transpiler' is available!"
fi

# Run pre-publish checks
echo "Running pre-publish checks..."

echo "Building project..."
npm run build

echo "Running tests..."
npm test

echo "Checking package contents..."
npm pack --dry-run

echo "All pre-publish checks passed!"

# Confirm publication
echo ""
echo " Ready to publish!"
echo "   Package: fumadocs-transpiler"
echo "   Version: $(node -p "require('./package.json').version")"
echo "   Registry: https://registry.npmjs.org/"
echo ""

read -p "Do you want to publish now? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Publishing to npm..."
    npm publish
    
    echo ""
    echo "Successfully published fumadocs-transpiler!"
    echo ""
    echo "Next steps:"
    echo "   • View your package: https://www.npmjs.com/package/fumadocs-transpiler"
    echo "   • Test installation: npm install -g fumadocs-transpiler"
    echo "   • Create GitHub repository if you haven't already"
    echo "   • Add GitHub releases for version tracking"
    echo ""
    echo "Happy coding!"
else
    echo "Publishing cancelled."
    echo "   Run this script again when you're ready to publish."
fi
