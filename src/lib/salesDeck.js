// Sales deck content. Edit copy here — the deck page renders whatever is in this file.

export const PRICING = [
  {
    tier: "Starter",
    who: "Single team, one coach",
    monthly: 149,
    season: 1190,
    seasonNote: "10 months — 2 months free",
    includes: [
      "1 team, up to 30 players",
      "8 match uploads per month",
      "AI blindspot reports + Time Machine replay",
      "Auto-generated counter-drills",
      "Player scanning profiles",
    ],
  },
  {
    tier: "Club",
    who: "Multi-team clubs, full staff",
    monthly: 349,
    season: 2790,
    seasonNote: "10 months — 2 months free",
    popular: true,
    includes: [
      "Up to 5 teams, unlimited players",
      "Unlimited match uploads",
      "Everything in Starter, plus:",
      "War Room opponent scouting + counter-plans",
      "Shareable read-only player reports",
      "Training blocks with baseline/retest progress",
      "Up to 10 staff seats",
    ],
  },
  {
    tier: "Academy",
    who: "Academies, colleges, federations",
    monthly: 899,
    season: 6990,
    seasonNote: "10 months — 2 months free",
    includes: [
      "Unlimited teams and staff seats",
      "Everything in Club, plus:",
      "Computer-vision tracking pipeline",
      "Cross-squad benchmarking + compare mode",
      "Automated opponent-pattern workflows",
      "Onboarding session + priority support",
    ],
  },
];

export const FEATURES = [
  {
    name: "Match Analysis",
    pitch: "Upload footage, get a coach-reviewable report",
    detail:
      "Drop in a video file or paste a YouTube link. The AI returns timestamped blindspot moments — who had the ball, who they didn't see, how far away, at what angle, and what the better option was. Every moment is a draft until a coach approves it.",
    example:
      "\"You upload Saturday's 90 minutes on Sunday morning. By the time you've had coffee, you have 23 flagged decision moments with clips attached — instead of scrubbing tape for four hours.\"",
  },
  {
    name: "Time Machine",
    pitch: "Put the player back inside the decision",
    detail:
      "Replay any flagged moment as a broadcast-style tactical reconstruction. Freeze at the decision point, ask the player what they missed, then reveal the open man. Switch between top-down, endzone, and the player's own first-person view.",
    example:
      "\"Your #6 swears the pass wasn't on. You show him the same three seconds through his own eyes — the switch was open the whole time. That argument ends in 20 seconds, permanently.\"",
  },
  {
    name: "Player Scanning Profiles",
    pitch: "Turn habits into a number you can coach",
    detail:
      "Every approved moment rolls into a per-player profile: average scan quality, how often they get beaten behind the shoulder, blindspot count, severity, worst moment, and a scan heatmap showing where on the pitch their head stops moving.",
    example:
      "\"Two centre-backs look identical on the stat sheet. One scans 0.71, the other 0.38. Now you know who to start against a team that plays in behind.\"",
  },
  {
    name: "Live Simulator",
    pitch: "A tactical whiteboard that knows what players can see",
    detail:
      "Drag players into any shape and the app draws real vision cones — who each player can actually see, who is hidden, and which blindspot is the most dangerous. Toggle to a player's POV to see the shape through their eyes.",
    example:
      "\"Team talk on Friday: you show the back four that in your current shape, the left-back physically cannot see the far-side runner. Then you move him four metres and the cone closes the gap.\"",
  },
  {
    name: "War Room",
    pitch: "Scout the opponent before they scout you",
    detail:
      "Enter the opponent and your intended shape. The app returns their likely responses with likelihood and danger ratings, exploitable zones, key players to track, and an animated counter-play for each threat.",
    example:
      "\"Wednesday: you know their press triggers on the ball going back to the keeper, and you already have a rehearsed counter for it. Saturday: they press, you play through it, and it looks like luck.\"",
  },
  {
    name: "Auto-Generated Drills",
    pitch: "Weakness in, session plan out",
    detail:
      "Pick a weakness from a real player's profile and the app writes the drill: setup, how it runs, coaching points, what went wrong in the match, how elite players do it, progressions, and a success metric.",
    example:
      "\"#8 keeps losing the far-side runner. One click and you have a 12-minute rondo variant with the exact coaching points printed, ready for Tuesday.\"",
  },
  {
    name: "Training Blocks & Progress",
    pitch: "Prove the coaching worked",
    detail:
      "Build a 4-week development block per player. The app captures a baseline from approved matches, schedules sessions, then retests against later matches and shows the delta.",
    example:
      "\"Scan quality 0.41 in March, 0.68 in May, blindspots down 44%. That's the slide you show the parents — and the board.\"",
  },
  {
    name: "Player Reports (shareable)",
    pitch: "Send the player their own homework",
    detail:
      "Generate a revocable read-only link for a single player. They see their profile, their drills, and their progress — nothing else, no login required. Kill the link any time.",
    example:
      "\"Text the link to the player Sunday night. Monday they arrive already knowing what they're working on.\"",
  },
  {
    name: "Compare Mode",
    pitch: "Two matches, side by side",
    detail:
      "Line up any two matches to see whether a problem is a pattern or a bad day — same player, same phase, same zone, across games.",
    example:
      "\"Was the shape wrong, or was the right-back tired? Compare the two games and the answer is on one screen.\"",
  },
];

