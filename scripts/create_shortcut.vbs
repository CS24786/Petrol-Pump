Set oWS = WScript.CreateObject("WScript.Shell")
sDesktop = oWS.SpecialFolders("Desktop")
sLinkFile = sDesktop & "\Diyal Filling Station.lnk"
Set oLink = oWS.CreateShortcut(sLinkFile)
oLink.TargetPath = "http://localhost:5173"
oLink.Description = "Diyal Filling Station Management System"
oLink.Save
WScript.Echo "SUCCESS"
