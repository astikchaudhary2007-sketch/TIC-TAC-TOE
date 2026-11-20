/*
 * Noughts & Crosses (Tic-Tac-Toe)
 *
 * Task: create a two-player game on a 3×3 board and detect the winner,
 * using a 2D array, functions and conditions.
 *
 * The board is a 2D array: board[row][col], rows and columns 0–2.
 * Each cell holds "X", "O" or null (empty).
 *
 *        col 0   col 1   col 2
 * row 0 [  .   ,   .   ,   .  ]
 * row 1 [  .   ,   .   ,   .  ]
 * row 2 [  .   ,   .   ,   .  ]
 */
(() => {
  "use strict";

  const SIZE = 3;
  const GLYPH = { X: "×", O: "○" };
  const ROW_NAMES = ["top", "middle", "bottom"];
  const COL_NAMES = ["left", "middle", "right"];
  const STORE_KEY = "nc-state-v2";
  const CPU_DELAY = 420;

  /* =====================================================================
   * 1. BOARD FUNCTIONS (all work on the 2D array)
   * ===================================================================== */

  // Make a fresh 3×3 board with every cell empty.
  function createBoard() {
    const grid = [];
    for (let row = 0; row < SIZE; row++) {
      grid[row] = [];
      for (let col = 0; col < SIZE; col++) {
        grid[row][col] = null;
      }
    }
    return grid;
  }

  // Copy a board so the computer can try moves without touching the real one.
  function copyBoard(grid) {
    return grid.map((row) => row.slice());
  }

  function isCellEmpty(grid, row, col) {
    return grid[row][col] === null;
  }

  // Put a mark in a cell. Returns false if the move is not allowed.
  function placeMark(grid, row, col, mark) {
    if (row < 0 || row >= SIZE || col < 0 || col >= SIZE) return false;
    if (!isCellEmpty(grid, row, col)) return false;
    grid[row][col] = mark;
    return true;
  }

  // List every empty cell as [row, col].
  function getEmptyCells(grid) {
    const empty = [];
    for (let row = 0; row < SIZE; row++) {
      for (let col = 0; col < SIZE; col++) {
        if (isCellEmpty(grid, row, col)) empty.push([row, col]);
      }
    }
    return empty;
  }

  // The board is full when no cell is empty.
  function isBoardFull(grid) {
    return getEmptyCells(grid).length === 0;
  }

  function switchPlayer(mark) {
    return mark === "X" ? "O" : "X";
  }

  /* =====================================================================
   * 2. WINNER DETECTION
   *
   * A player wins with three of their marks in one row, one column,
   * or one of the two diagonals. Returns { mark, cells } for the winner,
   * or null if nobody has won yet.
   * ===================================================================== */

  function allSame(grid, cells) {
    const [r0, c0] = cells[0];
    const first = grid[r0][c0];
    if (first === null) return false;
    for (const [r, c] of cells) {
      if (grid[r][c] !== first) return false;
    }
    return true;
  }

  function checkWinner(grid) {
    // Check each row: board[row][0], board[row][1], board[row][2]
    for (let row = 0; row < SIZE; row++) {
      const cells = [];
      for (let col = 0; col < SIZE; col++) cells.push([row, col]);
      if (allSame(grid, cells)) return { mark: grid[row][0], cells };
    }

    // Check each column: board[0][col], board[1][col], board[2][col]
    for (let col = 0; col < SIZE; col++) {
      const cells = [];
      for (let row = 0; row < SIZE; row++) cells.push([row, col]);
      if (allSame(grid, cells)) return { mark: grid[0][col], cells };
    }

    // Main diagonal: top-left to bottom-right, where row === col
    const diagonal = [];
    for (let i = 0; i < SIZE; i++) diagonal.push([i, i]);
    if (allSame(grid, diagonal)) return { mark: grid[0][0], cells: diagonal };

    // Anti-diagonal: top-right to bottom-left, where row + col === SIZE - 1
    const antiDiagonal = [];
    for (let i = 0; i < SIZE; i++) antiDiagonal.push([i, SIZE - 1 - i]);
    if (allSame(grid, antiDiagonal)) return { mark: grid[0][SIZE - 1], cells: antiDiagonal };

    return null;
  }

  // "X" or "O" if someone won, "draw" if the board is full, otherwise null.
  function getResult(grid) {
    const winner = checkWinner(grid);
    if (winner) return winner.mark;
    if (isBoardFull(grid)) return "draw";
    return null;
  }

  /* =====================================================================
   * 3. COMPUTER PLAYER (optional opponent)
   * ===================================================================== */

  // Minimax: score a board from the computer's point of view.
  // Faster wins score higher, slower losses score less badly.
  function minimax(grid, player, me, depth, alpha, beta) {
    const result = getResult(grid);
    if (result === me) return 10 - depth;
    if (result === "draw") return 0;
    if (result !== null) return depth - 10;

    const maximizing = player === me;
    let best = maximizing ? -Infinity : Infinity;
    for (const [row, col] of getEmptyCells(grid)) {
      grid[row][col] = player;
      const score = minimax(grid, switchPlayer(player), me, depth + 1, alpha, beta);
      grid[row][col] = null;
      if (maximizing) {
        best = Math.max(best, score);
        alpha = Math.max(alpha, score);
      } else {
        best = Math.min(best, score);
        beta = Math.min(beta, score);
      }
      if (beta <= alpha) break;
    }
    return best;
  }

  function bestMoves(grid, me) {
    let top = -Infinity;
    let moves = [];
    for (const [row, col] of getEmptyCells(grid)) {
      grid[row][col] = me;
      const score = minimax(grid, switchPlayer(me), me, 1, -Infinity, Infinity);
      grid[row][col] = null;
      if (score > top) { top = score; moves = [[row, col]]; }
      else if (score === top) moves.push([row, col]);
    }
    return moves;
  }

  // Find a cell that would complete three in a row for `mark`.
  function findWinningMove(grid, mark) {
    for (const [row, col] of getEmptyCells(grid)) {
      grid[row][col] = mark;
      const wins = checkWinner(grid) !== null;
      grid[row][col] = null;
      if (wins) return [row, col];
    }
    return null;
  }

  const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

  function chooseCpuMove(grid, me) {
    const open = getEmptyCells(grid);
    if (settings.difficulty === "easy") return pickRandom(open);
    if (settings.difficulty === "normal") {
      const win = findWinningMove(grid, me);
      if (win) return win;
      if (Math.random() < 0.8) {
        const block = findWinningMove(grid, switchPlayer(me));
        if (block) return block;
      }
      return Math.random() < 0.6 ? pickRandom(bestMoves(grid, me)) : pickRandom(open);
    }
    return pickRandom(bestMoves(grid, me));
  }

  /* =====================================================================
   * 4. PAGE: state, rendering and input
   * ===================================================================== */

  const $ = (id) => document.getElementById(id);
  const boardEl = $("board");
  const cellsEl = $("cells");
  const strikeEl = $("strike");
  const statusEl = $("status");
  const statusMark = statusEl.querySelector(".status__mark");
  const statusText = statusEl.querySelector(".status__text");
  const undoBtn = $("undoBtn");
  const newRoundBtn = $("newRoundBtn");
  const resetScoreBtn = $("resetScoreBtn");
  const difficultyEl = $("difficulty");
  const cpuOptions = $("cpuOptions");
  const moveLog = $("moveLog");
  const moveLogEmpty = $("moveLogEmpty");
  const roundLabel = $("roundLabel");
  const themeToggle = $("themeToggle");
  const scoreEls = { X: $("scoreX"), O: $("scoreO"), draw: $("scoreDraw") };
  const nameEls = { X: $("nameX"), O: $("nameO") };

  const saved = loadSaved();
  const settings = {
    mode: saved.mode === "cpu" ? "cpu" : "pvp", // two players by default
    difficulty: ["easy", "normal", "hard"].includes(saved.difficulty) ? saved.difficulty : "normal",
    human: saved.human === "O" ? "O" : "X",
    theme: saved.theme === "dark" || saved.theme === "light" ? saved.theme : null,
  };
  let scores = Object.assign({ X: 0, O: 0, draw: 0 }, saved.scores);
  let round = Number.isInteger(saved.round) && saved.round > 0 ? saved.round : 1;

  let board;      // the 3×3 2D array
  let current;    // whose turn: "X" or "O"
  let history;    // [{ row, col, mark }]
  let gameOver;
  let cpuTimer;

  function loadSaved() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; }
    catch { return {}; }
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ ...settings, scores, round })); }
    catch { /* storage blocked: the game still works, it just won't remember */ }
  }

  const starterFor = (r) => (r % 2 === 1 ? "X" : "O");
  const isCpuTurn = () => settings.mode === "cpu" && current !== settings.human && !gameOver;
  const cellButton = (row, col) => cellsEl.children[row * SIZE + col];
  const cellLabel = (row, col) => (row === 1 && col === 1 ? "centre" : `${ROW_NAMES[row]} ${COL_NAMES[col]}`);
  // Chess-style names for the move list: columns a–c, rows 3 (top) to 1 (bottom).
  const shortName = (row, col) => "abc"[col] + (SIZE - row);

  function nameFor(mark) {
    if (settings.mode === "pvp") return mark === "X" ? "Player 1" : "Player 2";
    return mark === settings.human ? "You" : "Computer";
  }

  function svgFor(mark, ghost = false) {
    const cls = ghost ? `ghost ${mark.toLowerCase()}` : `mark-${mark.toLowerCase()}`;
    if (mark === "X") {
      return `<svg viewBox="0 0 100 100" class="${cls}" aria-hidden="true"><path d="M14 14 L86 86"/><path d="M86 14 L14 86"/></svg>`;
    }
    return `<svg viewBox="0 0 100 100" class="${cls}" aria-hidden="true"><circle cx="50" cy="50" r="38" transform="rotate(-90 50 50)"/></svg>`;
  }

  function buildCells() {
    cellsEl.innerHTML = "";
    for (let row = 0; row < SIZE; row++) {
      for (let col = 0; col < SIZE; col++) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "cell";
        btn.setAttribute("role", "gridcell");
        btn.addEventListener("click", () => humanPlay(row, col));
        cellsEl.appendChild(btn);
      }
    }
  }

  function renderCell(row, col) {
    const btn = cellButton(row, col);
    const mark = board[row][col];
    btn.classList.remove("is-win");
    if (mark) {
      btn.innerHTML = svgFor(mark);
      btn.setAttribute("aria-label", `${cellLabel(row, col)}, ${mark === "X" ? "cross" : "nought"}`);
    } else {
      btn.innerHTML = `<span class="cell__key" aria-hidden="true">${row * SIZE + col + 1}</span>`;
      btn.setAttribute("aria-label", `${cellLabel(row, col)}, empty`);
    }
  }

  function refreshInteractivity() {
    const locked = gameOver || isCpuTurn();
    for (let row = 0; row < SIZE; row++) {
      for (let col = 0; col < SIZE; col++) {
        const btn = cellButton(row, col);
        btn.disabled = locked || !isCellEmpty(board, row, col);
        const ghost = btn.querySelector(".ghost");
        if (ghost) ghost.remove();
        if (!btn.disabled) btn.insertAdjacentHTML("beforeend", svgFor(current, true));
      }
    }
    boardEl.setAttribute("aria-busy", isCpuTurn() ? "true" : "false");

    const canUndo = settings.mode === "cpu"
      ? history.some((h) => h.mark === settings.human)
      : history.length > 0;
    undoBtn.disabled = gameOver || !canUndo || isCpuTurn();
    newRoundBtn.classList.toggle("pulse", gameOver);
  }

  function setStatus(mark, text, thinking = false) {
    statusMark.dataset.mark = mark;
    statusMark.textContent = mark === "draw" ? "=" : GLYPH[mark];
    statusText.textContent = text;
    statusEl.classList.toggle("is-thinking", thinking);
  }

  function renderStatus() {
    const result = getResult(board);
    if (result === "draw") {
      setStatus("draw", "It's a draw");
    } else if (result) {
      const who = nameFor(result);
      const text = who === "You" ? "You win this one"
        : who === "Computer" ? "The computer wins"
        : `${who} wins`;
      setStatus(result, text);
    } else if (isCpuTurn()) {
      setStatus(current, "Computer is thinking", true);
    } else if (settings.mode === "cpu") {
      setStatus(current, "Your move");
    } else {
      setStatus(current, `${nameFor(current)} to move`);
    }
  }

  function renderScores(bumpKey) {
    for (const k of ["X", "O", "draw"]) scoreEls[k].textContent = scores[k];
    nameEls.X.textContent = `× ${nameFor("X")}`;
    nameEls.O.textContent = `○ ${nameFor("O")}`;
    if (bumpKey) {
      const el = scoreEls[bumpKey];
      el.classList.remove("bump");
      void el.offsetWidth;
      el.classList.add("bump");
    }
  }

  function renderLog() {
    moveLog.innerHTML = history
      .map((h) => `<li><span class="m-${h.mark.toLowerCase()}">${GLYPH[h.mark]}</span>${shortName(h.row, h.col)}</li>`)
      .join("");
    moveLogEmpty.hidden = history.length > 0;
  }

  function drawStrike(cells) {
    // Each cell is 100 units wide in the 300×300 SVG; its centre is at 50 + index × 100.
    const centre = ([row, col]) => [50 + col * 100, 50 + row * 100];
    const [x1, y1] = centre(cells[0]);
    const [x2, y2] = centre(cells[cells.length - 1]);
    const len = Math.hypot(x2 - x1, y2 - y1);
    const dx = ((x2 - x1) / len) * 34;
    const dy = ((y2 - y1) / len) * 34;
    strikeEl.setAttribute("x1", x1 - dx);
    strikeEl.setAttribute("y1", y1 - dy);
    strikeEl.setAttribute("x2", x2 + dx);
    strikeEl.setAttribute("y2", y2 + dy);
    strikeEl.classList.remove("is-drawn");
    void strikeEl.getBoundingClientRect();
    strikeEl.classList.add("is-drawn");
  }

  function renderSettings() {
    document.querySelectorAll("[data-mode]").forEach((b) =>
      b.setAttribute("aria-checked", String(b.dataset.mode === settings.mode)));
    document.querySelectorAll("[data-side]").forEach((b) =>
      b.setAttribute("aria-checked", String(b.dataset.side === settings.human)));
    difficultyEl.value = settings.difficulty;
    cpuOptions.hidden = settings.mode !== "cpu";
    roundLabel.textContent = `Round ${round}`;
  }

  function applyTheme() {
    if (settings.theme) document.documentElement.dataset.theme = settings.theme;
    else delete document.documentElement.dataset.theme;
  }

  /* ---------- Game flow ---------- */

  function startRound() {
    clearTimeout(cpuTimer);
    board = createBoard();
    current = starterFor(round);
    history = [];
    gameOver = false;
    boardEl.classList.remove("is-over");
    strikeEl.classList.remove("is-drawn");
    for (let row = 0; row < SIZE; row++) {
      for (let col = 0; col < SIZE; col++) renderCell(row, col);
    }
    renderSettings();
    renderScores();
    renderLog();
    afterTurnChange();
  }

  function play(row, col) {
    if (gameOver) return;
    if (!placeMark(board, row, col, current)) return; // cell taken or off the board

    history.push({ row, col, mark: current });
    renderCell(row, col);
    renderLog();

    const winner = checkWinner(board);
    if (winner) {
      endRound(winner);
    } else if (isBoardFull(board)) {
      endRound(null);
    } else {
      current = switchPlayer(current);
      afterTurnChange();
    }
  }

  function afterTurnChange() {
    renderStatus();
    refreshInteractivity();
    if (isCpuTurn()) {
      cpuTimer = setTimeout(() => {
        if (!isCpuTurn()) return;
        const [row, col] = chooseCpuMove(copyBoard(board), current);
        play(row, col);
      }, CPU_DELAY);
    }
  }

  function humanPlay(row, col) {
    if (gameOver || isCpuTurn()) return;
    play(row, col);
  }

  function endRound(winner) {
    gameOver = true;
    boardEl.classList.add("is-over");
    if (winner) {
      scores[winner.mark]++;
      winner.cells.forEach(([r, c]) => cellButton(r, c).classList.add("is-win"));
      drawStrike(winner.cells);
    } else {
      scores.draw++;
    }
    save();
    renderStatus();
    renderScores(winner ? winner.mark : "draw");
    refreshInteractivity();
    newRoundBtn.focus({ preventScroll: true });
  }

  function undo() {
    if (undoBtn.disabled) return;
    clearTimeout(cpuTimer);
    const takeBack = () => {
      const last = history.pop();
      board[last.row][last.col] = null;
      renderCell(last.row, last.col);
      current = last.mark;
    };
    if (settings.mode === "cpu") {
      // Roll back to just before the human's most recent move.
      while (history.length) {
        const wasHuman = history[history.length - 1].mark === settings.human;
        takeBack();
        if (wasHuman) break;
      }
    } else {
      takeBack();
    }
    renderLog();
    afterTurnChange();
  }

  function newRound() {
    round++;
    save();
    startRound();
  }

  function resetEverything() {
    scores = { X: 0, O: 0, draw: 0 };
    round = 1;
    save();
    startRound();
  }

  /* ---------- Events ---------- */

  document.querySelectorAll("[data-mode]").forEach((btn) =>
    btn.addEventListener("click", () => {
      if (settings.mode === btn.dataset.mode) return;
      settings.mode = btn.dataset.mode;
      resetEverything();
    }));

  document.querySelectorAll("[data-side]").forEach((btn) =>
    btn.addEventListener("click", () => {
      if (settings.human === btn.dataset.side) return;
      settings.human = btn.dataset.side;
      resetEverything();
    }));

  document.querySelectorAll(".segmented").forEach((group) =>
    group.addEventListener("keydown", (e) => {
      if (!["ArrowLeft", "ArrowRight"].includes(e.key)) return;
      const opts = [...group.querySelectorAll("button")];
      const idx = opts.indexOf(document.activeElement);
      const next = opts[(idx + (e.key === "ArrowRight" ? 1 : -1) + opts.length) % opts.length];
      next.focus();
      next.click();
      e.preventDefault();
    }));

  difficultyEl.addEventListener("change", () => {
    settings.difficulty = difficultyEl.value;
    save();
  });

  undoBtn.addEventListener("click", undo);
  newRoundBtn.addEventListener("click", newRound);
  resetScoreBtn.addEventListener("click", () => {
    scores = { X: 0, O: 0, draw: 0 };
    save();
    renderScores();
  });

  themeToggle.addEventListener("click", () => {
    const dark = settings.theme
      ? settings.theme === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    settings.theme = dark ? "light" : "dark";
    applyTheme();
    save();
  });

  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === "SELECT" || tag === "INPUT" || tag === "TEXTAREA") return;

    if (/^[1-9]$/.test(e.key)) {
      // Keys 1–9 map onto the grid like a phone keypad: 1 2 3 / 4 5 6 / 7 8 9
      const n = Number(e.key) - 1;
      humanPlay(Math.floor(n / SIZE), n % SIZE);
      e.preventDefault();
    } else if (e.key === "n" || e.key === "N") {
      newRound();
    } else if (e.key === "u" || e.key === "U") {
      undo();
    }
  });

  /* ---------- Start ---------- */
  applyTheme();
  buildCells();
  startRound();
})();
