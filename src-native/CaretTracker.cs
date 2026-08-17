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
        long lastFoundTime = 0;
        IntPtr lastActiveHwnd = IntPtr.Zero;

        while (true) {
            try {
                bool foundCaret = false;
                int currentX = 0;
                int currentY = 0;
                long now = DateTime.UtcNow.Ticks / TimeSpan.TicksPerMillisecond;

                IntPtr hwnd = GetForegroundWindow();
                if (hwnd != IntPtr.Zero) {
                    uint threadId = GetWindowThreadProcessId(hwnd, IntPtr.Zero);
                    GUITHREADINFO gui = new GUITHREADINFO();
                    gui.cbSize = Marshal.SizeOf(gui);

                    // 1. Win32 GetGUIThreadInfo (Notepad, WordPad, classic controls)
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

                    // 2. Windows UI Automation TextPattern (Chromium, Edge, VS Code, Word, Slack, Discord)
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
                                        if (rects != null && rects.Length > 0 && rects[0].Width >= 0 && rects[0].Height >= 0) {
                                            currentX = (int)(rects[0].Right);
                                            currentY = (int)(rects[0].Bottom);
                                            if (currentX > 0 && currentY > 0) {
                                                foundCaret = true;
                                            }
                                        }
                                    }
                                }

                                // 3. Fallback: Focused Element Bounding Box (Web inputs, textareas)
                                if (!foundCaret) {
                                    ControlType cType = focused.Current.ControlType;
                                    if (cType == ControlType.Edit || cType == ControlType.Document || focused.Current.IsKeyboardFocusable) {
                                        Rect bRect = focused.Current.BoundingRectangle;
                                        if (bRect != Rect.Empty && bRect.Width > 10 && bRect.Height > 10) {
                                            currentX = (int)(bRect.Right - 20);
                                            currentY = (int)(bRect.Bottom - 10);
                                            if (currentX > 0 && currentY > 0) {
                                                foundCaret = true;
                                            }
                                        }
                                    }
                                }
                            }
                        } catch {
                            // Transient COM errors
                        }
                    }
                }

                if (foundCaret) {
                    lastFoundTime = now;
                    lastActiveHwnd = hwnd;
                    if (currentX != lastX || currentY != lastY || lastState != "caret") {
                        lastX = currentX;
                        lastY = currentY;
                        lastState = "caret";
                        Console.WriteLine(currentX + "," + currentY + ",caret");
                    }
                } else {
                    // Persistent Visibility: Keep dot calmly visible for 30s while user moves mouse to click it
                    if (lastX > 0 && lastY > 0 && (hwnd == lastActiveHwnd || now - lastFoundTime < 30000)) {
                        // Maintain last known caret position - DO NOT HIDE!
                    } else {
                        if (lastState != "none") {
                            lastState = "none";
                            lastX = -1;
                            lastY = -1;
                            Console.WriteLine("0,0,none");
                        }
                    }
                }
            } catch {
                // Ignore transient errors
            }

            Thread.Sleep(30);
        }
    }
}
