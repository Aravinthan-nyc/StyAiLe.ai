# How to Push Live Updates to Your App

## Quick Guide

### 1. Build the Update Bundle
```powershell
# Build production bundle
npm run build

# Navigate to dist folder
cd dist

# Create ZIP file (the update bundle)
Compress-Archive -Path .\* -DestinationPath ..\updates\v1.0.1.zip
```

### 2. Upload to Supabase Storage

1. Go to **Supabase Dashboard** → **Storage**
2. Create bucket: `updates` (set to **public**)
3. Create folder: `bundles`
4. Upload your ZIP file: `v1.0.1.zip`
5. Upload `manifest.json` to root of `updates` bucket

### 3. Update the Manifest

Edit `manifest.json` with new version info:

```json
{
    "version": "1.0.1",
    "buildNumber": 2,
    "releaseDate": "2026-02-15",
    "bundleUrl": "https://YOUR-PROJECT.supabase.co/storage/v1/object/public/updates/bundles/v1.0.1.zip",
    "bundleSize": 2048576,
    "bundleHash": "",
    "mandatory": false,
    "changelog": "Your changelog here",
    "minAppVersion": "1.0.0",
    "actions": []
}
```

### 4. Get Bundle Size and Hash

```powershell
# Get file size
(Get-Item .\updates\v1.0.1.zip).Length

# Get SHA256 hash (optional but recommended)
Get-FileHash .\updates\v1.0.1.zip -Algorithm SHA256 | Select-Object -ExpandProperty Hash
```

---

## Update Actions

You can force specific actions during update:

| Action | Description |
|--------|-------------|
| `force_logout` | Log out all users |
| `clear_cache` | Clear cached data |
| `clear_wardrobe` | Reset wardrobe (dangerous!) |
| `reset_settings` | Reset user settings |
| `require_reauth` | Require re-authentication |
| `show_changelog` | Show changelog after update |

Example mandatory security update:
```json
{
    "version": "1.0.2",
    "mandatory": true,
    "actions": ["force_logout", "clear_cache"],
    "changelog": "Critical security update. All users must re-login."
}
```

---

## Folder Structure

```
supabase-storage/
└── updates/              ← Public bucket
    ├── manifest.json     ← Version manifest
    └── bundles/
        ├── v1.0.0.zip
        ├── v1.0.1.zip
        └── v1.0.2.zip
```

---

## Important Notes

1. **Always increment buildNumber** - This is how the app detects updates
2. **Test locally first** - Set manifest URL to local file for testing
3. **Backup previous version** - Keep old bundles for rollback
4. **Use mandatory sparingly** - Only for critical security fixes
5. **Update app version constant** - After successful release, update `APP_VERSION` in liveUpdateService.ts

---

## Emergency Rollback

If an update breaks the app:

1. Update manifest.json with previous version's bundle
2. Set `mandatory: true` to force everyone back
3. Add `"actions": ["clear_cache"]` to clear bad state
