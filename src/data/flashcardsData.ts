import type { FlashcardDeck, FlashcardSubject, FlashcardLevel, FlashcardMode, Flashcard } from '../types';

// ─── Number-to-words helper ───────────────────────────────────────────────────

const ones = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
  'seventeen', 'eighteen', 'nineteen',
];
const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

export function numberToWords(n: number): string {
  if (n < 0) return `negative ${numberToWords(-n)}`;
  if (n < 20) return ones[n];
  if (n < 100) {
    const t = tens[Math.floor(n / 10)];
    const o = n % 10;
    return o === 0 ? t : `${t}-${ones[o]}`;
  }
  if (n < 1000) {
    const h = Math.floor(n / 100);
    const rest = n % 100;
    if (rest === 0) return `${ones[h]} hundred`;
    return `${ones[h]} hundred and ${numberToWords(rest)}`;
  }
  if (n <= 10000) {
    const th = Math.floor(n / 1000);
    const rest = n % 1000;
    if (rest === 0) return `${numberToWords(th)} thousand`;
    if (rest < 100) return `${numberToWords(th)} thousand and ${numberToWords(rest)}`;
    return `${numberToWords(th)} thousand ${numberToWords(rest)}`;
  }
  return String(n);
}

// ─── Card id generator ────────────────────────────────────────────────────────

function cid(prefix: string, i: number): string {
  return `${prefix}-${i}`;
}

// ─── Shuffle helper ───────────────────────────────────────────────────────────

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── MATHS DECKS ─────────────────────────────────────────────────────────────

// 1. Number Recognition — Reception (0–20)
const numRecReceptionCards: Flashcard[] = Array.from({ length: 21 }, (_, i) => ({
  id: cid('nr-rec', i),
  question: String(i),
  answer: numberToWords(i),
}));

// 2. Number Recognition — Year 1 (0–100, multiples of 5/10 + randoms)
function buildNRYear1(): Flashcard[] {
  const nums = new Set<number>();
  for (let i = 0; i <= 100; i += 5) nums.add(i);
  const randoms = [3, 7, 11, 13, 17, 21, 24, 27, 31, 33, 36, 38, 41, 44, 46, 48, 51, 53, 56, 58, 61, 63, 66, 68, 72, 74, 77, 79, 82, 84];
  randoms.forEach(n => nums.add(n));
  return [...nums].sort((a, b) => a - b).map((n, i) => ({
    id: cid('nr-y1', i),
    question: String(n),
    answer: numberToWords(n),
  }));
}

// 3. Number Recognition — Year 2 (0–1000)
function buildNRYear2(): Flashcard[] {
  const nums = new Set<number>();
  for (let i = 1; i <= 10; i++) nums.add(i * 100);
  [150, 250, 325, 400, 450, 500, 575, 625, 700, 750, 825, 875, 900, 950,
   101, 212, 333, 444, 555, 666, 777, 888, 999, 123, 456, 789, 111, 222].forEach(n => nums.add(n));
  return [...nums].sort((a, b) => a - b).map((n, i) => ({
    id: cid('nr-y2', i),
    question: String(n),
    answer: numberToWords(n),
  }));
}

// 4. Number Recognition — Year 3 (up to 10,000)
function buildNRYear3(): Flashcard[] {
  const nums = new Set<number>();
  for (let i = 1; i <= 10; i++) nums.add(i * 1000);
  [1500, 2500, 3250, 4750, 5100, 6300, 7800, 8450, 9000, 9999,
   1234, 2468, 3579, 4321, 5678, 6789, 7654, 8765, 9876].forEach(n => nums.add(n));
  return [...nums].sort((a, b) => a - b).map((n, i) => ({
    id: cid('nr-y3', i),
    question: String(n),
    answer: numberToWords(n),
  }));
}

// 5. Number Bonds — Reception (bonds to 5)
function buildNBReception(): Flashcard[] {
  const cards: Flashcard[] = [];
  let i = 0;
  for (let a = 0; a <= 5; a++) {
    const b = 5 - a;
    cards.push({ id: cid('nb-rec', i++), question: `${a} + ? = 5`, answer: String(b) });
  }
  return cards;
}

