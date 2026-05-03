import Phaser from "phaser";
import { useWorldStore, type WeatherKind } from "../../store/useWorldStore";

interface WeatherParticle {
  x: number;
  y: number;
  speed: number;
  drift: number;
  size: number;
}

const weatherOrder: WeatherKind[] = ["clear", "rain", "fog", "wind", "snow"];

export class WeatherSystem {
  private weather: WeatherKind = "clear";
  private nextWeatherAt = 22;
  private elapsed = 0;
  private particles: WeatherParticle[] = [];
  private readonly graphics: Phaser.GameObjects.Graphics;
  private readonly fog: Phaser.GameObjects.Rectangle;

  constructor(private readonly scene: Phaser.Scene) {
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(8700);
    this.graphics.setScrollFactor(0);
    this.fog = scene.add.rectangle(0, 0, 10, 10, 0xd7e6d9, 0);
    this.fog.setOrigin(0);
    this.fog.setScrollFactor(0);
    this.fog.setDepth(8600);
    this.resize();
    scene.scale.on("resize", () => this.resize());
  }

  update(deltaSeconds: number) {
    this.elapsed += deltaSeconds;

    if (this.elapsed >= this.nextWeatherAt) {
      this.elapsed = 0;
      this.nextWeatherAt = 30 + Math.random() * 28;
      const currentIndex = weatherOrder.indexOf(this.weather);
      this.setWeather(weatherOrder[(currentIndex + 1) % weatherOrder.length]);
    }

    this.draw(deltaSeconds);
  }

  setWeather(weather: WeatherKind) {
    this.weather = weather;
    this.particles = createParticles(weather, this.scene.scale.width, this.scene.scale.height);
    useWorldStore.getState().setWeather(weather);
  }

  private draw(deltaSeconds: number) {
    this.graphics.clear();

    if (this.weather === "clear") {
      this.fog.setAlpha(0);
      return;
    }

    this.fog.setAlpha(this.weather === "fog" ? 0.18 : this.weather === "snow" ? 0.05 : 0);

    for (const particle of this.particles) {
      particle.y += particle.speed * deltaSeconds;
      particle.x += particle.drift * deltaSeconds;

      if (particle.y > this.scene.scale.height + 20) {
        particle.y = -20;
        particle.x = Math.random() * this.scene.scale.width;
      }

      if (particle.x < -20) {
        particle.x = this.scene.scale.width + 20;
      } else if (particle.x > this.scene.scale.width + 20) {
        particle.x = -20;
      }

      if (this.weather === "rain") {
        this.graphics.lineStyle(1, 0x9bdcff, 0.62);
        this.graphics.lineBetween(particle.x, particle.y, particle.x - 4, particle.y + 13);
      } else if (this.weather === "snow") {
        this.graphics.fillStyle(0xffffff, 0.72);
        this.graphics.fillRect(particle.x, particle.y, particle.size, particle.size);
      } else if (this.weather === "wind") {
        this.graphics.lineStyle(1, 0xf3f1d2, 0.18);
        this.graphics.lineBetween(particle.x, particle.y, particle.x + 24, particle.y - 2);
      } else if (this.weather === "fog") {
        this.graphics.fillStyle(0xd7e6d9, 0.08);
        this.graphics.fillRect(particle.x, particle.y, 56, 6);
      }
    }
  }

  private resize() {
    this.fog.setSize(this.scene.scale.width, this.scene.scale.height);
  }
}

function createParticles(weather: WeatherKind, width: number, height: number) {
  const count = weather === "clear" ? 0 : weather === "fog" ? 28 : weather === "wind" ? 34 : 80;

  return Array.from({ length: count }, (): WeatherParticle => ({
    x: Math.random() * width,
    y: Math.random() * height,
    speed: weather === "rain" ? 520 : weather === "snow" ? 72 : weather === "wind" ? 46 : 18,
    drift: weather === "rain" ? -160 : weather === "snow" ? Math.random() * 26 - 13 : weather === "wind" ? 220 : 32,
    size: weather === "snow" ? 2 + Math.floor(Math.random() * 3) : 2
  }));
}
