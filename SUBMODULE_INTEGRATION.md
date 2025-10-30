# Adding TrouPriv to githubrepo1

This document provides instructions for adding the TrouPriv project as a Git submodule to the `TroupeCrypto/githubrepo1` repository.

## Prerequisites

- Access to the `TroupeCrypto/githubrepo1` repository
- Git installed on your local machine
- Appropriate permissions to modify githubrepo1

## Adding TrouPriv as a Submodule

### Step 1: Navigate to githubrepo1

```bash
cd /path/to/githubrepo1
```

### Step 2: Add TrouPriv as a Submodule

```bash
git submodule add https://github.com/TroupeCrypto/TrouPriv.git TrouPriv
```

This will:
- Clone the TrouPriv repository into a `TrouPriv` directory within githubrepo1
- Create/update the `.gitmodules` file with the submodule configuration
- Stage the changes for commit

### Step 3: Initialize and Update the Submodule

```bash
git submodule init
git submodule update
```

### Step 4: Commit the Changes

```bash
git add .gitmodules TrouPriv
git commit -m "Add TrouPriv as a submodule"
git push origin main
```

## Working with the Submodule

### Cloning githubrepo1 with Submodules

When cloning githubrepo1 in the future, use:

```bash
git clone --recursive https://github.com/TroupeCrypto/githubrepo1.git
```

Or, if already cloned without submodules:

```bash
git submodule init
git submodule update
```

### Updating the Submodule to Latest Version

To update TrouPriv to the latest commit:

```bash
git submodule update --remote TrouPriv

# Then, commit the updated submodule reference
git add TrouPriv
git commit -m "Update TrouPriv submodule to latest version"
git push origin main
```

### Using a Specific Branch or Tag

To use a specific branch of TrouPriv:

```bash
cd TrouPriv
git checkout <branch-name>
cd ..
git add TrouPriv
git commit -m "Update TrouPriv submodule to <branch-name>"
git push origin main
```

## Submodule Configuration

The `.gitmodules` file in githubrepo1 will contain:

```
[submodule "TrouPriv"]
	path = TrouPriv
	url = https://github.com/TroupeCrypto/TrouPriv.git
	branch = main
```

See `.gitmodules.example` in this repository for a reference configuration.

## Quick Reference

### One-line Submodule Add
```bash
git submodule add https://github.com/TroupeCrypto/TrouPriv.git TrouPriv
```

### Automated Script

Option 1 - Download and run directly:
```bash
# From within githubrepo1 repository
curl -O https://raw.githubusercontent.com/TroupeCrypto/TrouPriv/main/add-to-githubrepo1.sh
bash add-to-githubrepo1.sh
```

Option 2 - After submodule is added:
```bash
bash TrouPriv/add-to-githubrepo1.sh
```

## About TrouPriv

TrouPriv is a real-time, client-side asset management system designed to unify digital and physical portfolios under a single elegant, encrypted interface. It merges crypto, collectibles, art, and cannabis assets, all visualized through a psychedelic aesthetic.

### Key Features

- Real-time asset tracking
- Crypto wallet integration
- Multi-asset portfolio management
- Psychedelic visual effects
- Client-side encryption

### Technology Stack

- React 19.2.0
- TypeScript
- Vite build system
- Ethers.js for Web3 integration
- Framer Motion for animations
- Recharts for data visualization

## Troubleshooting

### Authentication Issues

If you encounter authentication issues when adding the submodule, ensure you have:
- Configured your GitHub credentials properly
- Access to both repositories
- Used the correct URL format (HTTPS or SSH)

### Submodule Not Updating

If the submodule doesn't update:

```bash
git submodule update --remote TrouPriv
```

### Removing the Submodule

If you need to remove the submodule:

```bash
git submodule deinit -f TrouPriv
git rm -f TrouPriv
rm -rf .git/modules/TrouPriv
```

## Support

For issues related to TrouPriv itself, please refer to the [TrouPriv README](README.md) or open an issue in the TrouPriv repository.
