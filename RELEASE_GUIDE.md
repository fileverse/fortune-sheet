# Fortune Sheet Release Guide

This guide explains the optimized release process for the Fortune Sheet monorepo packages.

## 🏗️ Architecture

We use a monorepo with three interdependent packages:

- `@fileverse-dev/formula-parser` - Core formula parsing engine
- `@fileverse-dev/fortune-core` - Main spreadsheet logic (depends on formula-parser)  
- `@fileverse-dev/fortune-react` - React components (depends on core)

## 🔧 Release Tooling

- **Lerna**: Manages the monorepo structure and package publishing
- **Changesets**: Handles versioning and changelog generation
- **GitHub Actions**: Automates the release process
- **Yarn Workspaces**: Manages internal dependencies

## 🚀 Development Workflow

### 1. Making Changes

1. Create a feature branch from `fileverse-mod`
2. Make your changes to one or more packages
3. Test your changes locally: `yarn test`
4. Build packages: `yarn build:packages`

### 2. Creating a Changeset

When you're ready to prepare a release:

```bash
# Interactive changeset creation
yarn changeset

# Or use the helper script
yarn changeset:helper
```

This will:
- Ask which packages have changed
- Ask for the type of change (major/minor/patch)
- Ask for a description of changes
- Generate a changeset file in `.changeset/`

### 3. Version Bumping

When ready to release:

```bash
# This consumes changesets and updates package.json versions
yarn version-packages
```

This will:
- Update package versions based on changesets
- Update internal dependencies automatically
- Generate/update CHANGELOG.md files
- Remove consumed changeset files

### 4. Publishing

```bash
# Build and publish all packages (automated with changesets)
yarn release

# Or publish with a beta tag (automated with changesets)
yarn release:beta

# Build and publish manually
yarn publish
```

## 🤖 Automated Releases (Recommended)

### GitHub Actions Setup

The repository includes a GitHub Action that automatically:

1. Creates a "Release PR" when changesets exist
2. Publishes packages when the Release PR is merged

#### Required Secrets

Add these to your GitHub repository secrets:

- `NPM_TOKEN`: Your npm publish token with access to `@fileverse-dev` scope
- `GITHUB_TOKEN`: Automatically provided by GitHub

#### Workflow

1. **Create changesets** for your changes and commit them
2. **Push to `fileverse-mod` branch** 
3. **GitHub Action runs** and creates a "Release PR"
4. **Review the Release PR** - it shows exactly what will be published
5. **Merge the Release PR** - packages are automatically published

## 📦 Package Dependencies

### Internal Dependencies

Packages reference each other with specific version numbers:

```json
{
  "dependencies": {
    "@fileverse-dev/fortune-core": "1.1.0"
  }
}
```

Changesets automatically update these dependencies when you release new versions.

### Dependency Flow

```
formula-parser (independent)
     ↓
fortune-core (depends on formula-parser)
     ↓  
fortune-react (depends on core)
```

## 🚀 Local Development & Publishing

### Local Linking (for development)
```bash
# Link all packages for development
yarn link

# Unlink when done
yarn unlink
```

### Publishing
```bash
# Build and publish all packages
yarn publish
```

**Prerequisites:** Make sure you're logged into npm (`npm login`) and have access to the `@fileverse-dev` scope.

## 🔍 Commands Reference

```bash
# Development
yarn dev                    # Start storybook
yarn build:packages         # Build all packages
yarn test                   # Run tests
yarn lint                   # Lint code

# Versioning & Releases
yarn changeset              # Create a changeset
yarn changeset:helper       # Interactive changeset helper
yarn version-packages       # Bump versions from changesets
yarn release                # Build and publish packages (automated)
yarn release:beta           # Publish with beta tag (automated)

# Local Development
yarn link                   # Link packages for development
yarn unlink                 # Unlink packages

# Publishing
yarn publish                # Build and publish

# Individual package development
cd packages/core
yarn dev                    # Watch mode for core package
yarn build                  # Build core package
```

## 🐛 Troubleshooting

### Build Issues

```bash
# Clean and rebuild everything
rm -rf node_modules packages/*/node_modules packages/*/dist
yarn install
yarn build:packages
```

### Version Conflicts

If you see version conflicts:

1. Ensure all changesets are consumed: `yarn version-packages`
2. Check that internal dependencies reference correct versions
3. Verify package.json versions are correct

### Publishing Issues

```bash
# Check if you're logged into npm
npm whoami

# Login if needed
npm login

# Verify access to @fileverse-dev scope
npm access list packages @fileverse-dev
```

## 📝 Changeset Types

- **patch**: Bug fixes, small improvements (0.0.X)
- **minor**: New features, backwards compatible (0.X.0)  
- **major**: Breaking changes, API changes (X.0.0)

## 🎯 Best Practices

1. **Always create changesets** for user-facing changes
2. **Test locally** before creating changesets
3. **Use descriptive changeset messages** - they become changelog entries
4. **Group related changes** in a single changeset when possible
5. **Use the Release PR workflow** for production releases
6. **Keep the `fileverse-mod` branch stable** - only merge tested changes

## 🔗 Related Links

- [Changesets Documentation](https://github.com/changesets/changesets)
- [Lerna Documentation](https://lerna.js.org/)
- [Yarn Workspaces](https://yarnpkg.com/features/workspaces) 