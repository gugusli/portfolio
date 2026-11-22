class Renderer {
  constructor(ctx) {
    this.ctx = ctx;
    this.prestigeFlashAlpha = 0;
    this.time = 0;
  }

  triggerPrestigeFlash() {
    this.prestigeFlashAlpha = 1;
  }

  drawPrestigeFlash() {
    if (this.prestigeFlashAlpha <= 0) return;
    const { ctx } = this;
    ctx.save();
    ctx.globalAlpha = this.prestigeFlashAlpha;
    const grad = ctx.createRadialGradient(
      ctx.canvas.width / 2, ctx.canvas.height / 2, 0,
      ctx.canvas.width / 2, ctx.canvas.height / 2, ctx.canvas.width * 0.6
    );
    grad.addColorStop(0, 'rgba(255, 215, 0, ' + this.prestigeFlashAlpha + ')');
    grad.addColorStop(0.5, 'rgba(255, 255, 255, ' + this.prestigeFlashAlpha + ')');
    grad.addColorStop(1, 'rgba(255, 215, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.restore();
    this.prestigeFlashAlpha -= 0.03;
    if (this.prestigeFlashAlpha < 0) this.prestigeFlashAlpha = 0;
  }

  clear(time) {
    this.time = time || 0;
    const { ctx } = this;
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.7);
    grad.addColorStop(0, '#0f1629');
    grad.addColorStop(0.5, '#080c18');
    grad.addColorStop(1, '#020408');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  applyCamera(camera) {
    const { ctx } = this;
    ctx.save();
    ctx.translate(Math.round(-(camera.x + camera.shakeX)), Math.round(-(camera.y + camera.shakeY)));
  }

  restoreCamera() {
    const { ctx } = this;
    ctx.restore();
  }

  drawVignette() {
    const { ctx } = this;
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    const grad = ctx.createRadialGradient(w / 2, h / 2, w * 0.25, w / 2, h / 2, w * 0.75);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  drawGrid() {
    const { ctx } = this;
    const step = 100;
    ctx.strokeStyle = 'rgba(30, 60, 120, 0.10)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= WORLD_WIDTH; x += step) {
      ctx.moveTo(x, 0); ctx.lineTo(x, WORLD_HEIGHT);
    }
    for (let y = 0; y <= WORLD_HEIGHT; y += step) {
      ctx.moveTo(0, y); ctx.lineTo(WORLD_HEIGHT, y);
    }
    ctx.stroke();
  }

  drawZoneBoundary(zone2Unlocked) {
    const { ctx } = this;
    const midX = WORLD_WIDTH / 2;

    ctx.save();
    if (zone2Unlocked) {
      const pulse = Math.sin(this.time * 0.002) * 0.3 + 0.5;
      ctx.strokeStyle = 'rgba(0, 180, 216, ' + (0.25 + pulse * 0.25) + ')';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 10]);
      ctx.beginPath();
      ctx.moveTo(midX, 0); ctx.lineTo(midX, WORLD_HEIGHT);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = 'rgba(0, 180, 216, 0.4)';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('◈ ZONE 2 ◈', WORLD_WIDTH * 0.75, WORLD_HEIGHT - 10);
    } else {
      ctx.strokeStyle = 'rgba(80, 30, 30, 0.35)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 10]);
      ctx.beginPath();
      ctx.moveTo(midX, 0); ctx.lineTo(midX, WORLD_HEIGHT);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = 'rgba(150, 50, 50, 0.35)';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('⛌ LOCKED', WORLD_WIDTH * 0.75, WORLD_HEIGHT - 10);
    }
    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';
    ctx.restore();
  }

  drawPlayer(x, y, radius) {
    const { ctx } = this;
    ctx.save();
    ctx.shadowColor = 'rgba(68, 136, 255, 0.3)';
    ctx.shadowBlur = 14;

    const glow = ctx.createRadialGradient(x, y, 0, x, y, radius * 2.5);
    glow.addColorStop(0, 'rgba(68, 136, 255, 0.15)');
    glow.addColorStop(1, 'rgba(68, 136, 255, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, radius * 2.5, 0, Math.PI * 2);
    ctx.fill();

    const grad = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius);
    grad.addColorStop(0, '#6aadff');
    grad.addColorStop(0.5, '#4488ff');
    grad.addColorStop(1, '#1a4fa0');
    ctx.shadowBlur = 12;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  drawResource(resource) {
    const { ctx } = this;
    if (resource.locked) return;

    const t = this.time * 0.002;
    const half = resource.size / 2;
    const x = resource.x;
    const y = resource.y;

    ctx.save();

    if (resource.isRegenerating) {
      const respawnPulse = Math.sin(resource.respawnTimer * 0.08) * 0.3 + 0.7;
      ctx.globalAlpha = 0.3 + respawnPulse * 0.2;
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 2;

      if (resource.type === 'crystal') {
        ctx.beginPath();
        ctx.moveTo(x, y - half);
        ctx.lineTo(x + half, y);
        ctx.lineTo(x, y + half);
        ctx.lineTo(x - half, y);
        ctx.closePath();
        ctx.stroke();
      } else {
        const s = resource.size * (0.8 + Math.sin(resource.respawnTimer * 0.06) * 0.2);
        const h = s / 2;
        ctx.strokeRect(x - h, y - h, s, s);
      }
      ctx.restore();
      return;
    }

    if (resource.type === 'crystal') {
      ctx.shadowColor = '#00b4d8';
      ctx.shadowBlur = 10 + Math.sin(t) * 3;
      const grad = ctx.createLinearGradient(x, y - half, x, y + half);
      grad.addColorStop(0, '#48cae4');
      grad.addColorStop(0.5, '#00b4d8');
      grad.addColorStop(1, '#0077b6');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(x, y - half);
      ctx.lineTo(x + half, y);
      ctx.lineTo(x, y + half);
      ctx.lineTo(x - half, y);
      ctx.closePath();
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - half * 0.3, y - half * 0.3);
      ctx.lineTo(x + half * 0.3, y - half * 0.1);
      ctx.stroke();
    } else {
      ctx.shadowColor = '#ffb703';
      ctx.shadowBlur = 8 + Math.sin(t) * 2;
      const grad = ctx.createLinearGradient(x - half, y - half, x + half, y + half);
      grad.addColorStop(0, '#ffd60a');
      grad.addColorStop(0.5, '#ffb703');
      grad.addColorStop(1, '#fb8500');
      ctx.fillStyle = grad;
      const s = resource.size * (0.85 + Math.sin(t + x) * 0.05);
      const h = s / 2;
      ctx.fillRect(x - h, y - h, s, s);

      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x - h, y - h, s, s);
    }
    ctx.restore();
  }

  drawBase() {
    const { ctx } = this;
    const x = BASE.x, y = BASE.y, radius = BASE.radius;
    const t = this.time * 0.002;

    ctx.save();
    const glowGrad = ctx.createRadialGradient(x, y, 0, x, y, radius * 2);
    glowGrad.addColorStop(0, 'rgba(42, 157, 143, 0.08)');
    glowGrad.addColorStop(1, 'rgba(42, 157, 143, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(42, 157, 143, ' + (0.15 + Math.sin(t) * 0.08) + ')';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 8]);
    ctx.beginPath();
    ctx.arc(x, y, radius + 8 + Math.sin(t) * 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.shadowColor = '#2a9d8f';
    ctx.shadowBlur = 10;
    ctx.strokeStyle = '#2a9d8f';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.6, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(42, 157, 143, 0.4)';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawHelper(helper, bobOffset, mode) {
    const { ctx } = this;
    const r = helper.radius + bobOffset;
    const x = helper.x;
    const y = helper.y;

    ctx.save();
    if (mode === 'crystal') {
      ctx.shadowColor = '#00b4d8';
      ctx.shadowBlur = 12;
      const grad = ctx.createLinearGradient(x, y - r, x, y + r);
      grad.addColorStop(0, '#48cae4');
      grad.addColorStop(0.5, '#0096c7');
      grad.addColorStop(1, '#005f8a');
      ctx.fillStyle = grad;
    } else {
      ctx.shadowColor = '#9b5de5';
      ctx.shadowBlur = 12;
      const grad = ctx.createLinearGradient(x, y - r, x, y + r);
      grad.addColorStop(0, '#c77dff');
      grad.addColorStop(0.5, '#9b5de5');
      grad.addColorStop(1, '#5a189a');
      ctx.fillStyle = grad;
    }

    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.lineTo(x + r, y);
    ctx.lineTo(x, y + r);
    ctx.lineTo(x - r, y);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.moveTo(x, y - r * 0.5);
    ctx.lineTo(x + r * 0.3, y);
    ctx.lineTo(x, y + r * 0.5);
    ctx.lineTo(x - r * 0.3, y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawRefinery(refinery) {
    const { ctx } = this;
    const hx = refinery.sizeX / 2;
    const hy = refinery.sizeY / 2;
    const x = refinery.x;
    const y = refinery.y;
    const t = this.time * 0.003;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 180, 216, 0.3)';
    ctx.shadowBlur = 8;

    const bGrad = ctx.createLinearGradient(x - hx, y - hy, x + hx, y + hy);
    bGrad.addColorStop(0, '#3a3d5c');
    bGrad.addColorStop(0.5, '#2b2d42');
    bGrad.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = bGrad;
    ctx.fillRect(x - hx, y - hy, refinery.sizeX, refinery.sizeY);

    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(0, 180, 216, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - hx, y - hy, refinery.sizeX, refinery.sizeY);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('REFINERY', x, y);

    if (refinery.processing) {
      const pulse = Math.sin(t * 4) * 0.3 + 0.7;
      ctx.fillStyle = 'rgba(241, 91, 181, ' + (0.05 * pulse) + ')';
      ctx.fillRect(x - hx, y - hy, refinery.sizeX, refinery.sizeY);
    }

    ctx.shadowColor = '#00b4d8';
    ctx.shadowBlur = 6;
    ctx.strokeStyle = '#00b4d8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(refinery.inputPad.x, refinery.inputPad.y, refinery.inputPad.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(0, 180, 216, 0.1)';
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('IN: ' + refinery.input + '/' + refinery.maxInput, refinery.inputPad.x, refinery.inputPad.y);

    ctx.shadowColor = '#f15bb5';
    ctx.shadowBlur = 6;
    ctx.strokeStyle = '#f15bb5';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(refinery.outputPad.x, refinery.outputPad.y, refinery.outputPad.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(241, 91, 181, 0.1)';
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText('OUT: ' + refinery.output + '/' + refinery.maxOutput, refinery.outputPad.x, refinery.outputPad.y);

    const barW = 50;
    const barH = 4;
    const barX = x - barW / 2;
    const barY = y - hy - 14;
    const progress = refinery.processingSpeed > 0 ? refinery.processingTimer / refinery.processingSpeed : 0;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(barX, barY, barW, barH);
    if (progress > 0) {
      ctx.shadowColor = '#f15bb5';
      ctx.shadowBlur = 4;
      ctx.fillStyle = '#f15bb5';
      ctx.fillRect(barX, barY, barW * progress, barH);
    }

    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';
    ctx.restore();
  }

  drawPrestigeBtn(canAfford) {
    const { ctx } = this;
    const x = BTN.prestige.x, y = BTN.prestige.y;
    const t = this.time * 0.003;

    ctx.save();
    if (canAfford) {
      const pulse = Math.sin(t * 2.5) * 0.12 + 1;
      const r = BTN.prestige.r * pulse;
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 20 + Math.sin(t * 3) * 8;

      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, '#ffe066');
      grad.addColorStop(0.7, '#ffd700');
      grad.addColorStop(1, '#e6a800');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, r - 2, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#1a1a1a';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('PRESTIGE', x, y - 1);
      ctx.fillStyle = '#ffd700';
      ctx.font = '7px monospace';
      ctx.fillText('★', x, y + 10);
    } else {
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = '#555';
      ctx.beginPath();
      ctx.arc(x, y, BTN.prestige.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#888';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('???', x, y);
    }

    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';
    ctx.restore();
  }

  drawShopBtn(x, y, r, label, cost, canAfford, color) {
    const { ctx } = this;
    const t = this.time * 0.002;

    ctx.save();

    if (canAfford) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 8 + Math.sin(t + x) * 3;
    } else {
      ctx.shadowBlur = 0;
    }

    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    if (canAfford) {
      grad.addColorStop(0, color);
      grad.addColorStop(1, this._darken(color, 0.4));
    } else {
      grad.addColorStop(0, '#444');
      grad.addColorStop(1, '#222');
    }
    ctx.fillStyle = grad;
    ctx.globalAlpha = canAfford ? 1 : 0.35;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.globalAlpha = canAfford ? 0.3 : 0.1;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, r - 1, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = canAfford ? 1 : 0.35;
    ctx.fillStyle = '#000';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y - 3);
    ctx.fillStyle = canAfford ? '#fff' : '#888';
    ctx.font = '7px monospace';
    ctx.fillText('$' + cost, x, y + 9);

    ctx.restore();
  }

  drawUpgradeBtns(economy) {
    const { ctx } = this;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    this.drawShopBtn(BTN.speed.x, BTN.speed.y, BTN.speed.r, 'SPD',
      economy.upgradeCosts.speed, economy.coins >= economy.upgradeCosts.speed, '#f4a261');
    this.drawShopBtn(BTN.cap.x, BTN.cap.y, BTN.cap.r, 'CAP',
      economy.upgradeCosts.capacity, economy.coins >= economy.upgradeCosts.capacity, '#e76f51');

    if (!economy.hasHelper1) {
      this.drawShopBtn(BTN.helper1.x, BTN.helper1.y, BTN.helper1.r, 'DROID',
        economy.upgradeCosts.helper1, economy.coins >= economy.upgradeCosts.helper1, '#9b5de5');
    }
    if (economy.hasHelper1) {
      this.drawShopBtn(BTN.hSpeed.x, BTN.hSpeed.y, BTN.hSpeed.r, 'HSPD',
        economy.upgradeCosts.helperSpeed, economy.coins >= economy.upgradeCosts.helperSpeed, '#c77dff');
      this.drawShopBtn(BTN.hCap.x, BTN.hCap.y, BTN.hCap.r, 'HCAP',
        economy.upgradeCosts.helperCapacity, economy.coins >= economy.upgradeCosts.helperCapacity, '#7b2cbf');
    }

    if (economy.hasHelper1 && !economy.crystalUnlocked) {
      this.drawShopBtn(BTN.crystal.x, BTN.crystal.y, BTN.crystal.r, 'CRYST',
        economy.upgradeCosts.crystal, economy.coins >= economy.upgradeCosts.crystal, '#00b4d8');
    }

    if (economy.crystalUnlocked && !economy.hasHelper2) {
      this.drawShopBtn(BTN.helper2.x, BTN.helper2.y, BTN.helper2.r, 'DROID2',
        economy.upgradeCosts.helper2, economy.coins >= economy.upgradeCosts.helper2, '#48cae4');
    }

    if (economy.hasHelper2 && !economy.zone2Unlocked) {
      this.drawShopBtn(BTN.zone2.x, BTN.zone2.y, BTN.zone2.r, 'ZONE2',
        economy.upgradeCosts.unlockZone2, economy.coins >= economy.upgradeCosts.unlockZone2, '#f77f00');
    }

    if (economy.zone2Unlocked && !economy.refineryUnlocked) {
      this.drawShopBtn(BTN.refinery.x, BTN.refinery.y, BTN.refinery.r, 'REF',
        economy.upgradeCosts.refinery, economy.coins >= economy.upgradeCosts.refinery, '#f15bb5');
    }

    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';
  }

  _darken(hex, amount) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return 'rgb(' + Math.round(r * (1 - amount)) + ',' +
      Math.round(g * (1 - amount)) + ',' +
      Math.round(b * (1 - amount)) + ')';
  }

  drawParticles(pool) {
    const { ctx } = this;
    const arr = pool.pool;
    for (let i = 0; i < arr.length; i++) {
      const p = arr[i];
      if (!p.active) continue;
      const alpha = Math.min(p.life / p.maxLife * 1.5, 1);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  drawFloatingTexts(textPool) {
    const { ctx } = this;
    const arr = textPool.pool;
    for (let i = 0; i < arr.length; i++) {
      const t = arr[i];
      if (!t.active) continue;
      const alpha = t.life / t.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      if (t.value > 10) {
        ctx.shadowColor = '#ffbe0b';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#ffbe0b';
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(t.text, t.x, t.y);

        ctx.globalAlpha = alpha * 0.2;
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 0;
        ctx.fillText(t.text, t.x + 1, t.y + 1);
      } else {
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 4;
        ctx.fillStyle = t.color;
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(t.text, t.x, t.y);
      }
      ctx.restore();
    }
  }

  drawJoystick(input) {
    const js = input.joystick;
    if (!js.active) return;
    const { ctx } = this;
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(js.cx, js.cy, 60, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.arc(js.px, js.py, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawPauseMenu(economy) {
    const { ctx } = this;
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    const pw = Math.min(420, w - 40);
    const ph = 280;
    const px = (w - pw) / 2;
    const py = (h - ph) / 2;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, w, h);

    const bgGrad = ctx.createLinearGradient(px, py, px, py + ph);
    bgGrad.addColorStop(0, '#1a1a2e');
    bgGrad.addColorStop(1, '#0f0f1a');
    ctx.fillStyle = bgGrad;
    ctx.beginPath();
    this._roundRect(ctx, px, py, pw, ph, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(233, 69, 96, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    this._roundRect(ctx, px, py, pw, ph, 12);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    ctx.fillStyle = '#e94560';
    ctx.font = 'bold 24px monospace';
    ctx.fillText('■ PAUSADO', w / 2, py + 20);

    const runSec = Math.floor(economy.playTime / 1000);
    const runMin = Math.floor(runSec / 60);
    const runHr = Math.floor(runMin / 60);

    const lines = [
      { label: 'Tiempo de partida:', value: runHr > 0 ? runHr + 'h ' + (runMin % 60) + 'm ' + (runSec % 60) + 's'
        : runMin > 0 ? runMin + 'm ' + (runSec % 60) + 's' : runSec + 's' },
      { label: 'Energía vendida:', value: economy.totalEnergySold + ' coins' },
      { label: 'Mejor prestigio:', value: economy.fastestPrestige === Infinity ? '--' : (() => {
        const bs = Math.floor(economy.fastestPrestige / 1000);
        const bm = Math.floor(bs / 60);
        const bh = Math.floor(bm / 60);
        return bh > 0 ? bh + 'h ' + (bm % 60) + 'm ' + (bs % 60) + 's'
          : bm > 0 ? bm + 'm ' + (bs % 60) + 's' : bs + 's';
      })() },
    ];

    let lx = py + 70;
    for (let i = 0; i < lines.length; i++) {
      ctx.fillStyle = '#a8b2d1';
      ctx.font = '14px monospace';
      ctx.fillText(lines[i].label, w / 2, lx);
      ctx.fillStyle = '#ccd6f6';
      ctx.font = '16px monospace';
      ctx.fillText(lines[i].value, w / 2, lx + 22);
      lx += 55;
    }

    ctx.fillStyle = '#555';
    ctx.font = '13px monospace';
    ctx.fillText('ESC / P para continuar', w / 2, py + ph - 30);
    ctx.restore();
  }

  drawUI(player, economy, fps) {
    const { ctx } = this;
    const w = ctx.canvas.width;

    ctx.save();
    ctx.fillStyle = 'rgba(8, 10, 20, 0.8)';
    ctx.fillRect(0, 0, w, 90);
    ctx.fillStyle = 'rgba(42, 157, 143, 0.06)';
    ctx.fillRect(0, 88, w, 2);

    ctx.font = '13px monospace';
    ctx.textBaseline = 'top';

    let cx = 14;

    // Inventory bar
    ctx.fillStyle = '#a8b2d1';
    ctx.fillText('INV', cx, 10);
    const invPct = player.maxCapacity > 0 ? player.inventory / player.maxCapacity : 0;
    const barW = 80, barH = 10;
    const barX = cx + 32, barY = 12;
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(barX, barY, barW, barH);
    if (invPct > 0) {
      const invGrad = ctx.createLinearGradient(barX, barY, barX + barW, barY);
      invGrad.addColorStop(0, '#2a9d8f');
      invGrad.addColorStop(1, '#52b788');
      ctx.fillStyle = invGrad;
      ctx.fillRect(barX, barY, barW * invPct, barH);
    }
    ctx.fillStyle = '#ccd6f6';
    ctx.font = '10px monospace';
    ctx.fillText(player.inventory + '/' + player.maxCapacity, barX + barW + 6, 12);

    // Coins
    ctx.font = '13px monospace';
    cx = barX + barW + 70;
    ctx.fillStyle = '#a8b2d1';
    ctx.fillText('$', cx, 10);
    ctx.fillStyle = '#ffd700';
    ctx.fillText(String(economy.coins), cx + 14, 10);

    // Multiplier
    cx += 120;
    ctx.fillStyle = '#a8b2d1';
    ctx.fillText('MULT', cx, 10);
    ctx.fillStyle = '#ffbe0b';
    ctx.fillText('x' + economy.multiplier.toFixed(1), cx + 36, 10);

    // Prestige
    cx += 110;
    ctx.fillStyle = '#a8b2d1';
    ctx.fillText('P', cx, 10);
    ctx.fillStyle = '#ffd700';
    ctx.fillText(economy.prestigePoints, cx + 14, 10);

    // FPS
    ctx.fillStyle = '#444';
    ctx.font = '10px monospace';
    ctx.fillText('FPS: ' + fps, w - 80, 12);

    // Next goal hint
    ctx.font = '10px monospace';
    ctx.fillStyle = '#555';
    ctx.fillText('SPD: ' + player.speed.toFixed(1) + '  CAP: ' + player.maxCapacity, 14, 76);

    // Goal hint on right side
    let goalText = '';
    if (!economy.hasHelper1) {
      goalText = '→ Buy DROID ($' + economy.upgradeCosts.helper1 + ')';
    } else if (!economy.crystalUnlocked) {
      goalText = '→ Unlock CRYSTAL ($' + economy.upgradeCosts.crystal + ')';
    } else if (!economy.hasHelper2) {
      goalText = '→ Buy DROID2 ($' + economy.upgradeCosts.helper2 + ')';
    } else if (!economy.zone2Unlocked) {
      goalText = '→ Unlock ZONE2 ($' + economy.upgradeCosts.unlockZone2 + ')';
    } else if (!economy.refineryUnlocked) {
      goalText = '→ Unlock REFINERY ($' + economy.upgradeCosts.refinery + ')';
    } else {
      var pLevel = economy.prestigePoints || 0;
      var pCost = Math.round(CFG.prestige.baseCost * Math.pow(CFG.prestige.costMultiplier, pLevel));
      if (economy.coins < pCost) {
        goalText = '→ Save $' + pCost + ' for PRESTIGE';
      } else {
        goalText = '★ PRESTIGE ready!';
      }
    }

    if (goalText) {
      ctx.fillStyle = '#666';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(goalText, w - 14, 76);
      ctx.textAlign = 'start';
    }

    ctx.restore();
  }

  // ── Statics ──
  static formatNum(n) {
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return Math.floor(n).toString();
  }

  // ── Offline Welcome Popup ──
  drawOfflinePopup(earnings) {
    const { ctx } = this;
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    const pw = Math.min(400, w - 40);
    const ph = 260;
    const px = (w - pw) / 2;
    const py = (h - ph) / 2;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, w, h);

    const bgGrad = ctx.createLinearGradient(px, py, px, py + ph);
    bgGrad.addColorStop(0, '#1a1a2e');
    bgGrad.addColorStop(1, '#0f0f1a');
    ctx.fillStyle = bgGrad;
    ctx.beginPath();
    this._roundRect(ctx, px, py, pw, ph, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    this._roundRect(ctx, px, py, pw, ph, 12);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('¡Bienvenido de vuelta!', w / 2, py + 20);

    ctx.fillStyle = '#a8b2d1';
    ctx.font = '13px monospace';
    ctx.fillText('Tus droids trabajaron mientras', w / 2, py + 58);
    ctx.fillText('estabas fuera:', w / 2, py + 76);

    let ly = py + 100;
    if (earnings.goldCoins > 0) {
      ctx.fillStyle = '#ffb703';
      ctx.font = '12px monospace';
      ctx.fillText('Oro recolectado: +' + Math.floor(earnings.goldCoins), w / 2, ly);
      ly += 20;
    }
    if (earnings.crystalCoins > 0) {
      ctx.fillStyle = '#00b4d8';
      ctx.font = '12px monospace';
      ctx.fillText('Cristales recolectados: +' + Math.floor(earnings.crystalCoins), w / 2, ly);
      ly += 20;
    }
    if (earnings.refineryCoins > 0) {
      ctx.fillStyle = '#f15bb5';
      ctx.font = '12px monospace';
      ctx.fillText('Energía procesada: +' + Math.floor(earnings.refineryCoins), w / 2, ly);
      ly += 20;
    }

    // Claim button
    const btnW = 160, btnH = 40;
    const btnX = (w - btnW) / 2;
    const btnY = py + ph - 60;
    const pulse = Math.sin(this.time * 0.005) * 0.1 + 1;
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 12 * pulse;
    const btnGrad = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH);
    btnGrad.addColorStop(0, '#f0a500');
    btnGrad.addColorStop(1, '#c77d00');
    ctx.fillStyle = btnGrad;
    ctx.beginPath();
    this._roundRect(ctx, btnX, btnY, btnW, btnH, 6);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('RECLAMAR', w / 2, btnY + btnH / 2);

    ctx.restore();
    return { x: btnX, y: btnY, w: btnW, h: btnH };
  }

  // ── Milestone Panel ──
  drawMilestonePanel(milestone, progress) {
    if (!milestone) return;
    const { ctx } = this;
    const w = ctx.canvas.width;
    const pw = Math.min(220, w * 0.35);
    const ph = 70;
    const px = w - pw - 10;
    const py = 96;

    ctx.save();
    ctx.fillStyle = 'rgba(8, 10, 20, 0.85)';
    ctx.beginPath();
    this._roundRect(ctx, px, py, pw, ph, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    this._roundRect(ctx, px, py, pw, ph, 8);
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('OBJETIVO', px + 10, py + 8);
    ctx.fillStyle = '#ccd6f6';
    ctx.font = '10px monospace';
    ctx.fillText(milestone.desc, px + 10, py + 24);

    // Progress bar
    const barW = pw - 20, barH = 8;
    const barX = px + 10, barY = py + 44;
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath();
    this._roundRect(ctx, barX, barY, barW, barH, 4);
    ctx.fill();

    const pct = Math.min(progress / milestone.target, 1);
    if (pct > 0) {
      const barGrad = ctx.createLinearGradient(barX, barY, barX + barW * pct, barY);
      barGrad.addColorStop(0, '#ffd700');
      barGrad.addColorStop(1, '#f0a500');
      ctx.fillStyle = barGrad;
      ctx.beginPath();
      this._roundRect(ctx, barX, barY, barW * pct, barH, 4);
      ctx.fill();
    }

    ctx.fillStyle = '#a8b2d1';
    ctx.font = '8px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(progress + '/' + milestone.target, px + pw - 10, barY - 12);
    ctx.restore();
  }

  // ── Stats Button ──
  drawStatsBtn() {
    const { ctx } = this;
    const w = ctx.canvas.width;
    const size = 28;
    const x = w - size - 10;
    const y = 98;

    ctx.save();
    ctx.fillStyle = 'rgba(68, 136, 255, 0.3)';
    ctx.strokeStyle = 'rgba(68, 136, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    this._roundRect(ctx, x, y, size, size, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#6aadff';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('i', x + size / 2, y + size / 2 + 1);
    ctx.restore();
    return { x: x, y: y, w: size, h: size };
  }

  // ── Stats Overlay ──
  drawStatsOverlay(stats, playTimeMs) {
    const { ctx } = this;
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    const pw = Math.min(380, w - 40);
    const ph = 320;
    const px = (w - pw) / 2;
    const py = (h - ph) / 2;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, w, h);

    const bgGrad = ctx.createLinearGradient(px, py, px, py + ph);
    bgGrad.addColorStop(0, '#1a1a2e');
    bgGrad.addColorStop(1, '#0f0f1a');
    ctx.fillStyle = bgGrad;
    ctx.beginPath();
    this._roundRect(ctx, px, py, pw, ph, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(106, 173, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    this._roundRect(ctx, px, py, pw, ph, 12);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    ctx.fillStyle = '#6aadff';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('ESTADÍSTICAS', w / 2, py + 16);

    const totalSec = Math.floor(playTimeMs / 1000);
    const totalMin = Math.floor(totalSec / 60);
    const totalHr = Math.floor(totalMin / 60);
    const timeStr = totalHr > 0
      ? totalHr + 'h ' + (totalMin % 60) + 'm ' + (totalSec % 60) + 's'
      : totalMin > 0
        ? totalMin + 'm ' + (totalSec % 60) + 's'
        : totalSec + 's';

    const lines = [
      { label: 'Tiempo de juego', value: timeStr },
      { label: 'Oro recolectado', value: Renderer.formatNum(stats.totalGold || 0) },
      { label: 'Cristales recolectados', value: Renderer.formatNum(stats.totalCrystals || 0) },
      { label: 'Monedas totales', value: Renderer.formatNum(stats.totalCoins || 0) },
      { label: 'Prestigios', value: String(stats.prestigeCount || 0) },
    ];

    let ly = py + 52;
    for (const line of lines) {
      ctx.fillStyle = '#a8b2d1';
      ctx.font = '13px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(line.label, px + 30, ly);
      ctx.fillStyle = '#ccd6f6';
      ctx.textAlign = 'right';
      ctx.fillText(line.value, px + pw - 30, ly);
      ly += 30;
    }

    // Close button
    const btnW = 140, btnH = 36;
    const btnX = (w - btnW) / 2;
    const btnY = py + ph - 50;
    ctx.fillStyle = '#e94560';
    ctx.beginPath();
    this._roundRect(ctx, btnX, btnY, btnW, btnH, 6);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('CERRAR', w / 2, btnY + btnH / 2);

    ctx.restore();
    return { x: btnX, y: btnY, w: btnW, h: btnH };
  }

  // ── Boost Button ──
  drawBoostBtn(boostActive, boostTimeLeft) {
    const { ctx } = this;
    const w = ctx.canvas.width;
    const size = 40;
    const x = w - size - 10;
    const y = 135;

    ctx.save();
    if (boostActive) {
      const pulse = Math.sin(this.time * 0.01) * 0.15 + 0.85;
      ctx.globalAlpha = pulse;
      ctx.fillStyle = 'rgba(255, 190, 11, 0.3)';
      ctx.strokeStyle = '#ffbe0b';
      ctx.shadowColor = '#ffbe0b';
      ctx.shadowBlur = 12;
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    }
    ctx.lineWidth = 1;
    ctx.beginPath();
    this._roundRect(ctx, x, y, size, size, 8);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.stroke();

    // Lightning bolt icon
    ctx.fillStyle = boostActive ? '#ffbe0b' : 'rgba(255,255,255,0.5)';
    ctx.font = '20px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚡', x + size / 2, y + size / 2);

    if (boostActive) {
      // Timer text below
      ctx.fillStyle = '#ffbe0b';
      ctx.font = '9px monospace';
      ctx.fillText(Math.ceil(boostTimeLeft / 1000) + 's', x + size / 2, y + size + 12);
    }

    ctx.restore();
    return { x: x, y: y, w: size, h: size };
  }

  // ── Refinery Instant Button (screen space near refinery when visible) ──
  drawRefineryInstantBtn(refinery, camera, canAfford) {
    if (!refinery) return null;
    const { ctx } = this;
    const screenX = refinery.x - camera.x;
    const screenY = refinery.y - camera.y;
    const btnW = 80, btnH = 24;
    const x = screenX - btnW / 2;
    const y = screenY - 50;

    ctx.save();
    if (canAfford) {
      ctx.shadowColor = '#f15bb5';
      ctx.shadowBlur = 10;
      ctx.fillStyle = 'rgba(241, 91, 181, 0.25)';
    } else {
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = 'rgba(100, 100, 100, 0.2)';
    }
    ctx.beginPath();
    this._roundRect(ctx, x, y, btnW, btnH, 4);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = canAfford ? '#f15bb5' : '#666';
    ctx.lineWidth = 1;
    ctx.beginPath();
    this._roundRect(ctx, x, y, btnW, btnH, 4);
    ctx.stroke();

    ctx.fillStyle = canAfford ? '#f15bb5' : '#888';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚡ LLENAR', x + btnW / 2, y + btnH / 2);
    ctx.restore();
    return { x: x, y: y, w: btnW, h: btnH };
  }

  // ── Guide Arrow ──
  drawGuideArrow(x, y, angle, scale) {
    const { ctx } = this;
    const pulse = Math.sin(this.time * 0.005) * 0.2 + 0.8;
    const arrowLen = 30 * pulse * scale;
    const headSize = 10 * pulse * scale;
    const alpha = 0.5 + Math.sin(this.time * 0.004) * 0.3;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.strokeStyle = '#6aadff';
    ctx.fillStyle = '#6aadff';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#6aadff';
    ctx.shadowBlur = 10;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -arrowLen);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-headSize, -arrowLen + headSize);
    ctx.lineTo(0, -arrowLen);
    ctx.lineTo(headSize, -arrowLen + headSize);
    ctx.fill();

    ctx.restore();
  }

  _roundRect(ctx, x, y, w, h, r) {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
  }
}