// 6. Number Bonds — Year 1 (bonds to 10 and bonds to 20)
function buildNBYear1(): Flashcard[] {
  const cards: Flashcard[] = [];
  let i = 0;
  for (let a = 0; a <= 10; a++) {
    cards.push({ id: cid('nb-y1', i++), question: `${a} + ? = 10`, answer: String(10 - a) });
  }
  for (let a = 0; a <= 20; a += 2) {
    cards.push({ id: cid('nb-y1', i++), question: `${a} + ? = 20`, answer: String(20 - a) });
  }
  for (let a = 1; a <= 19; a += 2) {
    cards.push({ id: cid('nb-y1', i++), question: `${a} + ? = 20`, answer: String(20 - a) });
  }
  return cards;
}

// 7. Addition — Year 1 (within 20)
function buildAddYear1(): Flashcard[] {
  const cards: Flashcard[] = [];
  let i = 0;
  const pairs: [number, number][] = [
    [1,1],[1,2],[1,3],[1,4],[1,5],[1,6],[1,7],[1,8],[1,9],
    [2,2],[2,3],[2,4],[2,5],[2,6],[2,7],[2,8],
    [3,3],[3,4],[3,5],[3,6],[3,7],
    [4,4],[4,5],[4,6],
    [5,5],[5,6],[5,7],
    [6,6],[6,7],
    [7,8],[8,9],[9,9],[6,8],[7,9],
  ];
  for (const [a, b] of pairs) {
    if (a + b <= 20) {
      cards.push({ id: cid('add-y1', i++), question: `${a} + ${b} = ?`, answer: String(a + b) });
    }
  }
  return cards;
}

// 8. Addition — Year 2 (within 100)
function buildAddYear2(): Flashcard[] {
  const pairs: [number, number][] = [
    [12,13],[14,15],[16,17],[18,19],[21,22],[23,24],[25,26],[27,28],[31,32],
    [33,34],[35,36],[37,38],[41,42],[43,44],[45,46],[47,48],[51,22],[53,24],
    [55,26],[57,28],[61,12],[63,14],[65,16],[67,18],[10,25],[20,35],[30,45],
    [40,55],[50,25],[60,15],[15,15],[25,25],[35,35],[45,45],[11,22],[33,44],
  ];
  return pairs.filter(([a, b]) => a + b <= 100).map(([a, b], i) => ({
    id: cid('add-y2', i),
    question: `${a} + ${b} = ?`,
    answer: String(a + b),
  }));
}

// 9. Subtraction — Year 1 (within 20)
function buildSubYear1(): Flashcard[] {
  const pairs: [number, number][] = [
    [5,1],[5,2],[5,3],[5,4],[5,5],
    [8,1],[8,2],[8,3],[8,4],[8,5],[8,6],[8,7],[8,8],
    [10,1],[10,2],[10,3],[10,4],[10,5],[10,6],[10,7],[10,8],[10,9],[10,10],
    [15,6],[15,7],[15,8],[15,9],[20,11],[20,13],[20,15],[20,17],
  ];
  return pairs.map(([a, b], i) => ({
    id: cid('sub-y1', i),
    question: `${a} − ${b} = ?`,
    answer: String(a - b),
  }));
}

// 10. Subtraction — Year 2 (within 100)
function buildSubYear2(): Flashcard[] {
  const pairs: [number, number][] = [
    [25,10],[35,15],[45,20],[55,25],[65,30],[75,35],[85,40],[95,45],
    [30,11],[40,13],[50,17],[60,22],[70,28],[80,33],[90,37],[100,45],
    [47,19],[58,29],[69,38],[72,43],[83,47],[96,58],[88,39],[77,48],[66,27],
  ];
  return pairs.map(([a, b], i) => ({
    id: cid('sub-y2', i),
    question: `${a} − ${b} = ?`,
    answer: String(a - b),
  }));
}

