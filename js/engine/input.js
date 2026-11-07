/**
 * Unified Client Input Manager (W, A, S, D, J, K, L)
 */
window.SF = window.SF || {};

class InputManager {
  constructor() {
    this.keysDown = new Set();
    this.keysPressed = new Set();
    this.keysReleased = new Set();

    this.initListeners();
  }

  initListeners() {
    window.addEventListener('keydown', (e) => {
      // Prevent browser default on game keys
      const gameKeys = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyJ', 'KeyK', 'KeyL', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
      if (gameKeys.includes(e.code)) {
        e.preventDefault();
      }

      if (!this.keysDown.has(e.code)) {
        this.keysPressed.add(e.code);
      }
      this.keysDown.add(e.code);
    });

    window.addEventListener('keyup', (e) => {
      this.keysDown.delete(e.code);
      this.keysReleased.add(e.code);
    });

    window.addEventListener('blur', () => {
      this.keysDown.clear();
      this.keysPressed.clear();
      this.keysReleased.clear();
    });
  }

  flush() {
    this.keysPressed.clear();
    this.keysReleased.clear();
  }

  isDown(action) {
    const keyMap = SF.CONSTANTS.KEYS[action];
    if (!keyMap) return false;
    return keyMap.some(code => this.keysDown.has(code));
  }

  isPressed(action) {
    const keyMap = SF.CONSTANTS.KEYS[action];
    if (!keyMap) return false;
    return keyMap.some(code => this.keysPressed.has(code));
  }
}

SF.Input = new InputManager();
