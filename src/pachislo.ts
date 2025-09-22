// Pachislot Game Simulator - TypeScript Implementation

// ============================================================================
// CONFIG MODULE
// ============================================================================

export class ConfigError extends Error {
  public readonly errors: string[];

  constructor(errors: string[] = []) {
    super(`ConfigError: ${errors.join("\n")}`);
    this.name = "ConfigError";
    this.errors = errors;
  }
}

export class BallsConfig {
  constructor(
    public readonly initBalls: number,
    public readonly incrementalBalls: number,
    public readonly incrementalRush: number,
  ) {}

  validate(): void {
    const errors: string[] = [];
    if (this.initBalls < 1) {
      errors.push("initial balls must be greater than 0");
    }
    if (errors.length > 0) throw new ConfigError(errors);
  }
}

export class SlotProbability {
  constructor(
    public readonly win: number,
    public readonly fakeWin: number,
    public readonly fakeLose: number,
  ) {}

  validate(): void {
    const errors: string[] = [];
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
}

export type RushContinueFunction = (n: number) => number;

export class Probability {
  constructor(
    public readonly normal: SlotProbability,
    public readonly rush: SlotProbability,
    public readonly rushContinue: SlotProbability,
    public readonly rushContinueFn: RushContinueFunction,
  ) {}

