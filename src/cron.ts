/**
 * Render Cron entry point — single cron job, auto-detects slot by UTC hour.
 * Schedule: 0 7,17 * * * (runs 2x daily)
 * 07 UTC = 09 CEST (morning reel)
 * 17 UTC = 19 CEST (evening post)
 *
 * Optional: npx tsx src/cron.ts --slot morning|evening
 */
import { execSync } from 'node:child_process';

const hour = new Date().getUTCHours();

let slot = process.argv.includes('--slot')
  ? process.argv[process.argv.indexOf('--slot') + 1]
  : null;

// Auto-detect slot from UTC hour
if (!slot) {
  if (hour < 12) slot = 'morning';
  else slot = 'evening';
}

if (!['morning', 'evening'].includes(slot)) {
  console.error('Invalid slot. Use: morning | evening');
  process.exit(1);
}

const day = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);

function run(cmd: string) {
  console.log(`> ${cmd}`);
  try {
    execSync(cmd, { stdio: 'inherit', timeout: 20 * 60 * 1000 });
  } catch (err: any) {
    console.error(`\nCommand failed: ${cmd}`);
    if (err.stdout) console.error('STDOUT:', err.stdout.toString());
    if (err.stderr) console.error('STDERR:', err.stderr.toString());
    throw err;
  }
}

console.log(`Slot: ${slot} | UTC hour: ${hour} | Day: ${day}`);

if (slot === 'morning') {
  // Rotate 3 reel types: 0=rozhovor, 1=bytefall, 2=bytesurf
  const reelType = day % 3;
  console.log(`Reel type ${reelType} (0=rozhovor, 1=bytefall, 2=bytesurf)`);

  if (reelType === 0) {
    // Dialog reel — EN first, then SK with same lesson
    const result = execSync('npx tsx src/indexReel.ts', { encoding: 'utf-8', timeout: 20 * 60 * 1000 });
    process.stdout.write(result);
    const match = result.match(/lesson_id=(\d+)/);
    if (match) {
      run(`npx tsx src/indexReel.ts --lang sk --lesson-id ${match[1]}`);
    } else {
      run('npx tsx src/indexReel.ts --lang sk');
    }
  } else if (reelType === 1) {
    run('npx tsx src/indexByteFall.ts');
  } else {
    run('npx tsx src/indexByteSurf.ts');
  }
} else if (slot === 'evening') {
  // Rotate 3 post types: 0=fill code, 1=quiz, 2=glossary
  const postType = day % 3;
  console.log(`Post type ${postType} (0=code, 1=quiz, 2=glossary)`);

  if (postType === 0) {
    run('npx tsx src/indexCode.ts');
  } else if (postType === 1) {
    run('npx tsx src/indexQuiz.ts');
  } else {
    run('npx tsx src/indexGlossary.ts');
  }
}

console.log('Done.');
