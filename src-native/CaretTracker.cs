using System;
using System.Runtime.InteropServices;
using System.Threading;
using System.Windows.Automation;
using System.Windows.Automation.Text;
using System.Windows;

public class CaretTracker {
    [StructLayout(LayoutKind.Sequential)]
    public struct RECT {
        public int Left, Top, Right, Bottom;
    }

    [StructLayout(LayoutKind.Sequential)]
    public struct GUITHREADINFO {
        public int cbSize;
        public int flags;
        public IntPtr hwndActive;
        public IntPtr hwndFocus;
        public IntPtr hwndCapture;
        public IntPtr hwndMenuOwner;
        public IntPtr hwndMoveSize;
        public IntPtr hwndCaret;
        public RECT rcCaret;
    }

    [StructLayout(LayoutKind.Sequential)]
    public struct POINT {
        public int X, Y;
    }

    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, IntPtr ProcessId);

    [DllImport("user32.dll")]
    public static extern bool GetGUIThreadInfo(uint idThread, ref GUITHREADINFO lpgui);

    [DllImport("user32.dll")]
    public static extern bool ClientToScreen(IntPtr hWnd, ref POINT lpPoint);

    public static void Main(string[] args) {
        int lastX = -1;
        int lastY = -1;
        string lastState = "";

        while (true) {
            try {
                bool foundCaret = false;
                int currentX = 0;
                int currentY = 0;

                IntPtr hwnd = GetForegroundWindow();
                if (hwnd != IntPtr.Zero) {
                    uint threadId = GetWindowThreadProcessId(hwnd, IntPtr.Zero);
                    GUITHREADINFO gui = new GUITHREADINFO();
                    gui.cbSize = Marshal.SizeOf(gui);

                    // 1. Win32 GetGUIThreadInfo
                    if (GetGUIThreadInfo(threadId, ref gui)) {
                        IntPtr targetHwnd = gui.hwndCaret != IntPtr.Zero ? gui.hwndCaret : gui.hwndFocus;
                        if (targetHwnd != IntPtr.Zero && (gui.rcCaret.Right != 0 || gui.rcCaret.Bottom != 0 || gui.rcCaret.Left != 0 || gui.rcCaret.Top != 0)) {
                            POINT pt = new POINT { X = gui.rcCaret.Right, Y = gui.rcCaret.Bottom };
                            if (ClientToScreen(targetHwnd, ref pt)) {
                                if (pt.X > 0 && pt.Y > 0) {
                                    currentX = pt.X;
                                    currentY = pt.Y;
                                    foundCaret = true;
                                }
                            }
                        }
                    }

                    // 2. Windows UI Automation (for Chromium browsers, Word, VS Code, Slack, WPF)
                    if (!foundCaret) {
                        try {
                            AutomationElement focused = AutomationElement.FocusedElement;
                            if (focused != null) {
                                object patternObj;
                                if (focused.TryGetCurrentPattern(TextPattern.Pattern, out patternObj)) {
                                    TextPattern textPattern = (TextPattern)patternObj;
                                    TextPatternRange[] selection = textPattern.GetSelection();
                                    if (selection != null && selection.Length > 0) {
                                        Rect[] rects = selection[0].GetBoundingRectangles();
                                        if (rects != null && rects.Length > 0 && rects[0].Width >= 0) {
                                            currentX = (int)(rects[0].Right);
                                            currentY = (int)(rects[0].Bottom);
                                            foundCaret = true;
                                        }
                                    }
                                }
                            }
                        } catch {
                            // Transient UIA COM errors
                        }
                    }
                }

                if (foundCaret) {
                    if (currentX != lastX || currentY != lastY || lastState != "caret") {
                        lastX = currentX;
                        lastY = currentY;
                        lastState = "caret";
                        Console.WriteLine(currentX + "," + currentY + ",caret");
                    }
                } else {
                    if (lastState != "none") {
                        lastState = "none";
                        lastX = -1;
                        lastY = -1;
                        Console.WriteLine("0,0,none");
                    }
                }
            } catch {
                // Ignore transient errors
            }

            Thread.Sleep(35); // 28 FPS caret polling
        }
    }
}
