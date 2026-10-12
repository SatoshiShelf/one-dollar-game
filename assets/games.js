// One Dollar Game — game catalog.
// Every game is $1. `demo` is the free playable version on the site;
// the paid download (browser HTML + Python source) is delivered by the Worker.
window.STORE_CONFIG = {
  storeName: "One Dollar Game",
  tagline: "25 games. One dollar each. Paid in crypto.",
  priceUsd: 1,
  contact: "onedollargame@proton.me",
  // Paste your deployed Cloudflare Worker URL here (secure delivery + payment check).
  workerUrl: "",
  priceApi: "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,litecoin,ethereum&vs_currencies=usd",
};

window.GAMES = [
  { id:"snake",      name:"Snake",              tagline:"Eat, grow, don't bite yourself.",       emoji:"\u{1F40D}", cat:"Arcade",  demo:"games/snake.html",      desc:"The classic. Steer the snake, eat the food, and grow as long as you can without crashing into yourself or the walls." },
  { id:"breakout",   name:"Breakout",           tagline:"Smash every last brick.",               emoji:"\u{1F9F1}", cat:"Arcade",  demo:"games/breakout.html",   desc:"Bounce the ball off your paddle and clear the wall of bricks. Lose the ball and it costs you a life." },
  { id:"pong",       name:"Pong",               tagline:"The one that started it all.",          emoji:"\u{1F3D3}", cat:"Arcade",  demo:"games/pong.html",       desc:"The original arcade duel. Move your paddle, outplay the CPU, and reach the winning score." },
  { id:"blockfall",  name:"Blockfall",          tagline:"Stack the falling blocks.",             emoji:"\u{1F7E6}", cat:"Puzzle",  demo:"games/blockfall.html",  desc:"Rotate and drop the falling pieces, fill complete lines to clear them, and survive as the speed ramps up." },
  { id:"flappy",     name:"Flappy Wing",        tagline:"One tap. Endless pipes.",               emoji:"\u{1F424}", cat:"Arcade",  demo:"games/flappy.html",     desc:"Tap to flap and thread the bird through the pipes. Simple to learn, brutal to master." },
  { id:"2048",       name:"2048",               tagline:"Merge tiles to reach 2048.",            emoji:"\u{1F522}", cat:"Puzzle",  demo:"games/2048.html",       desc:"Slide the tiles, merge matching numbers, and chase the 2048 tile before the board fills up." },
  { id:"memory",     name:"Memory Match",       tagline:"Find every matching pair.",             emoji:"\u{1F0CF}", cat:"Puzzle",  demo:"games/memory.html",     desc:"Flip cards two at a time and memorise where each symbol hides. Clear the board in as few moves as possible." },
  { id:"minefield",  name:"Minefield",          tagline:"Clear the grid, dodge the mines.",      emoji:"\u{1F4A3}", cat:"Puzzle",  demo:"games/minefield.html",  desc:"Use the number clues to work out where the mines are, then reveal every safe square without detonating one." },
  { id:"invaders",   name:"Space Invaders",     tagline:"Defend the planet.",                    emoji:"\u{1F47E}", cat:"Arcade",  demo:"games/invaders.html",   desc:"Aliens march down the screen as you shoot from below. Don't let them reach the bottom." },
  { id:"tictactoe",  name:"Tic-Tac-Toe AI",     tagline:"Try to beat the unbeatable.",           emoji:"\u274C",    cat:"Board",   demo:"games/tictactoe.html",  desc:"Play X against a CPU that never loses. Can you force a draw, or catch it off guard?" },
  { id:"sudoku",     name:"Sudoku",             tagline:"A fresh logic puzzle every time.",      emoji:"\u{1F532}", cat:"Puzzle",  demo:"games/sudoku.html",     desc:"Fill the grid so every row, column and box holds the digits 1-9. A new puzzle is generated each game." },
  { id:"wordsearch", name:"Word Search",        tagline:"Hunt the hidden words.",                emoji:"\u{1F524}", cat:"Word",    demo:"games/wordsearch.html", desc:"Words are hidden across the grid in every direction. Find them all against the clock." },
  { id:"hangman",    name:"Hangman",            tagline:"Guess the word before it's too late.",  emoji:"\u{1FA9D}", cat:"Word",    demo:"games/hangman.html",    desc:"Pick letters to reveal the secret word. Six wrong guesses and it's over." },
  { id:"simon",      name:"Simon Says",         tagline:"Repeat the growing pattern.",           emoji:"\u{1F534}", cat:"Memory",  demo:"games/simon.html",      desc:"Watch the colours light up, then repeat the sequence. It gets one step longer every round." },
  { id:"whack",      name:"Whack-a-Mole",       tagline:"Fast fingers only.",                    emoji:"\u{1F528}", cat:"Arcade",  demo:"games/whack.html",      desc:"Moles pop up all over the board - hit as many as you can before the clock runs out." },
  { id:"doodle",     name:"Doodle Jump",        tagline:"Climb as high as you can.",             emoji:"\u{1F998}", cat:"Arcade",  demo:"games/doodle.html",     desc:"Bounce your way up an endless tower of platforms. Miss one and you fall." },
  { id:"asteroids",  name:"Asteroids",          tagline:"Blast the drifting rocks.",             emoji:"\u2604\uFE0F", cat:"Arcade",  demo:"games/asteroids.html",  desc:"Spin, thrust and shoot through a field of asteroids that split into smaller ones when hit." },
  { id:"sokoban",    name:"Sokoban",            tagline:"Push every box onto its target.",       emoji:"\u{1F4E6}", cat:"Puzzle",  demo:"games/sokoban.html",    desc:"A classic box-pushing puzzle. Plan your moves carefully - one wrong shove and you're stuck." },
  { id:"lightsout",  name:"Lights Out",         tagline:"Switch every light off.",               emoji:"\u{1F4A1}", cat:"Puzzle",  demo:"games/lightsout.html",  desc:"Tapping a light toggles it and its neighbours. Turn the whole grid off in the fewest taps." },
  { id:"connect4",   name:"Connect Four AI",    tagline:"Four in a row wins.",                   emoji:"\u{1F535}", cat:"Board",   demo:"games/connect4.html",   desc:"Drop your discs and line up four before the CPU does. It blocks - and it attacks." },
  { id:"stacker",    name:"Stacker",            tagline:"Build the tallest tower.",              emoji:"\u{1F3D7}\uFE0F", cat:"Arcade",  demo:"games/stacker.html",    desc:"Time your moves to stack blocks into a tower. Overhang gets trimmed away - stay precise." },
  { id:"maze",       name:"Maze Runner",        tagline:"Find the way out.",                     emoji:"\u{1F300}", cat:"Puzzle",  demo:"games/maze.html",       desc:"A randomly generated maze every time. Race to the exit and try to beat your best time." },
  { id:"reaction",   name:"Reaction Test",      tagline:"How fast are your reflexes?",           emoji:"\u26A1",    cat:"Casual",  demo:"games/reaction.html",   desc:"Wait for green, then click as fast as you can. Average your five tries for a true score." },
  { id:"typing",     name:"Typing Speed",       tagline:"Words per minute.",                     emoji:"\u2328\uFE0F", cat:"Casual",  demo:"games/typing.html",     desc:"Type the passage against the clock and get your real words-per-minute and accuracy score." },
  { id:"rps",        name:"Rock Paper Scissors",tagline:"Best of five versus the CPU.",          emoji:"\u270A",    cat:"Casual",  demo:"games/rps.html",        desc:"The timeless duel. First to three wins the match - the CPU mixes it up to keep you guessing." },
];
