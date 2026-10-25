# DIYAL Filling Station — Release & Distribution Guide

Yeh folder customer terminal PC deployment aur GitHub remote auto-update management ke liye banaya gaya hai.

---

## 1. Customer PC Deployment (Desktop Shortcut Setup)

Jab client/customer ke PC par system install karna ho:
1. **Setup File:** Customer ke PC par `Diyal-Filling-Station-Setup-1.0.0.exe` download karein.
2. **Installation:** Setup file par double-click karein. 
3. **Desktop Shortcut:** Setup khud-ba-khud Windows Desktop par **"Diyal Filling Station"** ka shortcut icon bana dega.
4. **Direct Login Launch:** Desktop shortcut open karne par application seedha **Login Screen** (`admin` / `admin`) par launch hogi.

---

## 2. GitHub Releases & Auto-Update Configuration

Project ki GitHub repository:
- **Repository URL:** `https://github.com/CS24786/Petrol-Pump`
- **Release Channel:** Public GitHub Releases

### Release Files:
1. `release/latest.yml`:
   - `electron-updater` aur GitHub auto-updater is file ko parhta hai taake nayi version ki jaanch kar sakay.
2. `release/latest.json`:
   - Application ke Web interface ke liye latest version, download link aur changelog provide karta hai.

---

## 3. Naya Version (Release) Kaise Publish Karein?

Jab bhi aap code mein koi new feature add karein aur client ke system ko update karna ho:

### Step 1: Version increment karein (`package.json`)
`package.json` mein version change karein (e.g., `"version": "1.0.1"`).

### Step 2: Git tag push karein
Terminal mein yeh commands run karein:
```bash
git add .
git commit -m "Release v1.0.1"
git tag v1.0.1
git push origin main --tags
```

### Step 3: Automated GitHub Actions
GitHub Actions workflow ([.github/workflows/release.yml](file:///d:/Semesters/SPM%20Project/Petrol-Pump/.github/workflows/release.yml)) khud bakhud:
- Windows environment mein project build karega.
- `Diyal-Filling-Station-Setup-1.0.1.exe` create karega.
- `latest.yml` generate karke GitHub Releases par publish kar dega!

---

## 4. Client Side Auto-Update Experience (Settings Page)

Client jab apnay PC par **Settings & Backup** module mein **"Check for GitHub Updates"** par click karega:
1. **Agar System Pehle Se New Version Par Hai:**
   - Foran green badge show hoga: **"System already on new version (v1.0.0)"**.
2. **Agar Naya Version Available Hai (e.g. v1.0.1):**
   - New version details aur changelog show hoga.
   - Client **"Download New Version (v1.0.1)"** par click karega.
   - Real-time download progress bar (0% se 100%) chlay gi aur installer download ho jayega.
   - Download complete honay par button **"Restart & Apply Changes"** mein badal jaye ga.
   - Client click karega to setup run ho kar system restart ho jaye ga aur new changes apply ho jayen gi.
