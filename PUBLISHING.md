# Publishing Guide for Fumadocs Transpiler

This guide will help you publish the Fumadocs Transpiler CLI to the npm registry.

## Prerequisites

1. **npm Account**: You need an npm account. Create one at [npmjs.com](https://www.npmjs.com/signup)
2. **npm CLI**: Make sure you have npm installed and updated
3. **Authentication**: You need to be logged in to npm

## Step-by-Step Publishing Process

### 1. Verify npm Login

First, check if you're logged in to npm:

```bash
npm whoami
```

If not logged in, login with:

```bash
npm login
```

Enter your npm username, password, and email when prompted.

### 2. Check Package Name Availability

Before publishing, verify that the package name is available:

```bash
npm view fumadocs-transpiler
```

If you get a 404 error, the name is available. If the package exists, you might need to:

- Choose a different name (e.g., `@your-username/fumadocs-transpiler`)
- Or use a scoped package name

### 3. Final Pre-publish Checks

Run these commands to ensure everything is ready:

```bash
# Build the project
npm run build

# Run all tests
npm test

# Preview what will be published
npm pack --dry-run
```

### 4. Publish to npm

For the first publication:

```bash
npm publish
```

For scoped packages (if needed):

```bash
npm publish --access public
```

### 5. Verify Publication

After publishing, verify it worked:

```bash
# Check if the package is available
npm view fumadocs-transpiler

# Try installing it globally
npm install -g fumadocs-transpiler

# Test the CLI
fumadocs-transpiler --version
```

## Alternative Package Names (if needed)

If `fumadocs-transpiler` is already taken, consider these alternatives:

1. **Scoped package**: `@jagjeevankashid/fumadocs-transpiler`
2. **Alternative names**:
   - `fuma-transpiler`
   - `fumadocs-md-transpiler`
   - `markdown-to-fumadocs`
   - `fumadocs-converter`

To use a scoped package, update `package.json`:

```json
{
  "name": "@jagjeevankashid/fumadocs-transpiler"
  // ... rest of the config
}
```

## Publishing Updates

For future updates:

1. Update the version in `package.json`:

   ```bash
   npm version patch  # for bug fixes
   npm version minor  # for new features
   npm version major  # for breaking changes
   ```

2. Publish the update:
   ```bash
   npm publish
   ```

## GitHub Repository Setup

To complete the npm package setup, you should also:

1. **Create a GitHub repository** at `https://github.com/jagjeevankashid/fumadocs-transpiler`

2. **Initialize git and push**:

   ```bash
   git init
   git add .
   git commit -m "Initial commit: Fumadocs Transpiler CLI"
   git branch -M main
   git remote add origin https://github.com/jagjeevankashid/fumadocs-transpiler.git
   git push -u origin main
   ```

3. **Add repository info** (already done in package.json):
   ```json
   {
     "repository": {
       "type": "git",
       "url": "https://github.com/jagjeevankashid/fumadocs-transpiler.git"
     },
     "homepage": "https://github.com/jagjeevankashid/fumadocs-transpiler#readme",
     "bugs": {
       "url": "https://github.com/jagjeevankashid/fumadocs-transpiler/issues"
     }
   }
   ```

## Troubleshooting

### Common Issues

1. **403 Forbidden**: You don't have permission to publish. Make sure you're logged in with the correct account.

2. **Package name already exists**: Choose a different name or use a scoped package.

3. **Version already exists**: Update the version number in package.json.

4. **Build errors**: Make sure `npm run build` completes successfully.

5. **Test failures**: All tests must pass before publishing.

### Useful Commands

```bash
# Check npm configuration
npm config list

# Check current user
npm whoami

# View package info
npm view fumadocs-transpiler

# Unpublish (within 72 hours, use carefully)
npm unpublish fumadocs-transpiler@1.0.0

# Add npm tag
npm dist-tag add fumadocs-transpiler@1.0.0 latest
```

## Success!

Once published, users can install your CLI with:

```bash
# Global installation
npm install -g fumadocs-transpiler

# Local installation
npm install fumadocs-transpiler

# Using npx (no installation required)
npx fumadocs-transpiler --help
```

Your package will be available at: `https://www.npmjs.com/package/fumadocs-transpiler`

## Next Steps

After publishing:

1. **Create GitHub releases** for version tracking
2. **Add badges** to README (npm version, downloads, etc.)
3. **Set up CI/CD** for automated testing and publishing
4. **Monitor usage** and gather feedback
5. **Maintain and update** the package regularly

Happy publishing! 🚀
