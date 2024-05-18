class Config {
  gravity = 1500;
  GAME_SPEED = 0.1;
  DEGREE = Math.PI / 180;

  canvas = {
    canvasId: "game",
    width: 480,
    height: 720,
  };

  spritesheet = {
    width: 606,
    height: 428,
    src: "./spriteSheet.png",
  };

  background = {
    x: 0,
    y: 0,
    width: this.canvas.width,
    height: this.canvas.height,

    frames: [
      {
        x: 0,
        y: 0,
        w: 275,
        h: 228,
      },
    ],
  };

  foreground = {
    x: 0,
    y: 690,
    width: this.canvas.width,
    height: 110,
    frames: [
      {
        x: 276,
        y: 3,
        w: 222,
        h: 110,
      },
    ],
  };

  pipes = {
    x: this.canvas.width,
    y: 0,
    widthFactor: 2,
    height: 690,
    gapFactor: 5,
    frames: [
      {
        x: 502,
        y: 1,
        w: 52,
        h: 400,
      },
      {
        x: 553,
        y: 1,
        w: 52,
        h: 400,
      },
    ],
  };

  bird = {
    x: 55,
    y: 150,
    width: 34,
    height: 26,
    flapSpeed: 250,
    frames: [
      {
        x: 276,
        y: 114,
        w: 34,
        h: 26,
      },
      {
        x: 276,
        y: 140,
        w: 34,
        h: 26,
      },
      {
        x: 276,
        y: 166,
        w: 34,
        h: 26,
      },
      {
        x: 276,
        y: 140,
        w: 34,
        h: 26,
      },
    ],
  };

  startMessage = {
    x: this.canvas.width / 2 - 174 / 2,
    y: this.canvas.height / 2 - 45 / 0.5,
    width: 174,
    height: 153,
    frames: [
      {
        x: 0,
        y: 228,
        w: 174,
        h: 153,
      },
    ],
  };

  gameOverMessage = {
    x: this.canvas.width / 2 - 189 / 2,
    y: this.canvas.height / 2 - 39 / 0.5,
    width: 189,
    height: 39,
    frames: [
      {
        x: 193,
        y: 228,
        w: 189,
        h: 39,
      },
    ],
  };
}

class Entity {
  constructor({ x, y, width, height, frames, spriteSheet, drawEngine, game }) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speed = 0;
    this.falling = false;
    this._frames = frames;
    this._frameIdx = 0;
    this._spriteSheet = spriteSheet;
    this._drawEngine = drawEngine;
    this._game = game;
  }

  draw() {
    this._spriteSheet.then((sprite) => {
      this._drawEngine.drawImage({
        spriteSheet: sprite,
        image: this._frames[this._frameIdx],
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,
      });
    });
  }
  update(delta) {
    this._frameIdx = (this._frameIdx + Math.ceil(delta)) % this._frames.length;
  }
}

class Bird extends Entity {
  _rotation = 0;
  constructor(params) {
    super(params);
    this._flapSpeed = params.flapSpeed;
    this._physicsEngine = params.physicsEngine;
    this._foreground = params.foreground;
    this.falling = true;
    this._degree = params.degree;
    this._context = params.context;
  }

  update(delta) {
    super.update(delta);
    this._physicsEngine.update(this, delta);
    if (this.y < 0) {
      this.y = 0;
    }

    if (this.y + this.height >= this._foreground.y) {
      this._game.gameOver();
    }

    if (this.speed >= this._flapSpeed) {
      this._rotation = 90 * this._degree;
    } else {
      this._rotation = 0;
    }
  }

  draw() {
    this._spriteSheet.then((sprite) => {
      this._drawEngine.drawImage({
        spriteSheet: sprite,
        image: this._frames[this._frameIdx],
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,
      });
    });
  }

  flap() {
    this.speed = -this._flapSpeed;
    this._rotation = -25 * this._degree;
  }
}

class Background extends Entity {
  _index = 0;
  constructor(params) {
    super(params);
    this.speed = params.speed;
  }

