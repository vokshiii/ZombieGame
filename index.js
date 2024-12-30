import * as PIXI from "pixi.js";
import Player from "./player.js";
import Zombie from "./zombie.js";
import Spawner from "./spawner.js";
import { textStyle, subTextStyle, zombies } from "./globals.js";
import Weather from "./weather.js";
import GameState from "./game-state.js";

const canvasSize = 400;
const canvas = document.getElementById("mycanvas");
const app = new PIXI.Application({
  view: canvas,
  width: canvasSize,
  height: canvasSize,
  backgroundColor: 0x312a2b,
  resolution: 2,
});

PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
//Music
const music = new Audio("./assets/HordeZee.mp3");
music.volume = 0.2;
music.addEventListener("timeupdate", function () {
  if (this.currentTime > this.duration - 0.2) {
    this.currentTime = 0;
  }
});
//Zombie sounds
const zombieHorde = new Audio("./assets/horde.mp3");
zombieHorde.volume = 0.7;
zombieHorde.addEventListener("timeupdate", function () {
  if (this.currentTime > this.duration - 0.2) {
    this.currentTime = 0;
  }
});
initGame();

let score = 0;

async function initGame() {
  app.gameState = GameState.PREINTRO;

  try {
    await loadAssets();
    app.weather = new Weather({ app });
    let player = new Player({ app });
    let zSpawner = new Spawner({ app, create: () => new Zombie({ app, player }) });

    let gamePreIntroScene = createScene("Apocalypse Dash: Undead Uprising", "Click to Continue!");
    let gameStartScene = createScene("Apocalypse Dash: Undead Uprising", "Click Anywhere To Start!");
    let gameOverScene = createScene("Apocalypse Dash: Undead Uprising", `Game Over! Better Luck Next Time`);

    let scoreText = new PIXI.Text("Score: 0", new PIXI.TextStyle(textStyle));
    scoreText.x = app.screen.width / 2;
    scoreText.y = 25;
    scoreText.anchor.set(0.5, 0);
    app.stage.addChild(scoreText);

    app.ticker.add((delta) => {
        if (player.dead) app.gameState = GameState.GAMEOVER;
      
        gamePreIntroScene.visible = app.gameState === GameState.PREINTRO;
        gameStartScene.visible = app.gameState === GameState.START;
        gameOverScene.visible = app.gameState === GameState.GAMEOVER;
      
        switch (app.gameState) {
          case GameState.PREINTRO:
            player.scale = 4;
            break;
          case GameState.INTRO:
            player.scale -= 0.03;
            if (player.scale <= 1) app.gameState = GameState.START;
            break;
          case GameState.RUNNING:
            player.update(delta);
            zSpawner.spawns.forEach((zombie) => zombie.update(delta));
            bulletHitTest({ bullets: player.shooting.bullets, zombies: zSpawner.spawns, bulletRadius: 8, zombieRadius: 16, score });
            break;
          default:
            break;
        }
        app.stage.children.forEach((child) => {
            if (child.texture && child.texture.baseTexture.resource.name === "blood_waste.png") {
              child.animationSpeed = 10 * delta;
            }
          });
        
          // Update the score text
          scoreText.text = "Score: " + score;
    });
  } catch (error) {
    console.log(error.message);
    console.log("Load failed");
  }
}



function bulletHitTest({ bullets, zombies, bulletRadius, zombieRadius }) {
  bullets.forEach((bullet) => {
    zombies.forEach((zombie, index) => {
      let dx = zombie.position.x - bullet.position.x;
      let dy = zombie.position.y - bullet.position.y;
      let distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < bulletRadius + zombieRadius) {
        zombies.splice(index, 1);
        zombie.kill();
        score++; // Increment the score
      }
    });
  });
}

function createScene(sceneText, sceneSubText) {
  const sceneContainer = new PIXI.Container();
  const text = new PIXI.Text(sceneText, new PIXI.TextStyle(textStyle));
  text.x = app.screen.width / 2;
  text.y = 0;
  text.anchor.set(0.5, 0);

  const subText = new PIXI.Text(sceneSubText, new PIXI.TextStyle(subTextStyle));
  subText.x = app.screen.width / 2;
  subText.y = 50;
  subText.anchor.set(0.5, 0);

  sceneContainer.zIndex = 1;
  sceneContainer.addChild(text);
  sceneContainer.addChild(subText);
  app.stage.addChild(sceneContainer);
  return sceneContainer;
}

async function loadAssets() {
  return new Promise((resolve, reject) => {
    zombies.forEach((z) => PIXI.Loader.shared.add(`assets/${z}.json`));
    PIXI.Loader.shared.add("/assets/hero_male.json");
    PIXI.Loader.shared.add("bullet", "assets/bullet.png");
    PIXI.Loader.shared.add("rain", "assets/rain.png");
    PIXI.Loader.shared.onComplete.add(resolve);
    PIXI.Loader.shared.onError.add(reject);
    PIXI.Loader.shared.load();
  });
}

function clickHandler() {
  switch (app.gameState) {
    case GameState.PREINTRO:
      app.gameState = GameState.INTRO;
      music.play();
      app.weather.enableSound();
      break;
    case GameState.START:
      app.gameState = GameState.RUNNING;
      zombieHorde.play();
      break;

    default:
      break;
  }
}

document.addEventListener("click", clickHandler);
