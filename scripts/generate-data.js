// Converts the supplied UTF-8 CSV files to a browser-readable classic script.
// Run: node scripts/generate-data.js
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const parse = (file) => {
  const [header, ...lines] = fs.readFileSync(path.join(root, file), 'utf8').trim().split(/\r?\n/);
  const keys = header.split(',');
  return lines.map((line) => Object.fromEntries(keys.map((key, index) => [key, line.split(',')[index]?.trim() || ''])));
};
const pos = (value) => ({ article: 'determiner', 'phrasal verb': 'verb', expression: 'other' }[value] || value || 'other');
const legacyLevel = (level) => level === 'junior_high' ? 'junior' : 'senior';
const wordExample = (english) => `I learned the word "${english}" today.`;
const phraseExample = (english) => `We practiced the phrase "${english}" today.`;
const toCard = (row, type, number) => ({
  id: `${type}_${String(number).padStart(4, '0')}`,
  type,
  english: row.english,
  japanese: row.japanese,
  partOfSpeech: pos(row.partOfSpeech),
  level: legacyLevel(row.level),
  curriculumLevel: row.level,
  grade: Number(row.grade),
  category: type === 'phrase' ? 'phrase' : 'basic',
  priority: Number(row.priority) || 3,
  example: type === 'phrase' ? phraseExample(row.english) : wordExample(row.english),
  exampleJapanese: type === 'phrase' ? `今日は「${row.english}」という熟語を練習しました。` : `今日は「${row.english}」という英単語を学びました。`,
  pronunciation: row.english,
  tags: [row.level === 'junior_high' ? '中学' : '高校', type === 'phrase' ? '熟語' : row.partOfSpeech],
  enabled: true
});
const words = parse('junior_high_high_school_english_vocabulary.csv').map((row, index) => toCard(row, 'word', index + 1));
const phrases = parse('junior_high_high_school_english_idioms.csv').map((row, index) => toCard(row, 'phrase', index + 1));
const validate = (items) => {
  const ids = new Set(), values = new Set();
  for (const item of items) {
    if (!item.id || !item.english || !item.japanese || !['word', 'phrase'].includes(item.type) || !['junior', 'senior'].includes(item.level)) throw new Error(`Invalid item: ${item.id}`);
    const value = `${item.type}:${item.english.toLowerCase()}`;
    if (ids.has(item.id)) throw new Error(`Duplicate ID: ${item.id}`);
    if (values.has(value)) throw new Error(`Duplicate ${item.type}: ${item.english}`);
    ids.add(item.id); values.add(value);
  }
};
validate([...words, ...phrases]);
const output = `/* Generated from supplied CSV files. Do not edit manually. */\nwindow.EnglishCardCatalog = ${JSON.stringify([...words, ...phrases])};\n`;
fs.mkdirSync(path.join(root, 'js', 'data'), { recursive: true });
fs.writeFileSync(path.join(root, 'js', 'data', 'catalog.js'), output, 'utf8');
console.log(`Generated ${words.length} words and ${phrases.length} phrases.`);
