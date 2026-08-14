// Bump this whenever the research data-use policy text changes materially.
// Each consent_records row stores the version the user actually saw, so old
// consent decisions stay tied to the language they were given — see
// docs/DATA_GOVERNANCE.md.
export const RESEARCH_POLICY_VERSION = 'research-consent-v1';

export const RESEARCH_POLICY_SUMMARY = [
  {
    heading: 'What gets shared',
    body:
      'Only structured tracking fields: body location, suspected trigger, ' +
      'medication/treatment type, days since you started tracking a patch, ' +
      'whether you applied treatment, and your day-to-day progress rating.',
  },
  {
    heading: "What never leaves your account",
    body:
      'Your name, email, photos, and any free-text notes you write are ' +
      'never included in the research export, no matter what you choose here.',
  },
  {
    heading: 'How it stays de-identified',
    body:
      'Shared records are linked to a randomly generated research code, not ' +
      'your account. Calendar dates are converted to "day 1, day 2, ..." ' +
      'relative to when you started tracking, so exact dates are never shared.',
  },
  {
    heading: 'Your control',
    body:
      'This is entirely optional and off by default. You can turn it on or ' +
      'off at any time in Settings — turning it off stops future sharing ' +
      'immediately. Data already shared with a research partner under a ' +
      'signed data-use agreement before you withdrew can’t be recalled from ' +
      'them, the same way a letter can’t be unsent.',
  },
] as const;