  update(delta) {
    this._index += delta * 3;
    this.x = -((this._index * this.speed) % this._game.width);
  }

  draw() {
    this._spriteSheet.then((sprite) => {
      this._drawEngine.drawImage({
        spriteSheet: sprite,
        image: this._frames[this._frameIdx],
        x: this.x + this._game.width,
        y: this.y,
        width: this.width,
        height: this.height,
      });

      this._drawEngine.drawImage({
        spriteSheet: sprite,
        image: this._frames[this._frameIdx],
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,
      });
    });
  }
}

class Foreground extends Entity {
  _index = 0;
  constructor(params) {
    super(params);
    this.speed = params.speed;
  }

  update(delta) {
    this._index += delta * 3;
    this.x = -((this._index * this.speed * 2) % this._game.width);
  }

  draw() {
    this._spriteSheet.then((sprite) => {
      this._drawEngine.drawImage({
        spriteSheet: sprite,
        image: this._frames[this._frameIdx],
        x: this.x + this._game.width,
        y: this.y,
        width: this.width,
        height: this.height,
      });

      this._drawEngine.drawImage({
        spriteSheet: sprite,
        image: this._frames[this._frameIdx],
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,
      });
    });
  }
}

class Pipes extends Entity {
  _deltaX = 1;
  _maxYposition = -200;
  _position = [];
  _coordUpdateRate = 150;
  score = 0;

  constructor(params) {
    super(params);
    this._pipeGap = params.gap;
    this.bird = params.bird;
  }

  update(delta) {
    if (this._coordUpdateRate % 150 === 0) {
      this._position.push({
        x: this._game.width,
        y: this._maxYposition * (Math.random() + 1),
      });
    }
    this._coordUpdateRate += 1;
    this._deltaX = 2;
    for (let i = 0; i < this._position.length; i++) {
      this._position[i].x -= this._deltaX;
      if (this._position.length > 2) {
        this._position.shift();
        this.score += 1;
      }
      let bottomPipeY = this._position[i].y + this.height + this._pipeGap;

      if (
        this.bird.x + this.bird.width > this._position[i].x &&
        this.bird.x < this._position[i].x + this.width &&
        this.bird.y < this._position[i].y + this.height
      ) {
        this._game.gameOver();
      }

      if (
        this.bird.x + this.bird.width > this._position[i].x &&
        this.bird.x < this._position[i].x + this.width &&
        this.bird.y + this.bird.height > bottomPipeY &&
        this.bird.y < bottomPipeY + this.height
      ) {
        this._game.gameOver();
      }
    }
  }

  draw() {
    for (let i = 0; i < this._position.length; i++) {
      this._spriteSheet.then((sprite) => {
        this._drawEngine.drawImage({
          spriteSheet: sprite,
          image: this._frames[0],
          x: this._position[i].x,
          y: this._position[i].y + this.height + this._pipeGap,
          width: this.width,
          height: this.height,
        });

        this._drawEngine.drawImage({
          spriteSheet: sprite,
          image: this._frames[1],
          x: this._position[i].x,
          y: this._position[i].y,
          width: this.width,
          height: this.height,
        });
      });
    }
  }
}

class GameOverMessage extends Entity {
  constructor(params) {
    super(params);
  }
}

class StartMessage extends Entity {
  constructor(params) {
    super(params);
  }
}

class DrawEngine {
  drawImage({ spriteSheet, image, x, y, width, height }) {}
  clear() {}
}

class CanvasDrawEngine extends DrawEngine {
  constructor({ canvas }) {
    super();
    this._canvas = canvas;
    this._context = canvas.getContext("2d");
  }

  drawImage({ spriteSheet, image, x, y, width, height }) {
    super.drawImage({ spriteSheet, image, x, y, width, height });
    this._context.drawImage(
      spriteSheet,
      image.x,
      image.y,
      image.w,
      image.h,
      x,
      y,
      width,
      height
    );
  }

  clear() {
    super.clear();
    this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
  }
}

class PhysicsEngine {
  constructor({ gravity }) {
    this._gravity = gravity;
  }
  update(entity, delta) {
    if (entity.falling) {
      entity.speed += this._gravity * delta;
      entity.y += entity.speed * delta + this._gravity * delta * delta;
    }
  }
}

