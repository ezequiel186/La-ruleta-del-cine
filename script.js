// ---------------------------------------------------------------
// Pósters reales vía TMDb (The Movie Database)
// 1) Creá una cuenta gratis en https://www.themoviedb.org/
// 2) Andá a Configuración > API y generá una "API Key (v3 auth)"
// 3) Pegala acá abajo, entre las comillas
// ---------------------------------------------------------------
const TMDB_API_KEY = "7547c59723c1cded417d49535eb067cd";

// ---------------------------------------------------------------
// Calificación de IMDb vía OMDb API
// 1) Andá a https://www.omdbapi.com/apikey.aspx
// 2) Elegí el plan gratuito ("FREE! (1,000 daily limit)") y registrate
//    con tu email — te llega la key por correo en un par de minutos
// 3) Pegala acá abajo, entre las comillas
// ---------------------------------------------------------------
const OMDB_API_KEY = "723fb58d";

function hasValidTmdbKey(){
  return typeof TMDB_API_KEY === "string" && TMDB_API_KEY.trim().length > 0 && TMDB_API_KEY !== "PEGA_TU_API_KEY_ACA";
}
function hasValidOmdbKey(){
  return typeof OMDB_API_KEY === "string" && OMDB_API_KEY.trim().length > 0 && OMDB_API_KEY !== "PEGA_TU_API_KEY_DE_OMDB_ACA";
}

// Reintenta la solicitud si la API responde 429 (demasiadas solicitudes),
// con una pequeña espera creciente entre intentos.
async function fetchWithRetry(url, attempts = 4, delayMs = 500){
  let lastRes = null;
  for(let i = 0; i < attempts; i++){
    lastRes = await fetch(url);
    if(lastRes.status !== 429) return lastRes;
    await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)));
  }
  return lastRes;
}

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// paleta de tinta de afiche vintage, una por género —
// tonos térreos y saturados como los de un cartel serigrafiado envejecido
const genreColors = {
  "Crimen": "#5c1815",
  "Ciencia ficción": "#1c3a3d",
  "Terror": "#2c1414",
  "Drama": "#4a3813",
  "Suspenso y misterio": "#1a232f",
  "Acción y aventura": "#5c2a10",
  "Fantasía": "#3a2340",
  "Animación": "#253a1c",
  "Superhéroes": "#16283d",
  "Comedia": "#5c471f",
  "Cine clásico": "#1c170f"
};

// Iconos de línea simples por género (arte original, sin marcas ni pósters reales)
const genreIcons = {
  "Crimen": '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="4"><path d="M20 55 Q20 35 50 35 Q80 35 80 55 L80 60 L20 60 Z"/><rect x="15" y="58" width="70" height="8" rx="2"/><line x1="50" y1="35" x2="50" y2="20"/><circle cx="50" cy="16" r="4"/></svg>',
  "Ciencia ficción": '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="4"><circle cx="50" cy="50" r="22"/><ellipse cx="50" cy="50" rx="42" ry="12" transform="rotate(-20 50 50)"/><circle cx="72" cy="20" r="2.5" fill="currentColor" stroke="none"/><circle cx="20" cy="75" r="2" fill="currentColor" stroke="none"/></svg>',
  "Terror": '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="4"><path d="M50 15 C25 15 18 35 18 50 C18 65 28 72 28 72 L28 82 L38 82 L38 74 L44 74 L44 82 L56 82 L56 74 L62 74 L62 82 L72 82 L72 72 C72 72 82 65 82 50 C82 35 75 15 50 15 Z"/><circle cx="38" cy="48" r="5"/><circle cx="62" cy="48" r="5"/><path d="M42 62 L50 68 L58 62"/></svg>',
  "Drama": '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="4"><path d="M25 30 C25 20 40 18 40 28 C40 38 30 38 30 48 C30 60 45 62 45 50" /><path d="M75 30 C75 20 60 18 60 28 C60 38 70 38 70 48 C70 62 55 66 55 78" /></svg>',
  "Suspenso y misterio": '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="4"><circle cx="42" cy="42" r="22"/><line x1="58" y1="58" x2="82" y2="82"/></svg>',
  "Acción y aventura": '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="4"><line x1="20" y1="80" x2="70" y2="30"/><line x1="55" y1="20" x2="80" y2="45"/><line x1="20" y1="80" x2="30" y2="70"/><circle cx="75" cy="25" r="6"/></svg>',
  "Fantasía": '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="4"><path d="M22 55 L50 25 L78 55 Z"/><line x1="30" y1="55" x2="30" y2="75"/><line x1="50" y1="55" x2="50" y2="75"/><line x1="70" y1="55" x2="70" y2="75"/><line x1="22" y1="75" x2="78" y2="75"/></svg>',
  "Animación": '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="4"><path d="M50 20 C25 20 15 40 15 55 C15 72 30 80 50 80 C70 80 85 72 85 55 C85 40 75 20 50 20 Z"/><circle cx="35" cy="45" r="5" fill="currentColor" stroke="none"/><circle cx="65" cy="42" r="4" fill="currentColor" stroke="none"/><circle cx="55" cy="62" r="4.5" fill="currentColor" stroke="none"/><circle cx="30" cy="65" r="3" fill="currentColor" stroke="none"/></svg>',
  "Superhéroes": '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="4"><path d="M30 25 L50 18 L70 25 L70 45 C70 62 58 72 50 78 C42 72 30 62 30 45 Z"/></svg>',
  "Comedia": '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="4"><circle cx="50" cy="50" r="32"/><circle cx="38" cy="42" r="3.5" fill="currentColor" stroke="none"/><circle cx="62" cy="42" r="3.5" fill="currentColor" stroke="none"/><path d="M32 58 Q50 75 68 58"/></svg>',
  "Cine clásico": '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="4"><circle cx="50" cy="50" r="30"/><circle cx="50" cy="50" r="6"/><circle cx="50" cy="26" r="7"/><circle cx="72" cy="62" r="7"/><circle cx="28" cy="62" r="7"/></svg>'
};

// ---- catálogo de PELÍCULAS ----
const movieGenres = {
  "Crimen": [
    "The Godfather","Goodfellas","Pulp Fiction","The Silence of the Lambs",
    "City of God","El secreto de sus ojos","Se7en","No Country for Old Men",
    "Scarface","The Departed","Casino","American Gangster","Heat",
    "The Untouchables","The Usual Suspects"
  ],
  "Ciencia ficción": [
    "2001: A Space Odyssey","The Matrix","Planet of the Apes","Inception",
    "Back to the Future","Back to the Future Part II","Back to the Future Part III",
    "Jurassic Park","The Empire Strikes Back","Terminator 2: Judgment Day",
    "RoboCop","Blade Runner","Blade Runner 2049","Interstellar","War of the Worlds"
  ],
  "Terror": [
    "Psycho","The Shining","Halloween","Friday the 13th","The Texas Chain Saw Massacre",
    "A Nightmare on Elm Street","The Exorcist","Alien","The Thing","Jaws",
    "Day of the Dead","REC","The Nun","The Evil Dead","Evil Dead II"
  ],
  "Drama": [
    "Schindler's List","Forrest Gump","Dead Poets Society","12 Years a Slave",
    "Moonlight","Intouchables","Into the Wild","The Green Mile","Whiplash",
    "The Shawshank Redemption","Good Will Hunting","The Whale","Green Book",
    "Manchester by the Sea","The Pursuit of Happyness"
  ],
  "Suspenso y misterio": [
    "Memento","Fight Club","The Truman Show","Shutter Island","The Prestige",
    "Prisoners","Zodiac","Gone Girl","Oldboy","The Sixth Sense","The Others",
    "Rear Window","Vertigo","Mystic River","The Game"
  ],
  "Acción y aventura": [
    "Gladiator","Raiders of the Lost Ark","Rocky","First Blood","Die Hard",
    "Mad Max: Fury Road","Predator","Pirates of the Caribbean: The Curse of the Black Pearl",
    "The Mummy","John Wick","John Wick: Chapter 2","John Wick: Chapter 3 – Parabellum",
    "John Wick: Chapter 4","Mission: Impossible","Top Gun: Maverick"
  ],
  "Fantasía": [
    "The Lord of the Rings: The Fellowship of the Ring","The Lord of the Rings: The Two Towers",
    "The Lord of the Rings: The Return of the King","Everything Everywhere All at Once",
    "Harry Potter and the Philosopher's Stone","Harry Potter and the Prisoner of Azkaban",
    "Harry Potter and the Deathly Hallows – Part 2","Pan's Labyrinth","The Princess Bride",
    "Edward Scissorhands","The NeverEnding Story","Beetlejuice","Howl's Moving Castle",
    "Princess Mononoke","Stardust"
  ],
  "Animación": [
    "Coraline","The Road to El Dorado","Atlantis: The Lost Empire",
    "Spider-Man: Into the Spider-Verse","The Incredibles","Akira","Inside Out",
    "Persepolis","Spirited Away","Shrek","Shrek 2","WALL·E",
    "How to Train Your Dragon","The Iron Giant","Grave of the Fireflies"
  ],
  "Superhéroes": [
    "Spider-Man","Spider-Man 2","Joker","Batman Begins","The Dark Knight","Logan",
    "Iron Man","The Avengers","X-Men","Watchmen","Deadpool",
    "Captain America: The Winter Soldier","Spider-Man: No Way Home",
    "V for Vendetta","The Batman"
  ],
  "Comedia": [
    "Scary Movie","Scary Movie 2","Airplane!","Groundhog Day","The Big Lebowski",
    "Monty Python and the Holy Grail","The Mask","Bruce Almighty","Dumb and Dumber",
    "Hot Fuzz","Shaun of the Dead","The Naked Gun","Office Space","Superbad",
    "Ferris Bueller's Day Off"
  ],
  "Cine clásico": [
    "Casablanca","Citizen Kane","A Clockwork Orange","The Good, the Bad and the Ugly",
    "Apocalypse Now","Metropolis","Modern Times","The Great Dictator","12 Angry Men",
    "The Bridge on the River Kwai","Ben-Hur","Dr. Strangelove","Lawrence of Arabia",
    "Singin' in the Rain","The Maltese Falcon"
  ]
};

