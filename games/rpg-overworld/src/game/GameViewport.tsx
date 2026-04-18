import { type Dispatch, useEffect, useRef } from "react";
import { useWorldControls } from "../engine/input/useWorldControls";
import { renderWorldScene } from "../engine/render/mapRenderer";
import { audioManager } from "../lib/audio/audioManager";
import { getCurrentOverworldMap, getOverworldPosition, getTileChar, tileCharToType } from "../lib/game/overworld";
import type { GameAction } from "../lib/game/reducer";
import type { GameState, OverworldInteraction } from "../memory/types";

interface MovementAnimation {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  startAt: number;
  locationId: string;
}

interface GameViewportProps {
  state: GameState;
  dispatch: Dispatch<GameAction>;
  paused: boolean;
  highlightInteractionId?: string | null;
  nearbyInteraction?: OverworldInteraction;
  onTogglePause: () => void;
}

export const GameViewport = ({ state, dispatch, paused, highlightInteractionId, nearbyInteraction, onTogglePause }: GameViewportProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const movementRef = useRef<MovementAnimation | null>(null);
  const previousRef = useRef({
    locationId: state.currentLocationId,
    x: getOverworldPosition(state).x,
    y: getOverworldPosition(state).y,
  });

  const position = getOverworldPosition(state);

  useWorldControls({
    canMove: state.status === "playing",
    paused,
    modalLocked: Boolean(state.activeSceneId || state.combat || state.status === "gameover"),
    messageOpen: Boolean(state.overworld.message),
    shopOpen: Boolean(state.activeShopId),
    onMove: (direction) => dispatch({ type: "MOVE_OVERWORLD", direction }),
    onInteract: () => dispatch({ type: "INTERACT_OVERWORLD" }),
    onCloseMessage: () => dispatch({ type: "CLOSE_OVERWORLD_MESSAGE" }),
    onCloseShop: () => dispatch({ type: "SET_ACTIVE_SHOP", shopId: null }),
    onTogglePause,
  });

  useEffect(() => {
    const previous = previousRef.current;
    const next = getOverworldPosition(state);

    if (previous.locationId === state.currentLocationId && (previous.x !== next.x || previous.y !== next.y)) {
      movementRef.current = {
        fromX: previous.x,
        fromY: previous.y,
        toX: next.x,
        toY: next.y,
        startAt: performance.now(),
        locationId: state.currentLocationId,
      };

      const map = getCurrentOverworldMap(state);
      const tile = tileCharToType(getTileChar(map, next.x, next.y));
      audioManager.playSfx(tile === "wild" ? "footstep-grass" : "footstep-stone");
    } else if (previous.locationId !== state.currentLocationId) {
      movementRef.current = null;
    }

    previousRef.current = {
      locationId: state.currentLocationId,
      x: next.x,
      y: next.y,
    };
  }, [state, state.currentLocationId, position.x, position.y]);

  useEffect(() => {
    let frame = 0;

    const renderFrame = (now: number) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        frame = window.requestAnimationFrame(renderFrame);
        return;
      }

      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        frame = window.requestAnimationFrame(renderFrame);
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      const width = Math.round(rect.width * dpr);
      const height = Math.round(rect.height * dpr);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        frame = window.requestAnimationFrame(renderFrame);
        return;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, rect.width, rect.height);

      let animatedX = position.x;
      let animatedY = position.y;
      if (movementRef.current && movementRef.current.locationId === state.currentLocationId) {
        const progress = Math.min(1, (now - movementRef.current.startAt) / 120);
        animatedX = movementRef.current.fromX + (movementRef.current.toX - movementRef.current.fromX) * progress;
        animatedY = movementRef.current.fromY + (movementRef.current.toY - movementRef.current.fromY) * progress;
        if (progress >= 1) {
          movementRef.current = null;
        }
      }

      renderWorldScene(ctx, {
        state,
        widthPx: rect.width,
        heightPx: rect.height,
        now,
        playerPosition: {
          x: animatedX,
          y: animatedY,
          facing: position.facing,
        },
        highlightInteractionId,
        nearbyInteraction,
      });

      frame = window.requestAnimationFrame(renderFrame);
    };

    frame = window.requestAnimationFrame(renderFrame);
    return () => window.cancelAnimationFrame(frame);
  }, [highlightInteractionId, nearbyInteraction, position.facing, position.x, position.y, state, state.currentLocationId]);

  return (
    <canvas
      ref={canvasRef}
      className="game-canvas"
      onClick={() => {
        if (state.overworld.message) {
          dispatch({ type: "CLOSE_OVERWORLD_MESSAGE" });
          return;
        }
        if (!state.activeSceneId && !state.combat && !paused) {
          dispatch({ type: "INTERACT_OVERWORLD" });
        }
      }}
    />
  );
};
