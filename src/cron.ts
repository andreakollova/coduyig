/**
 * Render Cron entry point
 * Usage: npx tsx src/cron.ts --slot morning|lunch|evening
 */
import { execSync } from 'node:child_process';

const slot = process.argv.includes('--slot')
  ? process.argv[process.argv.indexOf('--slot') + 1]
  : null;

if (!slot || !['morning', 'lunch', 'evening'].includes(slot)) {
  console.error('Usage: npx tsx src/cron.ts --slot morning|lunch|evening');
  process.exit(1);
}

const day = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);

function run(cmd: string) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: 'inherit', timeout: 20 * 60 * 1000 });
}

// Ensure Remotion browser
run('npx remotion browser ensure');

if (slot === 'morning' || slot === 'evening') {
  // Rotate 3 reel types: 0=rozhovor, 1=bytefall, 2=bytesurf
  const offset = slot === 'evening' ? 1 : 0;
  const reelType = (day + offset) % 3;

  console.log(`Day ${day} | ${slot} | reel type ${reelType} (0=rozhovor, 1=bytefall, 2=bytesurf)`);

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
} else if (slot === 'lunch') {
  // Alternate quiz (even days) and code challenge (odd days)
  const lunchType = day % 2;
  console.log(`Day ${day} | lunch | type ${lunchType} (0=quiz, 1=code)`);

  if (lunchType === 0) {
    run('npx tsx src/indexQuiz.ts');
  } else {
    run('npx tsx src/indexCode.ts');
  }
}

console.log('Done.');
