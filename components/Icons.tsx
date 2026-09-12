// Small inline SVG icon set (no external icon font — keeps the preview offline-safe).
type P = { className?: string };
const s = (d: React.ReactNode, extra?: object) => (p: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
    strokeLinecap="round" strokeLinejoin="round" className={p.className ?? "h-5 w-5"} {...extra}>
    {d}
  </svg>
);

export const IconPlus = s(<><path d="M12 5v14M5 12h14" /></>);
export const IconMenu = s(<><path d="M4 6h16M4 12h16M4 18h16" /></>);
export const IconClose = s(<><path d="M6 6l12 12M18 6L6 18" /></>);
export const IconSend = s(<><path d="M12 19V5M5 12l7-7 7 7" /></>);
export const IconStop = s(<><rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor" stroke="none" /></>);
export const IconSun = s(<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" /></>);
export const IconMoon = s(<><path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" /></>);
export const IconTrash = s(<><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></>);
export const IconPencil = s(<><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" /></>);
export const IconCopy = s(<><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 012-2h10" /></>);
export const IconCheck = s(<><path d="M20 6L9 17l-5-5" /></>);
export const IconImage = s(<><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></>);
export const IconMic = s(<><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0014 0M12 18v4" /></>);
export const IconSearch = s(<><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></>);
export const IconRefresh = s(<><path d="M3 12a9 9 0 0115.5-6.2L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 01-15.5 6.2L3 16" /><path d="M3 21v-5h5" /></>);
export const IconDownload = s(<><path d="M12 3v12M7 11l5 5 5-5" /><path d="M4 21h16" /></>);
export const IconSpark = s(<><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" /></>);
export const IconChevron = s(<><path d="M6 9l6 6 6-6" /></>);
export const IconHome = s(<><path d="M3 10.5L12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></>);

// New icons for upgrades
export const IconPin = s(<><path d="M12 17v5M9 11l-2 6M15 11l2 6M5 11h14M8 2h8l1 9H7z" /></>);
export const IconPinOff = s(<><path d="M12 17v5M2 2l20 20M9 11l-2 6M15 11l2 6M5 11h14M8 2h8l1 9H7z" /></>);
export const IconVolume = s(<><path d="M11 5L6 9H2v6h4l5 4V5z" /><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" /></>);
export const IconVolumeOff = s(<><path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6" /></>);
export const IconZap = s(<><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></>);
export const IconHash = s(<><path d="M4 9h16M4 15h16M10 3l-2 18M16 3l-2 18" /></>);
export const IconList = s(<><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></>);
export const IconTable = s(<><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18" /></>);
export const IconFlow = s(<><rect x="3" y="3" width="7" height="5" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="8.5" y="16" width="7" height="5" rx="1" /><path d="M6.5 8v3h11V8M12 11v5" /></>);
export const IconSteps = s(<><path d="M3 20h4v-4H3zM9 20h4v-8H9zM15 20h4V4h-4" /></>);
export const IconBulb = s(<><path d="M9 18h6M10 22h4M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17H8v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z" /></>);
export const IconPlay = s(<><polygon points="5 3 19 12 5 21 5 3" fill="currentColor" stroke="none" /></>);
export const IconCode = s(<><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></>);
export const IconMaximize = s(<><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" /></>);
export const IconMinimize = s(<><path d="M4 14h6v6m10-10h-6V4m0 6l7-7M10 14l-7 7" /></>);
export const IconExternal = s(<><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" /></>);
export const IconColumns = s(<><rect x="4" y="4" width="7" height="16" rx="1" /><rect x="13" y="4" width="7" height="16" rx="1" /></>);
export const IconExpand = s(<><polyline points="7 15 12 20 17 15" /><polyline points="7 9 12 4 17 9" /></>);
export const IconFolder = s(<><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></>);
export const IconFile = s(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></>);
export const IconSave = s(<><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></>);