// 11. Multiplication — Year 3 (2×, 5×, 10× tables)
function buildMulYear3(): Flashcard[] {
  const cards: Flashcard[] = [];
  let i = 0;
  for (const t of [2, 5, 10]) {
    for (let n = 1; n <= 12; n++) {
      cards.push({ id: cid('mul-y3', i++), question: `${n} × ${t} = ?`, answer: String(n * t) });
    }
  }
  return cards;
}

// 12. Multiplication — Year 4 (all 2–12 times tables)
function buildMulYear4(): Flashcard[] {
  const cards: Flashcard[] = [];
  let i = 0;
  for (let t = 2; t <= 12; t++) {
    for (let n = 1; n <= 12; n++) {
      cards.push({ id: cid('mul-y4', i++), question: `${n} × ${t} = ?`, answer: String(n * t) });
    }
  }
  return cards;
}

// 13. Multiplication — Year 5 (mixed + higher)
function buildMulYear5(): Flashcard[] {
  const extras: [number, number][] = [
    [13,3],[14,4],[15,5],[16,2],[17,3],[18,4],[19,5],[20,6],[25,4],[50,3],
    [100,7],[11,11],[11,12],[12,12],[13,4],[15,6],[20,8],[25,8],[11,9],[12,8],
    [13,7],[14,6],[15,7],[16,8],[17,9],[18,7],[19,6],[24,5],[36,3],[48,2],
    [15,8],[16,9],[17,7],[18,6],[19,8],[21,4],[22,5],[23,3],[24,4],[25,6],
  ];
  return extras.map(([a, b], i) => ({
    id: cid('mul-y5', i),
    question: `${a} × ${b} = ?`,
    answer: String(a * b),
  }));
}

// 14. Division — Year 3 (2×, 5×, 10× tables)
function buildDivYear3(): Flashcard[] {
  const cards: Flashcard[] = [];
  let i = 0;
  for (const t of [2, 5, 10]) {
    for (let n = 1; n <= 12; n++) {
      const product = n * t;
      cards.push({ id: cid('div-y3', i++), question: `${product} ÷ ${t} = ?`, answer: String(n) });
    }
  }
  return cards;
}

// 15. Division — Year 4 (all tables 2–12)
function buildDivYear4(): Flashcard[] {
  const cards: Flashcard[] = [];
  let i = 0;
  for (let t = 2; t <= 12; t++) {
    for (let n = 1; n <= 10; n++) {
      const product = n * t;
      cards.push({ id: cid('div-y4', i++), question: `${product} ÷ ${t} = ?`, answer: String(n) });
    }
  }
  return cards;
}

// ─── READING DECKS ────────────────────────────────────────────────────────────

// 1. Letters — Reception
const letterSounds: { letter: string; sound: string; example: string }[] = [
  { letter: 'A', sound: '/æ/', example: 'apple' },
  { letter: 'B', sound: '/b/', example: 'ball' },
  { letter: 'C', sound: '/k/', example: 'cat' },
  { letter: 'D', sound: '/d/', example: 'dog' },
  { letter: 'E', sound: '/ɛ/', example: 'egg' },
  { letter: 'F', sound: '/f/', example: 'fish' },
  { letter: 'G', sound: '/g/', example: 'goat' },
  { letter: 'H', sound: '/h/', example: 'hat' },
  { letter: 'I', sound: '/ɪ/', example: 'insect' },
  { letter: 'J', sound: '/dʒ/', example: 'jam' },
  { letter: 'K', sound: '/k/', example: 'kite' },
  { letter: 'L', sound: '/l/', example: 'lion' },
  { letter: 'M', sound: '/m/', example: 'mouse' },
  { letter: 'N', sound: '/n/', example: 'net' },
  { letter: 'O', sound: '/ɒ/', example: 'orange' },
  { letter: 'P', sound: '/p/', example: 'pen' },
  { letter: 'Q', sound: '/kw/', example: 'queen' },
  { letter: 'R', sound: '/r/', example: 'rabbit' },
  { letter: 'S', sound: '/s/', example: 'sun' },
  { letter: 'T', sound: '/t/', example: 'top' },
  { letter: 'U', sound: '/ʌ/', example: 'umbrella' },
  { letter: 'V', sound: '/v/', example: 'van' },
  { letter: 'W', sound: '/w/', example: 'web' },
  { letter: 'X', sound: '/ks/', example: 'box' },
  { letter: 'Y', sound: '/j/', example: 'yellow' },
  { letter: 'Z', sound: '/z/', example: 'zip' },
];

