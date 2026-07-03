import { resolveRound } from './resolveRound';

// Very basic test suite representation
function runTests() {
  let passed = 0;
  let failed = 0;

  function assertEqual(name: string, actual: any, expected: any) {
    if (JSON.stringify(actual) === JSON.stringify(expected)) {
      passed++;
      console.log(`✅ ${name}`);
    } else {
      failed++;
      console.error(`❌ ${name}`);
      console.error(`   Expected: ${JSON.stringify(expected)}`);
      console.error(`   Actual:   ${JSON.stringify(actual)}`);
    }
  }

  // Test 1: All same (draw)
  assertEqual('All same (draw)', 
    resolveRound(['p1', 'p2', 'p3'], { p1: 'rock', p2: 'rock', p3: 'rock' }),
    { outcome: 'draw', winners: [], losers: [] }
  );

  // Test 2: All three present (draw)
  assertEqual('All three present (draw)', 
    resolveRound(['p1', 'p2', 'p3'], { p1: 'rock', p2: 'paper', p3: 'scissors' }),
    { outcome: 'draw', winners: [], losers: [] }
  );

  // Test 3: 2-vs-2-vs-1 style split -> actually impossible with 5 players to have 3 choices and not be a draw,
  // Wait, if all 3 are present, it's a draw, according to the requirements:
  // "All three choices present simultaneously -> draw"
  assertEqual('All three present (5 players)', 
    resolveRound(['p1', 'p2', 'p3', 'p4', 'p5'], { p1: 'rock', p2: 'rock', p3: 'paper', p4: 'paper', p5: 'scissors' }),
    { outcome: 'draw', winners: [], losers: [] }
  );

  // Test 4: Exactly two distinct choices (Rock vs Scissors) -> Rock wins
  assertEqual('Rock beats Scissors', 
    resolveRound(['p1', 'p2', 'p3'], { p1: 'rock', p2: 'scissors', p3: 'rock' }),
    { outcome: 'resolved', winners: ['p1', 'p3'], losers: ['p2'] }
  );

  // Test 5: Exactly two distinct choices (Paper vs Rock) -> Paper wins
  assertEqual('Paper beats Rock', 
    resolveRound(['p1', 'p2'], { p1: 'rock', p2: 'paper' }),
    { outcome: 'resolved', winners: ['p2'], losers: ['p1'] }
  );

  // Test 6: Exactly two distinct choices (Scissors vs Paper) -> Scissors wins
  assertEqual('Scissors beats Paper', 
    resolveRound(['p1', 'p2', 'p3', 'p4'], { p1: 'scissors', p2: 'paper', p3: 'paper', p4: 'scissors' }),
    { outcome: 'resolved', winners: ['p1', 'p4'], losers: ['p2', 'p3'] }
  );

  // Test 7: Timeouts
  assertEqual('Mix of valid picks and timeouts', 
    resolveRound(['p1', 'p2', 'p3'], { p1: 'rock', p2: 'scissors', p3: null }),
    { outcome: 'resolved', winners: ['p1'], losers: ['p2', 'p3'] }
  );

  // Test 8: All timeouts
  assertEqual('All timeouts', 
    resolveRound(['p1', 'p2'], { p1: null, p2: null }),
    { outcome: 'draw', winners: [], losers: ['p1', 'p2'] }
  );

  console.log(`\nTests completed: ${passed} passed, ${failed} failed.`);
}

runTests();
