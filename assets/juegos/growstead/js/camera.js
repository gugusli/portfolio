class Camera {
  constructor(width, height) {
    this.x = 0;
    this.y = 0;
    this.width = width;
    this.height = height;
    this.lerpFactor = 0.1;
    this.shakeDuration = 0;
    this.shakeIntensity = 0;
    this.shakeX = 0;
    this.shakeY = 0;
  }

  shake(intensity) {
    this.shakeDuration = 10;
    this.shakeIntensity = intensity;
  }

  update(player, worldWidth, worldHeight) {
    const targetX = player.x - this.width / 2;
    const targetY = player.y - this.height / 2;
    this.x += (targetX - this.x) * this.lerpFactor;
    this.y += (targetY - this.y) * this.lerpFactor;
    this.x = Math.max(0, Math.min(worldWidth - this.width, this.x));
    this.y = Math.max(0, Math.min(worldHeight - this.height, this.y));

    if (this.shakeDuration > 0) {
      this.shakeX = (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeY = (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeDuration--;
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
    }
  }
}
