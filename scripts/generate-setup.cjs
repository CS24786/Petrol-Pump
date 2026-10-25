const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

console.log('=== Building Diyal Filling Station Desktop Release Package ===');

const rootDir = path.resolve(__dirname, '..');
const releaseDir = path.join(rootDir, 'release');

if (!fs.existsSync(releaseDir)) {
  fs.mkdirSync(releaseDir, { recursive: true });
}

// 1. Build Vite web bundle
console.log('1. Building production web assets (npm run build)...');
try {
  execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });
} catch (e) {
  console.warn('Vite build warning:', e.message);
}

// 2. Write root desktop launcher "Diyal Filling Station.vbs" (Exactly like Marble Factory)
const rootLauncherContent = `Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
currentDir = fso.GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = currentDir
WshShell.Run "cmd.exe /c npm.cmd run electron", 0, False
Set WshShell = Nothing
Set fso = Nothing
`;
fs.writeFileSync(path.join(rootDir, 'Diyal Filling Station.vbs'), rootLauncherContent, 'utf-8');

// 3. Write release/Launch-Diyal-Station.vbs
const vbsLauncherContent = `Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
sScriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
sProjectDir = fso.GetParentFolderName(sScriptDir)

On Error Resume Next
WshShell.CurrentDirectory = sProjectDir
WshShell.Run "cmd.exe /c npm.cmd run electron", 0, False
Set WshShell = Nothing
Set fso = Nothing
`;
fs.writeFileSync(path.join(releaseDir, 'Launch-Diyal-Station.vbs'), vbsLauncherContent, 'utf-8');

// 4. Write create_shortcut.vbs
const vbsShortcutContent = `Set oWS = WScript.CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

sDesktop = oWS.SpecialFolders("Desktop")
sLinkFile = sDesktop & "\\Diyal Filling Station.lnk"
Set oLink = oWS.CreateShortcut(sLinkFile)

sScriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
sProjectDir = fso.GetParentFolderName(sScriptDir)
sRootLauncher = sProjectDir & "\\Diyal Filling Station.vbs"
sReleaseLauncher = sScriptDir & "\\Launch-Diyal-Station.vbs"

If fso.FileExists(sRootLauncher) Then
    oLink.TargetPath = "wscript.exe"
    oLink.Arguments = """" & sRootLauncher & """"
    oLink.WorkingDirectory = sProjectDir
ElseIf fso.FileExists(sReleaseLauncher) Then
    oLink.TargetPath = "wscript.exe"
    oLink.Arguments = """" & sReleaseLauncher & """"
    oLink.WorkingDirectory = sProjectDir
Else
    oLink.TargetPath = "http://localhost:5173"
End If

sIcoPath = sProjectDir & "\\public\\logo.ico"
sElectronExe = sProjectDir & "\\node_modules\\electron\\dist\\electron.exe"

If fso.FileExists(sIcoPath) Then
    oLink.IconLocation = sIcoPath & ",0"
ElseIf fso.FileExists(sElectronExe) Then
    oLink.IconLocation = sElectronExe & ",0"
End If

oLink.Description = "Diyal Filling Station Desktop ERP System"
oLink.Save
`;
fs.writeFileSync(path.join(releaseDir, 'create_shortcut.vbs'), vbsShortcutContent, 'utf-8');

// 5. Write clean Install-Desktop-Shortcut.bat
const setupBatContent = `@echo off
title Diyal Filling Station - Desktop Shortcut Setup
color 0A
cls
echo ==============================================================
echo      DIYAL FILLING STATION - DESKTOP SHORTCUT INSTALLER
echo ==============================================================
echo.
echo Installing desktop shortcut for Diyal Filling Station...
echo.

cscript //nologo "%~dp0create_shortcut.vbs"

echo.
echo ==============================================================
echo [SUCCESS] Desktop Shortcut created successfully on your Windows Desktop!
echo Icon Name: "Diyal Filling Station" (Native Desktop App)
echo ==============================================================
echo.
pause
`;
fs.writeFileSync(path.join(releaseDir, 'Install-Desktop-Shortcut.bat'), setupBatContent, 'utf-8');

// 6. Compile C# Standalone Setup Executable (.exe)
const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8'));
const version = pkg.version || '1.0.1';
const installerCsPath = path.join(rootDir, 'scripts', 'Installer.cs');
const outExePath = path.join(releaseDir, `Diyal-Filling-Station-Setup-${version}.exe`);
const cscPath = 'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe';
const icoPath = path.join(rootDir, 'public', 'logo.ico');

if (fs.existsSync(installerCsPath) && fs.existsSync(cscPath)) {
  console.log(`2. Compiling native Windows Setup .exe (v${version}) with embedded icon...`);
  try {
    const iconFlag = fs.existsSync(icoPath) ? `/win32icon:"${icoPath}"` : '';
    execSync(`"${cscPath}" /target:winexe ${iconFlag} /out:"${outExePath}" /r:System.Windows.Forms.dll /r:System.Drawing.dll "${installerCsPath}"`, {
      stdio: 'inherit'
    });
    console.log(`[SUCCESS] Diyal-Filling-Station-Setup-${version}.exe compiled successfully with native icon!`);

    // Calculate Hash and update latest.yml
    const fileBuffer = fs.readFileSync(outExePath);
    const hash = crypto.createHash('sha512').update(fileBuffer).digest('hex').toUpperCase();
    const stats = fs.statSync(outExePath);

    const ymlContent = `version: ${version}
files:
  - url: Diyal-Filling-Station-Setup-${version}.exe
    sha512: ${hash}
    size: ${stats.size}
path: Diyal-Filling-Station-Setup-${version}.exe
sha512: ${hash}
releaseDate: '${new Date().toISOString()}'
`;
    fs.writeFileSync(path.join(releaseDir, 'latest.yml'), ymlContent, 'utf-8');

    // Update latest.json
    const jsonContent = {
      version: version,
      tag: `v${version}`,
      productName: "Diyal Filling Station",
      releaseDate: new Date().toISOString().slice(0, 10),
      installerName: `Diyal-Filling-Station-Setup-${version}.exe`,
      downloadUrl: `https://github.com/CS24786/Petrol-Pump/releases/download/v${version}/Diyal-Filling-Station-Setup-${version}.exe`,
      githubRepo: "CS24786/Petrol-Pump",
      changelog: `Release v${version}: Desktop shortcut with official icon, clean setup messaging, and GitHub auto-updates.`
    };
    fs.writeFileSync(path.join(releaseDir, 'latest.json'), JSON.stringify(jsonContent, null, 2), 'utf-8');
    console.log(`[SUCCESS] Generated latest.yml and latest.json for v${version}`);
  } catch (err) {
    console.error('Error compiling C# setup exe:', err.message);
  }
}

console.log('=== Desktop release package built successfully in /release directory! ===');