// sagas de películas con orden obligatorio: una secuela queda bloqueada
// hasta marcar como vista la entrega anterior de la lista
const movieSequelChains = [
  ["Back to the Future","Back to the Future Part II","Back to the Future Part III"],
  ["John Wick","John Wick: Chapter 2","John Wick: Chapter 3 – Parabellum","John Wick: Chapter 4"],
  ["The Lord of the Rings: The Fellowship of the Ring","The Lord of the Rings: The Two Towers","The Lord of the Rings: The Return of the King"],
  ["Harry Potter and the Philosopher's Stone","Harry Potter and the Prisoner of Azkaban","Harry Potter and the Deathly Hallows – Part 2"],
  ["Shrek","Shrek 2"],
  ["Scary Movie","Scary Movie 2"],
  ["The Evil Dead","Evil Dead II"],
  ["Spider-Man","Spider-Man 2"]
];

// pistas de año para desambiguar remakes con el mismo título en TMDb
const moviePosterYearHints = {
  "Planet of the Apes": 1968,
  "The Mummy": 1999,
  "Halloween": 1978,
  "Friday the 13th": 1980,
  "The Texas Chain Saw Massacre": 1974,
  "A Nightmare on Elm Street": 1984,
  "The Thing": 1982,
  "Day of the Dead": 1985,
  "The Naked Gun": 1988
};

// ---- catálogo de SERIES (universo aparte del de películas) ----
const seriesGenres = {
  "Crimen": [
    "Breaking Bad","Better Call Saul","The Sopranos","Narcos","Ozark",
    "Peaky Blinders","The Wire","Fargo"
  ],
  "Drama": [
    "Succession","Mad Men","The Crown","Six Feet Under","Boardwalk Empire","This Is Us"
  ],
  "Ciencia ficción": [
    "The Twilight Zone","Black Mirror","Stranger Things","Westworld",
    "Dark","The Expanse","Fringe"
  ],
  "Terror": [
    "American Horror Story","The Haunting of Hill House","Penny Dreadful","Midnight Mass"
  ],
  "Comedia": [
    "The Office","Parks and Recreation","Brooklyn Nine-Nine","Seinfeld",
    "Arrested Development","Community"
  ],
  "Suspenso y misterio": [
    "True Detective","Mindhunter","Sherlock","Broadchurch","Mare of Easttown","The Killing"
  ],
  "Fantasía": [
    "Game of Thrones","The Witcher","Good Omens"
  ],
  "Animación": [
    "Rick and Morty","BoJack Horseman","Avatar: The Last Airbender","Arcane"
  ]
};

const seriesPosterYearHints = {}; // se completa a mano si algún título trae el póster equivocado

