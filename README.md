# That One Game (WIP title) - online tabletop

A website for playing That One Game online: rooms you join by link or code, a spectator view,
a library of every card, and a deck builder.

It is an *assisted tabletop*. The site handles turns, the turn draw, life, level unlocks,
stood/rested, face-down cards and combat math. Players carry out card effects by hand using the
menus on each card (change stats, move cards, draw, mill, search and so on).

## Files

| File | What it is |
| --- | --- |
| `index.html` | The page. Loads `style.css` and `app.js`. |
| `style.css` | All styling. |
| `app.js` | The site: library, deck builder, home screen, rooms and the play table. |
| `cards.js` | Every card, one per line, plus the two starter decks. Edit cards here. |
| `net.js` | Saves rooms and keeps players in sync. |
| `README.md` | This guide. |
| `firebase-config.js` | Where your Firebase settings go to turn on online play. Empty = practice mode. |
| `database.rules.json` | Security rules to paste into Firebase. |

There is no build step. The site is plain files that any static host can serve.

## Practice mode (no setup)

While `firebase-config.js` is empty, rooms only work between tabs of the same browser.
That is enough to try everything alone: create a room in one tab, open the invite link in a
second tab and join with the other starter deck.

The files must be served by a web server (opening `index.html` straight from a folder will not
work). Hosting on GitHub Pages, below, is the easy way.

## Put it online

### 1. Host the files (GitHub Pages)

1. Put these files in a GitHub repository (public, or private on a paid plan).
2. In the repository: Settings > Pages > "Deploy from a branch" > branch `main`, folder `/ (root)` > Save.
3. After a minute the site is live at `https://YOUR-USERNAME.github.io/REPO-NAME/`.

### 2. Turn on online rooms (Firebase)

1. Go to https://console.firebase.google.com, sign in with a Google account and create a project
   (Analytics is not needed).
2. **Databases & Storage > Realtime Database > Create database.** Pick a location and choose
   **locked mode**.
3. On the database's **Rules** tab, replace everything with the contents of `database.rules.json`
   and publish.
4. **Security > Authentication > Sign-in method:** enable **Anonymous**. (Players never see a
   login. This just gives each browser an ID so hands stay private.)
5. **Project settings > Your apps > Web app (the `</>` icon):** register an app, then copy the
   `firebaseConfig` values into `firebase-config.js`. Make sure `databaseURL` is included.
6. Commit the change. The practice-mode notice disappears and room links work for anyone.

## How a game works on the site

- **Create room** gives a 5-character code and an invite link. The second person to join with a
  deck is the opponent. Anyone after that, or anyone who picks "Just watch", is a spectator.
- Spectators see everything except the decks: the table, both hands, what face-down cards
  really are, life, discard piles and the log.
- Each player may mulligan once before the game starts. **Start game** picks the first player
  at random.
- **End turn** stands the next player's cards, resets their plays and draws their card.
- Tap a card in hand to play it, play it face down, discard it or move it.
- Tap a card on the table to rest/stand it, attack, change its stats, mark it (Condemned,
  Poisoned, Guard Duty), flip it, or move it anywhere.
- **Attack** asks for the color, then the target. Only rested units that share the color can be
  chosen. If you attack the player, they pick a blocker or take the hit. The site shows the
  result and either player presses **Apply result**.
- Life at 20 or 10 unlocks level 2 or 3 for both players. Playing a card above the unlocked
  level asks for confirmation instead of being blocked, so card effects can still override.
- Tap the deck chip to draw, mill, look at the top card, search or shuffle.
- **Soul:** open a card on the table and choose "Put this card into a soul" to slide it under
  another card. The top card shows "soul N". When the top card leaves the table, its soul goes
  to the discard pile automatically.
- The layout is built for a computer screen first: the table on the left, a card reader (hover
  a card) and the game log on the right. On a phone everything stacks into one column.

## Known limits

- Card effects are not automated.
- Hidden information is honest-player only. Because spectators can read hands, a player who
  opens the room in a second, private browser window as a spectator could read the opponent's
  hand. Fine for playtesting with friends; a public ranked game would need a real server.
- Decks are saved in the browser. Use a deck code to move a deck to another device.
- Old rooms are never deleted from the database.
- A player who clears their browser data loses their seat in rooms they were in.
