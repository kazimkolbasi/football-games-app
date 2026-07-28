/* =========================================================
   Fixture — shared game logic
   Everything the five games and the three tabs have in common:
   who today's rivals are, what you've already played, the end
   card, and the bottom tab bar.

   Scores live in sessionStorage, so they last while the app is
   open and are wiped the moment you quit it. That's deliberate
   for now — real scores need accounts and a server.
   ========================================================= */

window.Fixture = (function () {
  "use strict";

  // ---- The five games, in the order they appear on the home screen ----
  var GAMES = [
    { id: "topfive",   name: "Top Five",     sub: "Most Champions League goals", file: "top-five.html" },
    { id: "tictac",    name: "Tic Tac Toe",  sub: "Club × nationality grid", file: "tic-tac-toe.html" },
    { id: "xi",        name: "Missing XI",   sub: "Complete the lineup",          file: "missing-xi.html" },
    { id: "career",    name: "Career Path",  sub: "Guess from the clubs",         file: "career-path.html" },
    { id: "crossover", name: "Crossover",    sub: "Two clues, one player",        file: "crossover.html" },
  ];

  // ---- Your two rivals. Times are in seconds; "clean" means they
  //      finished that game without using a hint or a reveal. ----
  var RIVALS = [
    {
      name: "Eren", initial: "E", colour: "#8f6bd6",
      times: { topfive: 52, tictac: 161, xi: 78, career: 24, crossover: 96 },
      clean: { topfive: true, tictac: false, xi: true, career: true, crossover: false },
    },
    {
      name: "Mina", initial: "M", colour: "#4aa39a",
      times: { topfive: 66, tictac: 132, xi: 91, career: 31, crossover: 74 },
      clean: { topfive: false, tictac: true, xi: true, career: false, crossover: true },
    },
  ];

  var YOU = { name: "You", initial: "Y", colour: "#c68a2e" };

  // ---- Which day it is. Puzzles are keyed to the date, so everyone
  //      gets the same puzzle number on their own local date. ----
  function dayNumber() {
    var now = new Date();
    var today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    var epoch = Date.UTC(2026, 0, 1);          // counting starts 1 Jan 2026
    return Math.floor((today - epoch) / 86400000);
  }

  // ---- Today's results, kept for as long as the app stays open ----
  var STORE_KEY = "fixture.today";

  function load() {
    try {
      var raw = sessionStorage.getItem(STORE_KEY);
      if (!raw) return { day: dayNumber(), results: {} };
      var data = JSON.parse(raw);
      // a new day wipes the slate, even mid-session
      if (data.day !== dayNumber()) return { day: dayNumber(), results: {} };
      return data;
    } catch (e) {
      return { day: dayNumber(), results: {} };
    }
  }

  function save(data) {
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch (e) {}
  }

  function getResults() { return load().results; }

  function getResult(gameId) { return load().results[gameId] || null; }

  function hasPlayed(gameId) { return !!getResult(gameId); }

  // Record a finished game. Called once, by the game itself.
  function saveResult(gameId, seconds, clean) {
    var data = load();
    if (data.results[gameId]) return;      // never overwrite today's score
    data.results[gameId] = { seconds: seconds, clean: !!clean };
    save(data);
  }

  function clearToday() {
    try { sessionStorage.removeItem(STORE_KEY); } catch (e) {}
  }

  // ---- Time formatting: 0:07, 1:12, 12:04 ----
  function formatTime(totalSeconds) {
    var s = Math.max(0, Math.floor(totalSeconds));
    var m = Math.floor(s / 60);
    return m + ":" + (s % 60).toString().padStart(2, "0");
  }

  // ---- One game's standings: you against Eren and Mina ----
  function standingsFor(gameId) {
    var mine = getResult(gameId);
    var rows = RIVALS.map(function (r) {
      return {
        name: r.name, initial: r.initial, colour: r.colour,
        seconds: r.times[gameId], clean: r.clean[gameId], you: false,
      };
    });
    if (mine) {
      rows.push({
        name: YOU.name, initial: YOU.initial, colour: YOU.colour,
        seconds: mine.seconds, clean: mine.clean, you: true,
      });
    }
    rows.sort(function (a, b) { return a.seconds - b.seconds; });
    return rows;
  }

  // ---- Everyone's total across all five games ----
  // Anyone who hasn't finished all five is ranked below those who have,
  // which is the rule in LEADERBOARDS.md.
  function totals() {
    var results = getResults();
    var played = GAMES.filter(function (g) { return results[g.id]; });
    var myTotal = played.reduce(function (sum, g) { return sum + results[g.id].seconds; }, 0);

    var rows = RIVALS.map(function (r) {
      var total = GAMES.reduce(function (sum, g) { return sum + r.times[g.id]; }, 0);
      return {
        name: r.name, initial: r.initial, colour: r.colour,
        seconds: total, played: GAMES.length, you: false,
      };
    });
    rows.push({
      name: YOU.name, initial: YOU.initial, colour: YOU.colour,
      seconds: myTotal, played: played.length, you: true,
    });

    rows.sort(function (a, b) {
      var aDone = a.played === GAMES.length, bDone = b.played === GAMES.length;
      if (aDone !== bDone) return aDone ? -1 : 1;      // finishers first
      return a.seconds - b.seconds;
    });
    return rows;
  }

  // ---- Draw a set of leaderboard rows into an element ----
  function renderRows(el, rows, options) {
    var opts = options || {};
    el.innerHTML = "";
    rows.forEach(function (row, i) {
      var li = document.createElement("li");
      li.className = (row.you ? "you " : "") + (i < 3 ? "podium" : "");

      var incomplete = opts.showPlayed && row.played !== undefined && row.played < GAMES.length;
      var chip = "";
      if (incomplete) chip = row.played + " of " + GAMES.length + " played";
      else if (opts.showClean && row.clean) chip = "🧐 No hints!";

      li.innerHTML =
        '<span class="fx-rank">' + (i + 1) + '</span>' +
        '<span class="fx-avatar" style="background:' + row.colour + '">' + row.initial + '</span>' +
        '<span class="fx-who"><span class="fx-name">' + row.name + '</span>' +
        (chip ? '<br><span class="fx-chip">' + chip + '</span>' : '') + '</span>' +
        '<span class="fx-time">' + formatTime(row.seconds) + '</span>';
      el.appendChild(li);
    });
  }

  // =========================================================
  //  The end card — full screen, shown when a game finishes
  //  and again if you open a game you've already played today.
  // =========================================================
  function showEndcard(opts) {
    var game = GAMES.filter(function (g) { return g.id === opts.gameId; })[0];
    var rows = standingsFor(opts.gameId);
    var myRank = rows.findIndex(function (r) { return r.you; }) + 1;

    var card = document.createElement("div");
    card.className = "fx-endcard";
    card.innerHTML =
      '<div class="fx-end-inner">' +
        '<div class="fx-end-head">' +
          '<span class="fx-end-badge">' + game.name + '</span>' +
          '<span class="fx-end-puzzle">Puzzle No. ' + dayNumber() + '</span>' +
        '</div>' +
        '<div class="fx-end-hero">' +
          '<h2 class="fx-end-title">' + (opts.title || "Finished!") + '</h2>' +
          '<span class="fx-end-time">' + formatTime(opts.seconds) + '</span>' +
          '<span class="fx-end-sub">' +
            (myRank ? myRank + (myRank === 1 ? "st" : myRank === 2 ? "nd" : myRank === 3 ? "rd" : "th") +
                      " of " + rows.length + " today" : "Your time") +
          '</span>' +
        '</div>' +
        '<div class="fx-lb-title">' + game.name + ' · Today</div>' +
        '<ol class="fx-lb" id="fxEndRows"></ol>' +
        (opts.locked ? '<p class="fx-locked">You’ve already played today — come back tomorrow for a new puzzle.</p>' : '') +
        '<div class="fx-actions">' +
          '<a class="fx-btn primary" href="index.html">Home</a>' +
        '</div>' +
      '</div>';

    document.body.appendChild(card);
    renderRows(card.querySelector("#fxEndRows"), rows, { showClean: true });
    card.classList.add("show");
    return card;
  }

  // =========================================================
  //  The bottom tab bar
  // =========================================================
  var ICONS = {
    play:
      '<svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' +
      '<circle cx="12" cy="12" r="9"/><path d="M12 8.2l3.3 2.4-1.25 3.9h-4.1L8.7 10.6z"/>' +
      '<path d="M12 3v5.2M20.6 10.2l-4.95 .4M17.6 19l-3.5-4.5M6.4 19l3.5-4.5M3.4 10.2l4.95 .4"/></svg>',
    boards:
      '<svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' +
      '<rect x="3" y="13" width="5" height="7" rx="1"/><rect x="9.5" y="7" width="5" height="13" rx="1"/>' +
      '<rect x="16" y="10.5" width="5" height="9.5" rx="1"/></svg>',
    profile:
      '<svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
      '<circle cx="12" cy="12" r="3.2"/>' +
      '<path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.9 19.3a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.7 8.9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1.03-1.56V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15.1 4.7a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9v.09a1.7 1.7 0 0 0 1.56 1.03H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1.03z"/></svg>',
  };

  var TABS = [
    { id: "play",    label: "Play",    href: "index.html" },
    { id: "boards",  label: "Boards",  href: "leaderboard.html" },
    { id: "profile", label: "Profile", href: "profile.html" },
  ];

  function renderTabBar(activeId) {
    var bar = document.createElement("nav");
    bar.className = "fx-tabbar";
    bar.innerHTML = TABS.map(function (t) {
      return '<a class="fx-tab' + (t.id === activeId ? " on" : "") + '" href="' + t.href + '">' +
             ICONS[t.id] + '<span>' + t.label + '</span></a>';
    }).join("");
    document.body.appendChild(bar);
  }

  return {
    GAMES: GAMES,
    RIVALS: RIVALS,
    dayNumber: dayNumber,
    formatTime: formatTime,
    getResults: getResults,
    getResult: getResult,
    hasPlayed: hasPlayed,
    saveResult: saveResult,
    clearToday: clearToday,
    standingsFor: standingsFor,
    totals: totals,
    renderRows: renderRows,
    showEndcard: showEndcard,
    renderTabBar: renderTabBar,
  };
})();