// ---- helpers de color, comunes a cualquier catálogo ----
function hexToHsl(hex){
  let r = parseInt(hex.slice(1,3),16)/255;
  let g = parseInt(hex.slice(3,5),16)/255;
  let b = parseInt(hex.slice(5,7),16)/255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h, s, l = (max+min)/2;
  if(max===min){ h=s=0; }
  else{
    const d = max-min;
    s = l > 0.5 ? d/(2-max-min) : d/(max+min);
    switch(max){
      case r: h = (g-b)/d + (g<b?6:0); break;
      case g: h = (b-r)/d + 2; break;
      case b: h = (r-g)/d + 4; break;
    }
    h/=6;
  }
  return [h*360, s*100, l*100];
}
function shadeFor(baseHex, i){
  const [h,s,l] = hexToHsl(baseHex);
  const richSat = Math.min(Math.max(s, 30), 50);
  const deltas = [8, 0, -8];
  const delta = deltas[i % 3];
  const light = Math.min(30, Math.max(10, l + delta));
  return `hsl(${h.toFixed(1)}, ${richSat.toFixed(1)}%, ${light.toFixed(1)}%)`;
}
function truncate(text, max){
  return text.length > max ? text.slice(0, max - 1).trimEnd() + "…" : text;
}
function escapeHtml(str){
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

const ROMAN_NUMERALS = ["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII","XIII","XIV","XV"];
function coreTitle(rawTitle){
  let t = rawTitle.trim();
  const dashParts = t.split(/\s+[–—-]\s+/);
  if(dashParts.length > 1) t = dashParts[0].trim();
  const words = t.split(/\s+/);
  let last = words[words.length - 1];
  if(/^\d+$/.test(last)){
    words.pop();
    last = words[words.length - 1];
  }
  if(last && ROMAN_NUMERALS.includes(last)){
    words.pop();
    last = words[words.length - 1];
  }
  if(last && /^(part|chapter|vol\.?|volume)$/i.test(last)){
    words.pop();
  }
  return words.join(" ").replace(/[:\-–—]\s*$/, "").trim().toLowerCase();
}

// Separa un texto libre en varios títulos: uno por línea, o separados por
// coma. Recorta espacios y descarta entradas vacías.
function parseTitleList(raw){
  return raw
    .split(/[\n,]+/)
    .map(t => t.trim())
    .filter(t => t.length > 0);
}

// mapa de géneros de TMDb -> nuestras categorías (se usa para detectar
// género automáticamente al escribir un título nuevo)
const TMDB_GENRE_TO_CATEGORY = {
  27: "Terror", 16: "Animación", 80: "Crimen", 878: "Ciencia ficción",
  14: "Fantasía", 35: "Comedia", 9648: "Suspenso y misterio", 53: "Suspenso y misterio",
  28: "Acción y aventura", 12: "Acción y aventura", 37: "Acción y aventura",
  18: "Drama", 10749: "Drama", 36: "Drama", 10402: "Drama", 10752: "Drama",
  99: "Drama", 10770: "Drama", 10751: "Animación"
};
const TMDB_GENRE_PRIORITY = [27,16,80,878,14,35,9648,53,28,12,37,36,18,10749,10402,10751,99,10752,10770];
const CLASSIC_ERA_CUTOFF_YEAR = 1980;

// ---------------------------------------------------------------
// Fábrica de la app de ruleta+tablero. Se instancia una vez para
// películas y otra para series: cada instancia tiene su propio
// almacenamiento en localStorage, su propio DOM y su propio estado,
// así que son dos universos totalmente independientes.
// ---------------------------------------------------------------
function createRouletteApp(cfg){
  // cfg: {
  //   storagePrefix, genresData, sequelChains, posterYearHints, mediaType ('movie'|'tv'),
  //   ids: { canvas, spinBtn, backBtn, nextBtn, resultCard, ticketEyebrow, ticketTitle,
  //          ticketCode, ticketRating, stageLabelText, liveRegion, wheelWrap, pointerFlag,
  //          addTitle, addGenre, addBtn, detectHint, boardGrid, boardCount, resetBoardBtn },
  //   genreLabel, itemLabel, itemLabelCap
  // }

  const genres = cfg.genresData;
  const sequelChains = cfg.sequelChains || [];
  const posterYearHints = cfg.posterYearHints || {};
  const genreNames = Object.keys(genres);

  const prerequisiteOf = {};
  sequelChains.forEach(chain => {
    for(let i = 1; i < chain.length; i++){
      prerequisiteOf[chain[i]] = chain[i-1];
    }
  });

  function isLocked(item){
    const prev = prerequisiteOf[item];
    if(!prev) return false;
    if(watched.has(item)) return false;
    return !watched.has(prev);
  }
  function isWatchable(item){
    return !watched.has(item) && !isLocked(item);
  }

  function findFranchiseAnchor(genre, newTitle){
    const core = coreTitle(newTitle);
    if(!core) return null;
    const list = genres[genre] || [];
    let anchor = null;
    list.forEach((existing) => {
      if(existing !== newTitle && coreTitle(existing) === core) anchor = existing;
    });
    return anchor;
  }

  // ---- persistencia (prefijo propio por catálogo) ----
  const WATCHED_KEY = cfg.storagePrefix + ".watched";
  const CUSTOM_KEY = cfg.storagePrefix + ".custom.v1";
  const REMOVED_KEY = cfg.storagePrefix + ".removed.v1";
  const POSTER_CACHE_KEY = cfg.storagePrefix + ".posterCache.v1";
  const RATING_CACHE_KEY = cfg.storagePrefix + ".ratingCache.v1";
  const YEAR_CACHE_KEY = cfg.storagePrefix + ".yearCache.v1";
  const SORT_KEY = cfg.storagePrefix + ".sort.v1";

  function loadSet(key){
    try{ const raw = localStorage.getItem(key); return raw ? new Set(JSON.parse(raw)) : new Set(); }
    catch(e){ return new Set(); }
  }
  function saveSet(key, set){
    try{ localStorage.setItem(key, JSON.stringify([...set])); } catch(e){}
  }
  function loadObj(key){
    try{ const raw = localStorage.getItem(key); const p = raw ? JSON.parse(raw) : {}; return (p && typeof p === "object") ? p : {}; }
    catch(e){ return {}; }
  }
  function saveObj(key, obj){
    try{ localStorage.setItem(key, JSON.stringify(obj)); } catch(e){}
  }

  let watched = loadSet(WATCHED_KEY);
  let customItems = loadObj(CUSTOM_KEY);
  let removedItems = loadSet(REMOVED_KEY); // títulos originales del catálogo que el usuario sacó
  let posterCache = loadObj(POSTER_CACHE_KEY);
  let ratingCache = loadObj(RATING_CACHE_KEY);
  let yearCache = loadObj(YEAR_CACHE_KEY);

  const SORT_OPTIONS = ["default","alpha-asc","alpha-desc","rating-desc","rating-asc","year-desc","year-asc","unwatched-first","watched-first"];
  let sortMode = localStorage.getItem(SORT_KEY);
  if(!SORT_OPTIONS.includes(sortMode)) sortMode = "default";

  Object.keys(customItems).forEach((genre) => {
    if(!genres[genre]) return;
    customItems[genre].forEach((entry) => {
      if(genres[genre].includes(entry.title)) return;
      const idx = entry.afterTitle ? genres[genre].indexOf(entry.afterTitle) : -1;
      if(idx !== -1) genres[genre].splice(idx + 1, 0, entry.title);
      else genres[genre].push(entry.title);
      if(entry.prerequisite) prerequisiteOf[entry.title] = entry.prerequisite;
    });
  });

  // saca del catálogo, ya al cargar la página, cualquier título original
  // que el usuario haya quitado antes (persistido en REMOVED_KEY)
  genreNames.forEach((genre) => {
    if(removedItems.size === 0) return;
    genres[genre] = genres[genre].filter((item) => !removedItems.has(item));
  });

  function isCustomItem(genre, item){
    return !!(customItems[genre] && customItems[genre].some(e => e.title === item));
  }

  function addCustomItem(genre, rawTitle){
    const title = rawTitle.trim();
    if(!title) return { ok:false, reason:"empty" };
    if(!genres[genre]) return { ok:false, reason:"badgenre" };
    const exists = genres[genre].some(m => m.toLowerCase() === title.toLowerCase());
    if(exists) return { ok:false, reason:"duplicate" };

    const anchor = findFranchiseAnchor(genre, title);
    if(anchor){
      const idx = genres[genre].indexOf(anchor);
      genres[genre].splice(idx + 1, 0, title);
      prerequisiteOf[title] = anchor;
    } else {
      genres[genre].push(title);
    }

    if(!customItems[genre]) customItems[genre] = [];
    customItems[genre].push({ title, afterTitle: anchor || null, prerequisite: anchor || null });
    saveObj(CUSTOM_KEY, customItems);

    // si se había quitado antes y ahora se vuelve a agregar, ya no
    // cuenta como "eliminado"
    if(removedItems.has(title)){
      removedItems.delete(title);
      saveSet(REMOVED_KEY, removedItems);
    }

    return { ok:true, title };
  }

  // Saca una película/serie del catálogo, sea del listado original o
  // una agregada a mano. Si era del listado original, se recuerda en
  // REMOVED_KEY para que no vuelva a aparecer al recargar la página.
  function removeCatalogItem(genre, title){
    const wasCustom = isCustomItem(genre, title);

    if(genres[genre]){
      const idx = genres[genre].indexOf(title);
      if(idx !== -1) genres[genre].splice(idx, 1);
    }
    if(customItems[genre]){
      const idx2 = customItems[genre].findIndex(e => e.title === title);
      if(idx2 !== -1) customItems[genre].splice(idx2, 1);
      if(customItems[genre].length === 0) delete customItems[genre];
    }
    saveObj(CUSTOM_KEY, customItems);

    if(!wasCustom){
      removedItems.add(title);
      saveSet(REMOVED_KEY, removedItems);
    }

    // si esta era la entrega "anterior" de alguna secuela, esa secuela
    // queda desbloqueada (ya no hay nada que ver antes)
    Object.keys(prerequisiteOf).forEach((seq) => {
      if(prerequisiteOf[seq] === title) delete prerequisiteOf[seq];
    });
    delete prerequisiteOf[title];

    watched.delete(title);
    saveSet(WATCHED_KEY, watched);
  }

  // ---- DOM ----
  const ids = cfg.ids;
  const canvas = document.getElementById(ids.canvas);
  const ctx = canvas.getContext("2d");
  const spinBtn = document.getElementById(ids.spinBtn);
  const backBtn = document.getElementById(ids.backBtn);
  const nextBtn = document.getElementById(ids.nextBtn);
  const resultCard = document.getElementById(ids.resultCard);
  const ticketEyebrow = document.getElementById(ids.ticketEyebrow);
  const ticketTitle = document.getElementById(ids.ticketTitle);
  const ticketCode = document.getElementById(ids.ticketCode);
  const ticketRating = document.getElementById(ids.ticketRating);
  const stageLabelText = document.getElementById(ids.stageLabelText);
  const liveRegion = document.getElementById(ids.liveRegion);
  const wheelWrap = document.getElementById(ids.wheelWrap);
  const pointerFlag = document.getElementById(ids.pointerFlag);

  const addTitle = document.getElementById(ids.addTitle);
  const addGenre = document.getElementById(ids.addGenre);
  const addBtn = document.getElementById(ids.addBtn);
  const detectHint = document.getElementById(ids.detectHint);
  const boardGrid = document.getElementById(ids.boardGrid);
  const boardCount = document.getElementById(ids.boardCount);
  const resetBoardBtn = document.getElementById(ids.resetBoardBtn);
  const sortSelect = document.getElementById(ids.sortSelect);
  const selectModeBtn = document.getElementById(ids.selectModeBtn);
  const selectionBar = document.getElementById(ids.selectionBar);
  const selectionCount = document.getElementById(ids.selectionCount);
  const bulkDeleteBtn = document.getElementById(ids.bulkDeleteBtn);
  const cancelSelectBtn = document.getElementById(ids.cancelSelectBtn);

  let view = "genre";
  let currentGenre = null;
  let rotation = 0;
  let spinning = false;

  let selectionMode = false;
  let selectedKeys = new Set(); // "genre||title"
  function selKey(genre, title){ return genre + "||" + title; }

  // ---- studs de bronce alrededor del aro de la ruleta ----
  (function buildStuds(){
    const count = 28;
    const radiusPct = 46;
    for(let i=0;i<count;i++){
      const angle = (i / count) * Math.PI * 2;
      const stud = document.createElement("div");
      stud.className = "stud";
      stud.style.transform = `translate(${Math.cos(angle)*radiusPct}%, ${Math.sin(angle)*radiusPct}%)`;
      wheelWrap.appendChild(stud);
    }
  })();

  function currentData(){
    if(view === "genre"){
      return genreNames.filter(g => genres[g].some(m => isWatchable(m)));
    }
    return genres[currentGenre].filter(m => isWatchable(m));
  }
  function currentBaseColor(){
    return view === "genre" ? "#3a3018" : genreColors[currentGenre];
  }

  function drawWheel(){
    const data = currentData();
    const n = data.length;
    const w = canvas.width, h = canvas.height;
    const cx = w/2, cy = h/2;
    const radius = w/2;
    const segAngle = (Math.PI*2)/n;
    const baseColor = currentBaseColor();

    ctx.clearRect(0,0,w,h);

    let fontSize = Math.max(15, Math.min(24, 600/n));
    const availableRadius = radius * 0.72; // espacio real entre el borde y el cubo central
    let maxChars = Math.max(9, Math.floor(availableRadius / (fontSize*0.46)));

    // si la etiqueta más larga no entra igual, achicamos un poco la
    // tipografía (hasta un mínimo legible) en vez de cortarla con "…"
    const longestLen = data.reduce((m, t) => Math.max(m, t.length), 0);
    if(longestLen > maxChars){
      const neededFontSize = availableRadius / (longestLen * 0.46);
      fontSize = Math.max(13, Math.min(fontSize, neededFontSize));
      maxChars = Math.max(9, Math.floor(availableRadius / (fontSize*0.46)));
    }

    for(let i=0;i<n;i++){
      const start = i*segAngle;
      const end = start+segAngle;

      ctx.beginPath();
      ctx.moveTo(cx,cy);
      ctx.arc(cx,cy,radius,start,end);
      ctx.closePath();
      ctx.fillStyle = shadeFor(baseColor, i);
      ctx.fill();
      ctx.strokeStyle = "rgba(5,4,3,0.75)";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      const mid = start + segAngle/2;
      ctx.save();
      ctx.translate(cx,cy);
      ctx.rotate(mid);

      const flip = mid > Math.PI/2 && mid < Math.PI*1.5;
      ctx.textBaseline = "middle";
      ctx.font = `400 ${fontSize}px "Anton", sans-serif`;
      ctx.lineJoin = "round";

      const label = truncate(data[i], maxChars);
      const textRadius = radius*0.92;

      if(flip){
        ctx.textAlign = "left";
        ctx.rotate(Math.PI);
        ctx.strokeStyle = "rgba(5,4,3,0.9)";
        ctx.lineWidth = fontSize * 0.14;
        ctx.strokeText(label, -textRadius, 0);
        ctx.fillStyle = "#d9d2b8";
        ctx.fillText(label, -textRadius, 0);
      } else {
        ctx.textAlign = "right";
        ctx.strokeStyle = "rgba(5,4,3,0.9)";
        ctx.lineWidth = fontSize * 0.14;
        ctx.strokeText(label, textRadius, 0);
        ctx.fillStyle = "#d9d2b8";
        ctx.fillText(label, textRadius, 0);
      }
      ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(cx,cy, radius*0.18, 0, Math.PI*2);
    ctx.strokeStyle = "rgba(5,4,3,0.65)";
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  function normalizeDeg(d){ return ((d % 360) + 360) % 360; }

  function spin(){
    if(spinning) return;

    const data = currentData();
    if(data.length === 0){
      if(view === "movie"){
        alert("¡No queda nada para girar en " + currentGenre + "! Puede que ya viste todo o que lo que falta sean secuelas bloqueadas. Elegí otro género o reiniciá el tablero.");
      } else {
        alert("¡Ya viste todo lo que se puede girar! Puede que las que faltan sean secuelas bloqueadas. Reiniciá el tablero para seguir jugando.");
      }
      return;
    }

    spinning = true;
    spinBtn.disabled = true;
    resultCard.classList.add("hidden");
    backBtn.style.display = "none";
    nextBtn.style.display = "none";

    const n = data.length;
    const segAngleDeg = 360/n;
    const winnerIndex = Math.floor(Math.random()*n);
    const thetaCenter = winnerIndex*segAngleDeg + segAngleDeg/2;
    const pointerAngle = 270;

    const baseTarget = normalizeDeg(pointerAngle - thetaCenter);
    const currentMod = normalizeDeg(rotation);
    const extraSpins = 5 + Math.floor(Math.random()*3);
    const forward = normalizeDeg(baseTarget - currentMod);

    const newRotation = rotation + forward + extraSpins*360;

    if(reduceMotion){
      canvas.classList.add("no-transition");
      rotation = newRotation;
      canvas.style.transform = `rotate(${rotation}deg)`;
      requestAnimationFrame(()=> onSpinDone(data[winnerIndex]));
      return;
    }

    canvas.classList.remove("no-transition");
    const duration = 4200 + Math.random()*900;
    canvas.style.transition = `transform ${duration}ms cubic-bezier(.15,.63,.2,1)`;

    rotation = newRotation;
    canvas.style.transform = `rotate(${rotation}deg)`;

    const onEnd = () => {
      canvas.removeEventListener("transitionend", onEnd);
      onSpinDone(data[winnerIndex]);
    };
    canvas.addEventListener("transitionend", onEnd);
  }

  function ticketCodeText(){
    const num = Math.floor(100000 + Math.random()*899999);
    return "N.º " + num;
  }

  function onSpinDone(winner){
    spinning = false;
    spinBtn.disabled = false;

    pointerFlag.classList.remove("hit");
    void pointerFlag.offsetWidth;
    pointerFlag.classList.add("hit");

    if(view === "genre"){
      currentGenre = winner;
      ticketEyebrow.textContent = "Género seleccionado";
      ticketTitle.textContent = winner;
      ticketRating.textContent = "";
      ticketCode.textContent = ticketCodeText();
      resultCard.classList.remove("hidden");
      liveRegion.textContent = "Género elegido: " + winner;

      nextBtn.textContent = "Girar " + cfg.itemLabel + " de " + winner;
      nextBtn.style.display = "inline-block";
      backBtn.style.display = "none";
      spinBtn.style.display = "none";
    } else {
      ticketEyebrow.innerHTML = cfg.itemLabelCap + ' · <span class="genre-name">' + currentGenre + "</span>";
      ticketTitle.textContent = winner;
      showRatingOnTicket(winner);
      ticketCode.textContent = ticketCodeText();
      resultCard.classList.remove("hidden");
      liveRegion.textContent = cfg.itemLabelCap + " elegida: " + winner;

      nextBtn.textContent = "Girar de nuevo";
      nextBtn.style.display = "inline-block";
      backBtn.style.display = "inline-block";
      spinBtn.style.display = "none";
    }
  }

  function goToItemWheel(){
    const remaining = genres[currentGenre].filter(m => isWatchable(m));
    if(remaining.length === 0){
      alert("¡No queda nada para girar en " + currentGenre + "! Puede que ya viste todo o que lo que falta sean secuelas bloqueadas. Elegí otro género o reiniciá el tablero.");
      return;
    }

    view = "movie";
    rotation = 0;
    canvas.classList.add("no-transition");
    canvas.style.transform = "rotate(0deg)";
    drawWheel();
    requestAnimationFrame(()=> canvas.classList.remove("no-transition"));

    stageLabelText.textContent = "Función 2 · Género: " + currentGenre;
    resultCard.classList.add("hidden");
    nextBtn.style.display = "none";
    backBtn.style.display = "inline-block";
    spinBtn.textContent = "Girar " + cfg.itemLabel;
    spinBtn.style.display = "inline-block";
  }

  function goToGenreWheel(){
    view = "genre";
    currentGenre = null;
    rotation = 0;
    canvas.classList.add("no-transition");
    canvas.style.transform = "rotate(0deg)";
    drawWheel();
    requestAnimationFrame(()=> canvas.classList.remove("no-transition"));

    stageLabelText.textContent = "Función 1 · Elegí un género";
    resultCard.classList.add("hidden");
    nextBtn.style.display = "none";
    backBtn.style.display = "none";
    spinBtn.textContent = "Girar género";
    spinBtn.style.display = "inline-block";
  }

  spinBtn.addEventListener("click", spin);
  nextBtn.addEventListener("click", () => {
    if(view === "genre") goToItemWheel();
    else spin();
  });
  backBtn.addEventListener("click", goToGenreWheel);

  drawWheel();

  // ---- panel "agregar" ----
  const genrePlaceholderOpt = document.createElement("option");
  genrePlaceholderOpt.value = "";
  genrePlaceholderOpt.textContent = "Detectar género automáticamente";
  addGenre.appendChild(genrePlaceholderOpt);
  genreNames.forEach((g) => {
    const opt = document.createElement("option");
    opt.value = g;
    opt.textContent = g;
    addGenre.appendChild(opt);
  });
  addGenre.value = "";

  let detectTimer = null;
  let detectSeq = 0;

  // La previsualización de género en vivo solo tiene sentido cuando se
  // está escribiendo un único título; con varios, se detecta cada uno
  // por separado recién al presionar "Agregar".
  function scheduleGenreDetection(){
    detectHint.textContent = "";
    clearTimeout(detectTimer);
    const titles = parseTitleList(addTitle.value);
    if(titles.length !== 1 || titles[0].length < 2) return;
    const title = titles[0];
    detectTimer = setTimeout(() => runGenreDetection(title), 650);
  }

  async function runGenreDetection(title){
    const mySeq = ++detectSeq;
    detectHint.textContent = "Buscando género en TMDb…";
    const category = await detectGenreForTitle(title);
    if(mySeq !== detectSeq) return;
    const stillSingle = parseTitleList(addTitle.value);
    if(stillSingle.length !== 1 || stillSingle[0] !== title) return;

    if(category){
      addGenre.value = category;
      detectHint.textContent = "Género detectado: " + category + " (se puede cambiar)";
    } else {
      detectHint.textContent = "No se pudo detectar el género — elegilo abajo.";
    }
  }

  addTitle.addEventListener("input", scheduleGenreDetection);
  addTitle.addEventListener("blur", () => {
    const titles = parseTitleList(addTitle.value);
    if(titles.length === 1 && titles[0].length >= 2 && !addGenre.value){
      clearTimeout(detectTimer);
      runGenreDetection(titles[0]);
    }
  });

  // Agrega uno o varios títulos a la vez. Si se eligió un género en el
  // select, se usa ese mismo género para todos los títulos escritos. Si
  // se deja en "Detectar género automáticamente", cada título se busca
  // por separado en TMDb (uno por uno, para no pasarse del límite de la
  // API) y se le asigna el género que le corresponda.
  async function handleAddItem(){
    const rawTitles = parseTitleList(addTitle.value);
    if(rawTitles.length === 0){
      alert("Escribí al menos un título (uno por línea, o separados por coma).");
      return;
    }

    // saca duplicados dentro de lo escrito (sin distinguir mayúsculas),
    // conservando la primera aparición de cada uno
    const seenLower = new Set();
    const titles = [];
    rawTitles.forEach((t) => {
      const key = t.toLowerCase();
      if(seenLower.has(key)) return;
      seenLower.add(key);
      titles.push(t);
    });

    const manualGenre = addGenre.value; // "" = detectar automáticamente cada título
    if(!manualGenre && !hasValidTmdbKey()){
      alert("Elegí un género para agregar — no hay conexión con TMDb para detectarlo automáticamente.");
      return;
    }

    const multiple = titles.length > 1;
    addBtn.disabled = true;
    addTitle.disabled = true;

    let addedCount = 0;
    const duplicates = [];
    const failed = [];

    for(let i = 0; i < titles.length; i++){
      const title = titles[i];
      let genre = manualGenre;

      if(!genre){
        detectHint.textContent = multiple
          ? `Detectando género (${i + 1}/${titles.length})…`
          : "Buscando género en TMDb…";
        genre = await detectGenreForTitle(title);
      } else if(multiple){
        detectHint.textContent = `Agregando (${i + 1}/${titles.length})…`;
      }

      if(!genre){
        failed.push(title);
        continue;
      }

      const result = addCustomItem(genre, title);
      if(result.ok) addedCount++;
      else if(result.reason === "duplicate") duplicates.push(title);
      else failed.push(title);
    }

    addTitle.value = "";
    if(!manualGenre) addGenre.value = "";
    addBtn.disabled = false;
    addTitle.disabled = false;

    buildBoard();

    if(!spinning){
      rotation = 0;
      canvas.classList.add("no-transition");
      canvas.style.transform = "rotate(0deg)";
      drawWheel();
      requestAnimationFrame(()=> canvas.classList.remove("no-transition"));
    }

    const parts = [];
    if(addedCount > 0){
      parts.push(addedCount + " " + (addedCount === 1 ? cfg.itemLabel : cfg.itemLabel + "s") + " agregada" + (addedCount === 1 ? "" : "s"));
    }
    if(duplicates.length > 0){
      parts.push(duplicates.length + " ya estaba" + (duplicates.length === 1 ? "" : "n") + " en el catálogo");
    }
    if(failed.length > 0){
      parts.push(failed.length + " sin género detectado — probá elegirlo manualmente (" + truncate(failed.join(", "), 60) + ")");
    }
    detectHint.textContent = parts.length ? parts.join(" · ") : "No se agregó nada.";

    addTitle.focus();
  }

  addBtn.addEventListener("click", handleAddItem);
  // Enter agrega una nueva línea (para poder cargar varios títulos);
  // Ctrl/Cmd+Enter es el atajo para enviar sin tocar el botón.
  addTitle.addEventListener("keydown", (e) => {
    if(e.key === "Enter" && (e.ctrlKey || e.metaKey)){
      e.preventDefault();
      handleAddItem();
    }
  });

  // ---- búsqueda de pósters + año de estreno (TMDb, una sola llamada) ----
  async function fetchTitleMeta(title){
    const posterKnown = Object.prototype.hasOwnProperty.call(posterCache, title);
    const yearKnown = Object.prototype.hasOwnProperty.call(yearCache, title);
    if(!hasValidTmdbKey()){
      return { posterUrl: posterKnown ? posterCache[title] : null, year: yearKnown ? yearCache[title] : null };
    }
    if(posterKnown && yearKnown){
      return { posterUrl: posterCache[title], year: yearCache[title] };
    }
    try{
      const searchPath = cfg.mediaType === "tv" ? "search/tv" : "search/movie";
      const hintYear = posterYearHints[title];
      const yearParam = cfg.mediaType === "tv" ? "first_air_date_year" : "primary_release_year";
      const baseUrl = "https://api.themoviedb.org/3/" + searchPath + "?api_key=" +
        encodeURIComponent(TMDB_API_KEY) + "&query=" + encodeURIComponent(title);

      let res = await fetchWithRetry(hintYear ? baseUrl + "&" + yearParam + "=" + hintYear : baseUrl);
      if(!res.ok) throw new Error("Respuesta no válida de TMDb");
      let data = await res.json();
      let results = data.results || [];

      if(hintYear && results.length === 0){
        const fallbackRes = await fetchWithRetry(baseUrl);
        if(fallbackRes.ok){
          const fallbackData = await fallbackRes.json();
          results = (fallbackData.results || []).slice().sort((a, b) => {
            const dateA = a.release_date || a.first_air_date;
            const dateB = b.release_date || b.first_air_date;
            const yearA = dateA ? parseInt(dateA.slice(0, 4), 10) : 9999;
            const yearB = dateB ? parseInt(dateB.slice(0, 4), 10) : 9999;
            return Math.abs(yearA - hintYear) - Math.abs(yearB - hintYear);
          });
        }
      }

      const first = results[0];
      const posterUrl = (first && first.poster_path) ? "https://image.tmdb.org/t/p/w342" + first.poster_path : null;
      const dateStr = first ? (first.release_date || first.first_air_date) : null;
      const parsedYear = dateStr ? parseInt(dateStr.slice(0, 4), 10) : null;
      const year = (parsedYear && !isNaN(parsedYear)) ? parsedYear : null;

      if(!posterUrl){
        console.warn('[Ruleta] Sin póster para "' + title + '"', results);
      }

      // Solo guardamos en caché de forma permanente si SÍ conseguimos el
      // póster. Si vino vacío (falla momentánea, límite de la API, etc.)
      // no lo dejamos "sellado" como vacío para siempre — así el próximo
      // intento (por ejemplo, al reordenar el tablero) lo vuelve a pedir
      // en vez de quedar con el cartel en blanco para siempre.
      if(posterUrl){
        posterCache[title] = posterUrl;
        saveObj(POSTER_CACHE_KEY, posterCache);
      }
      yearCache[title] = year;
      saveObj(YEAR_CACHE_KEY, yearCache);

      return { posterUrl, year };
    }catch(e){
      return { posterUrl: posterKnown ? posterCache[title] : null, year: yearKnown ? yearCache[title] : null };
    }
  }

  function applyPosterToCard(art, posterUrl){
    art.style.backgroundImage = `url("${posterUrl}")`;
    art.style.backgroundSize = "cover";
    art.style.backgroundPosition = "center";
    art.classList.add("has-photo");
  }

  function applyYearToBadge(badge, year){
    badge.textContent = String(year);
    badge.classList.add("visible");
  }

  async function detectGenreForTitle(title){
    if(!hasValidTmdbKey()) return null;
    try{
      const searchPath = cfg.mediaType === "tv" ? "search/tv" : "search/movie";
      const url = "https://api.themoviedb.org/3/" + searchPath + "?api_key=" +
        encodeURIComponent(TMDB_API_KEY) + "&query=" + encodeURIComponent(title);
      const res = await fetchWithRetry(url);
      if(!res.ok) throw new Error("Respuesta no válida de TMDb");
      const data = await res.json();
      const first = (data.results || [])[0];
      if(!first) return null;

      const dateStr = first.release_date || first.first_air_date;
      const year = dateStr ? parseInt(dateStr.slice(0,4), 10) : null;
      if(cfg.mediaType !== "tv" && year && year < CLASSIC_ERA_CUTOFF_YEAR && genres["Cine clásico"]){
        return "Cine clásico";
      }

      const ids2 = first.genre_ids || [];
      for(const gid of TMDB_GENRE_PRIORITY){
        if(ids2.includes(gid) && TMDB_GENRE_TO_CATEGORY[gid] && genres[TMDB_GENRE_TO_CATEGORY[gid]]){
          return TMDB_GENRE_TO_CATEGORY[gid];
        }
      }
      return null;
    }catch(e){
      return null;
    }
  }

  // ---- calificación de IMDb (OMDb) ----
  async function fetchImdbRating(title){
    if(!hasValidOmdbKey()) return null;
    if(Object.prototype.hasOwnProperty.call(ratingCache, title)) return ratingCache[title];
    try{
      const typeParam = cfg.mediaType === "tv" ? "series" : "movie";
      const hintYear = posterYearHints[title];
      const baseUrl = "https://www.omdbapi.com/?apikey=" + encodeURIComponent(OMDB_API_KEY) +
        "&type=" + typeParam + "&t=" + encodeURIComponent(title);

      let res = await fetchWithRetry(hintYear ? baseUrl + "&y=" + hintYear : baseUrl);
      if(!res.ok) throw new Error("Respuesta no válida de OMDb");
      let data = await res.json();
      let rating = (data && data.imdbRating && data.imdbRating !== "N/A") ? data.imdbRating : null;

      if(!rating && hintYear){
        const fallbackRes = await fetchWithRetry(baseUrl);
        if(fallbackRes.ok){
          const fallbackData = await fallbackRes.json();
          rating = (fallbackData && fallbackData.imdbRating && fallbackData.imdbRating !== "N/A") ? fallbackData.imdbRating : null;
        }
      }

      if(!rating) console.warn('[Ruleta] Sin calificación de IMDb para "' + title + '"');

      // Igual que con el póster: solo guardamos permanentemente si vino
      // una calificación real. Si vino vacía, no la "sellamos" — así se
      // reintenta más adelante en vez de quedar sin estrella para siempre.
      if(rating){
        ratingCache[title] = rating;
        saveObj(RATING_CACHE_KEY, ratingCache);
      }
      return rating;
    }catch(e){
      return null;
    }
  }

  function applyRatingToBadge(badge, rating){
    badge.textContent = "★ " + rating;
    badge.classList.add("visible");
  }

  function showRatingOnTicket(title){
    if(Object.prototype.hasOwnProperty.call(ratingCache, title)){
      const cached = ratingCache[title];
      ticketRating.textContent = cached ? "★ IMDb " + cached : "";
      return;
    }
    ticketRating.textContent = "";
    if(!hasValidOmdbKey()) return;
    fetchImdbRating(title).then((rating) => {
      if(rating && ticketTitle.textContent === title){
        ticketRating.textContent = "★ IMDb " + rating;
      }
    });
  }

  // ---- colas de solicitudes, en tandas pequeñas para no pasarse del límite ----
  const QUEUE_BATCH_SIZE = 4;
  const QUEUE_DELAY_MS = 350;

  let posterQueue = [];
  let posterQueueRunning = false;
  function queuePosterFetch(title, art, yearBadge){
    posterQueue.push({ title, art, yearBadge });
    if(!posterQueueRunning){ posterQueueRunning = true; runPosterQueue(); }
  }
  async function runPosterQueue(){
    let anyYearResolved = false;
    while(posterQueue.length > 0){
      const batch = posterQueue.splice(0, QUEUE_BATCH_SIZE);
      await Promise.all(batch.map(async ({ title, art, yearBadge }) => {
        const wasCached = Object.prototype.hasOwnProperty.call(posterCache, title) && Object.prototype.hasOwnProperty.call(yearCache, title);
        const { posterUrl, year } = await fetchTitleMeta(title);
        if(posterUrl) applyPosterToCard(art, posterUrl);
        if(year){
          if(yearBadge && yearBadge.isConnected) applyYearToBadge(yearBadge, year);
          if(!wasCached) anyYearResolved = true;
        }
      }));
      if(posterQueue.length > 0) await new Promise((resolve) => setTimeout(resolve, QUEUE_DELAY_MS));
    }
    posterQueueRunning = false;
    // si el orden activo depende del año, una vez que terminan de llegar
    // los años hay que volver a ordenar el tablero
    if(anyYearResolved && (sortMode === "year-desc" || sortMode === "year-asc")){
      buildBoard();
    }
  }

  let ratingQueue = [];
  let ratingQueueRunning = false;
  function queueRatingFetch(title, badge){
    ratingQueue.push({ title, badge });
    if(!ratingQueueRunning){ ratingQueueRunning = true; runRatingQueue(); }
  }
  async function runRatingQueue(){
    let anyResolved = false;
    while(ratingQueue.length > 0){
      const batch = ratingQueue.splice(0, QUEUE_BATCH_SIZE);
      await Promise.all(batch.map(async ({ title, badge }) => {
        const wasCached = Object.prototype.hasOwnProperty.call(ratingCache, title);
        const rating = await fetchImdbRating(title);
        if(rating){
          if(badge.isConnected) applyRatingToBadge(badge, rating);
          if(!wasCached) anyResolved = true;
        } else if(badge.isConnected){
          badge.remove();
        }
      }));
      if(ratingQueue.length > 0) await new Promise((resolve) => setTimeout(resolve, QUEUE_DELAY_MS));
    }
    ratingQueueRunning = false;
    // si el orden activo depende de la valoración, una vez que terminan
    // de llegar las calificaciones hay que volver a ordenar el tablero
    if(anyResolved && (sortMode === "rating-desc" || sortMode === "rating-asc")){
      buildBoard();
    }
  }

  // ---- orden del tablero ----
  function ratingValueOf(title){
    const raw = ratingCache[title];
    const n = raw ? parseFloat(raw) : NaN;
    return isNaN(n) ? null : n;
  }

  function yearValueOf(title){
    const y = yearCache[title];
    return (typeof y === "number" && !isNaN(y)) ? y : null;
  }

  function sortItemsForDisplay(items){
    const arr = items.slice();
    const alpha = (a,b) => a.localeCompare(b, "es", { sensitivity: "base" });

    switch(sortMode){
      case "alpha-asc":
        arr.sort(alpha);
        break;
      case "alpha-desc":
        arr.sort((a,b) => alpha(b,a));
        break;
      case "rating-desc":
        arr.sort((a,b) => {
          const ra = ratingValueOf(a), rb = ratingValueOf(b);
          if(ra === null && rb === null) return alpha(a,b);
          if(ra === null) return 1;
          if(rb === null) return -1;
          return rb - ra || alpha(a,b);
        });
        break;
      case "rating-asc":
        arr.sort((a,b) => {
          const ra = ratingValueOf(a), rb = ratingValueOf(b);
          if(ra === null && rb === null) return alpha(a,b);
          if(ra === null) return 1;
          if(rb === null) return -1;
          return ra - rb || alpha(a,b);
        });
        break;
      case "year-desc":
        arr.sort((a,b) => {
          const ya = yearValueOf(a), yb = yearValueOf(b);
          if(ya === null && yb === null) return alpha(a,b);
          if(ya === null) return 1;
          if(yb === null) return -1;
          return yb - ya || alpha(a,b);
        });
        break;
      case "year-asc":
        arr.sort((a,b) => {
          const ya = yearValueOf(a), yb = yearValueOf(b);
          if(ya === null && yb === null) return alpha(a,b);
          if(ya === null) return 1;
          if(yb === null) return -1;
          return ya - yb || alpha(a,b);
        });
        break;
      case "unwatched-first":
        arr.sort((a,b) => (watched.has(a)?1:0) - (watched.has(b)?1:0) || alpha(a,b));
        break;
      case "watched-first":
        arr.sort((a,b) => (watched.has(b)?1:0) - (watched.has(a)?1:0) || alpha(a,b));
        break;
      default:
        break; // orden original del catálogo
    }
    return arr;
  }

  if(sortSelect){
    sortSelect.value = sortMode;
    sortSelect.addEventListener("change", () => {
      sortMode = SORT_OPTIONS.includes(sortSelect.value) ? sortSelect.value : "default";
      try{ localStorage.setItem(SORT_KEY, sortMode); } catch(e){}
      buildBoard();
    });
  }

  // ---- selección múltiple para borrado masivo ----
  function updateSelectionUI(){
    if(!selectionBar) return;
    selectionCount.textContent = selectedKeys.size + (selectedKeys.size === 1 ? " seleccionada" : " seleccionadas");
    bulkDeleteBtn.disabled = selectedKeys.size === 0;
  }

  function enterSelectionMode(){
    selectionMode = true;
    selectedKeys.clear();
    if(selectModeBtn) selectModeBtn.style.display = "none";
    if(selectionBar) selectionBar.classList.remove("hidden");
    updateSelectionUI();
    buildBoard();
  }

  function exitSelectionMode(){
    selectionMode = false;
    selectedKeys.clear();
    if(selectModeBtn) selectModeBtn.style.display = "inline-block";
    if(selectionBar) selectionBar.classList.add("hidden");
    buildBoard();
  }

  if(selectModeBtn) selectModeBtn.addEventListener("click", enterSelectionMode);
  if(cancelSelectBtn) cancelSelectBtn.addEventListener("click", exitSelectionMode);

  if(bulkDeleteBtn){
    bulkDeleteBtn.addEventListener("click", () => {
      if(selectedKeys.size === 0) return;
      const targets = [...selectedKeys].map((key) => {
        const sep = key.indexOf("||");
        return { genre: key.slice(0, sep), title: key.slice(sep + 2) };
      });
      const preview = targets.slice(0, 6).map(t => '"' + t.title + '"').join(", ") + (targets.length > 6 ? "…" : "");
      const noun = targets.length === 1 ? cfg.itemLabel : cfg.itemLabel + "s";
      if(!confirm(`¿Eliminar ${targets.length} ${noun} del catálogo?\n${preview}\nNo van a aparecer más en la ruleta ni en el tablero.`)) return;

      targets.forEach(({ genre, title }) => removeCatalogItem(genre, title));
      exitSelectionMode();

      if(!spinning){
        rotation = 0;
        canvas.classList.add("no-transition");
        canvas.style.transform = "rotate(0deg)";
        drawWheel();
        requestAnimationFrame(()=> canvas.classList.remove("no-transition"));
      }
    });
  }

  // ---- tablero de pósters ----
  function lockAwareLabel(item, locked){
    if(watched.has(item)) return " (vista)";
    if(locked) return " (bloqueada hasta ver " + prerequisiteOf[item] + ")";
    return " (no vista)";
  }

  function refreshLockStates(){
    boardGrid.querySelectorAll(".poster-card").forEach((card) => {
      const item = card.getAttribute("data-movie");
      if(!prerequisiteOf[item]) return;
      const locked = isLocked(item);
      card.classList.toggle("locked", locked && !selectionMode);
      card.disabled = locked && !selectionMode;
      card.setAttribute("aria-disabled", (locked && !selectionMode) ? "true" : "false");
      card.setAttribute("aria-label", item + lockAwareLabel(item, locked));
    });
  }

  function updateProgress(genre, items){
    const seen = items.filter(m => watched.has(m)).length;
    const el = boardGrid.querySelector('[data-genre-progress="' + genre + '"]');
    if(el) el.textContent = "(" + seen + "/" + items.length + ")";
  }

  function updateTotalCount(totalItems){
    boardCount.textContent = watched.size + " / " + totalItems + " vistas";
  }

  function buildBoard(){
    boardGrid.innerHTML = "";
    boardGrid.classList.toggle("selection-mode", selectionMode);
    let totalItems = 0;

    genreNames.forEach((genre) => {
      const rawItems = genres[genre];
      const items = sortItemsForDisplay(rawItems);
      totalItems += items.length;

      const section = document.createElement("div");
      section.className = "genre-section";

      const seenInGenre = items.filter(m => watched.has(m)).length;

      const heading = document.createElement("h3");
      heading.className = "genre-heading";
      heading.innerHTML = genre + ' <span class="genre-progress" data-genre-progress="' + genre + '">(' + seenInGenre + '/' + items.length + ')</span>';
      section.appendChild(heading);

      const grid = document.createElement("div");
      grid.className = "poster-grid";

      items.forEach((item) => {
        const locked = isLocked(item);
        const key = selKey(genre, item);
        const isSelected = selectedKeys.has(key);

        const wrap = document.createElement("div");
        wrap.className = "poster-card-wrap";

        const card = document.createElement("button");
        card.type = "button";
        card.className = "poster-card"
          + (watched.has(item) ? " watched" : "")
          + (locked && !selectionMode ? " locked" : "")
          + (isSelected ? " selected" : "");
        card.setAttribute("data-movie", item);
        card.disabled = locked && !selectionMode;
        card.setAttribute("aria-pressed", selectionMode ? String(isSelected) : (watched.has(item) ? "true" : "false"));
        card.setAttribute("aria-disabled", (locked && !selectionMode) ? "true" : "false");
        card.setAttribute("aria-label", item + lockAwareLabel(item, locked));

        const art = document.createElement("div");
        art.className = "poster-art";
        art.style.background = "linear-gradient(160deg, " + shadeFor(genreColors[genre], 0) + ", " + shadeFor(genreColors[genre], 1) + ")";
        art.innerHTML = genreIcons[genre] || "";
        const cachedPosterUrl = posterCache[item];
        if(cachedPosterUrl) applyPosterToCard(art, cachedPosterUrl);

        const title = document.createElement("div");
        title.className = "poster-title";
        title.textContent = item;

        const stamp = document.createElement("div");
        stamp.className = "poster-stamp";
        const stampText = document.createElement("span");
        stampText.className = "poster-stamp-text";
        stampText.textContent = "VISTA";
        stamp.appendChild(stampText);

        const lockOverlay = document.createElement("div");
        lockOverlay.className = "poster-lock";
        const prevTitle = prerequisiteOf[item];
        lockOverlay.innerHTML =
          '<svg class="poster-lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="9" rx="1.5"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>' +
          (prevTitle ? '<span class="poster-lock-text">Mirá antes<br>' + escapeHtml(prevTitle) + '</span>' : '');

        const ratingBadge = document.createElement("div");
        ratingBadge.className = "poster-rating";
        const cachedRating = ratingCache[item];
        if(cachedRating) applyRatingToBadge(ratingBadge, cachedRating);

        const yearBadge = document.createElement("div");
        yearBadge.className = "poster-year";
        const cachedYear = yearCache[item];
        if(cachedYear) applyYearToBadge(yearBadge, cachedYear);

        const selectMark = document.createElement("div");
        selectMark.className = "poster-select";
        selectMark.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="4 12 9 17 20 6"/></svg>';

        card.appendChild(art);
        card.appendChild(title);
        card.appendChild(stamp);
        card.appendChild(lockOverlay);
        card.appendChild(ratingBadge);
        card.appendChild(yearBadge);
        card.appendChild(selectMark);
        wrap.appendChild(card);

        const delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.className = "poster-delete";
        delBtn.setAttribute("aria-label", 'Quitar "' + item + '" del catálogo');
        delBtn.textContent = "×";
        delBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          if(!confirm('¿Quitar "' + item + '" del catálogo? No va a aparecer más en la ruleta ni en el tablero.')) return;
          removeCatalogItem(genre, item);
          buildBoard();
          const affectsCurrentWheel = (view === "genre") || (view === "movie" && currentGenre === genre);
          if(affectsCurrentWheel && !spinning){
            rotation = 0;
            canvas.classList.add("no-transition");
            canvas.style.transform = "rotate(0deg)";
            drawWheel();
            requestAnimationFrame(()=> canvas.classList.remove("no-transition"));
          }
        });
        wrap.appendChild(delBtn);

        // Solo volvemos a pedir el póster/año si NO lo tenemos ya
        // guardado con éxito. La calificación se maneja igual, aparte.
        const needsMeta = !posterCache[item];
        if(needsMeta) queuePosterFetch(item, art, yearBadge);
        if(!cachedRating) queueRatingFetch(item, ratingBadge);

        card.addEventListener("click", () => {
          if(selectionMode){
            if(selectedKeys.has(key)) selectedKeys.delete(key);
            else selectedKeys.add(key);
            card.classList.toggle("selected", selectedKeys.has(key));
            card.setAttribute("aria-pressed", String(selectedKeys.has(key)));
            updateSelectionUI();
            return;
          }
          if(card.disabled) return;
          const isWatched = watched.has(item);
          if(isWatched) watched.delete(item);
          else watched.add(item);
          saveSet(WATCHED_KEY, watched);
          card.classList.toggle("watched", !isWatched);
          card.setAttribute("aria-pressed", !isWatched ? "true" : "false");
          card.setAttribute("aria-label", item + lockAwareLabel(item, false));
          updateProgress(genre, items);
          updateTotalCount(totalItems);
          refreshLockStates();

          const affectsCurrentWheel = (view === "movie" && currentGenre === genre) || (view === "genre");
          if(affectsCurrentWheel && !spinning){
            rotation = 0;
            canvas.classList.add("no-transition");
            canvas.style.transform = "rotate(0deg)";
            drawWheel();
            requestAnimationFrame(()=> canvas.classList.remove("no-transition"));
          }

          if(sortMode !== "default" && sortMode !== "alpha-asc" && sortMode !== "alpha-desc" && sortMode !== "rating-desc" && sortMode !== "rating-asc"){
            buildBoard();
          }
        });

        grid.appendChild(wrap);
      });

      section.appendChild(grid);
      boardGrid.appendChild(section);
    });

    updateTotalCount(totalItems);
    updateSelectionUI();
  }

  resetBoardBtn.addEventListener("click", () => {
    if(!confirm("¿Reiniciar el tablero y borrar todo lo marcado como visto?")) return;
    watched = new Set();
    saveSet(WATCHED_KEY, watched);
    buildBoard();
  });

  buildBoard();

  return { drawWheel, buildBoard };
}

// ---------------------------------------------------------------
// marquee bulbs (una sola secuencia de encendido al cargar)
// ---------------------------------------------------------------
const bulbRowTop = document.getElementById("bulbRowTop");
const bulbRowBottom = document.getElementById("bulbRowBottom");
function buildBulbs(row, count){
  for(let i=0;i<count;i++){
    const b = document.createElement("span");
    b.className = "bulb";
    row.appendChild(b);
  }
}
buildBulbs(bulbRowTop, 16);
buildBulbs(bulbRowBottom, 16);
function lightBulbsSequentially(){
  const bulbs = document.querySelectorAll(".bulb");
  bulbs.forEach((b, i) => { setTimeout(() => { b.classList.add("lit"); }, i * 45); });
}
if(reduceMotion){
  document.querySelectorAll(".bulb").forEach(b => b.classList.add("lit"));
} else {
  requestAnimationFrame(lightBulbsSequentially);
}

// ---------------------------------------------------------------
// instancia de PELÍCULAS
// ---------------------------------------------------------------
createRouletteApp({
  storagePrefix: "ruletaCine.movies",
  genresData: movieGenres,
  sequelChains: movieSequelChains,
  posterYearHints: moviePosterYearHints,
  mediaType: "movie",
  itemLabel: "película",
  itemLabelCap: "Película",
  ids: {
    canvas: "wheelCanvas", spinBtn: "spinBtn", backBtn: "backBtn", nextBtn: "nextBtn",
    resultCard: "resultCard", ticketEyebrow: "ticketEyebrow", ticketTitle: "ticketTitle",
    ticketCode: "ticketCode", ticketRating: "ticketRating", stageLabelText: "stageLabelText",
    liveRegion: "liveRegion", wheelWrap: "wheelWrap", pointerFlag: "pointerFlag",
    addTitle: "addMovieTitle", addGenre: "addMovieGenre", addBtn: "addMovieBtn", detectHint: "detectHint",
    boardGrid: "boardGrid", boardCount: "boardCount", resetBoardBtn: "resetBoardBtn",
    sortSelect: "sortSelect", selectModeBtn: "selectModeBtn", selectionBar: "selectionBar",
    selectionCount: "selectionCount", bulkDeleteBtn: "bulkDeleteBtn", cancelSelectBtn: "cancelSelectBtn"
  }
});

// ---------------------------------------------------------------
// instancia de SERIES (catálogo, ruleta y tablero totalmente aparte)
// ---------------------------------------------------------------
createRouletteApp({
  storagePrefix: "ruletaCine.series",
  genresData: seriesGenres,
  sequelChains: [],
  posterYearHints: seriesPosterYearHints,
  mediaType: "tv",
  itemLabel: "serie",
  itemLabelCap: "Serie",
  ids: {
    canvas: "sWheelCanvas", spinBtn: "sSpinBtn", backBtn: "sBackBtn", nextBtn: "sNextBtn",
    resultCard: "sResultCard", ticketEyebrow: "sTicketEyebrow", ticketTitle: "sTicketTitle",
    ticketCode: "sTicketCode", ticketRating: "sTicketRating", stageLabelText: "sStageLabelText",
    liveRegion: "sLiveRegion", wheelWrap: "sWheelWrap", pointerFlag: "sPointerFlag",
    addTitle: "sAddTitle", addGenre: "sAddGenre", addBtn: "sAddBtn", detectHint: "sDetectHint",
    boardGrid: "sBoardGrid", boardCount: "sBoardCount", resetBoardBtn: "sResetBoardBtn",
    sortSelect: "sSortSelect", selectModeBtn: "sSelectModeBtn", selectionBar: "sSelectionBar",
    selectionCount: "sSelectionCount", bulkDeleteBtn: "sBulkDeleteBtn", cancelSelectBtn: "sCancelSelectBtn"
  }
});

// ---------------------------------------------------------------
// navegación entre las tres secciones: La ruleta / Mi tablero / Series,
// y dentro de Series, entre su propia ruleta y su propio tablero
// ---------------------------------------------------------------
const tabWheel = document.getElementById("tabWheel");
const tabBoard = document.getElementById("tabBoard");
const tabSeries = document.getElementById("tabSeries");
const wheelView = document.getElementById("wheelView");
const boardView = document.getElementById("boardView");
const seriesView = document.getElementById("seriesView");

function showTopTab(which){
  tabWheel.classList.toggle("active", which === "wheel");
  tabBoard.classList.toggle("active", which === "board");
  tabSeries.classList.toggle("active", which === "series");
  tabWheel.setAttribute("aria-selected", which === "wheel" ? "true" : "false");
  tabBoard.setAttribute("aria-selected", which === "board" ? "true" : "false");
  tabSeries.setAttribute("aria-selected", which === "series" ? "true" : "false");
  wheelView.hidden = which !== "wheel";
  boardView.hidden = which !== "board";
  seriesView.hidden = which !== "series";
}
tabWheel.addEventListener("click", () => showTopTab("wheel"));
tabBoard.addEventListener("click", () => showTopTab("board"));
tabSeries.addEventListener("click", () => showTopTab("series"));

const sTabWheel = document.getElementById("sTabWheel");
const sTabBoard = document.getElementById("sTabBoard");
const sWheelView = document.getElementById("sWheelView");
const sBoardView = document.getElementById("sBoardView");

function showSeriesSubTab(which){
  sTabWheel.classList.toggle("active", which === "wheel");
  sTabBoard.classList.toggle("active", which === "board");
  sTabWheel.setAttribute("aria-selected", which === "wheel" ? "true" : "false");
  sTabBoard.setAttribute("aria-selected", which === "board" ? "true" : "false");
  sWheelView.hidden = which !== "wheel";
  sBoardView.hidden = which !== "board";
}
sTabWheel.addEventListener("click", () => showSeriesSubTab("wheel"));
sTabBoard.addEventListener("click", () => showSeriesSubTab("board"));

// ---------------------------------------------------------------
// ruleta previa: ¿Película o serie? — decide primero qué tipo de
// contenido mirar, y después te manda a la sección correspondiente
// para elegir género. Es una ruleta chica e independiente, con solo
// dos casilleros, sin catálogo ni tablero propio.
// ---------------------------------------------------------------
(function initDecideWheel(){
  const canvas = document.getElementById("decideCanvas");
  if(!canvas) return;
  const ctx = canvas.getContext("2d");
  const spinBtn = document.getElementById("decideSpinBtn");
  const resultCard = document.getElementById("decideResultCard");
  const resultTitle = document.getElementById("decideResultTitle");
  const actions = document.getElementById("decideActions");
  const goBtn = document.getElementById("decideGoBtn");
  const againBtn = document.getElementById("decideAgainBtn");
  const pointerFlag = document.getElementById("decidePointerFlag");
  const liveRegion = document.getElementById("decideLiveRegion");

  const OPTIONS = [
    { label: "Película", color: "#5c1815" },
    { label: "Serie", color: "#1c3a3d" }
  ];

  let rotation = 0;
  let spinning = false;
  let lastWinner = null;

  function drawDecideWheel(){
    const n = OPTIONS.length;
    const w = canvas.width, h = canvas.height;
    const cx = w/2, cy = h/2;
    const radius = w/2;
    const segAngle = (Math.PI*2)/n;

    ctx.clearRect(0,0,w,h);

    const fontSize = 30;

    for(let i=0;i<n;i++){
      const start = i*segAngle;
      const end = start+segAngle;

      ctx.beginPath();
      ctx.moveTo(cx,cy);
      ctx.arc(cx,cy,radius,start,end);
      ctx.closePath();
      ctx.fillStyle = shadeFor(OPTIONS[i].color, i);
      ctx.fill();
      ctx.strokeStyle = "rgba(5,4,3,0.75)";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      const mid = start + segAngle/2;
      ctx.save();
      ctx.translate(cx,cy);
      ctx.rotate(mid);

      const flip = mid > Math.PI/2 && mid < Math.PI*1.5;
      ctx.textBaseline = "middle";
      ctx.font = `400 ${fontSize}px "Anton", sans-serif`;
      ctx.lineJoin = "round";

      const label = OPTIONS[i].label;
      const textRadius = radius*0.6;

      if(flip){
        ctx.textAlign = "left";
        ctx.rotate(Math.PI);
        ctx.strokeStyle = "rgba(5,4,3,0.9)";
        ctx.lineWidth = fontSize * 0.14;
        ctx.strokeText(label, -textRadius, 0);
        ctx.fillStyle = "#d9d2b8";
        ctx.fillText(label, -textRadius, 0);
      } else {
        ctx.textAlign = "right";
        ctx.strokeStyle = "rgba(5,4,3,0.9)";
        ctx.lineWidth = fontSize * 0.14;
        ctx.strokeText(label, textRadius, 0);
        ctx.fillStyle = "#d9d2b8";
        ctx.fillText(label, textRadius, 0);
      }
      ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(cx,cy, radius*0.18, 0, Math.PI*2);
    ctx.strokeStyle = "rgba(5,4,3,0.65)";
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  function normalizeDeg(d){ return ((d % 360) + 360) % 360; }

  function spinDecide(){
    if(spinning) return;
    spinning = true;
    spinBtn.disabled = true;
    resultCard.classList.add("hidden");
    actions.style.display = "none";

    const n = OPTIONS.length;
    const segAngleDeg = 360/n;
    const winnerIndex = Math.floor(Math.random()*n);
    const thetaCenter = winnerIndex*segAngleDeg + segAngleDeg/2;
    const pointerAngle = 270;

    const baseTarget = normalizeDeg(pointerAngle - thetaCenter);
    const currentMod = normalizeDeg(rotation);
    const extraSpins = 5 + Math.floor(Math.random()*3);
    const forward = normalizeDeg(baseTarget - currentMod);

    const newRotation = rotation + forward + extraSpins*360;

    const onDone = () => {
      spinning = false;
      spinBtn.disabled = false;
      lastWinner = OPTIONS[winnerIndex].label;

      pointerFlag.classList.remove("hit");
      void pointerFlag.offsetWidth;
      pointerFlag.classList.add("hit");

      resultTitle.textContent = lastWinner;
      resultCard.classList.remove("hidden");
      actions.style.display = "flex";
      liveRegion.textContent = "Salió: " + lastWinner;
    };

    if(reduceMotion){
      canvas.classList.add("no-transition");
      rotation = newRotation;
      canvas.style.transform = `rotate(${rotation}deg)`;
      requestAnimationFrame(onDone);
      return;
    }

    canvas.classList.remove("no-transition");
    const duration = 3400 + Math.random()*700;
    canvas.style.transition = `transform ${duration}ms cubic-bezier(.15,.63,.2,1)`;

    rotation = newRotation;
    canvas.style.transform = `rotate(${rotation}deg)`;

    const onEnd = () => {
      canvas.removeEventListener("transitionend", onEnd);
      onDone();
    };
    canvas.addEventListener("transitionend", onEnd);
  }

  spinBtn.addEventListener("click", spinDecide);
  againBtn.addEventListener("click", spinDecide);

  goBtn.addEventListener("click", () => {
    if(lastWinner === "Serie"){
      showTopTab("series");
      document.getElementById("seriesView").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    } else {
      showTopTab("wheel");
      document.getElementById("wheelView").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    }
  });

  drawDecideWheel();
})();