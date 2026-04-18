import { chessModule } from "../games/chess";
import { checkersModule } from "../games/checkers";
import { connect4Module } from "../games/connect4";
import { gomokuModule } from "../games/gomoku";
import { reversiModule } from "../games/reversi";
import { ticTacToeModule } from "../games/tictactoe";
import type { GameModule, GameId } from "./types";

export const contentRegistry: Record<GameId, GameModule<any, any>> = {
  chess: chessModule,
  connect4: connect4Module,
  checkers: checkersModule,
  tictactoe: ticTacToeModule,
  reversi: reversiModule,
  gomoku: gomokuModule,
};
