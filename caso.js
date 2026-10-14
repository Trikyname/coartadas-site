/* caso.js — one small case of Coartadas, playable on the page.
   The case is the game's real mechanic at its smallest: a floor plan of four rooms joined by doors,
   three suspects and three hours. The player puts each suspect in a room for each hour; whoever is
   alone at the crime scene at the crime hour is the killer. The board only shows what is placed
   and which moves the house does not allow; whether the night is right is said only on accusing.

   The case data and the rule checks are shared with check-case.js (run with `node`), which proves
   that exactly one night fits, that every clue is needed, that the night is reached without guessing
   and that no clue puts anyone at the crime scene. Change the case here, then run that script. */
(function () {
  'use strict';

  // ── The case ────────────────────────────────────────────────────────────────────────────────
  var CASE = {
    // The case does not turn on the rule of staying: every hour, everyone goes through a door.
    stay: false,
    hours: [21, 22, 23],
    rooms: [
      { key: 'lounge',  es: 'Salón',      esThe: 'el salón',      en: 'Lounge',  enThe: 'the lounge' },
      { key: 'library', es: 'Biblioteca', esThe: 'la biblioteca', en: 'Library', enThe: 'the library' },
      { key: 'kitchen', es: 'Cocina',     esThe: 'la cocina',     en: 'Kitchen', enThe: 'the kitchen' },
      { key: 'garden',  es: 'Jardín',     esThe: 'el jardín',     en: 'Garden',  enThe: 'the garden' }
    ],
    // Library and garden share a wall with no door: the house is a corridor of four rooms.
    doors: [[0, 1], [0, 2], [2, 3]],
    suspects: [
      { name: 'Ana',   ink: 'red' },
      { name: 'Bruno', ink: 'teal' },
      { name: 'Clara', ink: 'ocre' }
    ],
    crime: { room: 1, hour: 2 },
    clues: [
      { kind: 'at', who: 2, hour: 1, room: 3 },          // At 22h, Clara was in the garden.
      { kind: 'before', first: 0, second: 1, room: 2 },  // Ana was in the kitchen before Bruno.
      { kind: 'met', a: 1, b: 2 }                        // Bruno and Clara met at some hour.
    ]
  };

  // ── Rules ───────────────────────────────────────────────────────────────────────────────────
  // A board is board[suspect][hour] = room index, or -1 where nothing is placed.

  function adjacent(a, b) {
    if (a === b) return CASE.stay;
    for (var i = 0; i < CASE.doors.length; i++) {
      var d = CASE.doors[i];
      if ((d[0] === a && d[1] === b) || (d[0] === b && d[1] === a)) return true;
    }
    return false;
  }

  function firstVisit(row, room) {
    for (var h = 0; h < row.length; h++) if (row[h] === room) return h;
    return -1;
  }

  // «Before» needs both people to go through the room, the first one at an earlier hour; any
  // earlier hour counts, not only the one right before (the game says the same in its rules).
  function clueHolds(c, board) {
    switch (c.kind) {
      case 'at': return board[c.who][c.hour] === c.room;
      case 'before': {
        var fa = firstVisit(board[c.first], c.room), fb = firstVisit(board[c.second], c.room);
        return fa >= 0 && fb >= 0 && fa < fb;
      }
      case 'met':
        for (var h = 0; h < CASE.hours.length; h++)
          if (board[c.a][h] >= 0 && board[c.a][h] === board[c.b][h]) return true;
        return false;
    }
    throw new Error('Unknown clue kind: ' + c.kind);
  }

  function atScene(board) {
    var who = [];
    for (var s = 0; s < board.length; s++) if (board[s][CASE.crime.hour] === CASE.crime.room) who.push(s);
    return who;
  }

  function walks(row) {
    for (var h = 1; h < row.length; h++) if (!adjacent(row[h - 1], row[h])) return false;
    return true;
  }

  // The whole night holds: every walk is possible, exactly one person is at the scene, every clue is true.
  function holds(board) {
    for (var s = 0; s < board.length; s++) {
      if (board[s].indexOf(-1) >= 0 || !walks(board[s])) return false;
    }
    if (atScene(board).length !== 1) return false;
    for (var i = 0; i < CASE.clues.length; i++) if (!clueHolds(CASE.clues[i], board)) return false;
    return true;
  }

  var api = { CASE: CASE, adjacent: adjacent, clueHolds: clueHolds, atScene: atScene, walks: walks, holds: holds };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof document === 'undefined') return;

  // ── Words ───────────────────────────────────────────────────────────────────────────────────
  var T = {
    en: {
      label: 'Sample case · {0} of 9 placed',
      title: 'The library',
      crime: 'Murder in the library at {0}.',
      hourPill: function (h) { return (h > 12 ? h - 12 : h) + ' PM'; },
      hour: function (h) { return (h > 12 ? h - 12 : h) + ' pm'; },
      the: function (r) { return CASE.rooms[r].enThe; },
      room: function (r) { return CASE.rooms[r].en; },
      clueAt: '{0}, {1} was in {2}.',
      clueAtLead: 'At {0}',
      clueBefore: '{0} was in {1} before {2} was.',
      clueMet: '{0} and {1} were in the same room at some point.',
      evidence: 'Evidence {0}',
      notebook: 'Notebook',
      rulesTitle: 'Rules of the night',
      rules: [
        'Every hour, everyone goes through a door into a room next door. Nobody stays where they were.',
        '“Before” means at any earlier hour, not only the one right before.',
        'Only one person was at the crime scene at that hour. Whoever was there is the killer.'
      ],
      statusIdle: 'Pick a suspect, then tap the room where they were at {0}.',
      statusPick: 'Where was {0} at {1}?',
      statusPlaced: '{0} is in {1} at {2}. Tap another room to move them, or the same one to take them off.',
      statusFull: 'The night is complete. Accuse when it adds up.',
      statusPlaying: 'The night at {0}.',
      warnMove: 'Impossible move',
      warnGo: '{0} could not get from {1} to {2} between {3} and {4}.',
      warnStay: '{0} could not stay in {1} from {2} to {3}.',
      undo: 'Undo', undoNone: 'nothing to undo',
      reset: 'Clear', resetNone: 'nothing placed',
      accuse: 'Accuse', accuseLeft: '{0} to place',
      play: 'Play the night', stop: 'Stop',
      roomLabel: '{0}, {1}',
      roomPeople: function (n) { return n === 0 ? 'empty' : n === 1 ? '1 person' : n + ' people'; },
      roomPlace: 'Put {0} in {1} at {2}',
      chipLabel: '{0}, in {1} at {2}',
      castPlaced: '{0}, on the plan at {1}',
      hourLabel: '{0}',
      hourCrime: '{0}, the hour of the crime',
      accused: 'You accuse {0}',
      nobody: 'In your night, nobody was in the library at {0}.',
      many: 'In your night, {0} were all in the library at {1}.',
      and: ' and ',
      solved: 'Solved',
      verdictWho: 'It was {0}, in the library, at {1}',
      stamp: 'Case closed',
      failed: 'That’s not it',
      failedLine: 'Something in that night could not have happened',
      keepThinking: 'Keep thinking',
      again: 'Play again',
      soon: 'The full game is coming soon to Google Play and the App Store.'
    },
    es: {
      label: 'Caso de prueba · {0} de 9 colocados',
      title: 'La biblioteca',
      crime: 'Crimen en la biblioteca a las {0}.',
      hourPill: function (h) { return h + 'H'; },
      hour: function (h) { return h + 'h'; },
      the: function (r) { return CASE.rooms[r].esThe; },
      room: function (r) { return CASE.rooms[r].es; },
      clueAt: '{0}, {1} estaba en {2}.',
      clueAtLead: 'A las {0}',
      clueBefore: '{0} pasó por {1} antes que {2}.',
      clueMet: '{0} y {1} coincidieron en algún momento.',
      evidence: 'Prueba {0}',
      notebook: 'Cuaderno',
      rulesTitle: 'Reglas de la noche',
      rules: [
        'Cada hora, todos cruzan una puerta a una estancia vecina. Nadie se queda donde estaba.',
        '«Antes que» vale para cualquier hora anterior, no sólo para la de justo antes.',
        'En la escena del crimen, a esa hora, sólo había una persona. Quien estaba allí es el culpable.'
      ],
      statusIdle: 'Elige a alguien y toca la estancia donde estaba a las {0}.',
      statusPick: '¿Dónde estaba {0} a las {1}?',
      statusPlaced: '{0} está en {1} a las {2}. Toca otra estancia para cambiar la ficha de sitio o la misma para quitarla.',
      statusFull: 'La noche está completa. Acusa cuando cuadre.',
      statusPlaying: 'La noche a las {0}.',
      warnMove: 'Paso imposible',
      warnGo: '{0} no pudo ir de {1} a {2} entre las {3} y las {4}.',
      warnStay: '{0} no pudo quedarse en {1} de las {2} a las {3}.',
      undo: 'Deshacer', undoNone: 'nada que deshacer',
      reset: 'Borrar', resetNone: 'no hay nada',
      accuse: 'Acusar', accuseLeft: 'faltan {0}',
      play: 'Ver la noche', stop: 'Parar',
      roomLabel: '{0}, {1}',
      roomPeople: function (n) { return n === 0 ? 'vacía' : n === 1 ? '1 persona' : n + ' personas'; },
      roomPlace: 'Poner a {0} en {1} a las {2}',
      chipLabel: '{0}, en {1} a las {2}',
      castPlaced: '{0}, ya en el plano a las {1}',
      hourLabel: '{0}',
      hourCrime: '{0}, la hora del crimen',
      accused: 'Acusas a {0}',
      nobody: 'En tu noche, nadie estaba en la biblioteca a las {0}.',
      many: 'En tu noche, {0} estaban en la biblioteca a las {1}.',
      and: ' y ',
      solved: 'Resuelto',
      verdictWho: 'Fue {0}, en la biblioteca, a las {1}',
      stamp: 'Caso cerrado',
      failed: 'No es así',
      failedLine: 'Hay algo en esa noche que no pudo pasar',
      keepThinking: 'Seguir pensando',
      again: 'Otra vez',
      soon: 'El juego completo llega muy pronto a Google Play y App Store.'
    }
  };

  function lang() { return document.documentElement.lang === 'es' ? 'es' : 'en'; }
  function tx(key) { return T[lang()][key]; }
  function fmt(s) {
    var args = arguments;
    return s.replace(/\{(\d)\}/g, function (_, i) { return args[+i + 1]; });
  }
  function hourWord(h) { return tx('hour')(CASE.hours[h]); }
  function name(s) { return CASE.suspects[s].name; }

  function clueText(c) {
    switch (c.kind) {
      case 'at': return fmt(tx('clueAt'), fmt(tx('clueAtLead'), hourWord(c.hour)), name(c.who), tx('the')(c.room));
      case 'before': return fmt(tx('clueBefore'), name(c.first), tx('the')(c.room), name(c.second));
      case 'met': return fmt(tx('clueMet'), name(c.a), name(c.b));
    }
    return '';
  }

  // ── Drawing ─────────────────────────────────────────────────────────────────────────────────
  // Plan units: 1000 × 800. Rooms touch on the mid lines; the walls are paper drawn over them.
  var PLAN_W = 1000, PLAN_H = 800;
  var LAYOUT = {
    library: { x: 20,  y: 20,  w: 480, h: 380 },
    lounge:  { x: 500, y: 20,  w: 480, h: 380 },
    garden:  { x: 20,  y: 400, w: 480, h: 380 },
    kitchen: { x: 500, y: 400, w: 480, h: 380 }
  };
  // Paper walls, with the gaps that are the doors: library–lounge, lounge–kitchen, kitchen–garden.
  var WALLS = 'M500 20V150 M500 250V530 M500 630V780 M20 400H690 M790 400H980';

  var INK = {
    red: '#A8392C', teal: '#1F5257', ocre: '#D0942B', black: '#1F1B16', paper: '#E9E2D3',
    teal28: '#B0BAB0', teal46: '#8CA09A', teal72: '#587A7A', ocre20: '#E4D2B1', ocre46: '#DAB572', ocre72: '#D39B34'
  };
  var FLOOR = { library: INK.teal28, lounge: INK.ocre20, kitchen: INK.teal46, garden: INK.teal72 };
  var PATTERN = { library: 'pCross', lounge: 'pStripe', kitchen: 'pDot', garden: 'pBlade' };

  // The furniture is what says which room it is: flat, seen from above, always in the next coverage
  // step of the floor's own ink, and against the walls so the middle is free for the people.
  function furniture(key, o) {
    function r(x, y, w, h, f) { return '<rect x="' + (o.x + x) + '" y="' + (o.y + y) + '" width="' + w + '" height="' + h + '" fill="' + f + '"/>'; }
    function c(x, y, rad, f) { return '<circle cx="' + (o.x + x) + '" cy="' + (o.y + y) + '" r="' + rad + '" fill="' + f + '"/>'; }
    var s = '', i;
    if (key === 'library') {
      // Bookcases along the left and bottom walls: the right wall has the door to the lounge,
      // and the top right corner carries the scene's disc.
      s += r(18, 90, 40, 228, INK.teal46);
      for (i = 0; i < 7; i++) s += r(22, 104 + i * 30, 32, 6, INK.teal72);
      s += r(18, 326, 444, 36, INK.teal46);
      for (i = 0; i < 14; i++) s += r(30 + i * 31, 330, 6, 28, INK.teal72);
    } else if (key === 'lounge') {
      s += r(240, 18, 200, 50, INK.ocre46) + r(222, 18, 18, 66, INK.ocre46) + r(440, 18, 18, 66, INK.ocre46);
      s += r(26, 318, 112, 44, INK.ocre46) + r(342, 318, 112, 44, INK.ocre46);
      s += r(190, 342, 100, 20, INK.ocre72);
    } else if (key === 'kitchen') {
      s += r(18, 312, 444, 50, INK.teal72);
      s += c(60, 337, 14, INK.teal) + c(100, 337, 14, INK.teal) + c(140, 337, 14, INK.teal);
      s += r(330, 320, 96, 34, INK.teal);
      s += r(398, 18, 64, 150, INK.teal72);
    } else if (key === 'garden') {
      s += c(420, 70, 46, INK.teal) + c(360, 40, 26, INK.teal);
      s += c(60, 330, 34, INK.teal) + c(120, 352, 22, INK.teal) + c(420, 330, 30, INK.teal);
    }
    return s;
  }

  // The silhouettes of the cast, as the game draws them.
  var FIGURE = [
    { box: '-30 -46 60 62', g: '<circle cx="0" cy="-13" r="15"/><path d="M-22 24c0-13 10-22 22-22s22 9 22 22z"/><path d="M-15 -25c5-11 25-11 30 0" stroke-width="7" fill="none" stroke-linecap="round"/>' },
    { box: '-30 -50 60 66', g: '<circle cx="0" cy="-12" r="15"/><path d="M-22 24c0-13 10-22 22-22s22 9 22 22z"/><rect x="-24" y="-32" width="48" height="8" rx="4"/><rect x="-14" y="-47" width="28" height="16" rx="3"/>' },
    { box: '-30 -46 60 62', g: '<circle cx="0" cy="-12" r="15"/><path d="M-22 24c0-13 10-22 22-22s22 9 22 22z"/><path d="M-18 -26h36l-5-13h-26z"/>' }
  ];
  function figure(s) {
    var f = FIGURE[s], col = CASE.suspects[s].ink === 'ocre' ? INK.black : INK.paper;
    return '<svg viewBox="' + f.box + '" aria-hidden="true" focusable="false"><g fill="' + col + '" stroke="' + col + '">' + f.g + '</g></svg>';
  }
  var CRIME_DISC = '<svg class="disc" viewBox="-24 -24 48 48" aria-hidden="true" focusable="false"><circle r="24" fill="#E9E2D3"/><rect x="-4.5" y="-14" width="9" height="17" fill="#A8392C"/><rect x="-4.5" y="7" width="9" height="9" fill="#A8392C"/></svg>';

  function planSvg() {
    var s = '<svg class="plan__art" viewBox="0 0 ' + PLAN_W + ' ' + PLAN_H + '" aria-hidden="true" focusable="false"><defs>' +
      '<pattern id="pStripe" width="12" height="12" patternUnits="userSpaceOnUse"><path d="M0 0h12" stroke="#1F1B16" stroke-width="3"/></pattern>' +
      '<pattern id="pCross" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0v14M0 0h14" stroke="#1F1B16" stroke-width="2.4"/></pattern>' +
      '<pattern id="pDot" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="1.5" fill="#1F1B16"/></pattern>' +
      '<pattern id="pBlade" width="18" height="18" patternUnits="userSpaceOnUse"><path d="M4 14l3-8M12 16l2-7" stroke="#1F1B16" stroke-width="2.4" stroke-linecap="round"/></pattern>' +
      '<pattern id="pScene" width="26" height="26" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0v26" stroke="#A8392C" stroke-width="7"/></pattern>' +
      '</defs>';
    var keys = ['library', 'lounge', 'garden', 'kitchen'], i, k, o;
    for (i = 0; i < keys.length; i++) { k = keys[i]; o = LAYOUT[k]; s += '<rect x="' + o.x + '" y="' + o.y + '" width="' + o.w + '" height="' + o.h + '" fill="' + FLOOR[k] + '"/>'; }
    s += '<g opacity="0.1">';
    for (i = 0; i < keys.length; i++) { k = keys[i]; o = LAYOUT[k]; s += '<rect x="' + o.x + '" y="' + o.y + '" width="' + o.w + '" height="' + o.h + '" fill="url(#' + PATTERN[k] + ')"/>'; }
    s += '</g>';
    for (i = 0; i < keys.length; i++) s += furniture(keys[i], LAYOUT[keys[i]]);
    var scene = LAYOUT[CASE.rooms[CASE.crime.room].key];
    s += '<rect class="plan__scene" x="' + scene.x + '" y="' + scene.y + '" width="' + scene.w + '" height="' + scene.h + '" fill="url(#pScene)"/>';
    s += '<path d="' + WALLS + '" stroke="#E9E2D3" stroke-width="16" stroke-linecap="square" fill="none"/>';
    s += '<rect x="16" y="16" width="968" height="768" fill="none" stroke="#1F1B16" stroke-width="8"/>';
    s += '<g transform="translate(' + (scene.x + scene.w - 52) + ' ' + (scene.y + 54) + ') scale(1.2)">' +
         '<circle r="24" fill="#E9E2D3"/><rect x="-4.5" y="-14" width="9" height="17" fill="#A8392C"/><rect x="-4.5" y="7" width="9" height="9" fill="#A8392C"/></g>';
    for (i = 0; i < CASE.rooms.length; i++) {
      k = CASE.rooms[i].key; o = LAYOUT[k];
      // The garden is too dark for black or paper alone: its name goes on a black plate.
      s += '<g class="plan__name" data-name="' + i + '">' + (k === 'garden' ? '<rect class="plan__plate" x="' + (o.x + 18) + '" y="' + (o.y + 18) + '" height="50" width="150" fill="#1F1B16"/>' : '') +
           '<text x="' + (o.x + 30) + '" y="' + (o.y + 58) + '" fill="' + (k === 'garden' ? INK.paper : INK.black) + '"></text></g>';
    }
    return s + '</svg>';
  }

  // ── State ───────────────────────────────────────────────────────────────────────────────────
  var S = CASE.suspects.length, H = CASE.hours.length;
  var board, hour, sel, history, playTimer, dragged;

  function empty() {
    var b = [];
    for (var s = 0; s < S; s++) { b.push([]); for (var h = 0; h < H; h++) b[s].push(-1); }
    return b;
  }
  function copy(b) { return b.map(function (row) { return row.slice(); }); }
  function placedCount() {
    var n = 0;
    for (var s = 0; s < S; s++) for (var h = 0; h < H; h++) if (board[s][h] >= 0) n++;
    return n;
  }

  // ── Building the case on the page ───────────────────────────────────────────────────────────
  var root = document.getElementById('caso');
  if (!root) return;
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  board = empty(); hour = 0; sel = 0; history = []; playTimer = null; dragged = false;

  root.innerHTML =
    '<div class="case__head"><span class="case__label"></span><span class="case__title"></span></div>' +
    '<div class="case__crime">' + CRIME_DISC + '<span class="case__crimeline"></span></div>' +
    '<div class="plan">' + planSvg() + '<div class="plan__rooms"></div><div class="plan__chips"></div></div>' +
    '<ul class="case__warn" aria-live="polite"></ul>' +
    '<div class="cast" role="group"></div>' +
    '<p class="case__status" aria-live="polite"></p>' +
    '<div class="timeline"><button type="button" class="timeline__play"></button><div class="timeline__hours" role="group"></div></div>' +
    '<div class="notebook"><h3 class="notebook__title"></h3><ol class="clues"></ol><h3 class="notebook__title notebook__rules-title"></h3><ul class="rules"></ul></div>' +
    '<div class="tools"></div>' +
    '<div class="verdict" tabindex="-1" hidden></div>';

  var $ = function (sel) { return root.querySelector(sel); };
  var plan = $('.plan'), roomsBox = $('.plan__rooms'), chipsBox = $('.plan__chips');
  if (reduced) root.classList.add('is-still');

  var roomBtns = CASE.rooms.map(function (room, i) {
    var o = LAYOUT[room.key], b = document.createElement('button');
    b.type = 'button'; b.className = 'room'; b.setAttribute('data-room', i);
    b.style.left = (o.x / PLAN_W * 100) + '%'; b.style.top = (o.y / PLAN_H * 100) + '%';
    b.style.width = (o.w / PLAN_W * 100) + '%'; b.style.height = (o.h / PLAN_H * 100) + '%';
    b.addEventListener('click', function () { onRoom(i); });
    roomsBox.appendChild(b);
    return b;
  });

  var chips = CASE.suspects.map(function (p, s) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'chip chip--' + p.ink;
    b.innerHTML = '<span class="chip__disc">' + figure(s) + '</span><span class="chip__name">' + p.name + '</span>';
    b.addEventListener('click', function () { if (!dragged) onPick(s); });
    b.addEventListener('pointerdown', function (e) { startDrag(e, s, b, true); });
    chipsBox.appendChild(b);
    return b;
  });

  var castBtns = CASE.suspects.map(function (p, s) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'cast__person chip--' + p.ink;
    b.innerHTML = '<span class="chip__disc">' + figure(s) + '</span><span class="cast__name">' + p.name + '</span>';
    b.addEventListener('click', function () { if (!dragged) onPick(s); });
    b.addEventListener('pointerdown', function (e) { startDrag(e, s, b, false); });
    $('.cast').appendChild(b);
    return b;
  });

  var hourBtns = CASE.hours.map(function (_, h) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'hour' + (h === CASE.crime.hour ? ' hour--crime' : '');
    b.innerHTML = '<span class="hour__pill">' + (h === CASE.crime.hour ? CRIME_DISC : '') + '<span class="hour__text"></span></span>';
    b.addEventListener('click', function () { stopPlay(); setHour(h); });
    b.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      var n = Math.max(0, Math.min(H - 1, h + d));
      stopPlay(); setHour(n); hourBtns[n].focus();
    });
    $('.timeline__hours').appendChild(b);
    return b;
  });

  function tool(cls) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'tool ' + cls;
    b.innerHTML = '<span class="tool__label"></span><span class="tool__reason"></span>';
    $('.tools').appendChild(b);
    return b;
  }
  var undoBtn = tool('tool--undo'), resetBtn = tool('tool--reset'), accuseBtn = tool('tool--accuse');
  undoBtn.addEventListener('click', function () { if (history.length) { board = history.pop(); hideVerdict(); render(); } });
  resetBtn.addEventListener('click', function () { if (placedCount()) { history.push(copy(board)); board = empty(); sel = 0; hideVerdict(); render(); } });
  accuseBtn.addEventListener('click', accuse);
  $('.timeline__play').addEventListener('click', function () { if (playTimer) stopPlay(); else play(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && sel >= 0) { sel = -1; render(); } });
  document.addEventListener('langchange', render);

  // ── Acting ──────────────────────────────────────────────────────────────────────────────────
  function onPick(s) { sel = sel === s ? -1 : s; render(); }

  function onRoom(r) {
    if (sel < 0) { flashStatus(); return; }
    place(sel, r);
  }

  function place(s, r) {
    stopPlay();
    history.push(copy(board));
    board[s][hour] = board[s][hour] === r ? -1 : r;
    // Next: whoever is still missing at this hour, so a whole hour is a few taps.
    sel = -1;
    for (var i = 1; i <= S; i++) { var n = (s + i) % S; if (board[n][hour] < 0) { sel = n; break; } }
    hideVerdict();
    render();
  }

  function unplace(s) {
    if (board[s][hour] < 0) return;
    history.push(copy(board));
    board[s][hour] = -1;
    hideVerdict();
    render();
  }

  function setHour(h) { hour = h; render(); }

  function play() {
    sel = -1;
    setHour(0);
    root.classList.add('is-playing');
    playTimer = setInterval(function () {
      if (hour >= H - 1) { stopPlay(); return; }
      setHour(hour + 1);
    }, 1100);
    render();
  }
  function stopPlay() {
    if (!playTimer) return;
    clearInterval(playTimer); playTimer = null;
    root.classList.remove('is-playing');
    render();
  }

  function flashStatus() {
    var p = $('.case__status');
    p.classList.remove('is-flash'); void p.offsetWidth; p.classList.add('is-flash');
  }

  // Drag: from the cast or from the plan to a room. Dropped off the plan, a chip leaves the board.
  function roomAt(x, y) {
    var rc = plan.getBoundingClientRect();
    var px = (x - rc.left) / rc.width * PLAN_W, py = (y - rc.top) / rc.height * PLAN_H;
    for (var i = 0; i < CASE.rooms.length; i++) {
      var o = LAYOUT[CASE.rooms[i].key];
      if (px >= o.x && px <= o.x + o.w && py >= o.y && py <= o.y + o.h) return i;
    }
    return -1;
  }
  function startDrag(e, s, el, fromPlan) {
    if (e.button !== 0 || playTimer) return;
    var sx = e.clientX, sy = e.clientY, ghost = null, over = -1;
    dragged = false;
    try { el.setPointerCapture(e.pointerId); } catch (_) { /* capture is a nicety */ }
    function move(ev) {
      if (!ghost) {
        if (Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) < 10) return;
        ghost = document.createElement('div');
        ghost.className = 'ghost chip--' + CASE.suspects[s].ink;
        ghost.innerHTML = '<span class="chip__disc">' + figure(s) + '</span>';
        document.body.appendChild(ghost);
        dragged = true;
      }
      ghost.style.transform = 'translate(' + ev.clientX + 'px,' + ev.clientY + 'px)';
      var r = roomAt(ev.clientX, ev.clientY);
      if (r !== over) {
        if (over >= 0) roomBtns[over].classList.remove('is-over');
        if (r >= 0) roomBtns[r].classList.add('is-over');
        over = r;
      }
    }
    function end(ev, cancelled) {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', cancel);
      if (over >= 0) roomBtns[over].classList.remove('is-over');
      if (!ghost) return;
      ghost.remove();
      if (!cancelled) {
        var r = roomAt(ev.clientX, ev.clientY);
        if (r >= 0) { if (board[s][hour] !== r) { sel = s; place(s, r); } }
        else if (fromPlan) unplace(s);
      }
      // The click that follows a drag is not a pick.
      setTimeout(function () { dragged = false; }, 0);
    }
    function up(ev) { end(ev, false); }
    function cancel(ev) { end(ev, true); }
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', cancel);
  }

  // ── The accusation: the only place where right and wrong are said ───────────────────────────
  function accuse() {
    if (placedCount() < S * H) return;
    stopPlay();
    var v = $('.verdict'), who = atScene(board), ok = holds(board), crimeHour = hourWord(CASE.crime.hour);
    var lead;
    if (who.length === 1) lead = '<p class="verdict__accused"><span class="chip--' + CASE.suspects[who[0]].ink + '"><span class="chip__disc">' + figure(who[0]) + '</span></span>' + fmt(tx('accused'), name(who[0])) + '</p>';
    else if (who.length === 0) lead = '<p class="verdict__accused verdict__accused--none">' + fmt(tx('nobody'), crimeHour) + '</p>';
    else lead = '<p class="verdict__accused verdict__accused--none">' + fmt(tx('many'), who.map(name).join(tx('and')), crimeHour) + '</p>';
    if (ok) {
      v.className = 'verdict verdict--solved';
      v.innerHTML = lead +
        '<div class="verdict__band"><p class="verdict__word">' + tx('solved') + '</p><p class="verdict__line">' +
        fmt(tx('verdictWho'), name(who[0]), crimeHour) + '</p><span class="verdict__stamp">' + tx('stamp') + '</span></div>' +
        '<p class="verdict__soon">' + tx('soon') + '</p>' +
        '<button type="button" class="tool tool--wide verdict__again"><span class="tool__label">' + tx('again') + '</span></button>';
      v.querySelector('.verdict__again').addEventListener('click', function () {
        board = empty(); history = []; sel = 0; hour = 0; hideVerdict(); render();
        castBtns[0].focus();
      });
    } else {
      v.className = 'verdict verdict--failed';
      v.innerHTML = lead +
        '<div class="verdict__band"><p class="verdict__word">' + tx('failed') + '</p><p class="verdict__line">' + tx('failedLine') + '</p></div>' +
        '<button type="button" class="tool tool--wide verdict__back"><span class="tool__label">' + tx('keepThinking') + '</span></button>';
      v.querySelector('.verdict__back').addEventListener('click', function () { hideVerdict(); accuseBtn.focus(); });
    }
    v.hidden = false;
    root.classList.add('has-verdict');
    v.focus({ preventScroll: true });
    v.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' });
  }
  function hideVerdict() {
    var v = $('.verdict');
    if (v.hidden) return;
    v.hidden = true; v.innerHTML = '';
    root.classList.remove('has-verdict');
  }

  // ── Rendering: what is placed, and the moves the house does not allow ───────────────────────
  function seats(n) { return n === 1 ? [0.5] : n === 2 ? [0.32, 0.68] : [0.2, 0.5, 0.8]; }

  function warnings() {
    var out = [];
    for (var s = 0; s < S; s++) for (var h = 1; h < H; h++) {
      var a = board[s][h - 1], b = board[s][h];
      if (a < 0 || b < 0 || adjacent(a, b)) continue;
      out.push(a === b
        ? fmt(tx('warnStay'), name(s), tx('the')(a), hourWord(h - 1), hourWord(h))
        : fmt(tx('warnGo'), name(s), tx('the')(a), tx('the')(b), hourWord(h - 1), hourWord(h)));
    }
    return out;
  }

  function render() {
    var L = lang(), h, s, r, n = placedCount(), hw = hourWord(hour);
    root.setAttribute('lang', L);
    $('.case__label').textContent = fmt(tx('label'), n);
    $('.case__title').textContent = tx('title');
    $('.case__crimeline').textContent = fmt(tx('crime'), hourWord(CASE.crime.hour));

    var names = root.querySelectorAll('.plan__name');
    for (r = 0; r < names.length; r++) {
      var label = tx('room')(r).toUpperCase(), t = names[r].querySelector('text'), plate = names[r].querySelector('.plan__plate');
      t.textContent = label;
      if (plate) plate.setAttribute('width', 26 + label.length * 22);
    }
    plan.classList.toggle('is-crime-hour', hour === CASE.crime.hour);

    // Chips: one per suspect, moved from seat to seat so playing the night walks them.
    var inRoom = CASE.rooms.map(function () { return []; });
    for (s = 0; s < S; s++) if (board[s][hour] >= 0) inRoom[board[s][hour]].push(s);
    for (s = 0; s < S; s++) {
      var c = chips[s], at = board[s][hour];
      c.classList.toggle('is-selected', sel === s);
      if (at < 0) { c.classList.add('is-off'); c.tabIndex = -1; c.setAttribute('aria-hidden', 'true'); continue; }
      var o = LAYOUT[CASE.rooms[at].key], group = inRoom[at], fx = seats(group.length)[group.indexOf(s)];
      c.classList.remove('is-off'); c.tabIndex = 0; c.removeAttribute('aria-hidden');
      c.style.left = ((o.x + o.w * fx) / PLAN_W * 100) + '%';
      c.style.top = ((o.y + o.h * 0.56) / PLAN_H * 100) + '%';
      c.setAttribute('aria-label', fmt(tx('chipLabel'), name(s), tx('the')(at), hw));
      c.setAttribute('aria-pressed', String(sel === s));
    }
    for (r = 0; r < roomBtns.length; r++) {
      roomBtns[r].setAttribute('aria-label', sel >= 0
        ? fmt(tx('roomPlace'), name(sel), tx('the')(r), hw)
        : fmt(tx('roomLabel'), tx('room')(r), tx('roomPeople')(inRoom[r].length)));
      roomBtns[r].classList.toggle('is-target', sel >= 0);
    }
    for (s = 0; s < S; s++) {
      castBtns[s].classList.toggle('is-placed', board[s][hour] >= 0);
      castBtns[s].classList.toggle('is-selected', sel === s);
      castBtns[s].setAttribute('aria-pressed', String(sel === s));
      castBtns[s].setAttribute('aria-label', board[s][hour] >= 0 ? fmt(tx('castPlaced'), name(s), hw) : name(s));
    }

    for (h = 0; h < H; h++) {
      hourBtns[h].querySelector('.hour__text').textContent = tx('hourPill')(CASE.hours[h]);
      hourBtns[h].classList.toggle('is-current', h === hour);
      hourBtns[h].setAttribute('aria-pressed', String(h === hour));
      hourBtns[h].setAttribute('aria-label', fmt(tx(h === CASE.crime.hour ? 'hourCrime' : 'hourLabel'), tx('hour')(CASE.hours[h])));
    }
    var pb = $('.timeline__play');
    pb.innerHTML = playTimer
      ? '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="6" y="6" width="12" height="12" fill="#1F1B16"/></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 4.5l11 7.5-11 7.5z" fill="#1F1B16"/></svg>';
    pb.setAttribute('aria-label', tx(playTimer ? 'stop' : 'play'));

    var st;
    if (playTimer) st = fmt(tx('statusPlaying'), hw);
    else if (sel >= 0 && board[sel][hour] >= 0) st = fmt(tx('statusPlaced'), name(sel), tx('the')(board[sel][hour]), hw);
    else if (sel >= 0) st = fmt(tx('statusPick'), name(sel), hw);
    else if (n === S * H) st = tx('statusFull');
    else st = fmt(tx('statusIdle'), hw);
    $('.case__status').textContent = st;

    var w = warnings(), ul = $('.case__warn');
    ul.innerHTML = w.map(function (line) {
      return '<li><span class="case__warnplate">' + tx('warnMove') + '</span><span>' + line + '</span></li>';
    }).join('');

    setTool(undoBtn, tx('undo'), history.length ? '' : tx('undoNone'), !history.length);
    setTool(resetBtn, tx('reset'), n ? '' : tx('resetNone'), !n);
    setTool(accuseBtn, tx('accuse'), n < S * H ? fmt(tx('accuseLeft'), S * H - n) : '', n < S * H);

    $('.notebook__title').textContent = tx('notebook');
    $('.notebook__rules-title').textContent = tx('rulesTitle');
    $('.clues').innerHTML = CASE.clues.map(function (c, i) {
      return '<li class="clue"><span class="clue__label">' + fmt(tx('evidence'), i + 1) + '</span><span class="clue__text">' + clueText(c) + '</span></li>';
    }).join('');
    $('.rules').innerHTML = tx('rules').map(function (line) { return '<li>' + line + '</li>'; }).join('');
    $('.cast').setAttribute('aria-label', L === 'es' ? 'Sospechosos' : 'Suspects');
    $('.timeline__hours').setAttribute('aria-label', L === 'es' ? 'Horas' : 'Hours');
  }

  function setTool(b, label, reason, off) {
    b.querySelector('.tool__label').textContent = label;
    b.querySelector('.tool__reason').textContent = reason;
    b.disabled = off;
  }

  render();
})();