export const SLIDES = [
  {
    kind: "cover",
    eyebrow: "Sales enablement",
    title: "Sell the app coaches wish existed",
    body: "A 12-minute pitch, in order, with the words to say and the answers to the pushback. Run it start to finish on a laptop or an iPad.",
    notes:
      "Open with a question, not a feature: \"How many hours a week do you spend watching your own match footage?\" Whatever they answer, that's your wedge. Do not open the app until slide 4.",
  },
  {
    kind: "problem",
    eyebrow: "The problem",
    title: "Coaches don't lack video. They lack eyes.",
    bullets: [
      "A 90-minute match takes 3–5 hours to review properly. Most coaches never do it.",
      "Existing tools count passes and distance covered. Nobody measures whether the player LOOKED.",
      "Scanning — head-checks before receiving — is the single most trainable habit in the game, and it's invisible on every stat sheet.",
      "So the same mistake happens in round 4, round 11, and round 20, and nobody can prove it's a pattern.",
    ],
    notes:
      "Let them agree with you three times before you mention software. If they say \"we already have Hudl/Veo\" — good, that's footage. This is what to DO with the footage. You're not replacing their camera.",
  },
  {
    kind: "solution",
    eyebrow: "What it is",
    title: "Blindspot analysis for football decisions",
    body: "Upload footage. The app finds the moments a player didn't see what they should have seen, replays it through that player's own eyes, and writes the drill that fixes it — then measures whether it got fixed.",
    bullets: [
      "Find it — AI-flagged blindspot moments with timestamps and clips",
      "Show it — Time Machine replay in the player's first-person view",
      "Fix it — auto-generated drills tied to the exact weakness",
      "Prove it — baseline vs retest progress per player",
    ],
    notes:
      "Say this sentence exactly: \"It finds what your players didn't see, and turns it into Tuesday's training session.\" That's the whole product in one line. Pause after it.",
  },
  {
    kind: "features",
    eyebrow: "The product",
    title: "Every feature, and what to say about it",
    notes:
      "Do NOT walk all nine. Pick three based on who's in the room: Academy director → Training Blocks, Player Reports, Compare. First-team coach → War Room, Time Machine, Drills. Youth coach → Time Machine, Player Profiles, Drills. Read the example lines out loud — they land better than the feature names.",
  },
  {
    kind: "demo",
    eyebrow: "Live demo",
    title: "The 4-minute demo script",
    steps: [
      { t: "0:00", d: "Open a match that's already analyzed. Never demo an upload — dead air kills the room." },
      { t: "0:30", d: "Scroll the flagged moments. Say: \"A coach approved each of these. Nothing goes in a player's profile until a human agrees.\"" },
      { t: "1:15", d: "Open one moment in the Time Machine. Freeze at the decision. Ask THEM: \"What would you have played here?\"" },
      { t: "2:00", d: "Reveal the open man. Switch to the player's POV. Stay quiet for three seconds. This is the moment that sells it." },
      { t: "2:45", d: "Jump to that player's profile. Point at the scan number and the heatmap." },
      { t: "3:15", d: "Click through to the auto-generated drill. Say: \"That's Tuesday, written for you.\"" },
      { t: "3:45", d: "Stop. Ask: \"Which of your players did you just think of?\" Then be quiet and let them talk." },
    ],
    notes:
      "The POV reveal is the close. Everything before it is setup, everything after it is paperwork. Never talk over it.",
  },
  {
    kind: "pricing",
    eyebrow: "Investment",
    title: "Pricing",
    notes:
      "Always present the season price second — it's the one you want. Frame it against what they already spend: one afternoon of an outside analyst costs more than a month of Club. Discount authority: 15% on annual prepay, 20% for 3+ teams signing together. Never discount the monthly rate; move them to season instead.",
  },
  {
    kind: "value",
    eyebrow: "The money argument",
    title: "Why it's worth it",
    bullets: [
      "A part-time video analyst costs $18–30k a season. Club is $2,790.",
      "5 hours of tape review a week × 30 weeks = 150 coaching hours back. At $40/hr that's $6,000 of the coach's own time.",
      "One retained player at a paid academy is $1,500–4,000 a year. Visible individual development is why families stay.",
      "One promotion, one scholarship, one cup run — the platform costs less than the fuel money for the away trips.",
    ],
    notes:
      "Ask what they currently spend on video, analysis, or a GA who cuts clips. Whatever number they say, put your price next to it and stop talking. Do not defend the price — compare it.",
  },
  {
    kind: "objections",
    eyebrow: "Pushback",
    title: "Objection handling",
    items: [
      {
        o: "\"We already have Veo / Hudl / Trace.\"",
        a: "Perfect — keep it. That's your camera. This is the analysis layer on top. Paste the link and it works with the footage you already pay for.",
      },
      {
        o: "\"I don't trust AI to judge my players.\"",
        a: "Neither do we. Every moment is a draft until you approve it. Nothing reaches a player's profile without a coach clicking yes. You're the analyst; this just stops you scrubbing tape.",
      },
      {
        o: "\"Too expensive for our club.\"",
        a: "Compared to what? What does a season of video analysis cost you now — in money or in your own Sunday mornings? Start on one team, one season. If it doesn't change a single team talk, don't renew.",
      },
      {
        o: "\"My phone footage isn't good enough.\"",
        a: "Phone, endzone, or broadcast — pick the camera type on upload. Wider is better, but a phone on a tripod from halfway is plenty.",
      },
      {
        o: "\"I don't have time to learn software.\"",
        a: "Upload, read, approve. Three clicks. If you can post to a team WhatsApp group you can run this. Club and Academy include a setup session.",
      },
      {
        o: "\"Will my players actually use it?\"",
        a: "They get one link, no login, showing their own clips and their own drills. Players who ignore a PDF will watch themselves get beaten behind the shoulder in first person.",
      },
      {
        o: "\"Let me think about it.\"",
        a: "Of course. Send me your last match and I'll have the report back to you before your next session — then decide with your own footage in front of you, not mine.",
      },
    ],
    notes:
      "Never argue price on price. Always convert to hours or to a competing line item in their budget.",
  },
  {
    kind: "close",
    eyebrow: "The close",
    title: "Ask for the match, not the money",
    bullets: [
      "\"Send me your last match and I'll run the report for free before your next session.\"",
      "That's the ask. Not a signature — a video file.",
      "Once a coach sees their OWN player in the Time Machine, pricing becomes a formality.",
      "Follow up within 24 hours of delivering the report, while the clip is still in their head.",
    ],
    notes:
      "Free first report is authorized for any coach with a real team. It costs us minutes and closes at a far higher rate than any discount. Book the follow-up call before you leave the room.",
  },
];