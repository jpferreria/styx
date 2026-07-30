# Styx OS Git Versioning & Release Strategy

This document defines the official **Semantic Versioning (SemVer 2.0.0)**, Git Tagging, and Release Branching Strategy for **Styx OS**.

---

## 1. Versioning Model (SemVer 2.0.0)

Styx OS releases follow `v<MAJOR>.<MINOR>.<PATCH>`:
- **`v0.10.0`**: Milestone 1 through 61 Baseline (60 POSIX Subsystems & LLM Sandbox).
- **`v0.20.0`**: Milestone 62 through 71 (*"Rivendell"* Release with WebSockets Proxying, EXT4/OPFS, WASI Preview 2, tmux, and Agent RPC).
- **`v0.20.x`**: Patch bug fixes and maintenance releases.

---

## 2. Git Tagging & Release Branches

### Current Baseline Tags
- **`v0.10.0`**: Tagged on commit `f1d5234` / `872fac7` marking the completion of Milestones 1–61.

### Branch Structure
```
main                        (Active development branch for v0.20 "Rivendell")
├── release/v0.10.x          (LTS Maintenance branch for v0.10 patch fixes)
└── release/v0.20.x          (Future LTS Maintenance branch for v0.20)
```

---

## 3. How Users Can Get & Checkout Specific Versions

### Option A: Clone a Specific Release Version directly
Users can clone any exact tagged version of Styx OS:
```bash
# Clone Styx OS v0.10.0 Stable Release
git clone --branch v0.10.0 https://github.com/jpferreria/styx.git
```

### Option B: Switch Versions in an Existing Local Repository
If a user has already cloned `https://github.com/jpferreria/styx.git`:

```bash
# Fetch all tags from GitHub
git fetch --tags

# Checkout Styx OS v0.10.0
git checkout v0.10.0

# Return to active development (v0.20 "Rivendell")
git checkout main
```

---

## 4. Developer & Maintainer Release Protocol

When completing a major version (e.g. v0.10.0 or v0.20.0):

1. **Update `package.json`**:
   ```json
   "version": "0.10.0"
   ```

2. **Create Git Tag**:
   ```bash
   git tag -a v0.10.0 -m "Styx OS v0.10.0 Stable Release (60 POSIX Subsystems & LLM Sandbox)"
   ```

3. **Push Tag to GitHub**:
   ```bash
   git push origin v0.10.0
   ```

4. **Create Maintenance Branch (if needed)**:
   ```bash
   git checkout -b release/v0.10.x
   git push origin release/v0.10.x
   ```