const lettersReceptionCards: Flashcard[] = letterSounds.map((ls, i) => ({
  id: cid('let-rec', i),
  question: `What sound does this letter make? ${ls.letter}`,
  answer: `${ls.sound} — as in "${ls.example}"`,
}));

// 2. Phonics CVC — Reception
const cvcWords: { word: string; meaning: string }[] = [
  { word: 'cat', meaning: 'a furry pet that meows' },
  { word: 'dog', meaning: 'a pet that barks' },
  { word: 'big', meaning: 'large in size' },
  { word: 'hop', meaning: 'to jump on one foot' },
  { word: 'sun', meaning: 'the bright star in the sky' },
  { word: 'red', meaning: 'the colour of a tomato' },
  { word: 'sit', meaning: 'to rest on a chair' },
  { word: 'ten', meaning: 'the number after nine' },
  { word: 'cup', meaning: 'something you drink from' },
  { word: 'map', meaning: 'a picture of a place' },
  { word: 'pin', meaning: 'a small sharp metal stick' },
  { word: 'fog', meaning: 'thick mist in the air' },
  { word: 'bed', meaning: 'where you sleep at night' },
  { word: 'run', meaning: 'to move quickly on foot' },
  { word: 'lid', meaning: 'the top cover of a box' },
  { word: 'van', meaning: 'a large vehicle for goods' },
  { word: 'hot', meaning: 'very warm' },
  { word: 'met', meaning: 'saw or was introduced to someone' },
  { word: 'cut', meaning: 'to slice with scissors' },
  { word: 'zip', meaning: 'a fastener on a bag' },
  { word: 'hug', meaning: 'to hold someone with your arms' },
  { word: 'net', meaning: 'a mesh used to catch things' },
  { word: 'box', meaning: 'a square container' },
  { word: 'mud', meaning: 'wet, dirty earth' },
  { word: 'web', meaning: 'the sticky trap a spider makes' },
  { word: 'wig', meaning: 'a fake head of hair' },
  { word: 'yam', meaning: 'a root vegetable like a sweet potato' },
  { word: 'jet', meaning: 'a very fast aeroplane' },
  { word: 'peg', meaning: 'a clip to hang washing' },
  { word: 'tip', meaning: 'the pointed end of something' },
];

const phonicsCVCReceptionCards: Flashcard[] = cvcWords.map((w, i) => ({
  id: cid('cvc-rec', i),
  question: `Sound out this word: ${w.word.toUpperCase()}`,
  answer: `"${w.word}" — ${w.meaning}`,
}));

// 3. Phonics CCVC/CVCC — Year 1
const ccvcWords: { word: string; meaning: string }[] = [
  { word: 'frog', meaning: 'a green animal that jumps and croaks' },
  { word: 'trip', meaning: 'a journey, or to stumble' },
  { word: 'flat', meaning: 'smooth with no bumps' },
  { word: 'drum', meaning: 'a musical instrument you hit' },
  { word: 'sled', meaning: 'a vehicle that slides on snow' },
  { word: 'clap', meaning: 'to hit your hands together' },
  { word: 'snip', meaning: 'to cut with scissors' },
  { word: 'grip', meaning: 'to hold tightly' },
  { word: 'spot', meaning: 'a small dot or to notice something' },
  { word: 'step', meaning: 'one movement of the foot' },
  { word: 'went', meaning: 'moved to another place (past tense of go)' },
  { word: 'best', meaning: 'the most good' },
  { word: 'lamp', meaning: 'a light you can move around' },
  { word: 'risk', meaning: 'a chance something bad might happen' },
  { word: 'lost', meaning: 'unable to find the way' },
  { word: 'hand', meaning: 'the part at the end of your arm' },
  { word: 'belt', meaning: 'a strap worn around the waist' },
  { word: 'jump', meaning: 'to push yourself off the ground' },
  { word: 'sand', meaning: 'tiny grains found on beaches' },
  { word: 'melt', meaning: 'to change from solid to liquid with heat' },
  { word: 'felt', meaning: 'experienced (past tense of feel)' },
  { word: 'must', meaning: 'have to do something' },
  { word: 'rest', meaning: 'to relax and stop working' },
  { word: 'list', meaning: 'words or items written in order' },
  { word: 'help', meaning: 'to give someone assistance' },
];