  validate(): void {
    const errors: string[] = [];
    try {
      this.normal.validate();
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
}

export class Config {
  constructor(
    public readonly balls: BallsConfig,
    public readonly probability: Probability,
  ) {}

  validate(): void {
    const errors: string[] = [];
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
}

// ============================================================================
// GAME STATE MODULE
// ============================================================================

export class UninitializedError extends Error {
  constructor() {
    super("UninitializedError");
    this.name = "UninitializedError";
  }
}

export class AlreadyStartedError extends Error {
  constructor() {
    super("AlreadyStartedError");
    this.name = "AlreadyStartedError";
  }
}

export interface UninitializedState {
  type: "Uninitialized";
}

export interface NormalState {
  type: "Normal";
  balls: number;
}

export interface RushState {
  type: "Rush";
  balls: number;
  rushBalls: number;
  n: number;
}

export type GameStateType = UninitializedState | NormalState | RushState;

export class GameState {
  static Uninitialized(): UninitializedState {
    return { type: "Uninitialized" };
  }

  static Normal(balls: number): NormalState {
    return { type: "Normal", balls };
  }

  static Rush(balls: number, rushBalls: number, n: number): RushState {
    return { type: "Rush", balls, rushBalls, n };
  }

  static isUninitialized(state: GameStateType): state is UninitializedState {
    return state.type === "Uninitialized";
  }

  static isRush(state: GameStateType): state is RushState {
    return state.type === "Rush";
  }

  static launchBall(state: GameStateType): GameStateType {
    switch (state.type) {
      case "Uninitialized": {
        throw new UninitializedError();
      }

      case "Normal": {
        const newBalls = state.balls - 1;
        return newBalls === 0
          ? GameState.Uninitialized()
          : GameState.Normal(newBalls);
      }

      case "Rush": {
        const newRushBalls = state.rushBalls - 1;
        return newRushBalls === 0
          ? GameState.Normal(state.balls)
          : GameState.Rush(state.balls, newRushBalls, state.n);
      }

      default: {
        const _exhaustiveCheck: never = state;
        throw new Error(
          `Unknown state type: ${
            String((_exhaustiveCheck as Record<string, unknown>).type)
          }`,
        );
      }
    }
  }

  static init(state: GameStateType, config: BallsConfig): GameStateType {
    if (GameState.isUninitialized(state)) {
      return GameState.Normal(config.initBalls);
    } else {
      throw new AlreadyStartedError();
    }
  }

  static incrementBalls(
    state: GameStateType,
    config: BallsConfig,
  ): GameStateType {
    switch (state.type) {
      case "Uninitialized": {
        throw new Error("Cannot increment balls in uninitialized state");
      }

      case "Normal": {
        return GameState.Normal(state.balls + config.incrementalBalls);
      }

      case "Rush": {
        return GameState.Rush(
          state.balls + config.incrementalBalls,
          state.rushBalls,
          state.n,
        );
      }

      default: {
        const _exhaustiveCheck: never = state;
        throw new Error(
          `Unknown state type: ${
            String((_exhaustiveCheck as Record<string, unknown>).type)
          }`,
        );
      }
    }
  }

  static triggerRush(state: GameStateType, config: BallsConfig): GameStateType {
    switch (state.type) {
      case "Uninitialized": {
        throw new Error("Cannot trigger rush in uninitialized state");
      }

      case "Normal": {
        return GameState.Rush(
          state.balls + config.incrementalBalls,
          config.incrementalRush,
          1,
        );
      }

      case "Rush": {
        return GameState.Rush(
          state.balls + config.incrementalBalls,
          state.rushBalls + config.incrementalRush,
          state.n + 1,
        );
      }

      default: {
        const _exhaustiveCheck: never = state;
        throw new Error(
          `Unknown state type: ${
            String((_exhaustiveCheck as Record<string, unknown>).type)
          }`,
        );
      }
    }
  }
}

export class Transition {
  constructor(
    public readonly before: GameStateType | null,
    public readonly after: GameStateType,
  ) {}
}

// ============================================================================
// LOTTERY MODULE
// ============================================================================

export enum Win {
  Default = "Default",
  FakeWin = "FakeWin",
}

export enum Lose {
  Default = "Default",
  FakeLose = "FakeLose",
}

export interface WinResult {
  type: "Win";
  winType: Win;
}

export interface LoseResult {
  type: "Lose";
  loseType: Lose;
}

export type LotteryResultType = WinResult | LoseResult;

export class LotteryResult {
  static Win(winType: Win): WinResult {
    return { type: "Win", winType };
  }

  static Lose(loseType: Lose): LoseResult {
    return { type: "Lose", loseType };
  }

  static isWin(result: LotteryResultType): result is WinResult {
    return result.type === "Win";
  }
}

export class ProbabilityError extends Error {
  constructor() {
    super(
      "Invalid probability value\nIf it causes in `lottery_rush_continue` function, `Config.probability.rush_continue_fn` may return a value outside the range [0.0, 1.0]",
    );
    this.name = "ProbabilityError";
  }
}

export class Lottery {
  constructor(private readonly probability: Probability) {}

  private lottery(slotProbability: SlotProbability): LotteryResultType {
    const { win, fakeWin, fakeLose } = slotProbability;

    if (Math.random() < win) {
      return Math.random() < fakeWin
        ? LotteryResult.Win(Win.FakeWin)
        : LotteryResult.Win(Win.Default);
    } else {
      return Math.random() < fakeLose
        ? LotteryResult.Lose(Lose.FakeLose)
        : LotteryResult.Lose(Lose.Default);
    }
  }

  lotteryNormal(): LotteryResultType {
    return this.lottery(this.probability.normal);
  }

  lotteryRush(): LotteryResultType {
    return this.lottery(this.probability.rush);
  }

  lotteryRushContinue(n: number): LotteryResultType {
    const probabilityValues = { ...this.probability.rushContinue };
    const adjustedWin = probabilityValues.win *
      this.probability.rushContinueFn(n);

    if (adjustedWin > 1.0) {
      throw new ProbabilityError();
    }

    const adjustedProbability = new SlotProbability(
      adjustedWin,
      probabilityValues.fakeWin,
      probabilityValues.fakeLose,
    );

    return this.lottery(adjustedProbability);
  }
}

// ============================================================================
// SLOT MODULE
// ============================================================================

function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

export type SlotSymbol = number;
export type SlotResult = SlotSymbol[];
export type SlotOutput = [SlotResult, SlotResult | null];

export class SlotProducer {
  constructor(
    private readonly length: number,
    private readonly choices: SlotSymbol[],
  ) {
    if (choices.length < 2) {
      throw new Error("Choices must have at least two elements");
    }
  }

  private produceWin(): SlotResult {
    const choice =
      this.choices[Math.floor(Math.random() * this.choices.length)];
    return Array(this.length).fill(choice);
  }

  private produceLose(): SlotResult {
    // Shuffle choices
    const refChoices = [...this.choices];
    shuffleArray(refChoices);

    // Partition into two non-empty groups
    const partition = Math.floor(Math.random() * (refChoices.length - 1)) + 1;
    const choices1 = refChoices.slice(0, partition);
    const choices2 = refChoices.slice(partition);

    // Distribute length between the two groups
    const cnt1 = Math.floor(Math.random() * (this.length - 1)) + 1;
    const cnt2 = this.length - cnt1;

    const result1: SlotSymbol[] = [];
    for (let i = 0; i < cnt1; i++) {
      result1.push(choices1[Math.floor(Math.random() * choices1.length)]);
    }

    const result2: SlotSymbol[] = [];
    for (let i = 0; i < cnt2; i++) {
      result2.push(choices2[Math.floor(Math.random() * choices2.length)]);
    }

    // Combine and shuffle
    const result = [...result1, ...result2];
    shuffleArray(result);
    return result;
  }

  private produceFakeLose(): SlotResult {
    const choices = [...this.choices];
    const choiceIndex = Math.floor(Math.random() * choices.length);
    const shifted =
      (choiceIndex + (Math.random() < 0.5 ? -1 : 1) + choices.length) %
      choices.length;

    console.log(`Choice index: ${choiceIndex}, Shifted index: ${shifted}`);

    const result = [
      choices[choiceIndex],
      choices[shifted],
      choices[choiceIndex],
    ];

    console.log(`Fake lose result: ${result}`);

    return result;
  }

  produce(lotteryResult: LotteryResultType): SlotOutput {
    switch (lotteryResult.type) {
      case "Win": {
        switch (lotteryResult.winType) {
          case Win.Default: {
            return [this.produceWin(), null];
          }
          case Win.FakeWin: {
            return [this.produceFakeLose(), this.produceWin()];
          }
          default: {
            const _exhaustiveCheck: never = lotteryResult.winType;
            throw new Error(`Unknown win type: ${_exhaustiveCheck}`);
          }
        }
      }

      case "Lose": {
        switch (lotteryResult.loseType) {
          case Lose.Default: {
            return [this.produceLose(), null];
          }
          case Lose.FakeLose: {
            return [this.produceFakeLose(), null];
          }
          default: {
            const _exhaustiveCheck: never = lotteryResult.loseType;
            throw new Error(`Unknown lose type: ${_exhaustiveCheck}`);
          }
        }
      }

      default: {
        const _exhaustiveCheck: never = lotteryResult;
        throw new Error(
          `Unknown lottery result type: ${
            String((_exhaustiveCheck as Record<string, unknown>).type)
          }`,
        );
      }
    }
  }
}

// ============================================================================
// COMMAND MODULE
// ============================================================================

export interface ControlCommand {
  type: "Control";
  command: GameCommand;
}

export interface FinishGameCommand {
  type: "FinishGame";
}

export type CommandType = ControlCommand | FinishGameCommand | string;

export const Command = {
  FinishGame: "FinishGame" as const,
  Control: (command: GameCommand): ControlCommand => ({
    type: "Control",
    command,
  }),
};

export interface GameCommand {
  execute(game: Game): void;
}

export class LaunchBall implements GameCommand {
  execute(game: Game): void {
    game.launchBall();
  }
}

export class CauseLottery implements GameCommand {
  execute(game: Game): void {
    game.causeLottery();
  }
}

export class StartGame implements GameCommand {
  execute(game: Game): void {
    game.start();
  }
}

export class FinishGameCommandImpl implements GameCommand {
  execute(game: Game): void {
    game.finish();
  }
}

export class LaunchBallFlowProducer {
  constructor(private readonly startHoleProbability: number) {
    if (startHoleProbability < 0 || startHoleProbability > 1) {
      throw new Error("start_hole_probability must be between 0.0 and 1.0");
    }
  }

  produce(): LaunchBallFlow {
    return new LaunchBallFlow(Math.random() < this.startHoleProbability);
  }
}

export class LaunchBallFlow implements GameCommand {
  constructor(private readonly isLottery: boolean) {}

  execute(game: Game): void {
    game.launchBall();
    if (this.isLottery) {
      game.causeLottery();
    }
  }
}

// ============================================================================
// INTERFACE MODULE
// ============================================================================

export abstract class UserInput {
  abstract waitForInput(): CommandType | null;
}

export abstract class UserOutput {
  abstract default(transition: Transition): void;
  abstract finishGame(state: GameStateType): void;
  abstract startGame(state: GameStateType): void;
  abstract lotteryNormal(result: LotteryResultType, slot: SlotOutput): void;
  abstract lotteryRush(result: LotteryResultType, slot: SlotOutput): void;
  abstract lotteryRushContinue(
    result: LotteryResultType,
    slot: SlotOutput,
  ): void;
}

// JsInput and JsOutput classes for WASM compatibility
export class JsInput extends UserInput {
  private commands: CommandType[] = [];
  private currentIndex = 0;

  addCommand(command: CommandType): void {
    this.commands.push(command);
  }

  waitForInput(): CommandType | null {
    if (this.currentIndex < this.commands.length) {
      const command = this.commands[this.currentIndex];
      this.currentIndex++;
      return command;
    }
    return null;
  }

  reset(): void {
    this.currentIndex = 0;
    this.commands = [];
  }
}

export type LogFunction = (message: string) => void;
export type DefaultFunction = (transition: Transition) => void;
export type FinishGameFunction = (state: GameStateType) => void;
export type StartGameFunction = (state: GameStateType) => void;
export type LotteryFunction = (
  result: LotteryResultType,
  slot: SlotOutput,
) => void;

export class JsOutput extends UserOutput {
  constructor(
    private readonly defaultFn: DefaultFunction | null,
    private readonly finishGameFn: FinishGameFunction | null,
    private readonly startGameFn: StartGameFunction | null,
    private readonly lotteryNormalFn: LotteryFunction | null,
    private readonly lotteryRushFn: LotteryFunction | null,
    private readonly lotteryRushContinueFn: LotteryFunction | null,
  ) {
    super();
  }

  default(transition: Transition): void {
    if (this.defaultFn) {
      this.defaultFn(transition);
    }
  }

  finishGame(state: GameStateType): void {
    if (this.finishGameFn) {
      this.finishGameFn(state);
    }
  }

  startGame(state: GameStateType): void {
    if (this.startGameFn) {
      this.startGameFn(state);
    }
  }

  lotteryNormal(result: LotteryResultType, slot: SlotOutput): void {
    if (this.lotteryNormalFn) {
      this.lotteryNormalFn(result, slot);
    }
  }

  lotteryRush(result: LotteryResultType, slot: SlotOutput): void {
    if (this.lotteryRushFn) {
      this.lotteryRushFn(result, slot);
    }
  }

  lotteryRushContinue(result: LotteryResultType, slot: SlotOutput): void {
    if (this.lotteryRushContinueFn) {
      this.lotteryRushContinueFn(result, slot);
    }
  }
}

// ============================================================================
// GAME MODULE
// ============================================================================

export type StepResult = "continue" | "break";

export class Game {
  private beforeState: GameStateType | null = null;
  private state: GameStateType = GameState.Uninitialized();
  private readonly lottery: Lottery;
  private readonly config: BallsConfig;
  private readonly slotProducer = new SlotProducer(
    3,
    [1, 2, 3, 4, 5, 6, 7, 8, 9],
  );
  private isSlotSpinning = false;

  constructor(
    config: Config,
    private readonly input: UserInput,
    private readonly output: UserOutput,
  ) {
    config.validate();
    this.lottery = new Lottery(config.probability);
    this.config = config.balls;
  }

  runStep(): StepResult {
    const command = this.input.waitForInput();
    return this.runStepWithCommand(command);
  }

  runStepWithCommand(command: CommandType | null): StepResult {
    this.beforeState = { ...this.state };

    if (
      command === Command.FinishGame ||
      (command &&
        typeof command === "object" &&
        command.type === "FinishGame") ||
      command === "FinishGame"
    ) {
      return "break";
    }

    if (!command) {
      return "continue";
    }

    let controlCommand: GameCommand;
    if (typeof command === "object" && command.type === "Control") {
      controlCommand = command.command;
    } else if (typeof command === "string") {
      // Handle string commands
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
      controlCommand = command as GameCommand;
    }

    controlCommand.execute(this);

    this.output.default(new Transition(this.beforeState, this.state));

    return "continue";
  }

  run(): void {
    while (true) {
      if (this.runStep() === "break") {
        break;
      }
    }
  }

  start(): void {
    this.state = GameState.init(this.state, this.config);
    this.output.startGame(this.state);
  }

  finish(): void {
    if (GameState.isUninitialized(this.state)) {
      throw new UninitializedError();
    }

    this.output.finishGame(this.state);
    this.state = GameState.Uninitialized();
  }

  launchBall(): void {
    // ゲームが未初期化の場合、GameState.launchBallでUninitializedErrorがthrowされる
    // スロットが回転中の場合は球を打てない
    if (this.isSlotSpinning) {
      console.log(
        "Attempted to launch ball while slot is spinning - blocking action",
      );
      throw new Error("Cannot launch ball while slot is spinning");
    }

    this.state = GameState.launchBall(this.state);
  }

  causeLottery(): void {
    // スロット回転開始
    console.log("Starting slot spin - setting isSlotSpinning to true");
    this.setSlotSpinning(true);

    let result: LotteryResultType;
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

    // When win the lottery
    if (this.state.type !== "Rush") {
      this.state = GameState.triggerRush(this.state, this.config);
      return;
    }

    // When in rush mode
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

    // スロット回転終了（実際の回転終了はUI側で管理）
    // この時点では回転中のままにしておく
  }

  getState(): GameStateType {
    return this.state;
  }

  getOutput(): UserOutput {
    return this.output;
  }

  isGameStarted(): boolean {
    return !GameState.isUninitialized(this.state);
  }

  setSlotSpinning(spinning: boolean): void {
    const previousState = this.isSlotSpinning;
    this.isSlotSpinning = spinning;
    console.log(`Slot spinning state changed: ${previousState} -> ${spinning}`);
  }

  isSlotCurrentlySpinning(): boolean {
    console.log(`Checking slot spinning state: ${this.isSlotSpinning}`);
    return this.isSlotSpinning;
  }

  // WASM compatibility alias
  run_step_with_command(command: CommandType | null): StepResult {
    return this.runStepWithCommand(command);
  }
}

// WasmGame class for WASM compatibility
export class WasmGame {
  private readonly game: Game;

  constructor(input: UserInput, output: UserOutput, config: Config) {
    this.game = new Game(config, input, output);
  }

  run_step_with_command(command: CommandType | null): StepResult {
    return this.game.run_step_with_command(command);
  }

  runStep(): StepResult {
    return this.game.runStep();
  }

  run(): void {
    return this.game.run();
  }

  start(): void {
    return this.game.start();
  }

  finish(): void {
    return this.game.finish();
  }

  launchBall(): void {
    return this.game.launchBall();
  }

  causeLottery(): void {
    return this.game.causeLottery();
  }

  getState(): GameStateType {
    return this.game.getState();
  }

  getOutput(): UserOutput {
    return this.game.getOutput();
  }

  isGameStarted(): boolean {
    return this.game.isGameStarted();
  }

  setSlotSpinning(spinning: boolean): void {
    console.log(`Setting slot spinning state to ${spinning}`);
    if (!spinning) {
      console.trace();
    }
    this.game.setSlotSpinning(spinning);
  }

  isSlotCurrentlySpinning(): boolean {
    return this.game.isSlotCurrentlySpinning();
  }
}

// ControlFlow class for WASM compatibility
export class ControlFlow {
  static readonly Continue = "continue" as const;
  static readonly Break = "break" as const;

  static continue(): typeof ControlFlow.Continue {
    return ControlFlow.Continue;
  }

  static break(): typeof ControlFlow.Break {
    return ControlFlow.Break;
  }
}

// Dummy init function for WASM compatibility
export function init(): Promise<void> {
  // No initialization needed for JavaScript version
  return Promise.resolve();
}

// ============================================================================
// EXAMPLE CONFIGURATION
// ============================================================================

export const START_HOLE_PROBABILITY_EXAMPLE = 0.12;

export const CONFIG_EXAMPLE = new Config(
  new BallsConfig(1000, 15, 300),
  new Probability(
    new SlotProbability(0.16, 0.3, 0.15), // normal
    new SlotProbability(0.48, 0.2, 0.05), // rush
    new SlotProbability(0.8, 0.25, 0.1), // rush_continue
    (n: number) => Math.pow(0.6, n - 1), // rush_continue_fn
  ),
);

// ============================================================================
// EXAMPLE CLI IMPLEMENTATION
// ============================================================================

export class CLIInput extends UserInput {
  private readonly launchBallFlowProducer: LaunchBallFlowProducer;
  private commands: string[] = [];
  private currentIndex = 0;

  constructor(startHoleProbability: number) {
    super();
    this.launchBallFlowProducer = new LaunchBallFlowProducer(
      startHoleProbability,
    );
  }

  // For demo purposes, simulate input commands
  addCommands(commands: string[]): void {
    this.commands = commands;
    this.currentIndex = 0;
  }

  waitForInput(): CommandType {
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
        return this.waitForInput(); // Skip unknown commands
    }
  }
}

export class CLIOutput extends UserOutput {
  private readonly logs: string[] = [];

  private log(message: string): void {
    this.logs.push(message);
    console.log(message);
  }

  default(transition: Transition): void {
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

  finishGame(state: GameStateType): void {
    this.log("Game finished!");
    this.log(`Final state: ${JSON.stringify(state)}`);
  }

  startGame(state: GameStateType): void {
    this.log("Game started!");
    this.log(`Initial state: ${JSON.stringify(state)}`);
    this.log("");
  }

  lotteryNormal(result: LotteryResultType, slot: SlotOutput): void {
    const [slotResult, but] = slot;
    this.printSlot(slotResult, but);
    this.log(`Lottery result: ${JSON.stringify(result)}`);
  }

  lotteryRush(result: LotteryResultType, slot: SlotOutput): void {
    const [slotResult, but] = slot;
    this.printSlot(slotResult, but);
    this.log(`Lottery result in rush mode: ${JSON.stringify(result)}`);
  }

  lotteryRushContinue(result: LotteryResultType, slot: SlotOutput): void {
    const [slotResult, but] = slot;
    this.printSlot(slotResult, but);
    this.log(`Lottery result in rush continue: ${JSON.stringify(result)}`);
  }

  private printSlot(slot: SlotResult, but: SlotResult | null): void {
    this.log(`Slot: ${JSON.stringify(slot)}`);
    if (but) {
      this.log(`But: ${JSON.stringify(but)}`);
    }
  }

  getLogs(): string[] {
    return this.logs;
  }
}

// ============================================================================
// DENO MAIN FUNCTION
// ============================================================================

// Main function for Deno execution
export function main(): void {
  if (import.meta.main) {
    runDemo();
  }
}

// Auto-run if this is the main module
if (import.meta.main) {
  main();
}

// ============================================================================
// DEMO FUNCTION
// ============================================================================

export interface DemoExports {
  Game: typeof Game;
  GameState: typeof GameState;
  Config: typeof Config;
  BallsConfig: typeof BallsConfig;
  Probability: typeof Probability;
  SlotProbability: typeof SlotProbability;
  Lottery: typeof Lottery;
  SlotProducer: typeof SlotProducer;
  CLIInput: typeof CLIInput;
  CLIOutput: typeof CLIOutput;
  CONFIG_EXAMPLE: Config;
  START_HOLE_PROBABILITY_EXAMPLE: number;
}

export function runDemo(): DemoExports {
  console.log("=== Pachislot Game Simulator Demo ===\n");

  try {
    const input = new CLIInput(START_HOLE_PROBABILITY_EXAMPLE);
    const output = new CLIOutput();

    // Add some demo commands
    input.addCommands(["s", "l", "l", "l", "l", "l", "q"]);

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
      START_HOLE_PROBABILITY_EXAMPLE,
    };
  } catch (error) {
    console.error("Demo failed:", error);
    throw error;
  }
}
