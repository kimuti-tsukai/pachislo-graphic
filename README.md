# Pachislo Game Simulator

A TypeScript implementation of a Pachislot (Japanese slot machine) game simulator built for Deno.

## Overview

This project provides a comprehensive simulation of a Pachislot game with the following features:

- **Game State Management**: Handles different game states (Uninitialized, Normal, Rush)
- **Lottery System**: Implements probability-based lottery mechanics with configurable win rates
- **Slot Machine Logic**: Simulates slot reels with configurable symbols and outcomes
- **Rush Mode**: Special game mode with enhanced winning chances
- **Command Pattern**: Extensible command system for game actions
- **TypeScript Support**: Full type safety and IntelliSense support
- **Deno Runtime**: No node_modules, native TypeScript support

## Project Structure

```
pachislo-graphic/
├── src/
│   └── pachislo.ts          # Main TypeScript source code
├── .zed/
│   ├── settings.json        # Zed editor settings for Deno
│   ├── tasks.json          # Zed task definitions
│   └── project.json        # Zed project configuration
├── deno.json               # Deno configuration
├── server.ts               # HTTP server for web interface
├── index.html              # Web-based game interface
└── README.md               # This file
```

## Requirements

- [Deno](https://deno.land/) v1.37+ installed

## Installation

No installation required! Deno handles everything natively.

For the best development experience with Zed, ensure you have Deno installed and the Deno LSP will be automatically configured through the `.zed/` settings.

## Usage

### Quick Start

Run the CLI demo directly:

```bash
deno run src/pachislo.ts
```

Or use the task:

```bash
deno task demo
```

### Web Interface

Start the web server:

```bash
deno task serve
```

Then open http://localhost:8080 in your browser to play the interactive game.

### Development Tasks

Available Deno tasks:

```bash
# Run the CLI demo
deno task demo

# Start web server
deno task serve

# Check types
deno task check

# Format code
deno task fmt

# Lint code
deno task lint

# Run tests (when available)
deno task test

# Development mode with watch
deno task dev
```

### Build Process

For GitHub Pages deployment, use the build command:

```bash
deno task build
```

This command performs the following tasks:

1. **TypeScript Bundling**: Creates `pachislo.js` from `src/pachislo.ts`
2. **Video List Generation**: Scans the `images/` directory and creates `video-list.json`

#### Generated Files

- `pachislo.js` - Bundled TypeScript game logic
- `video-list.json` - Static list of available video files for each category

#### Manual Video List Generation

You can also generate just the video list:

```bash
deno task generate-videos
```

This is useful when you add new video files to the `images/` directory.

#### Available Build Tasks

- `deno task build` - Build for GitHub Pages deployment
- `deno task generate-videos` - Generate video list only

### Importing as a Module

```typescript
import {
  Game,
  Config,
  BallsConfig,
  Probability,
  SlotProbability,
  CLIInput,
  CLIOutput,
  START_HOLE_PROBABILITY_EXAMPLE,
} from "./src/pachislo.ts";

// Create configuration
const config = new Config(
  new BallsConfig(1000, 15, 300), // initBalls, incrementalBalls, incrementalRush
  new Probability(
    new SlotProbability(0.16, 0.3, 0.15), // normal mode probabilities
    new SlotProbability(0.48, 0.2, 0.05), // rush mode probabilities
    new SlotProbability(0.8, 0.25, 0.1), // rush continue probabilities
    (n) => Math.pow(0.6, n - 1), // rush continue function
  ),
);

// Create input/output handlers
const input = new CLIInput(START_HOLE_PROBABILITY_EXAMPLE);
const output = new CLIOutput();

// Add commands (for demo)
input.addCommands(["s", "l", "l", "l", "q"]);

// Create and run game
const game = new Game(config, input, output);
game.run();
```

### Remote Import

You can also import directly from a URL (if hosted):

```typescript
import {
  Game,
  Config,
} from "https://raw.githubusercontent.com/username/repo/main/src/pachislo.ts";
```

## Game Mechanics

### Game States

- **Uninitialized**: Game not started
- **Normal**: Standard play mode with regular win rates
- **Rush**: Special mode with higher win rates and bonus balls

### Configuration Parameters

#### BallsConfig

- `initBalls`: Starting number of balls
- `incrementalBalls`: Balls gained on normal wins
- `incrementalRush`: Balls gained during rush mode

#### SlotProbability

- `win`: Base win probability (0.0-1.0)
- `fakeWin`: Probability of fake win animation (0.0-1.0)
- `fakeLose`: Probability of fake lose animation (0.0-1.0)

#### Probability

Contains SlotProbability settings for:

- `normal`: Standard game mode
- `rush`: Enhanced rush mode
- `rushContinue`: Rush continuation checks
- `rushContinueFn`: Function determining rush continuation probability

### Available Commands

- `StartGame`: Initialize the game with configured balls
- `LaunchBall`: Launch a single ball
- `CauseLottery`: Force a lottery event
- `LaunchBallFlow`: Launch ball with optional lottery trigger
- `FinishGame`: End the current game session

## API Reference

### Core Classes

#### Game

Main game engine that orchestrates all game mechanics.

```typescript
class Game {
  constructor(config: Config, input: UserInput, output: UserOutput);
  run(): void;
  runStep(): StepResult;
  start(): void;
  finish(): void;
  launchBall(): void;
  causeLottery(): void;
}
```

#### GameState

Static utility class for state management.

```typescript
class GameState {
  static Uninitialized(): UninitializedState;
  static Normal(balls: number): NormalState;
  static Rush(balls: number, rushBalls: number, n: number): RushState;
  static isUninitialized(state: GameStateType): boolean;
  static isRush(state: GameStateType): boolean;
}
```

#### Config

Game configuration container with validation.

```typescript
class Config {
  constructor(balls: BallsConfig, probability: Probability);
  validate(): void;
}
```

### Interfaces and Types

#### Game State Types

```typescript
type GameStateType = UninitializedState | NormalState | RushState;

interface UninitializedState {
  type: "Uninitialized";
}
interface NormalState {
  type: "Normal";
  balls: number;
}
interface RushState {
  type: "Rush";
  balls: number;
  rushBalls: number;
  n: number;
}
```

#### Lottery Types

```typescript
type LotteryResultType = WinResult | LoseResult;

interface WinResult {
  type: "Win";
  winType: Win;
}
interface LoseResult {
  type: "Lose";
  loseType: Lose;
}

enum Win {
  Default = "Default",
  FakeWin = "FakeWin",
}
enum Lose {
  Default = "Default",
  FakeLose = "FakeLose",
}
```

### Abstract Base Classes

#### UserInput

Extend this class to create custom input handlers:

```typescript
abstract class UserInput {
  abstract waitForInput(): CommandType | null;
}
```

#### UserOutput

Extend this class to create custom output handlers:

```typescript
abstract class UserOutput {
  abstract default(transition: Transition): void;
  abstract finishGame(state: GameStateType): void;
  abstract lotteryNormal(result: LotteryResultType, slot: SlotOutput): void;
  abstract lotteryRush(result: LotteryResultType, slot: SlotOutput): void;
  abstract lotteryRushContinue(
    result: LotteryResultType,
    slot: SlotOutput,
  ): void;
}
```

## Error Handling

The simulator includes comprehensive error handling:

- `ConfigError`: Invalid configuration parameters
- `UninitializedError`: Operations on uninitialized game state
- `AlreadyStartedError`: Attempting to start already running game
- `ProbabilityError`: Invalid probability calculations

## Example Output

```
=== Pachislot Game Simulator Demo ===

Welcome to Pachislo!

Current state: {"type":"Normal","balls":1000}

Current state: {"type":"Normal","balls":999}

Slot: [3,7,3]
Lottery result: {"type":"Lose","loseType":"Default"}
Current state: {"type":"Normal","balls":998}

Game finished!
Final state: {"type":"Normal","balls":995}
```

## Contributing

1. Make changes to `src/pachislo.ts` or other files
2. Use Zed's integrated tasks (Cmd+Shift+P → "task") or run manually:
   - `deno task check` to verify types
   - `deno task lint` to check code style
   - `deno task fmt` to format code
3. Test with `deno task demo` (CLI) or `deno task serve` (web)

### Zed Editor Integration

This project includes Zed-specific configuration files:

- `.zed/settings.json`: Editor settings with Deno LSP integration
- `.zed/tasks.json`: Predefined tasks for common Deno operations
- `.zed/project.json`: Project-level configuration

Available Zed tasks:

- **Deno: Run Demo**: Execute the CLI demo
- **Deno: Start Server**: Launch the web server
- **Deno: Check Types**: Run type checking
- **Deno: Lint**: Check code style
- **Deno: Format**: Auto-format code
- **Deno: Watch Demo**: Run demo with file watching

## Why Deno?

- **No node_modules**: Clean project structure without dependency hell
- **Native TypeScript**: No build step required, run .ts files directly
- **Built-in tools**: Formatting, linting, testing, bundling all included
- **Secure by default**: Explicit permissions for file system, network access
- **Modern standards**: ES modules, Web APIs, modern JavaScript features
- **Single executable**: No complex toolchain setup required
- **Fast development**: Hot reload, instant startup, integrated development server

## Deployment

### GitHub Pages

This project is configured as a static site and can be deployed manually to GitHub Pages.

#### Setup Steps

1. **Enable GitHub Pages**:
   - Go to your repository's Settings → Pages
   - Set Source to "Deploy from a branch"
   - Select "main" branch and "/ (root)" folder
   - Click Save

2. **Push your code**:

   ```bash
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push origin main
   ```

3. **Manual Deployment**:
   - Your game will be available at `https://username.github.io/repository-name/`
   - Changes may take a few minutes to appear

#### Static Site Features

The project automatically switches to static mode when deployed:

- **Video Files**: Uses static JSON configuration (`video-list.json`) instead of server API
- **No Server Dependencies**: All functionality works without a backend server
- **Cross-Origin Compatible**: Properly configured CORS headers for static hosting

#### Manual Deployment

You can also deploy manually by uploading these files to any static hosting service:

- `index.html` - Main game interface
- `pachislo.js` - Bundled game logic
- `video-list.json` - Video file configuration
- `images/` - Video and image assets

#### Local Testing

Test the static version locally:

```bash
# Using Python
python -m http.server 8000

# Using Deno (if you prefer)
deno task serve
```

Then visit `http://localhost:8000` to verify everything works in static mode.

## License

See LICENSE file for details.