const phonicsCCVCYear1Cards: Flashcard[] = ccvcWords.map((w, i) => ({
  id: cid('ccvc-y1', i),
  question: `Sound out this word: ${w.word.toUpperCase()}`,
  answer: `"${w.word}" — ${w.meaning}`,
}));

// 4. Sight Words — Reception (Phase 2–3 tricky words)
const sightWordsReception: { word: string; tip?: string }[] = [
  { word: 'the', tip: 'the "th" makes a special sound' },
  { word: 'to', tip: 'sounds like "too"' },
  { word: 'I', tip: 'always a capital letter' },
  { word: 'no', tip: 'rhymes with go' },
  { word: 'go', tip: 'rhymes with no' },
  { word: 'into', tip: 'in + to together' },
  { word: 'he', tip: 'rhymes with me' },
  { word: 'she', tip: 'rhymes with me' },
  { word: 'we', tip: 'rhymes with me and he' },
  { word: 'me', tip: 'rhymes with he and she' },
  { word: 'be', tip: 'rhymes with me' },
  { word: 'was', tip: 'sounds like "woz"' },
  { word: 'my', tip: 'rhymes with by' },
  { word: 'you', tip: 'sounds like "yoo"' },
  { word: 'they', tip: 'sounds like "thay"' },
  { word: 'all', tip: 'sounds like "awl"' },
  { word: 'are', tip: 'sounds like "ar"' },
  { word: 'her', tip: 'sounds like "hur"' },
  { word: 'said', tip: 'sounds like "sed"' },
  { word: 'have', tip: 'the e is silent' },
  { word: 'like', tip: 'the e is silent' },
  { word: 'some', tip: 'sounds like "sum"' },
  { word: 'come', tip: 'sounds like "cum"' },
  { word: 'were', tip: 'sounds like "wur"' },
  { word: 'there', tip: 'here + th at the front' },
  { word: 'little', tip: 'two t\'s, silent e' },
  { word: 'one', tip: 'sounds like "wun"' },
  { word: 'do', tip: 'sounds like "doo"' },
  { word: 'when', tip: 'wh makes a /w/ sound' },
  { word: 'out', tip: 'the ou makes /ow/' },
  { word: 'what', tip: 'wh + a + t' },
  { word: 'so', tip: 'rhymes with go' },
];

const sightWordsReceptionCards: Flashcard[] = sightWordsReception.map((sw, i) => ({
  id: cid('sw-rec', i),
  question: `Read this word: ${sw.word}`,
  answer: sw.tip ? `"${sw.word}" — ${sw.tip}` : `"${sw.word}"`,
}));

// 5. Sight Words — Year 1 (common exception words)
const sightWordsYear1: string[] = [
  'Mrs', 'Mr', 'Ms', 'the', 'a', 'do', 'to', 'today', 'of', 'said',
  'says', 'are', 'were', 'was', 'is', 'his', 'has', 'I', 'you', 'your',
  'they', 'be', 'he', 'she', 'we', 'me', 'no', 'go', 'so', 'by',
  'my', 'here', 'there', 'where', 'love', 'come', 'some', 'one', 'once', 'ask',
  'friend', 'school', 'put', 'push', 'pull', 'full', 'bull', 'could', 'would', 'should',
  'our', 'house', 'mouse', 'water', 'want',
];

