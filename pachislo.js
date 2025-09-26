// src/pachislo.ts
var ConfigError = class extends Error {
  errors;
  constructor(errors = []) {
    super(`ConfigError: ${errors.join("\n")}`);
    this.name = "ConfigError";
    this.errors = errors;
  }
};
var BallsConfig = class {
  initBalls;
  incrementalBalls;
  incrementalRush;
  constructor(initBalls, incrementalBalls, incrementalRush) {
    this.initBalls = initBalls;
    this.incrementalBalls = incrementalBalls;
    this.incrementalRush = incrementalRush;
  }
  validate() {
    const errors = [];
    if (this.initBalls < 1) {
      errors.push("initial balls must be greater than 0");
    }
    if (errors.length > 0) throw new ConfigError(errors);
  }
};
var SlotProbability = class {
  win;
  fakeWin;
  fakeLose;
  constructor(win, fakeWin, fakeLose) {
    this.win = win;
    this.fakeWin = fakeWin;
    this.fakeLose = fakeLose;
  }
  validate() {
    const errors = [];
    if (this.win < 0 || this.win > 1) {
      errors.push("win probability must be between 0.0 and 1.0");
    }
    if (this.fakeWin < 0 || this.fakeWin > 1) {
      errors.push("fake_win probability must be between 0.0 and 1.0");
    }
    if (this.fakeLose < 0 || this.fakeLose > 1) {
      errors.push("fake_lose probability must be between 0.0 and 1.0");
    }
    if (errors.length > 0) throw new ConfigError(errors);
  }
};
var Probability = class {
  normal;
  intoRush;
  rush;
  rushContinue;
  rushContinueFn;
  constructor(normal, intoRush, rush, rushContinue, rushContinueFn) {
    this.normal = normal;
    this.intoRush = intoRush;
    this.rush = rush;
    this.rushContinue = rushContinue;
    this.rushContinueFn = rushContinueFn;
  }
  validate() {
    const errors = [];
    try {
      this.normal.validate();
    } catch (e) {
      if (e instanceof ConfigError) {
        errors.push(...e.errors);
      }
    }
    try {
      this.intoRush.validate();
    } catch (e) {
      if (e instanceof ConfigError) {
        errors.push(...e.errors);
      }
    }
    try {
      this.rush.validate();
    } catch (e) {
      if (e instanceof ConfigError) {
        errors.push(...e.errors);
      }
    }
    try {
      this.rushContinue.validate();
    } catch (e) {
      if (e instanceof ConfigError) {
        errors.push(...e.errors);
      }
    }
    if (errors.length > 0) throw new ConfigError(errors);
  }
};
var Config = class {
  balls;
  probability;
  constructor(balls, probability) {
    this.balls = balls;
    this.probability = probability;
  }
  validate() {
    const errors = [];
    try {
      this.balls.validate();
    } catch (e) {
      if (e instanceof ConfigError) {
        errors.push(...e.errors);
      }
    }
    try {
      this.probability.validate();
    } catch (e) {
      if (e instanceof ConfigError) {
        errors.push(...e.errors);
      }
    }
    if (errors.length > 0) throw new ConfigError(errors);
  }
};
var UninitializedError = class extends Error {
  constructor() {
    super("UninitializedError");
    this.name = "UninitializedError";
  }
};
var AlreadyStartedError = class extends Error {
  constructor() {
    super("AlreadyStartedError");
    this.name = "AlreadyStartedError";
  }
};
var GameState = class _GameState {
  static Uninitialized() {
    return {
      type: "Uninitialized"
    };
  }
  static Normal(balls) {
    return {
      type: "Normal",
      balls
    };
  }
  static Rush(balls, rushBalls, n) {
    return {
      type: "Rush",
      balls,
      rushBalls,
      n
    };
  }
  static isUninitialized(state) {
    return state.type === "Uninitialized";
  }
  static isRush(state) {
    return state.type === "Rush";
  }
  static launchBall(state) {
    switch (state.type) {
      case "Uninitialized": {
        throw new UninitializedError();
      }
      case "Normal": {
        const newBalls = state.balls - 1;
        return newBalls === 0 ? _GameState.Uninitialized() : _GameState.Normal(newBalls);
      }
      case "Rush": {
        const newRushBalls = state.rushBalls - 1;
        return newRushBalls === 0 ? _GameState.Normal(state.balls) : _GameState.Rush(state.balls, newRushBalls, state.n);
      }
      default: {
        const _exhaustiveCheck = state;
        throw new Error(`Unknown state type: ${String(_exhaustiveCheck.type)}`);
      }
    }
  }
  static init(state, config) {
    if (_GameState.isUninitialized(state)) {
      return _GameState.Normal(config.initBalls);
    } else {
      throw new AlreadyStartedError();
    }
  }
  static incrementBalls(state, config) {
    switch (state.type) {
      case "Uninitialized": {
        throw new Error("Cannot increment balls in uninitialized state");
      }
      case "Normal": {
        return _GameState.Normal(state.balls + config.incrementalBalls);
      }
      case "Rush": {
        return _GameState.Rush(state.balls + config.incrementalBalls, state.rushBalls, state.n);
      }
      default: {
        const _exhaustiveCheck = state;
        throw new Error(`Unknown state type: ${String(_exhaustiveCheck.type)}`);
      }
    }
  }
  static triggerRush(state, config) {
    switch (state.type) {
      case "Uninitialized": {
        throw new Error("Cannot trigger rush in uninitialized state");
      }
      case "Normal": {
        return _GameState.Rush(state.balls + config.incrementalBalls, config.incrementalRush, 1);
      }
      case "Rush": {
        return _GameState.Rush(state.balls + config.incrementalBalls, state.rushBalls + config.incrementalRush, state.n + 1);
      }
      default: {
        const _exhaustiveCheck = state;
        throw new Error(`Unknown state type: ${String(_exhaustiveCheck.type)}`);
      }
    }
  }
};
var Transition = class {
  before;
  after;
  constructor(before, after) {
    this.before = before;
    this.after = after;
  }
};
var Win = /* @__PURE__ */ function(Win2) {
  Win2["Default"] = "Default";
  Win2["FakeWin"] = "FakeWin";
  return Win2;
}({});
var Lose = /* @__PURE__ */ function(Lose2) {
  Lose2["Default"] = "Default";
  Lose2["FakeLose"] = "FakeLose";
  return Lose2;
}({});
var LotteryResult = class {
  static Win(winType) {
    return {
      type: "Win",
      winType
    };
  }
  static Lose(loseType) {
    return {
      type: "Lose",
      loseType
    };
  }
  static isWin(result) {
    return result.type === "Win";
  }
};
var ProbabilityError = class extends Error {
  constructor() {
    super("Invalid probability value\nIf it causes in `lottery_rush_continue` function, `Config.probability.rush_continue_fn` may return a value outside the range [0.0, 1.0]");
    this.name = "ProbabilityError";
  }
};
var Lottery = class {
  probability;
  constructor(probability) {
    this.probability = probability;
  }
  lottery(slotProbability) {
    const { win, fakeWin, fakeLose } = slotProbability;
    if (Math.random() < win) {
      return Math.random() < fakeWin ? LotteryResult.Win(Win.FakeWin) : LotteryResult.Win(Win.Default);
    } else {
      return Math.random() < fakeLose ? LotteryResult.Lose(Lose.FakeLose) : LotteryResult.Lose(Lose.Default);
    }
  }
  lotteryNormal() {
    return this.lottery(this.probability.normal);
  }
  lotteryIntoRush() {
    return this.lottery(this.probability.intoRush);
  }
  lotteryRush() {
    return this.lottery(this.probability.rush);
  }
  lotteryRushContinue(n) {
    const probabilityValues = {
      ...this.probability.rushContinue
    };
    const adjustedWin = probabilityValues.win * this.probability.rushContinueFn(n);
    if (adjustedWin > 1) {
      throw new ProbabilityError();
    }
    const adjustedProbability = new SlotProbability(adjustedWin, probabilityValues.fakeWin, probabilityValues.fakeLose);
    return this.lottery(adjustedProbability);
  }
};
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [
      array[j],
      array[i]
    ];
  }
}
var SlotProducer = class {
  length;
  choices;
  constructor(length, choices) {
    this.length = length;
    this.choices = choices;
    if (choices.length < 2) {
      throw new Error("Choices must have at least two elements");
    }
  }
  produceWin() {
    const choice = this.choices[Math.floor(Math.random() * this.choices.length)];
    return Array(this.length).fill(choice);
  }
  produceLose() {
    const refChoices = [
      ...this.choices
    ];
    shuffleArray(refChoices);
    const partition = Math.floor(Math.random() * (refChoices.length - 1)) + 1;
    const choices1 = refChoices.slice(0, partition);
    const choices2 = refChoices.slice(partition);
    const cnt1 = Math.floor(Math.random() * (this.length - 1)) + 1;
    const cnt2 = this.length - cnt1;
    const result1 = [];
    for (let i = 0; i < cnt1; i++) {
      result1.push(choices1[Math.floor(Math.random() * choices1.length)]);
    }
    const result2 = [];
    for (let i = 0; i < cnt2; i++) {
      result2.push(choices2[Math.floor(Math.random() * choices2.length)]);
    }
    const result = [
      ...result1,
      ...result2
    ];
    shuffleArray(result);
    return result;
  }
  produceFakeLose() {
    const choices = [
      ...this.choices
    ];
    const choiceIndex = Math.floor(Math.random() * choices.length);
    let shifted = (choiceIndex + (Math.random() < 0.5 ? -1 : 1) + choices.length) % choices.length;
    if (shifted === choiceIndex) {
      shifted = (shifted + 1) % choices.length;
    }
    console.log(`Choice index: ${choiceIndex}, Shifted index: ${shifted}`);
    const result = [
      choices[choiceIndex],
      choices[shifted],
      choices[choiceIndex]
    ];
    console.log(`Fake lose result: ${result}`);
    return result;
  }
  produce(lotteryResult) {
    switch (lotteryResult.type) {
      case "Win": {
        switch (lotteryResult.winType) {
          case Win.Default: {
            return [
              this.produceWin(),
              null
            ];
          }
          case Win.FakeWin: {
            return [
              this.produceFakeLose(),
              this.produceWin()
            ];
          }
          default: {
            const _exhaustiveCheck = lotteryResult.winType;
            throw new Error(`Unknown win type: ${_exhaustiveCheck}`);
          }
        }
      }
      case "Lose": {
        switch (lotteryResult.loseType) {
          case Lose.Default: {
            return [
              this.produceLose(),
              null
            ];
          }
          case Lose.FakeLose: {
            return [
              this.produceFakeLose(),
              null
            ];
          }
          default: {
            const _exhaustiveCheck = lotteryResult.loseType;
            throw new Error(`Unknown lose type: ${_exhaustiveCheck}`);
          }
        }
      }
      default: {
        const _exhaustiveCheck = lotteryResult;
        throw new Error(`Unknown lottery result type: ${String(_exhaustiveCheck.type)}`);
      }
    }
  }
};
var Command = {
  FinishGame: "FinishGame",
  Control: (command) => ({
    type: "Control",
    command
  })
};
var LaunchBall = class {
  execute(game) {
    game.launchBall();
  }
};
var CauseLottery = class {
  execute(game) {
    game.causeLottery();
  }
};
var StartGame = class {
  execute(game) {
    game.start();
  }
};
var FinishGameCommandImpl = class {
  execute(game) {
    game.finish();
  }
};
var LaunchBallFlowProducer = class {
  startHoleProbability;
  constructor(startHoleProbability) {
    this.startHoleProbability = startHoleProbability;
    if (startHoleProbability < 0 || startHoleProbability > 1) {
      throw new Error("start_hole_probability must be between 0.0 and 1.0");
    }
  }
  produce() {
    return new LaunchBallFlow(Math.random() < this.startHoleProbability);
  }
};
var LaunchBallFlow = class {
  isLottery;
  constructor(isLottery) {
    this.isLottery = isLottery;
  }
  execute(game) {
    game.launchBall();
    if (this.isLottery) {
      game.causeLottery();
    }
  }
};
var UserInput = class {
};
var UserOutput = class {
};
var JsInput = class extends UserInput {
  commands = [];
  currentIndex = 0;
  addCommand(command) {
    this.commands.push(command);
  }
  waitForInput() {
    if (this.currentIndex < this.commands.length) {
      const command = this.commands[this.currentIndex];
      this.currentIndex++;
      return command;
    }
    return null;
  }
  reset() {
    this.currentIndex = 0;
    this.commands = [];
  }
};
var JsOutput = class extends UserOutput {
  defaultFn;
  finishGameFn;
  startGameFn;
  lotteryNormalFn;
  lotteryIntoRushFn;
  lotteryRushFn;
  lotteryRushContinueFn;
  constructor(defaultFn, finishGameFn, startGameFn, lotteryNormalFn, lotteryIntoRushFn, lotteryRushFn, lotteryRushContinueFn) {
    super(), this.defaultFn = defaultFn, this.finishGameFn = finishGameFn, this.startGameFn = startGameFn, this.lotteryNormalFn = lotteryNormalFn, this.lotteryIntoRushFn = lotteryIntoRushFn, this.lotteryRushFn = lotteryRushFn, this.lotteryRushContinueFn = lotteryRushContinueFn;
  }
  default(transition) {
    if (this.defaultFn) {
      this.defaultFn(transition);
    }
  }
  finishGame(state) {
    if (this.finishGameFn) {
      this.finishGameFn(state);
    }
  }
  startGame(state) {
    if (this.startGameFn) {
      this.startGameFn(state);
    }
  }
  lotteryNormal(result, slot) {
    if (this.lotteryNormalFn) {
      this.lotteryNormalFn(result, slot);
    }
  }
  lotteryIntoRush(result, slot) {
    if (this.lotteryIntoRushFn) {
      this.lotteryIntoRushFn(result, slot);
    }
  }
  lotteryRush(result, slot) {
    if (this.lotteryRushFn) {
      this.lotteryRushFn(result, slot);
    }
  }
  lotteryRushContinue(result, slot) {
    if (this.lotteryRushContinueFn) {
      this.lotteryRushContinueFn(result, slot);
    }
  }
};
var Game = class {
  input;
  output;
  beforeState;
  state;
  lottery;
  config;
  slotProducer;
  isSlotSpinning;
  constructor(config, input, output) {
    this.input = input;
    this.output = output;
    this.beforeState = null;
    this.state = GameState.Uninitialized();
    this.slotProducer = new SlotProducer(3, [
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8
    ]);
    this.isSlotSpinning = false;
    config.validate();
    this.lottery = new Lottery(config.probability);
    this.config = config.balls;
  }
  runStep() {
    const command = this.input.waitForInput();
    return this.runStepWithCommand(command);
  }
  runStepWithCommand(command) {
    this.beforeState = {
      ...this.state
    };
    if (!command) {
      return "continue";
    }
    let controlCommand;
    if (typeof command === "object" && command.type === "Control") {
      controlCommand = command.command;
    } else if (typeof command === "string") {
      switch (command) {
        case "LaunchBall":
          controlCommand = new LaunchBall();
          break;
        case "CauseLottery":
          controlCommand = new CauseLottery();
          break;
        case "StartGame":
          controlCommand = new StartGame();
          break;
        case "FinishGame":
          controlCommand = new FinishGameCommandImpl();
          break;
        default:
          throw new Error(`Unknown command: ${command}`);
      }
    } else {
      controlCommand = command;
    }
    controlCommand.execute(this);
    this.output.default(new Transition(this.beforeState, this.state));
    return "continue";
  }
  run() {
    while (true) {
      if (this.runStep() === "break") {
        break;
      }
    }
  }
  start() {
    this.state = GameState.init(this.state, this.config);
    this.output.startGame(this.state);
  }
  finish() {
    if (GameState.isUninitialized(this.state)) {
      throw new UninitializedError();
    }
    this.output.finishGame(this.state);
    this.state = GameState.Uninitialized();
  }
  launchBall() {
    if (this.isSlotSpinning) {
      console.log("Attempted to launch ball while slot is spinning - blocking action");
      throw new Error("Cannot launch ball while slot is spinning");
    }
    this.state = GameState.launchBall(this.state);
  }
  causeLottery() {
    console.log("Starting slot spin - setting isSlotSpinning to true");
    this.setSlotSpinning(true);
    let result;
    if (GameState.isRush(this.state)) {
      result = this.lottery.lotteryRush();
      const slotResult = this.slotProducer.produce(result);
      this.output.lotteryRush(result, slotResult);
    } else {
      result = this.lottery.lotteryNormal();
      const slotResult = this.slotProducer.produce(result);
      this.output.lotteryNormal(result, slotResult);
    }
    if (!LotteryResult.isWin(result)) {
      return;
    }
    if (this.state.type !== "Rush") {
      const intoRushResult = this.lottery.lotteryIntoRush();
      const slotResult = this.slotProducer.produce(intoRushResult);
      this.output.lotteryIntoRush(intoRushResult, slotResult);
      if (LotteryResult.isWin(intoRushResult)) {
        this.state = GameState.triggerRush(this.state, this.config);
      } else {
        this.state = GameState.incrementBalls(this.state, this.config);
      }
      return;
    }
    try {
      const continueResult = this.lottery.lotteryRushContinue(this.state.n);
      const slotResult = this.slotProducer.produce(continueResult);
      this.output.lotteryRushContinue(continueResult, slotResult);
      if (LotteryResult.isWin(continueResult)) {
        this.state = GameState.triggerRush(this.state, this.config);
      } else {
        this.state = GameState.incrementBalls(this.state, this.config);
      }
    } catch (error) {
      if (error instanceof Error) {
        console.warn("Warn:", error.message);
      }
    }
  }
  getState() {
    return this.state;
  }
  getOutput() {
    return this.output;
  }
  isGameStarted() {
    return !GameState.isUninitialized(this.state);
  }
  setSlotSpinning(spinning) {
    const previousState = this.isSlotSpinning;
    this.isSlotSpinning = spinning;
    console.log(`Slot spinning state changed: ${previousState} -> ${spinning}`);
  }
  isSlotCurrentlySpinning() {
    console.log(`Checking slot spinning state: ${this.isSlotSpinning}`);
    return this.isSlotSpinning;
  }
  // WASM compatibility alias
  run_step_with_command(command) {
    return this.runStepWithCommand(command);
  }
};
var WasmGame = class {
  game;
  constructor(input, output, config) {
    this.game = new Game(config, input, output);
  }
  run_step_with_command(command) {
    return this.game.run_step_with_command(command);
  }
  runStep() {
    return this.game.runStep();
  }
  run() {
    return this.game.run();
  }
  start() {
    return this.game.start();
  }
  finish() {
    return this.game.finish();
  }
  launchBall() {
    return this.game.launchBall();
  }
  causeLottery() {
    return this.game.causeLottery();
  }
  getState() {
    return this.game.getState();
  }
  getOutput() {
    return this.game.getOutput();
  }
  isGameStarted() {
    return this.game.isGameStarted();
  }
  setSlotSpinning(spinning) {
    this.game.setSlotSpinning(spinning);
  }
  isSlotCurrentlySpinning() {
    return this.game.isSlotCurrentlySpinning();
  }
};
var ControlFlow = class _ControlFlow {
  static Continue = "continue";
  static Break = "break";
  static continue() {
    return _ControlFlow.Continue;
  }
  static break() {
    return _ControlFlow.Break;
  }
};
function init() {
  return Promise.resolve();
}
var START_HOLE_PROBABILITY_EXAMPLE = 0.12;
var CONFIG_EXAMPLE = new Config(new BallsConfig(1e3, 15, 300), new Probability(new SlotProbability(0.16, 0.3, 0.15), new SlotProbability(0.48, 0.2, 0.05), new SlotProbability(0.48, 0.2, 0.05), new SlotProbability(0.8, 0.25, 0.1), (n) => Math.pow(0.6, n - 1)));
var CLIInput = class extends UserInput {
  launchBallFlowProducer;
  commands = [];
  currentIndex = 0;
  constructor(startHoleProbability) {
    super();
    this.launchBallFlowProducer = new LaunchBallFlowProducer(startHoleProbability);
  }
  // For demo purposes, simulate input commands
  addCommands(commands) {
    this.commands = commands;
    this.currentIndex = 0;
  }
  waitForInput() {
    if (this.currentIndex >= this.commands.length) {
      return Command.FinishGame;
    }
    const cmd = this.commands[this.currentIndex++];
    switch (cmd) {
      case "s":
        return Command.Control(new StartGame());
      case "l":
      case "":
        return Command.Control(this.launchBallFlowProducer.produce());
      case "q":
        return Command.Control(new FinishGameCommandImpl());
      case "q!":
        return Command.FinishGame;
      default:
        return this.waitForInput();
    }
  }
};
var CLIOutput = class extends UserOutput {
  logs = [];
  log(message) {
    this.logs.push(message);
    console.log(message);
  }
  default(transition) {
    const { before, after } = transition;
    if (after.type === "Uninitialized" && before === null) {
      this.log("Welcome to Pachislo!");
      this.log("");
      return;
    }
    if (after.type === "Normal" && before && before.type === "Rush") {
      this.log(`RUSH finished!, Number of RUSH times: ${before.n}`);
    }
    this.log(`Current state: ${JSON.stringify(after)}`);
    this.log("");
  }
  finishGame(state) {
    this.log("Game finished!");
    this.log(`Final state: ${JSON.stringify(state)}`);
  }
  startGame(state) {
    this.log("Game started!");
    this.log(`Initial state: ${JSON.stringify(state)}`);
    this.log("");
  }
  lotteryNormal(result, slot) {
    const [slotResult, but] = slot;
    this.printSlot(slotResult, but);
    this.log(`Lottery result: ${JSON.stringify(result)}`);
  }
  lotteryIntoRush(result, slot) {
    const [slotResult, but] = slot;
    this.printSlot(slotResult, but);
    this.log(`Lottery result in into rush mode: ${JSON.stringify(result)}`);
  }
  lotteryRush(result, slot) {
    const [slotResult, but] = slot;
    this.printSlot(slotResult, but);
    this.log(`Lottery result in rush mode: ${JSON.stringify(result)}`);
  }
  lotteryRushContinue(result, slot) {
    const [slotResult, but] = slot;
    this.printSlot(slotResult, but);
    this.log(`Lottery result in rush continue: ${JSON.stringify(result)}`);
  }
  printSlot(slot, but) {
    this.log(`Slot: ${JSON.stringify(slot)}`);
    if (but) {
      this.log(`But: ${JSON.stringify(but)}`);
    }
  }
  getLogs() {
    return this.logs;
  }
};
function main() {
  if (import.meta.main) {
    runDemo();
  }
}
if (import.meta.main) {
  main();
}
function runDemo() {
  console.log("=== Pachislot Game Simulator Demo ===\n");
  try {
    const input = new CLIInput(START_HOLE_PROBABILITY_EXAMPLE);
    const output = new CLIOutput();
    input.addCommands([
      "s",
      "l",
      "l",
      "l",
      "l",
      "l",
      "q"
    ]);
    const game = new Game(CONFIG_EXAMPLE, input, output);
    game.run();
    console.log("\n=== Demo completed successfully! ===");
    return {
      Game,
      GameState,
      Config,
      BallsConfig,
      Probability,
      SlotProbability,
      Lottery,
      SlotProducer,
      CLIInput,
      CLIOutput,
      CONFIG_EXAMPLE,
      START_HOLE_PROBABILITY_EXAMPLE
    };
  } catch (error) {
    console.error("Demo failed:", error);
    throw error;
  }
}
export {
  AlreadyStartedError,
  BallsConfig,
  CLIInput,
  CLIOutput,
  CONFIG_EXAMPLE,
  CauseLottery,
  Command,
  Config,
  ConfigError,
  ControlFlow,
  FinishGameCommandImpl,
  Game,
  GameState,
  JsInput,
  JsOutput,
  LaunchBall,
  LaunchBallFlow,
  LaunchBallFlowProducer,
  Lose,
  Lottery,
  LotteryResult,
  Probability,
  ProbabilityError,
  START_HOLE_PROBABILITY_EXAMPLE,
  SlotProbability,
  SlotProducer,
  StartGame,
  Transition,
  UninitializedError,
  UserInput,
  UserOutput,
  WasmGame,
  Win,
  init,
  main,
  runDemo
};