class InputHandler {
  eventHandlerMap = {};

  constructor(eventHandlerMap) {
    this._eventHandlerMap = eventHandlerMap;
  }

  subscribe() {
    Object.entries(this.eventHandlerMap).forEach(([name, handler]) => {
      document.addEventListener(name, handler);
    });
  }
}

class MouseInputHandler extends InputHandler {
  buttonIndexNameMap = {
    0: "left",
  };

  eventHandlerMap = {
    click: (event) => {
      const buttonName = this.buttonIndexNameMap[event.button];
      const handler = this._eventHandlerMap[buttonName];
      if (handler) {
        handler(event);
      }
    },
  };
}

class KeyBoardInputHandler extends InputHandler {
  buttonIndexNameMap = {
    38: "ArrowUp",
    32: "space",
  };

  eventHandlerMap = {
    keydown: (event) => {
      const buttonName = this.buttonIndexNameMap[event.keyCode];
      const handler = this._eventHandlerMap[buttonName];
      if (handler) {
        handler(event);
      }
    },
  };
}

const RESOURCE_TYPE = {
  IMAGE: "image",
};

class ResourceLoader {
  _typeLoadersMap = {
    [RESOURCE_TYPE.IMAGE]: async ({ src, width, height }) => {
      return new Promise((resolve, reject) => {
        const image = new Image(width, height);
        image.addEventListener("load", () => resolve(image));
        image.addEventListener("error", (error) => reject(error));
        image.src = src;
      });
    },
  };

  async load(resource) {
    const loader = this._typeLoadersMap[resource.type];
    const loadedRes = await loader(resource);
    return loadedRes;
  }
}

class Game {
  _countCurrent = document.getElementById("count_current");
  _countBest = document.getElementById("count_best");
  _bestStored = parseInt(localStorage.getItem("bestScore"));
  _startBtn = document.getElementById("start");
  _getReadyListener = null;

  constructor() {
    this._config = new Config();
    this._canvas = document.getElementById(this._config.canvas.canvasId);
    this._canvas.width = this._config.canvas.width;
    this._canvas.height = this._config.canvas.height;
    this.height = this._config.canvas.height;
    this.width = this._config.canvas.width;
    this._drawEngine = new CanvasDrawEngine({ canvas: this._canvas });
    this._physicsEngine = new PhysicsEngine({ gravity: this._config.gravity });
    this._resourceLoader = new ResourceLoader();

    this._mouseInputHandler = new MouseInputHandler({
      left: () => {
        this._bird.flap();
      },
    });

    this._keyBoardInputHandler = new KeyBoardInputHandler({
      ArrowUp: () => {
        console.log(5);
        this._bird.flap();
      },
      space: () => {
        console.log(5);
        this._bird.flap();
      },
    });
  }

  async prepare() {
    this._spriteSheet = this._resourceLoader.load({
      type: RESOURCE_TYPE.IMAGE,
      src: this._config.spritesheet.src,
      width: this._config.spritesheet.width,
      height: this._config.spritesheet.height,
    });
  }

  reset() {
    this._score = 0;

    this._background = new Background({
      x: this._config.background.x,
      y: this._config.background.y,
      width: this._config.background.width,
      frames: this._config.background.frames,
      height: this._config.background.height,
      spriteSheet: this._spriteSheet,
      drawEngine: this._drawEngine,
      speed: this._config.GAME_SPEED,
      game: this,
    });

    this._foreground = new Foreground({
      x: this._config.foreground.x,
      y: this._config.foreground.y,
      width: this._config.foreground.width,
      frames: this._config.foreground.frames,
      height: this._config.foreground.height,
      spriteSheet: this._spriteSheet,
      drawEngine: this._drawEngine,
      speed: this._config.GAME_SPEED,
      game: this,
    });

    this._bird = new Bird({
      x: this._config.bird.x,
      y: this._config.bird.y,
      width: this._config.bird.width,
      height: this._config.bird.height,
      degree: this._config.DEGREE,
      context: this._drawEngine._context,
      frames: this._config.bird.frames,
      spriteSheet: this._spriteSheet,
      foreground: this._config.foreground,
      flapSpeed: this._config.bird.flapSpeed,
      physicsEngine: this._physicsEngine,
      drawEngine: this._drawEngine,
      game: this,
    });

    this._pipes = new Pipes({
      x: this._config.pipes.x,
      y: this._config.pipes.y,
      width: this._config.pipes.widthFactor * this._bird.width,
      frames: this._config.pipes.frames,
      height: this._config.pipes.height,
      gap: this._config.pipes.gapFactor * this._bird.height,
      bird: this._bird,
      spriteSheet: this._spriteSheet,
      drawEngine: this._drawEngine,
      speed: this._config.GAME_SPEED,
      game: this,
    });
  }