const sightWordsYear1Cards: Flashcard[] = sightWordsYear1.map((word, i) => ({
  id: cid('sw-y1', i),
  question: `Read this word: ${word}`,
  answer: `"${word}"`,
}));

// 6. Sight Words — Year 2 (common exception words)
const sightWordsYear2: string[] = [
  'door', 'floor', 'poor', 'because', 'find', 'kind', 'mind', 'behind', 'child', 'children',
  'wild', 'climb', 'most', 'only', 'both', 'old', 'cold', 'gold', 'hold', 'told',
  'every', 'great', 'break', 'steak', 'pretty', 'beautiful', 'after', 'fast', 'last', 'past',
  'father', 'class', 'grass', 'pass', 'plant', 'path', 'bath', 'hour', 'move', 'prove',
  'improve', 'sure', 'sugar', 'eye', 'could', 'would', 'should', 'who', 'whole', 'any',
  'many', 'clothes', 'busy', 'people', 'water', 'again', 'half', 'money', 'parents', 'Christmas',
];

const sightWordsYear2Cards: Flashcard[] = sightWordsYear2.map((word, i) => ({
  id: cid('sw-y2', i),
  question: `Read this word: ${word}`,
  answer: `"${word}"`,
}));

// 7. Vocabulary — Year 3
const vocabularyYear3: { word: string; meaning: string }[] = [
  { word: 'ancient', meaning: 'very very old, from a long time ago' },
  { word: 'bewildered', meaning: 'completely confused and puzzled' },
  { word: 'cautious', meaning: 'being careful to avoid danger' },
  { word: 'delicate', meaning: 'very fine, gentle and easily broken' },
  { word: 'enormous', meaning: 'very, very large; huge' },
  { word: 'ferocious', meaning: 'very fierce and frightening' },
  { word: 'generous', meaning: 'happy to give things to others' },
  { word: 'hesitant', meaning: 'pausing before you do something, unsure' },
  { word: 'immense', meaning: 'extremely large or great' },
  { word: 'jubilant', meaning: 'feeling extremely happy and joyful' },
  { word: 'keen', meaning: 'very eager and enthusiastic' },
  { word: 'lofty', meaning: 'very tall or high up' },
  { word: 'magnificent', meaning: 'impressively beautiful or splendid' },
  { word: 'nimble', meaning: 'quick and light in movement' },
  { word: 'obedient', meaning: 'doing what you are told' },
  { word: 'peculiar', meaning: 'strange or unusual' },
  { word: 'quarrelsome', meaning: 'enjoying arguments; always wanting to fight' },
  { word: 'radiant', meaning: 'glowing brightly; showing great happiness' },
  { word: 'scarce', meaning: 'not enough of something; hard to find' },
  { word: 'timid', meaning: 'shy and easily frightened' },
  { word: 'unique', meaning: 'the only one of its kind; unlike anything else' },
  { word: 'vivid', meaning: 'bright and strong in colour; very clear' },
  { word: 'weary', meaning: 'very tired, especially after long effort' },
  { word: 'zealous', meaning: 'showing great energy and enthusiasm' },
];

const vocabularyYear3Cards: Flashcard[] = vocabularyYear3.map((v, i) => ({
  id: cid('vocab-y3', i),
  question: `What does "${v.word}" mean?`,
  answer: v.meaning,
  hint: v.word,
}));

