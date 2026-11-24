/**
 * One source for the navigation, read by the page bar, the sticky bar and the
 * megamenu, so the three can never drift apart.
 *
 * The Approach entry is gone with the section it pointed at: the four numbered
 * steps were removed at the client's request, so the link and its four children
 * (which were those same step lines) had nowhere left to go.
 *
 * PLACEHOLDER IA: the sections are the ones that were on the old rail, and the
 * children under each are shape, not a settled structure. None of the
 * destinations exist yet.
 */
export type NavSection = {
  href: string;
  label: string;
  children: Array<[string, string]>;
};

export const NAV: NavSection[] = [
  {
    href: "#work",
    label: "Work",
    children: [
      ["#work", "Selected work"],
      ["#testimonials", "What clients say"],
      ["#footprint", "Where we work"],
    ],
  },
  {
    href: "#what-we-do",
    label: "Services",
    children: [
      ["#what-we-do", "Strategy & Consulting"],
      ["#what-we-do", "Websites & Digital Experiences"],
      ["#what-we-do", "Automation & AI"],
      ["#what-we-do", "Marketing & Growth"],
    ],
  },
  {
    href: "#about",
    label: "About",
    children: [
      ["#about", "The firm"],
      ["#footprint", "Our global footprint"],
      ["#about", "Careers"],
    ],
  },
  {
    href: "#journal",
    label: "Journal",
    children: [
      ["#journal", "Latest"],
      ["#journal", "Notes on building"],
    ],
  },
  {
    href: "#contact",
    label: "Contact",
    children: [
      ["#intake", "Start a conversation"],
      ["/book", "Book an appointment"],
      ["/sign-in", "Sign in"],
    ],
  },
];