  update(delta) {
    this._background.update(delta);
    this._foreground.update(delta);
    this._bird.update(delta);
    this._pipes.update(delta);
    this.updateCounter();
  }

  draw() {
    this._background.draw();
    this._pipes.draw();
    this._bird.draw();
    this._foreground.draw();
  }

  _loop() {
    const now = Date.now();
    const delta = now - this._lastUpdate;

    this.update(delta / 1000);

    if (this._playing) {
      this._drawEngine.clear();
      this.draw();
      this._lastUpdate = now;
      requestAnimationFrame(this._loop.bind(this));
    }
  }

  updateCounter() {
    if (!this._bestStored) {
      this._bestStored = this._scoreCurrent;
    }
    this._scoreCurrent = this._pipes.score;
    this._countCurrent.innerText = `current ${this._scoreCurrent}`;
    this._bestStored = Math.max(this._scoreCurrent, this._bestStored);
    this._countBest.innerText = `best ${this._bestStored}`;
    localStorage.setItem("bestScore", this._bestStored);
  }

  start() {
    this._canvas.removeEventListener("click", this._getReadyListener);
    this._playing = true;
    this._mouseInputHandler.subscribe();
    this._keyBoardInputHandler.subscribe();
    this._lastUpdate = Date.now();
    this.reset();
    this._loop();
  }

  gameOver() {
    this._playing = false;
    // alert(`game over ${this._bestStored}`)
    this._gameOverMessage = new GameOverMessage({
      x: this._config.gameOverMessage.x,
      y: this._config.gameOverMessage.y,
      width: this._config.gameOverMessage.width,
      frames: this._config.gameOverMessage.frames,
      height: this._config.gameOverMessage.height,
      spriteSheet: this._spriteSheet,
      drawEngine: this._drawEngine,
      game: this,
    });
    this._gameOverMessage.draw();
    this._startBtn.style.display = "flex";
    this._startBtn.addEventListener("click", (event) => {
      window.location = "/";
    });
  }

  getReady() {
    this._playing = false;
    console.log(this._bestStored);
    if (this._bestStored === 0 || Number.isNaN(this._bestStored)) {
      this._startMessage = new StartMessage({
        x: this._config.startMessage.x,
        y: this._config.startMessage.y,
        width: this._config.startMessage.width,
        frames: this._config.startMessage.frames,
        height: this._config.startMessage.height,
        spriteSheet: this._spriteSheet,
        drawEngine: this._drawEngine,
        game: this,
      });

      this._background = new Background({
        x: this._config.background.x,
        y: this._config.background.y,
        width: this._config.background.width,
        frames: this._config.background.frames,
        height: this._config.background.height,
        spriteSheet: this._spriteSheet,
        drawEngine: this._drawEngine,
        speed: this._config.GAME_SPEED,
        game: this,
      });

      this._background.draw();
      this._startMessage.draw();
      this._getReadyListener = (event) => {
        this.start();
      };
      this._canvas.addEventListener("click", this._getReadyListener);
    } else this.start();
  }
}

const game = new Game();
const audio = new Audio("./music.mp3");

game.prepare().then(() => {
  game.getReady();
  audio.volume = 1;
  audio.play();
});