// 8. Spelling Patterns — Year 4
const spellingPatterns: { word: string; definition: string; rule: string }[] = [
  { word: 'knight', definition: 'a warrior in armour', rule: 'silent kn- at the start' },
  { word: 'gnome', definition: 'a small garden ornament', rule: 'silent gn- at the start' },
  { word: 'wrong', definition: 'not correct', rule: 'silent wr- at the start' },
  { word: 'knack', definition: 'a special skill', rule: 'silent kn- at the start' },
  { word: 'knife', definition: 'a sharp cutting tool', rule: 'silent kn- at the start' },
  { word: 'wrap', definition: 'to cover with paper', rule: 'silent wr- at the start' },
  { word: 'wrist', definition: 'the joint between hand and arm', rule: 'silent wr- at the start' },
  { word: 'climb', definition: 'to go up', rule: 'silent -mb at the end' },
  { word: 'comb', definition: 'used to tidy hair', rule: 'silent -mb at the end' },
  { word: 'lamb', definition: 'a baby sheep', rule: 'silent -mb at the end' },
  { word: 'thumb', definition: 'the short fat finger', rule: 'silent -mb at the end' },
  { word: 'caught', definition: 'grabbed something (past tense of catch)', rule: 'augh makes /or/ sound' },
  { word: 'taught', definition: 'gave a lesson (past tense of teach)', rule: 'augh makes /or/ sound' },
  { word: 'daughter', definition: 'a girl child', rule: 'augh makes /or/ sound' },
  { word: 'eight', definition: 'the number 8', rule: 'eigh makes /ay/ sound' },
  { word: 'weigh', definition: 'to measure how heavy something is', rule: 'eigh makes /ay/ sound' },
  { word: 'reign', definition: 'to rule as king or queen', rule: 'eigh makes /ay/ sound; g is silent' },
  { word: 'quiet', definition: 'making very little noise', rule: 'qui- has a /kw/ sound' },
  { word: 'quite', definition: 'fairly; to a certain degree', rule: 'qui- has a /kw/ sound; different to quiet' },
  { word: 'their', definition: 'belonging to them', rule: 'homophones: their / there / they\'re' },
  { word: 'there', definition: 'in that place', rule: 'homophones: their / there / they\'re' },
  { word: "they're", definition: 'they are (contraction)', rule: 'homophones: their / there / they\'re' },
  { word: 'where', definition: 'in what place?', rule: 'wh- question words' },
  { word: 'wear', definition: 'to have clothing on your body', rule: 'sounds like "where" but different meaning' },
  { word: 'were', definition: 'past tense of are', rule: 'sounds like "wur"' },
];

const spellingYear4Cards: Flashcard[] = spellingPatterns.map((sp, i) => ({
  id: cid('spell-y4', i),
  question: `Spell the word that means: "${sp.definition}"`,
  answer: `${sp.word} — ${sp.rule}`,
  hint: sp.rule,
}));

// ─── All decks ────────────────────────────────────────────────────────────────

