Set oWS = WScript.CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

sDesktop = oWS.SpecialFolders("Desktop")
sLinkFile = sDesktop & "\Diyal Filling Station.lnk"
Set oLink = oWS.CreateShortcut(sLinkFile)

sScriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
sProjectDir = fso.GetParentFolderName(sScriptDir)
sRootLauncher = sProjectDir & "\Diyal Filling Station.vbs"
sReleaseLauncher = sScriptDir & "\Launch-Diyal-Station.vbs"

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

sIcoPath = sProjectDir & "\public\logo.ico"
sElectronExe = sProjectDir & "\node_modules\electron\dist\electron.exe"

If fso.FileExists(sIcoPath) Then
    oLink.IconLocation = sIcoPath & ",0"
ElseIf fso.FileExists(sElectronExe) Then
    oLink.IconLocation = sElectronExe & ",0"
End If

oLink.Description = "Diyal Filling Station Desktop ERP System"
oLink.Save
