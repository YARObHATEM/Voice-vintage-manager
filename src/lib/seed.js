/*
 * The roadmap ships pre-filled. An empty checklist is a chore; a checklist
 * that already knows what shipping an iOS app involves is a tool. Every item
 * can be edited or deleted, and phases accept new items of your own.
 */

export const PHASES = [
  { id: 'store', label: 'App Store Readiness', blurb: 'Everything Apple asks for before the button says Submit.' },
  { id: 'content', label: 'Content Engine', blurb: 'The first ten videos and the profile they land on.' },
  { id: 'outreach', label: 'Outreach & Seeding', blurb: 'Getting it into other people’s hands before launch day.' }
];

export const SEED_ROADMAP = [
  // App Store Readiness
  ['store', 'RevenueCat SDK wired up', 'Products created in App Store Connect, paywall tested in sandbox.'],
  ['store', 'IAP products approved', 'Pricing tiers set, tax and banking filled in.'],
  ['store', 'Restore Purchases flow', 'Apple rejects builds without it.'],
  ['store', 'Privacy Policy hosted', 'Public URL, reachable from inside the app and from the listing.'],
  ['store', 'Privacy Nutrition Labels', 'Recording stays on device — say so explicitly.'],
  ['store', 'Info.plist microphone string', 'NSMicrophoneUsageDescription, written in plain English.'],
  ['store', 'App icon at every size', '1024 master, no alpha channel.'],
  ['store', 'Screenshots 6.7" + 6.5"', 'Retro chassis on screen, one caption each.'],
  ['store', 'App Preview video (30s)', 'Silent-safe: the first three seconds have to read without sound.'],
  ['store', 'Listing copy + keywords', 'Title, subtitle, 100-char keyword field.'],
  ['store', 'TestFlight build passing', 'External testers added, no crashes on cold start.'],
  ['store', 'Support URL live', 'Even a one-page site with an email counts.'],

  // Content Engine
  ['content', 'Profile branding pass', 'Handle, avatar, bio, link-in-bio all saying the same thing.'],
  ['content', 'Pinned "what is this" video', 'The one a new visitor watches first.'],
  ['content', 'Batch videos 1–3', 'Film in one sitting, same lighting.'],
  ['content', 'Batch videos 4–7', 'Vary the hook style, keep the format.'],
  ['content', 'Batch videos 8–10', 'Hold two back as reposts for the launch week.'],
  ['content', 'Sound library shortlist', 'Trending audio that fits the vibe, saved and dated.'],
  ['content', 'Caption + hashtag template', 'Reusable, so posting is 30 seconds not 10 minutes.'],
  ['content', 'Posting schedule set', 'Times chosen, reminders on the phone.'],

  // Outreach & Seeding
  ['outreach', 'Build 40-creator shortlist', 'Lo-fi, CCD/retro, journaling. Small accounts, high comment rates.'],
  ['outreach', 'Write the DM template', 'Three sentences. No pitch deck.'],
  ['outreach', 'TestFlight link for creators', 'Public link so you are not adding emails one at a time.'],
  ['outreach', 'First 20 DMs sent', 'Track every one in the CRM tab.'],
  ['outreach', 'Subreddit post plan', 'r/lofi, r/analog, r/Journaling — read each set of rules first.'],
  ['outreach', 'Discord / niche communities', 'Post where retro-tech people already talk.'],
  ['outreach', 'Launch-day asset pack', 'Clips and stills creators can repost without editing.'],
  ['outreach', 'Follow-up wave scheduled', 'One polite nudge, five days after the first message.']
];

export const SEED_TAGS = ['#ASMR', '#Storytelling', '#Comparison', '#Y2K', '#POV', '#Tutorial'];
