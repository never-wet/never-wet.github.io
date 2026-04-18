import { useEffect, useRef } from "react";
import type { Direction } from "../../memory/types";

interface WorldControlOptions {
  canMove: boolean;
  paused: boolean;
  modalLocked: boolean;
  messageOpen: boolean;
  shopOpen: boolean;
  onMove: (direction: Direction) => void;
  onInteract: () => void;
  onCloseMessage: () => void;
  onCloseShop: () => void;
  onTogglePause: () => void;
}

const moveKeys: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  s: "down",
  a: "left",
  d: "right",
};

const interactKeys = new Set(["e", "Enter"]);

export const useWorldControls = ({
  canMove,
  paused,
  modalLocked,
  messageOpen,
  shopOpen,
  onMove,
  onInteract,
  onCloseMessage,
  onCloseShop,
  onTogglePause,
}: WorldControlOptions) => {
  const pressedOrderRef = useRef<string[]>([]);
  const lastMoveAtRef = useRef(0);

  useEffect(() => {
    const pushKey = (key: string) => {
      pressedOrderRef.current = [...pressedOrderRef.current.filter((entry) => entry !== key), key];
    };

    const releaseKey = (key: string) => {
      pressedOrderRef.current = pressedOrderRef.current.filter((entry) => entry !== key);
    };

    const getActiveDirection = (): Direction | null => {
      for (let index = pressedOrderRef.current.length - 1; index >= 0; index -= 1) {
        const key = pressedOrderRef.current[index];
        const direction = moveKeys[key];
        if (direction) {
          return direction;
        }
      }
      return null;
    };

    const tryMove = (immediate = false) => {
      if (!canMove || paused || modalLocked || messageOpen || shopOpen) {
        return;
      }
      const direction = getActiveDirection();
      if (!direction) {
        return;
      }
      const now = performance.now();
      if (immediate || now - lastMoveAtRef.current >= 140) {
        lastMoveAtRef.current = now;
        onMove(direction);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      if (moveKeys[key]) {
        event.preventDefault();
        pushKey(key);
        tryMove(true);
        return;
      }

      if (interactKeys.has(key)) {
        event.preventDefault();
        if (messageOpen) {
          onCloseMessage();
          return;
        }
        if (!paused && !modalLocked && !shopOpen) {
          onInteract();
        }
        return;
      }

      if (key === "Escape") {
        event.preventDefault();
        if (messageOpen) {
          onCloseMessage();
          return;
        }
        if (shopOpen) {
          onCloseShop();
          return;
        }
        if (!modalLocked) {
          onTogglePause();
        }
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      if (moveKeys[key]) {
        releaseKey(key);
      }
    };

    const onBlur = () => {
      pressedOrderRef.current = [];
    };

    let frame = 0;
    const tick = () => {
      tryMove(false);
      frame = window.requestAnimationFrame(tick);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    frame = window.requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      window.cancelAnimationFrame(frame);
    };
  }, [canMove, paused, modalLocked, messageOpen, shopOpen, onMove, onInteract, onCloseMessage, onCloseShop, onTogglePause]);
};
