using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;

internal static class Program
{
    [DllImport("user32.dll")]
    private static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll")]
    private static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);

    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    private static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);

    private static int Main()
    {
        try
        {
            var hwnd = GetForegroundWindow();
            if (hwnd == IntPtr.Zero)
            {
                return 1;
            }

            uint processId;
            GetWindowThreadProcessId(hwnd, out processId);
            var process = Process.GetProcessById((int)processId);
            var titleBuilder = new StringBuilder(512);
            GetWindowText(hwnd, titleBuilder, titleBuilder.Capacity);

            Console.OutputEncoding = Encoding.UTF8;
            Console.Write(process.ProcessName + "|" + titleBuilder);
            return 0;
        }
        catch
        {
            return 2;
        }
    }
}
