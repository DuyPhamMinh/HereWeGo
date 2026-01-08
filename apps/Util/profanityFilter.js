

const profanityList = [

  'địt', 'đụ', 'đéo', 'đĩ', 'đồ chó', 'đồ khùng', 'đồ ngu', 'đồ ngốc',
  'đồ điên', 'đồ dốt', 'đồ đần', 'đồ súc vật', 'đồ thú vật',
  'chết tiệt', 'chết bà', 'chết mẹ', 'chết cha', 'chết cha mày',
  'đồ khốn', 'đồ khốn nạn', 'đồ súc sinh', 'đồ chó má',
  'mẹ mày', 'cha mày', 'bố mày', 'mẹ kiếp', 'cha kiếp',
  'đồ ngu xuẩn', 'đồ đần độn', 'đồ ngu dốt',

  'fuck', 'fucking', 'fucked', 'fucker', 'fuckers',
  'shit', 'shitting', 'shitted', 'shitty',
  'damn', 'damned', 'dammit',
  'bitch', 'bitches', 'bitching',
  'ass', 'asses', 'asshole', 'assholes',
  'bastard', 'bastards',
  'crap', 'crappy',
  'hell', 'hells',
  'idiot', 'idiots', 'idiotic',
  'stupid', 'stupidity',
  'moron', 'morons',
  'retard', 'retarded',
  'piss', 'pissing', 'pissed',
  'cunt', 'cunts',
  'dick', 'dicks', 'dickhead',
  'pussy', 'pussies',

  'go to hell', 'go to hell you', 'screw you', 'screw off',
  'fuck off', 'fuck you', 'fuck yourself',
  'shut up', 'shut the fuck up',
  'you suck', 'you are stupid', 'you are an idiot',
];

const profanityPattern = new RegExp(
  profanityList
    .map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|'),
  'gi'
);

function containsProfanity(text) {
  if (!text || typeof text !== 'string') {
    return false;
  }

  const normalizedText = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  return profanityPattern.test(normalizedText);
}

function filterProfanity(text, replacement = '***') {
  if (!text || typeof text !== 'string') {
    return text;
  }

  return text.replace(profanityPattern, (match) => {
    return replacement.repeat(match.length);
  });
}

function sanitizeText(text) {
  if (!text || typeof text !== 'string') {
    return { sanitized: text, hasProfanity: false };
  }

  const hasProfanity = containsProfanity(text);
  const sanitized = hasProfanity ? filterProfanity(text) : text;

  return { sanitized, hasProfanity };
}

module.exports = {
  containsProfanity,
  filterProfanity,
  sanitizeText,
};

