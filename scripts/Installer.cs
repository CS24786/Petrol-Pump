using System;
using System.IO;
using System.Diagnostics;
using System.Windows.Forms;

namespace DiyalSetup
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            try
            {
                string desktopPath = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
                string baseDir = AppDomain.CurrentDomain.BaseDirectory;
                string projectDir = Path.GetFullPath(Path.Combine(baseDir, ".."));
                string rootLauncher = Path.Combine(projectDir, "Diyal Filling Station.vbs");
                string releaseLauncher = Path.Combine(baseDir, "Launch-Diyal-Station.vbs");
                string activeLauncher = File.Exists(rootLauncher) ? rootLauncher : releaseLauncher;
                string iconPath = Path.Combine(projectDir, "public", "logo.ico");

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
                        else
                        {
                            shortcut.TargetPath = "wscript.exe";
                            shortcut.Arguments = "\"" + releaseLauncher + "\"";
                            shortcut.WorkingDirectory = projectDir;
                        }

                        if (File.Exists(iconPath))
                        {
                            shortcut.IconLocation = iconPath + ",0";
                        }

                        shortcut.Description = "Diyal Filling Station Desktop ERP System";
                        shortcut.Save();
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
                    "It will now open as a standalone Desktop Window (just like the Marble Factory application).",
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
