/* eslint-disable react-refresh/only-export-components */

const Icon = ({ children, size = 15 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.55"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

export const Icons = {
  inbox: <Icon><path d="M2 10h3l1.5 2h3L11 10h3V4.5A1.5 1.5 0 0 0 12.5 3h-9A1.5 1.5 0 0 0 2 4.5V10Z" /></Icon>,
  my: <Icon><path d="M3 5.5 5.5 3h5L13 5.5v5L10.5 13h-5L3 10.5v-5Z" /><path d="M6 8h4" /></Icon>,
  grid: <Icon><rect x="2.5" y="2.5" width="4" height="4" rx="1" /><rect x="9.5" y="2.5" width="4" height="4" rx="1" /><rect x="2.5" y="9.5" width="4" height="4" rx="1" /><rect x="9.5" y="9.5" width="4" height="4" rx="1" /></Icon>,
  issue: <Icon><circle cx="8" cy="8" r="6" /><circle cx="8" cy="8" r="2" /></Icon>,
  plus: <Icon><path d="M8 3v10M3 8h10" /></Icon>,
  project: <Icon><path d="m8 2 5 3v6l-5 3-5-3V5l5-3Z" /><path d="M3 5l5 3 5-3M8 8v6" /></Icon>,
  views: <Icon><path d="m3 5 5-2 5 2-5 2-5-2Z" /><path d="m3 9 5 2 5-2" /><path d="m3 12 5 2 5-2" /></Icon>,
  invite: <Icon><path d="M8 3v10M3 8h10" /></Icon>,
  github: <Icon><path d="M5.8 13.3c-3 .8-3-1.5-4.2-1.8" /><path d="M10.2 14v-2.4c0-.8.3-1.3.7-1.7-2.3-.3-4.7-1.1-4.7-5A3.8 3.8 0 0 1 7.3 2.3 3.6 3.6 0 0 1 7.4.1s.9-.3 2.8 1a9.5 9.5 0 0 1 5 0c1.9-1.3 2.8-1 2.8-1a3.6 3.6 0 0 1 .1 2.2 3.8 3.8 0 0 1 1.1 2.6c0 3.9-2.4 4.7-4.7 5 .5.4.8 1 .8 2V14" transform="scale(.76) translate(.4 .7)" /></Icon>,
  camera: <Icon><path d="M2 12V6h3l1.2-2h3.6L11 6h3v6H2Z" /><circle cx="8" cy="9" r="2.2" /></Icon>,
  logout: <Icon><path d="M6 2H3.5A1.5 1.5 0 0 0 2 3.5v9A1.5 1.5 0 0 0 3.5 14H6" /><path d="m10 11 4-3-4-3M14 8H5.5" /></Icon>,
  members: <Icon><path d="M6.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM2.5 14c.4-2.7 2-4 4-4s3.6 1.3 4 4" /><path d="M11 4.2a2 2 0 0 1 0 3.6M12 10c1 .6 1.6 1.8 1.8 3.2" /></Icon>,
  more: <Icon><path d="M3 8h.01M8 8h.01M13 8h.01" /></Icon>,
  settings: <Icon><path d="M6.7 2.4h2.6l.4 1.5 1.3.8 1.5-.4 1.3 2.3-1.1 1.1v1.6l1.1 1.1-1.3 2.3-1.5-.4-1.3.8-.4 1.5H6.7l-.4-1.5-1.3-.8-1.5.4-1.3-2.3 1.1-1.1V7.7L2.2 6.6l1.3-2.3 1.5.4 1.3-.8.4-1.5Z" /><circle cx="8" cy="8" r="2" /></Icon>,
  chevronDown: <Icon size={12}><path d="m4 6 4 4 4-4" /></Icon>,
  chevronRight: <Icon size={12}><path d="m6 4 4 4-4 4" /></Icon>,
  back: <Icon size={16}><path d="m10 4-4 4 4 4" /></Icon>,
  forward: <Icon size={16}><path d="m6 4 4 4-4 4" /></Icon>,
  close: <Icon size={16}><path d="M4 4l8 8M12 4l-8 8" /></Icon>,
};

export const iconForTitle = (title = "") => {
  const key = title.toLowerCase();
  if (key.includes("inbox")) return Icons.inbox;
  if (key.includes("my issues")) return Icons.my;
  if (key.includes("dashboard")) return Icons.grid;
  if (key.includes("member")) return Icons.members;
  if (key.includes("project")) return Icons.project;
  if (key.includes("view")) return Icons.views;
  if (key.includes("new issue")) return Icons.plus;
  if (key.includes("issue")) return Icons.issue;
  return Icons.issue;
};
