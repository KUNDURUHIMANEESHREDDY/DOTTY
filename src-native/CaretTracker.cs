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

    [DllImport("user32.dll")]
    public static extern bool GetCursorPos(out POINT lpPoint);

    public static void Main(string[] args) {
        int lastX = -1;
        int lastY = -1;

        while (true) {
            try {
                bool foundCaret = false;
                int currentX = 0;
                int currentY = 0;

                // 1. Win32 GetGUIThreadInfo (Ultra-fast for standard Win32 text fields)
                IntPtr hwnd = GetForegroundWindow();
                uint threadId = GetWindowThreadProcessId(hwnd, IntPtr.Zero);
                GUITHREADINFO gui = new GUITHREADINFO();
                gui.cbSize = Marshal.SizeOf(gui);

                if (GetGUIThreadInfo(threadId, ref gui)) {
                    IntPtr targetHwnd = gui.hwndCaret != IntPtr.Zero ? gui.hwndCaret : gui.hwndFocus;
                    if (targetHwnd != IntPtr.Zero && (gui.rcCaret.Right != 0 || gui.rcCaret.Bottom != 0)) {
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

                // 2. Windows UI Automation (For Chromium, Edge, Word, VS Code, Slack, Electron)
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
                        // Ignore transient UIA COM errors
                    }
                }

                // 3. Fallback to mouse cursor position
                if (!foundCaret) {
                    POINT mousePt;
                    if (GetCursorPos(out mousePt)) {
                        currentX = mousePt.X;
                        currentY = mousePt.Y;
                    }
                }

                if (currentX > 0 && currentY > 0 && (currentX != lastX || currentY != lastY)) {
                    lastX = currentX;
                    lastY = currentY;
                    Console.WriteLine(currentX + "," + currentY + "," + (foundCaret ? "caret" : "mouse"));
                }
            } catch {
                // Ignore transient errors
            }

            Thread.Sleep(30); // ~33 FPS tracking
        }
    }
}
