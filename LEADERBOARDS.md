# Fixture — Leaderboard Design (LOCKED)

Locked 28 July 2026. This is the agreed design. The screen at `leaderboard.html`
is built to this spec with placeholder standings.

---

## The scoring rule

**Your time is your score. Lowest wins.**

- No points, no percentages, no time penalties.
- Hint and Reveal are gated by charge-up timers instead. Because time *is* the
  score, waiting for them to charge already costs you exactly what it should.
- No game can be lost. You always finish — you just finish slower.
- Times are stored in milliseconds and displayed as `m:ss`.

## The daily score

**Daily score = your times across all five games added together.**

To appear on the Overall board you must finish all five. A partial day is shown
as "3/5 played" and ranks below everyone who completed. Without this rule,
skipping games would give you a lower total and win.

Each game is capped at **10:00**, so walking away mid-game banks the cap
instead of ruining a whole week.

---

## Where each board lives

**Per-game boards live inside the game.** Finishing a game opens a full-screen
end card: your time, your rank, and that game's standings for today. It's also
what you see if you open a game you've already played.

**The Leaderboards tab is the overall board only** — your five times added
together — with two scopes and four periods.

### Scopes
| Scope | Who | Notes |
|---|---|---|
| **Global** | Everyone | Minimum activity to appear: 3 days for weekly, 10 for monthly |
| **Friends** | People you've added | The one people actually check. Also shows head-to-head records |

### Periods
| Period | Ranked by | Why |
|---|---|---|
| **Day** | That day's total time | — |
| **Week** | Average daily total, **best 5 of 7 days** | One busy day shouldn't end your week |
| **Month** | Average daily total, **best 20 days**, min 10 played | Stops one lucky day topping the table |
| **All-time** | Average over your **last 30 played days** | See below |

### All-time is a form rating, never a lifetime total

A running total means whoever installed first wins forever, and every new player
can see they'll never catch up. All-time is therefore a rolling average, so
anyone can top it within a month.

A separate **Hall of Fame** board may carry lifetime totals for the loyal — it
just isn't the leaderboard.

**Tiebreak:** exact milliseconds, then whoever finished earliest in the day.

---

## Daily refresh

- Puzzles are keyed to a **date**, so everyone gets puzzle #214 on their own
  local date. Leaderboards group by puzzle number, not by timestamp.
- Archive puzzles are playable but **do not score**, or a new player could grind
  200 old puzzles and top the all-time board on day one.

---

## Not built yet

Everything above is designed and the screen exists, but the standings are
placeholders. Real boards need:

1. **Accounts** — so a score belongs to someone
2. **A server** — scores calculated in the browser can be edited by anyone
3. **Friend invites** — a shareable link or code is enough to start

---

## Retention ideas (agreed direction, not yet designed in detail)

- **Weekly divisions** of ~20 players, top 3 promoted / bottom 3 relegated,
  named for the football pyramid: Sunday League → League Two → League One →
  Championship → Premier → Champions League → Legends
- **Streak freeze** — one missed day forgiven per month
- Streaks earn badges and their own board, **never a score multiplier**
