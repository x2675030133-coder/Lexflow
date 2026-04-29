/**
 * ECDICT 词库导入脚本
 * 自动下载 ECDICT SQLite 数据库，按考试标签提取词汇，按词频排序，生成 JSON
 *
 * 使用: node scripts/import-ecdict.js
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const Database = require('better-sqlite3');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── 配置 ───
const DATA_DIR = path.join(__dirname, 'data');
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'data');
const ECDICT_URL = 'https://github.com/skywind3000/ECDICT/releases/download/1.0.28/ecdict-sqlite-28.zip';

// tag → 词表 ID 映射
const TAG_MAP = {
  zk: 'junior',
  gk: 'senior',
  cet4: 'cet4',
  cet6: 'cet6',
  ielts: 'ielts',
  toefl: 'toefl',
  gre: 'gre',
};

// 小学常见词汇（人教版 PEP 教材核心词汇精选）
const PRIMARY_WORDS = [
  'apple','bag','ball','banana','bear','bed','big','bird','birthday','black',
  'blue','boat','body','book','box','boy','bread','brother','brown','bus',
  'cake','candy','cap','car','card','cat','chair','chicken','child','chocolate',
  'class','clean','clock','close','clothes','coat','coffee','cold','color','come',
  'computer','cook','cool','cow','cup','dad','dance','day','dear','desk',
  'dinner','doctor','dog','doll','door','down','draw','dress','drink','drive',
  'duck','ear','eat','egg','eight','elephant','eleven','English','eraser','evening',
  'every','eye','face','family','fan','farm','farmer','fast','father','favorite',
  'fifteen','find','fine','finger','first','fish','five','floor','flower','fly',
  'food','foot','football','for','fork','four','fox','friend','fruit','fun',
  'game','garden','get','girl','give','glass','go','good','goodbye','grape',
  'grass','great','green','grow','guess','hair','hamburger','hand','happy','hat',
  'have','he','head','hello','help','her','here','hill','his','home',
  'homework','horse','hospital','hot','house','how','hundred','hungry','ice','idea',
  'in','it','jacket','job','juice','jump','key','kind','king','kite',
  'knife','know','lake','lamp','last','late','learn','left','leg','lemon',
  'lesson','letter','library','light','like','line','lion','listen','little','live',
  'long','look','love','lunch','make','man','mango','many','map','math',
  'may','me','meat','meet','melon','milk','mine','miss','mom','Monday',
  'money','monkey','month','moon','morning','mother','mountain','mouse','mouth','movie',
  'much','music','my','name','new','next','nice','night','nine','no',
  'noodle','nose','not','notebook','now','number','nurse','of','office','old',
  'on','one','only','open','orange','our','out','panda','paper','park',
  'party','pass','peach','pear','pen','pencil','people','pet','photo','piano',
  'picture','pig','pink','pizza','plant','plate','play','please','point','potato',
  'present','pretty','pupil','purple','put','queen','question','quiet','rabbit','rain',
  'rainbow','read','red','rice','ride','right','river','road','robot','room',
  'rope','rose','round','ruler','run','sad','salad','salt','same','sand',
  'Saturday','say','school','sea','season','see','seven','she','sheep','ship',
  'shirt','shoe','shop','short','show','sing','sister','sit','six','skirt',
  'sleep','small','smile','snake','snow','so','sock','some','son','song',
  'sorry','soup','speak','sport','spring','stand','star','start','stop','store',
  'story','street','strong','student','study','sugar','summer','sun','Sunday','swim',
  'table','take','talk','tall','tea','teach','teacher','telephone','tell','ten',
  'thank','that','the','their','them','then','there','these','they','thin',
  'thing','think','thirteen','this','those','three','Thursday','tiger','time','tired',
  'to','today','tomato','too','toy','train','tree','try','Tuesday','turn',
  'TV','twelve','twenty','two','umbrella','uncle','under','up','us','use',
  'vegetable','very','visit','wait','walk','wall','want','warm','wash','watch',
  'water','we','weather','Wednesday','week','welcome','well','west','what','when',
  'where','which','white','who','why','will','wind','window','winter','with',
  'woman','wonderful','word','work','world','write','wrong','year','yellow','yes',
  'you','young','your','zero','zoo',
];

// ─── 工具函数 ───

function followRedirects(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) return reject(new Error('Too many redirects'));
    const client = url.startsWith('https') ? https : http;
    client.get(url, { headers: { 'User-Agent': 'ECDICT-Importer/1.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        resolve(followRedirects(res.headers.location, maxRedirects - 1));
      } else {
        resolve(res);
      }
    }).on('error', reject);
  });
}

async function downloadFile(url, destPath) {
  console.log(`下载: ${url}`);
  const res = await followRedirects(url);
  if (res.statusCode !== 200) {
    throw new Error(`下载失败: HTTP ${res.statusCode}`);
  }
  const totalBytes = parseInt(res.headers['content-length'] || '0', 10);
  let downloaded = 0;
  let lastPercent = -1;

  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    res.on('data', (chunk) => {
      downloaded += chunk.length;
      if (totalBytes > 0) {
        const percent = Math.floor((downloaded / totalBytes) * 100);
        if (percent !== lastPercent) {
          process.stdout.write(`\r  进度: ${percent}% (${(downloaded / 1024 / 1024).toFixed(1)}MB / ${(totalBytes / 1024 / 1024).toFixed(1)}MB)`);
          lastPercent = percent;
        }
      }
    });
    res.pipe(file);
    file.on('finish', () => { console.log('\n  下载完成'); resolve(); });
    file.on('error', reject);
    res.on('error', reject);
  });
}

async function unzipFile(zipPath, destDir) {
  console.log('解压文件...');
  const { execSync } = await import('child_process');
  try {
    execSync(`powershell -command "Expand-Archive -Path '${zipPath}' -DestinationPath '${destDir}' -Force"`, { stdio: 'pipe' });
  } catch {
    try {
      execSync(`unzip -o "${zipPath}" -d "${destDir}"`, { stdio: 'pipe' });
    } catch {
      throw new Error('无法解压文件，请手动解压 ZIP 到 scripts/data/ 目录');
    }
  }
  console.log('  解压完成');
}

function findDbFile(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true, recursive: true });
  for (const entry of entries) {
    if (entry.name.endsWith('.db')) {
      const fullPath = entry.parentPath
        ? path.join(entry.parentPath, entry.name)
        : path.join(dir, entry.name);
      return fullPath;
    }
  }
  return null;
}

function convertToAppFormat(row, listId, index) {
  const { word, phonetic, definition, translation, pos } = row;

  // 解析词性
  const partOfSpeech = [];
  if (pos) {
    pos.split('/').forEach(p => {
      const m = p.match(/^([a-z]+)/);
      if (m && !partOfSpeech.includes(m[1] + '.')) partOfSpeech.push(m[1] + '.');
    });
  }
  if (partOfSpeech.length === 0) partOfSpeech.push('n.');

  // 解析定义
  const definitions = [];
  const enDefs = definition ? definition.split('\n').filter(Boolean) : [];
  const zhDefs = translation ? translation.split('\n').filter(Boolean) : [];

  if (zhDefs.length > 0) {
    zhDefs.slice(0, 3).forEach((zh, i) => {
      definitions.push({
        en: enDefs[i] || '',
        zh: zh.trim(),
      });
    });
  } else if (enDefs.length > 0) {
    enDefs.slice(0, 3).forEach(en => {
      definitions.push({ en: en.trim(), zh: '' });
    });
  } else {
    definitions.push({ en: word, zh: '' });
  }

  // 生成例句
  const examples = [{
    en: `I need to learn the word "${word}".`,
    zh: `我需要学习单词"${word}"。`,
  }];

  return {
    id: `${listId}-${String(index + 1).padStart(4, '0')}`,
    word,
    phonetic: phonetic ? `/${phonetic}/` : '',
    partOfSpeech: partOfSpeech.slice(0, 3),
    definitions,
    examples,
    imageQuery: word,
    memoryTip: definitions[0]?.zh ? `${word} - ${definitions[0].zh}` : word,
  };
}

// ─── 主流程 ───

async function main() {
  console.log('=== ECDICT 词库导入工具 ===\n');

  // 1. 确保目录存在
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // 2. 查找或下载 SQLite 数据库
  let dbPath = findDbFile(DATA_DIR);
  if (!dbPath) {
    const zipPath = path.join(DATA_DIR, 'ecdict.zip');
    if (!fs.existsSync(zipPath)) {
      await downloadFile(ECDICT_URL, zipPath);
    }
    await unzipFile(zipPath, DATA_DIR);
    dbPath = findDbFile(DATA_DIR);
    if (!dbPath) {
      console.error('错误: 解压后未找到 .db 文件');
      process.exit(1);
    }
  }
  console.log(`使用数据库: ${dbPath}\n`);

  // 3. 打开数据库
  const db = new Database(dbPath, { readonly: true });

  // 检查表结构
  const columns = db.pragma('table_info(stardict)').map(c => c.name);
  console.log(`数据库字段: ${columns.join(', ')}\n`);

  // 4. 按标签查询词汇
  console.log('按考试标签提取词汇...');
  const wordsByList = {};

  for (const [tag, listId] of Object.entries(TAG_MAP)) {
    const rows = db.prepare(
      `SELECT word, phonetic, definition, translation, pos, bnc, frq
       FROM stardict
       WHERE tag LIKE '%${tag}%'
       ORDER BY CASE WHEN bnc > 0 THEN bnc ELSE 999999 END ASC,
                CASE WHEN frq > 0 THEN frq ELSE 0 END DESC`
    ).all();

    // 去重
    const seen = new Set();
    wordsByList[listId] = rows.filter(row => {
      const key = row.word.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    console.log(`  ${tag} → ${listId}: ${wordsByList[listId].length} 词`);
  }

  // 5. 构建小学词表
  console.log('\n构建小学词表...');
  const placeholders = PRIMARY_WORDS.map(() => '?').join(',');
  const primaryRows = db.prepare(
    `SELECT word, phonetic, definition, translation, pos, bnc, frq
     FROM stardict
     WHERE LOWER(word) IN (${placeholders})`
  ).all(...PRIMARY_WORDS.map(w => w.toLowerCase()));

  const primaryMap = new Map();
  for (const row of primaryRows) {
    primaryMap.set(row.word.toLowerCase(), row);
  }

  wordsByList['primary'] = PRIMARY_WORDS.map(w => {
    return primaryMap.get(w.toLowerCase()) || {
      word: w, phonetic: '', definition: '', translation: w, pos: '', bnc: 0, frq: 0,
    };
  });
  console.log(`  primary: ${wordsByList['primary'].length} 词`);

  db.close();

  // 6. 转换并写入 JSON（使用紧凑格式减小文件体积）
  console.log('\n生成 JSON 文件:');
  const metadata = { version: '2', generated: new Date().toISOString(), lists: {} };

  for (const [listId, rows] of Object.entries(wordsByList)) {
    const jsonData = rows.map((row, i) => convertToAppFormat(row, listId, i));
    const outputFile = path.join(OUTPUT_DIR, `${listId}.json`);
    fs.writeFileSync(outputFile, JSON.stringify(jsonData), 'utf-8');

    const fileSize = fs.statSync(outputFile).size;
    const sizeStr = fileSize > 1024 * 1024
      ? `${(fileSize / 1024 / 1024).toFixed(1)}MB`
      : `${(fileSize / 1024).toFixed(0)}KB`;
    console.log(`  ✓ ${listId.padEnd(8)} — ${String(rows.length).padStart(5)} 词  (${sizeStr})`);
    metadata.lists[listId] = { totalWords: rows.length };
  }

  // 7. 写入 metadata
  const metaPath = path.join(OUTPUT_DIR, 'metadata.json');
  fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2), 'utf-8');
  console.log(`\n  ✓ metadata.json`);

  console.log('\n=== 导入完成 ===');
}

main().catch(err => {
  console.error('\n导入失败:', err.message);
  process.exit(1);
});