export const flashcardDecks: FlashcardDeck[] = [
  // ── Maths ──
  {
    subject: 'maths',
    level: 'reception',
    mode: 'number-recognition',
    modeLabel: 'Number Recognition',
    description: 'Recognise and name numbers 0 to 20',
    cards: numRecReceptionCards,
  },
  {
    subject: 'maths',
    level: 'year1',
    mode: 'number-recognition',
    modeLabel: 'Number Recognition',
    description: 'Recognise numbers up to 100, including multiples of 5 and 10',
    cards: buildNRYear1(),
  },
  {
    subject: 'maths',
    level: 'year2',
    mode: 'number-recognition',
    modeLabel: 'Number Recognition',
    description: 'Recognise numbers up to 1,000, including all hundreds',
    cards: buildNRYear2(),
  },
  {
    subject: 'maths',
    level: 'year3',
    mode: 'number-recognition',
    modeLabel: 'Number Recognition',
    description: 'Recognise numbers up to 10,000, including thousands',
    cards: buildNRYear3(),
  },
  {
    subject: 'maths',
    level: 'reception',
    mode: 'number-bonds',
    modeLabel: 'Number Bonds',
    description: 'Number bonds to 5',
    cards: buildNBReception(),
  },
  {
    subject: 'maths',
    level: 'year1',
    mode: 'number-bonds',
    modeLabel: 'Number Bonds',
    description: 'Number bonds to 10 and 20',
    cards: buildNBYear1(),
  },
  {
    subject: 'maths',
    level: 'year1',
    mode: 'addition',
    modeLabel: 'Addition',
    description: 'Adding numbers within 20',
    cards: buildAddYear1(),
  },
  {
    subject: 'maths',
    level: 'year2',
    mode: 'addition',
    modeLabel: 'Addition',
    description: 'Adding numbers within 100',
    cards: buildAddYear2(),
  },
  {
    subject: 'maths',
    level: 'year1',
    mode: 'subtraction',
    modeLabel: 'Subtraction',
    description: 'Taking away numbers within 20',
    cards: buildSubYear1(),
  },
  {
    subject: 'maths',
    level: 'year2',
    mode: 'subtraction',
    modeLabel: 'Subtraction',
    description: 'Taking away numbers within 100',
    cards: buildSubYear2(),
  },
  {
    subject: 'maths',
    level: 'year3',
    mode: 'multiplication',
    modeLabel: 'Multiplication',
    description: '2×, 5×, and 10× times tables',
    cards: buildMulYear3(),
  },
  {
    subject: 'maths',
    level: 'year4',
    mode: 'multiplication',
    modeLabel: 'Multiplication',
    description: 'All times tables from 2× to 12×',
    cards: buildMulYear4(),
  },
  {
    subject: 'maths',
    level: 'year5',
    mode: 'multiplication',
    modeLabel: 'Multiplication',
    description: 'Mixed and higher multiplication facts',
    cards: buildMulYear5(),
  },
  {
    subject: 'maths',
    level: 'year3',
    mode: 'division',
    modeLabel: 'Division',
    description: 'Division linked to 2×, 5×, and 10× tables',
    cards: buildDivYear3(),
  },
  {
    subject: 'maths',
    level: 'year4',
    mode: 'division',
    modeLabel: 'Division',
    description: 'Division linked to all times tables 2× through 12×',
    cards: buildDivYear4(),
  },

  // ── Reading ──
  {
    subject: 'reading',
    level: 'reception',
    mode: 'letters',
    modeLabel: 'Letter Sounds',
    description: 'The phonics sound and example word for each letter of the alphabet',
    cards: lettersReceptionCards,
  },
  {
    subject: 'reading',
    level: 'reception',
    mode: 'phonics-cvc',
    modeLabel: 'CVC Words',
    description: 'Sound out simple consonant-vowel-consonant words',
    cards: phonicsCVCReceptionCards,
  },
  {
    subject: 'reading',
    level: 'year1',
    mode: 'phonics-cvc',
    modeLabel: 'CCVC & CVCC Words',
    description: 'Sound out longer consonant blend words',
    cards: phonicsCCVCYear1Cards,
  },
  {
    subject: 'reading',
    level: 'reception',
    mode: 'sight-words',
    modeLabel: 'Sight Words',
    description: 'Phase 2–3 tricky words — learn to read them on sight',
    cards: sightWordsReceptionCards,
  },
  {
    subject: 'reading',
    level: 'year1',
    mode: 'sight-words',
    modeLabel: 'Sight Words',
    description: 'Year 1 common exception words',
    cards: sightWordsYear1Cards,
  },
  {
    subject: 'reading',
    level: 'year2',
    mode: 'sight-words',
    modeLabel: 'Sight Words',
    description: 'Year 2 common exception words',
    cards: sightWordsYear2Cards,
  },
  {
    subject: 'reading',
    level: 'year3',
    mode: 'vocabulary',
    modeLabel: 'Vocabulary',
    description: 'Key vocabulary words and their meanings',
    cards: vocabularyYear3Cards,
  },
  {
    subject: 'reading',
    level: 'year4',
    mode: 'spelling-patterns',
    modeLabel: 'Spelling Patterns',
    description: 'Common spelling rules, silent letters, and tricky patterns',
    cards: spellingYear4Cards,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getDeck(
  subject: FlashcardSubject,
  level: FlashcardLevel,
  mode: FlashcardMode,
): FlashcardDeck | undefined {
  return flashcardDecks.find(
    d => d.subject === subject && d.level === level && d.mode === mode,
  );
}

export function getAvailableModes(
  subject: FlashcardSubject,
  level: FlashcardLevel,
): { mode: FlashcardMode; label: string; description: string }[] {
  return flashcardDecks
    .filter(d => d.subject === subject && d.level === level)
    .map(d => ({ mode: d.mode, label: d.modeLabel, description: d.description ?? '' }));
}

export { shuffled };
