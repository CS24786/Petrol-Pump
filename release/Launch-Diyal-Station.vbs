Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
sScriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
sProjectDir = fso.GetParentFolderName(sScriptDir)

On Error Resume Next
WshShell.CurrentDirectory = sProjectDir
WshShell.Run "cmd.exe /c npm.cmd run electron", 0, False
Set WshShell = Nothing
Set fso = Nothing
