using System;
using System.IO;
using System.Diagnostics;
using System.Windows.Forms;
using System.Runtime.InteropServices;

namespace DiyalSetup
{
    static class Program
    {
        [DllImport("shell32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern void SHChangeNotify(int wEventId, int uFlags, IntPtr dwItem1, IntPtr dwItem2);

        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            try
            {
                string desktopPath = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
                string exePath = Application.ExecutablePath;
                string baseDir = AppDomain.CurrentDomain.BaseDirectory;
                string projectDir = Path.GetFullPath(Path.Combine(baseDir, ".."));
                string rootLauncher = Path.Combine(projectDir, "Diyal Filling Station.vbs");
                string releaseLauncher = Path.Combine(baseDir, "Launch-Diyal-Station.vbs");
                string activeLauncher = File.Exists(rootLauncher) ? rootLauncher : releaseLauncher;
                string iconPath = Path.Combine(projectDir, "public", "logo.ico");
                string electronExe = Path.Combine(projectDir, "node_modules", "electron", "dist", "electron.exe");

                // Clean up any old .url browser shortcut if present
                try
                {
                    string oldUrlPath = Path.Combine(desktopPath, "Diyal Filling Station.url");
                    if (File.Exists(oldUrlPath))
                    {
                        File.Delete(oldUrlPath);
                    }
                }
                catch { }

                // 1. Create native Windows .lnk shortcut targeting Electron Desktop App
                try
                {
                    Type shellType = Type.GetTypeFromProgID("WScript.Shell");
                    if (shellType != null)
                    {
                        dynamic shell = Activator.CreateInstance(shellType);
                        string lnkPath = Path.Combine(desktopPath, "Diyal Filling Station.lnk");
                        dynamic shortcut = shell.CreateShortcut(lnkPath);

                        if (File.Exists(activeLauncher))
                        {
                            shortcut.TargetPath = "wscript.exe";
                            shortcut.Arguments = "\"" + activeLauncher + "\"";
                            shortcut.WorkingDirectory = projectDir;
                        }
                        else if (File.Exists(releaseLauncher))
                        {
                            shortcut.TargetPath = "wscript.exe";
                            shortcut.Arguments = "\"" + releaseLauncher + "\"";
                            shortcut.WorkingDirectory = baseDir;
                        }
                        else
                        {
                            shortcut.TargetPath = "wscript.exe";
                            shortcut.Arguments = "\"" + activeLauncher + "\"";
                            shortcut.WorkingDirectory = projectDir;
                        }

                        // Set shortcut icon: Prefer project logo.ico, then electron.exe, then the installer exe itself
                        if (File.Exists(iconPath))
                        {
                            shortcut.IconLocation = iconPath + ",0";
                        }
                        else if (File.Exists(electronExe))
                        {
                            shortcut.IconLocation = electronExe + ",0";
                        }
                        else if (File.Exists(exePath))
                        {
                            shortcut.IconLocation = exePath + ",0";
                        }

                        shortcut.Description = "Diyal Filling Station Desktop ERP System";
                        shortcut.Save();

                        // Notify Windows Explorer to immediately refresh icon cache
                        try
                        {
                            SHChangeNotify(0x08000000, 0, IntPtr.Zero, IntPtr.Zero);
                        }
                        catch { }
                    }
                }
                catch { }

                // 2. Launch Desktop Application Window immediately
                try
                {
                    if (File.Exists(activeLauncher))
                    {
                        ProcessStartInfo psi = new ProcessStartInfo
                        {
                            FileName = "wscript.exe",
                            Arguments = "\"" + activeLauncher + "\"",
                            WorkingDirectory = projectDir,
                            UseShellExecute = true
                        };
                        Process.Start(psi);
                    }
                }
                catch { }

                MessageBox.Show(
                    "Diyal Filling Station Desktop Application Setup Complete!\n\n" +
                    "A desktop shortcut named 'Diyal Filling Station' has been placed on your Windows Desktop.\n\n" +
                    "You can now launch the application directly from your Desktop anytime.",
                    "Diyal Filling Station Setup",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information
                );
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    "Setup encountered an issue: " + ex.Message,
                    "Setup Error",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
            }
        }
    }
}

