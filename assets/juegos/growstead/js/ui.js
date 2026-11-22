var ANCHOR_TL = 'TL', ANCHOR_TC = 'TC', ANCHOR_TR = 'TR';
var ANCHOR_BL = 'BL', ANCHOR_BR = 'BR', ANCHOR_BC = 'BC', ANCHOR_CC = 'CC';

var SAFE_ZONE = { top: 25, bottom: 25, left: 15, right: 15 };

function resolveAnchor(anchor, w, h, ox, oy, cw, ch) {
  ox += SAFE_ZONE.left;
  oy += SAFE_ZONE.top;
  switch (anchor) {
    case ANCHOR_TL: return { x: ox, y: oy };
    case ANCHOR_TC: return { x: (cw - w) / 2 + ox - SAFE_ZONE.left, y: oy };
    case ANCHOR_TR: return { x: cw - w - ox - SAFE_ZONE.left + SAFE_ZONE.right, y: oy };
    case ANCHOR_BL: return { x: ox, y: ch - h - oy };
    case ANCHOR_BR: return { x: cw - w - ox - SAFE_ZONE.left + SAFE_ZONE.right, y: ch - h - oy };
    case ANCHOR_BC: return { x: (cw - w) / 2 + ox - SAFE_ZONE.left, y: ch - h - oy };
    case ANCHOR_CC: return { x: (cw - w) / 2 + ox, y: (ch - h) / 2 + oy };
  }
  return { x: ox, y: oy };
}

function getUiScale(cw) {
  return cw < 768 ? 1.2 : 1.0;
}

function UIManager(ctx) {
  this.ctx = ctx;
  this.time = 0;
  this.pressAnims = {};
  this.shopOpen = false;
  this.shopScroll = 0;
  this.shopMaxScroll = 0;
  this.tooltipData = null;
  this.hoveredUpgrade = null;

  // Touch drag
  this._dragStartY = 0;
  this._dragStartScroll = 0;
  this._isDragging = false;
}

UIManager.prototype.update = function(time) {
  this.time = time;
  var dt = 16;
  for (var k in this.pressAnims) {
    if (this.pressAnims.hasOwnProperty(k)) {
      this.pressAnims[k].timer -= dt * 0.004;
      if (this.pressAnims[k].timer <= 0) {
        delete this.pressAnims[k];
      }
    }
  }
};

UIManager.prototype.press = function(id) {
  this.pressAnims[id] = { timer: 0.3 };
};

UIManager.prototype._getPressScale = function(id) {
  var p = this.pressAnims[id];
  if (!p) return 1;
  var t = p.timer / 0.3;
  return t < 0.15 ? (1 + t * 0.8) : (1 + (0.15 - (t - 0.15)) * 0.3);
};

UIManager.prototype._getScale = function() {
  return getUiScale(this.ctx.canvas.width);
};

// ── TOP BAR (Glassmorphism) ──
UIManager.prototype.drawTopBar = function(economy) {
  var ctx = this.ctx;
  var w = ctx.canvas.width;
  var barH = 48;
  var s = this._getScale();

  ctx.save();
  var goldRushActive = typeof goldRushManager !== 'undefined' && goldRushManager && typeof goldRushManager.isActive === 'function' && goldRushManager.isActive();
  // Glassmorphism background
  if (goldRushActive) {
    ctx.fillStyle = 'rgba(90, 70, 0, 0.75)';
  } else {
    ctx.fillStyle = 'rgba(8, 10, 20, 0.65)';
  }
  ctx.beginPath();
  this._roundRect(ctx, SAFE_ZONE.left, 0, w - SAFE_ZONE.left - SAFE_ZONE.right, barH, 10);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.beginPath();
  this._roundRect(ctx, SAFE_ZONE.left, 0, w - SAFE_ZONE.left - SAFE_ZONE.right, barH / 2, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  this._roundRect(ctx, SAFE_ZONE.left, 0, w - SAFE_ZONE.left - SAFE_ZONE.right, barH, 10);
  ctx.stroke();

  ctx.textBaseline = 'middle';

  // LEFT: Coins
  var lx = SAFE_ZONE.left + 16 * s;
  ctx.textAlign = 'left';
  ctx.shadowColor = '#ffd700';
  ctx.shadowBlur = 8;
  ctx.font = 'bold ' + Math.round(16 * s) + 'px monospace';
  ctx.fillStyle = '#ffd700';
  ctx.fillText('$', lx, barH / 2);
  ctx.shadowBlur = 0;
  ctx.font = 'bold ' + Math.round(16 * s) + 'px monospace';
  ctx.fillStyle = '#fff';
  ctx.fillText(UIManager.formatNum(economy.coins), lx + 22 * s, barH / 2);

  // CENTER: Prestige
  if (economy.prestigePoints > 0) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd700';
    ctx.font = Math.round(14 * s) + 'px monospace';
    ctx.fillText('★ ' + economy.prestigePoints, w / 2, barH / 2);
    ctx.fillStyle = '#a8b2d1';
    ctx.font = Math.round(10 * s) + 'px monospace';
    ctx.fillText('x' + economy.multiplier.toFixed(1), w / 2 + 60 * s, barH / 2);
  }

  if (goldRushActive) {
    var blink = Math.sin(this.time * 0.01) > 0;
    ctx.textAlign = 'center';
    ctx.fillStyle = blink ? '#ffd700' : '#ffe066';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = blink ? 12 : 4;
    ctx.font = 'bold ' + Math.round(11 * s) + 'px monospace';
    var gy = economy.prestigePoints > 0 ? barH / 2 + 14 * s : barH / 2;
    if (economy.prestigePoints > 0) {
      ctx.font = 'bold ' + Math.round(9 * s) + 'px monospace';
      gy = barH / 2 + 14;
    }
    ctx.fillText('⚡ GOLD RUSH x' + GOLD_RUSH.valueMultiplier + '!', w / 2, gy);
    ctx.shadowBlur = 0;
  }

  // RIGHT: Stats button
  var btnSize = Math.round(32 * s);
  var rightAnchor = resolveAnchor(ANCHOR_TR, btnSize, btnSize, 10 * s, (barH - btnSize) / 2, w, barH);
  var bx = rightAnchor.x, by = rightAnchor.y;
  var pScale = this._getPressScale('stats');
  ctx.save();
  ctx.translate(bx + btnSize / 2, by + btnSize / 2);
  ctx.scale(pScale, pScale);
  ctx.translate(-(bx + btnSize / 2), -(by + btnSize / 2));
  ctx.fillStyle = 'rgba(68, 136, 255, 0.2)';
  ctx.strokeStyle = 'rgba(68, 136, 255, 0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  this._roundRect(ctx, bx, by, btnSize, btnSize, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#6aadff';
  ctx.font = 'bold ' + Math.round(16 * s) + 'px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('i', bx + btnSize / 2, by + btnSize / 2 + 1);
  ctx.restore();

  ctx.restore();
  return { x: bx, y: by, w: btnSize, h: btnSize };
};

// ── FLOATING INVENTORY BAR ──
UIManager.prototype.drawInventoryBar = function(player, screenX, screenY, camera) {
  if (player.inventory <= 0) return;
  var ctx = this.ctx;
  var s = this._getScale();
  var barW = Math.round(60 * s);
  var barH = Math.round(6 * s);
  var x = screenX - barW / 2;
  var y = screenY - 30 * s;

  // Clamp to screen
  var w = ctx.canvas.width;
  var h = ctx.canvas.height;
  if (x < 10) x = 10;
  if (x + barW > w - 10) x = w - barW - 10;
  if (y < 10) y = 10;
  if (y > h - 10) return;

  ctx.save();
  var pct = player.maxCapacity > 0 ? player.inventory / player.maxCapacity : 0;
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath();
  this._roundRect(ctx, x, y, barW, barH, barH / 2);
  ctx.fill();

  if (pct > 0) {
    var color = player.depositValue >= 15 ? '#f15bb5' : player.depositValue > 1 ? '#00b4d8' : '#ffb703';
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;
    ctx.fillStyle = color;
    ctx.beginPath();
    this._roundRect(ctx, x, y, barW * pct, barH, barH / 2);
    ctx.fill();
  }
  ctx.restore();
};

// ── BOTTOM RIGHT ACTIONS ──
UIManager.prototype.drawBottomActions = function(boostActive, boostTimeLeft, economy, refinery, camera) {
  var ctx = this.ctx;
  var w = ctx.canvas.width;
  var h = ctx.canvas.height;
  var s = this._getScale();
  var size = Math.round(44 * s);
  var gap = Math.round(10 * s);
  var totalH = size * 2 + gap;
  var startY = h - SAFE_ZONE.bottom - totalH;
  var startX = w - SAFE_ZONE.right - size;

  var results = { boost: null, stats: null, refinery: null };

  // Boost button
  var bx = startX, by = startY;
  ctx.save();
  if (boostActive) {
    ctx.shadowColor = '#ffbe0b';
    ctx.shadowBlur = 14;
    ctx.fillStyle = 'rgba(255, 190, 11, 0.15)';
  } else {
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
  }
  ctx.strokeStyle = boostActive ? '#ffbe0b' : 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(bx + size / 2, by + size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Radial timer wipe
  if (boostActive) {
    var pct = Math.max(0, boostTimeLeft / BOOST_DURATION_MS);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(bx + size / 2, by + size / 2);
    ctx.arc(bx + size / 2, by + size / 2, size / 2 + 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - pct));
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 190, 11, 0.2)';
    ctx.fill();
    ctx.restore();
  }

  ctx.fillStyle = boostActive ? '#ffbe0b' : 'rgba(255,255,255,0.4)';
  ctx.font = Math.round(22 * s) + 'px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('⚡', bx + size / 2, by + size / 2 + 1);

  if (boostActive) {
    ctx.fillStyle = '#ffbe0b';
    ctx.font = Math.round(8 * s) + 'px monospace';
    ctx.fillText(Math.ceil(boostTimeLeft / 1000) + 's', bx + size / 2, by + size + 12 * s);
  }
  ctx.restore();
  results.boost = { x: bx, y: by, w: size, h: size, id: 'boost' };

  // Stats button (second circle)
  var sx = startX, sy = startY + size + gap;
  ctx.save();
  ctx.fillStyle = 'rgba(68, 136, 255, 0.12)';
  ctx.strokeStyle = 'rgba(68, 136, 255, 0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(sx + size / 2, sy + size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#6aadff';
  ctx.font = 'bold ' + Math.round(18 * s) + 'px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('i', sx + size / 2, sy + size / 2 + 1);
  ctx.restore();
  results.stats = { x: sx, y: sy, w: size, h: size, id: 'stats' };

  return results;
};

// ── SHOP TOGGLE ──
UIManager.prototype.drawShopToggle = function() {
  var ctx = this.ctx;
  var w = ctx.canvas.width;
  var h = ctx.canvas.height;
  var s = this._getScale();
  var size = Math.round(40 * s);
  var pos = resolveAnchor(ANCHOR_BL, size, size, 12 * s, 12 * s, w, h);
  var x = pos.x, y = pos.y;

  ctx.save();
  ctx.fillStyle = 'rgba(42, 157, 143, 0.2)';
  ctx.strokeStyle = this.shopOpen ? '#e94560' : '#2a9d8f';
  ctx.lineWidth = 2;
  ctx.shadowColor = this.shopOpen ? '#e94560' : '#2a9d8f';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  this._roundRect(ctx, x, y, size, size, 8);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.stroke();
  ctx.fillStyle = this.shopOpen ? '#e94560' : '#2a9d8f';
  ctx.font = 'bold ' + Math.round(20 * s) + 'px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(this.shopOpen ? '✕' : '⌂', x + size / 2, y + size / 2);
  ctx.restore();
  return { x: x, y: y, w: size, h: size, id: 'shop_toggle' };
};

// ── SHOP PANEL ──
UIManager.prototype.drawShopPanel = function(economy, player) {
  if (!this.shopOpen) return [];
  var ctx = this.ctx;
  var w = ctx.canvas.width;
  var h = ctx.canvas.height;
  var s = this._getScale();
  var pw = Math.min(380, w - SAFE_ZONE.left - SAFE_ZONE.right - 20);
  var ph = Math.min(320, h * 0.45);
  var pos = resolveAnchor(ANCHOR_BC, pw, ph, 0, SAFE_ZONE.bottom + 8, w, h);
  var px = pos.x, py = pos.y;
  var cardH = Math.round(44 * s);
  var gap = Math.round(4 * s);
  var contentW = pw - 16;

  // Background
  ctx.save();
  ctx.fillStyle = 'rgba(8, 10, 20, 0.85)';
  ctx.beginPath();
  this._roundRect(ctx, px, py, pw, ph, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(42, 157, 143, 0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  this._roundRect(ctx, px, py, pw, ph, 12);
  ctx.stroke();

  // Title
  ctx.fillStyle = '#a8b2d1';
  ctx.font = 'bold ' + Math.round(11 * s) + 'px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('TIENDA', px + pw / 2, py + 8 * s);

  // Clip region for scroll
  ctx.save();
  ctx.beginPath();
  this._roundRect(ctx, px + 8, py + 28 * s, pw - 16, ph - 36 * s, 6);
  ctx.clip();

  // Build upgrade list
  var upgrades = [];
  upgrades.push({ id: 'speed', label: 'Velocidad', cost: economy.upgradeCosts.speed, canAfford: economy.coins >= economy.upgradeCosts.speed, icon: '◈', color: '#f4a261', bought: false, owned: true, type: 'speed' });
  upgrades.push({ id: 'cap', label: 'Capacidad', cost: economy.upgradeCosts.capacity, canAfford: economy.coins >= economy.upgradeCosts.capacity, icon: '▣', color: '#e76f51', bought: false, owned: true, type: 'capacity' });

  if (!economy.hasHelper1) {
    upgrades.push({ id: 'helper1', label: 'Droid MK1', cost: economy.upgradeCosts.helper1, canAfford: economy.coins >= economy.upgradeCosts.helper1, icon: '◊', color: '#9b5de5', bought: false, owned: false, type: 'helper1' });
  }
  if (economy.hasHelper1) {
    upgrades.push({ id: 'hSpeed', label: 'Droid Vel.', cost: economy.upgradeCosts.helperSpeed, canAfford: economy.coins >= economy.upgradeCosts.helperSpeed, icon: '▶', color: '#c77dff', bought: false, owned: true, type: 'helperSpeed' });
    upgrades.push({ id: 'hCap', label: 'Droid Cap.', cost: economy.upgradeCosts.helperCapacity, canAfford: economy.coins >= economy.upgradeCosts.helperCapacity, icon: '▲', color: '#7b2cbf', bought: false, owned: true, type: 'helperCapacity' });
  }
  if (economy.hasHelper1 && !economy.crystalUnlocked) {
    upgrades.push({ id: 'crystal', label: 'Cristal', cost: economy.upgradeCosts.crystal, canAfford: economy.coins >= economy.upgradeCosts.crystal, icon: '◆', color: '#00b4d8', bought: false, owned: false, type: 'crystal' });
  }
  if (economy.crystalUnlocked && !economy.hasHelper2) {
    upgrades.push({ id: 'helper2', label: 'Droid MK2', cost: economy.upgradeCosts.helper2, canAfford: economy.coins >= economy.upgradeCosts.helper2, icon: '◊', color: '#48cae4', bought: false, owned: false, type: 'helper2' });
  }
  if (economy.hasHelper2 && !economy.zone2Unlocked) {
    upgrades.push({ id: 'zone2', label: 'Zona 2', cost: economy.upgradeCosts.unlockZone2, canAfford: economy.coins >= economy.upgradeCosts.unlockZone2, icon: '◈', color: '#f77f00', bought: false, owned: false, type: 'unlockZone2' });
  }
  if (economy.zone2Unlocked && !economy.refineryUnlocked) {
    upgrades.push({ id: 'refinery', label: 'Refinería', cost: economy.upgradeCosts.refinery, canAfford: economy.coins >= economy.upgradeCosts.refinery, icon: '⎔', color: '#f15bb5', bought: false, owned: false, type: 'refinery' });
  }
  // Prestige always at end
  var pCost = Math.round(CFG.prestige.baseCost * Math.pow(CFG.prestige.costMultiplier, economy.prestigePoints));
  upgrades.push({ id: 'prestige', label: 'Prestigio', cost: pCost, canAfford: economy.coins >= pCost, icon: '★', color: '#ffd700', bought: false, owned: true, type: 'prestige' });
  if(typeof PRESTIGE_INFINITE !== 'undefined'){
    for(var pi=0; pi<PRESTIGE_INFINITE.length; pi++){
      var inode=PRESTIGE_INFINITE[pi];
      var lvl=(economy.prestigeInfinite && economy.prestigeInfinite[inode.id])||0;
      if(typeof S!=='undefined' && S.prestigeInfinite) lvl=S.prestigeInfinite[inode.id]||lvl;
      var iCost=Math.floor(inode.baseCost * Math.pow(inode.costMult, lvl));
      var can=economy.prestigePoints >= iCost;
      upgrades.push({ id:'inf_'+inode.id, label: inode.name+' Lv'+lvl, cost: iCost, canAfford: can, icon:'∞', color:'#ffd700', bought:false, owned:true, type:'inf_'+inode.id, infiniteId:inode.id, lvl:lvl, desc:inode.desc });
    }
  }

  var contentH = upgrades.length * (cardH + gap);
  this.shopMaxScroll = Math.max(0, contentH - (ph - 36 * s));
  if (this.shopScroll > this.shopMaxScroll) this.shopScroll = this.shopMaxScroll;
  if (this.shopScroll < 0) this.shopScroll = 0;

  var startY = py + 28 * s - this.shopScroll;
  var cardRects = [];

  for (var i = 0; i < upgrades.length; i++) {
    var ug = upgrades[i];
    var cy = startY + i * (cardH + gap);
    if (cy + cardH < py + 28 * s || cy > py + ph - 8 * s) continue;

    var pScale = this._getPressScale('shop_' + ug.id);
    ctx.save();
    ctx.translate(px + 8 + contentW / 2, cy + cardH / 2);
    ctx.scale(pScale, pScale);
    ctx.translate(-(px + 8 + contentW / 2), -(cy + cardH / 2));

    // Card background
    if (ug.canAfford) {
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      ctx.strokeStyle = ug.color;
      ctx.shadowColor = ug.color;
      ctx.shadowBlur = 6;
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.strokeStyle = 'rgba(100,100,100,0.3)';
      ctx.shadowBlur = 0;
    }
    ctx.lineWidth = 1;
    ctx.beginPath();
    this._roundRect(ctx, px + 8, cy, contentW, cardH, 6);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.stroke();

    // Icon
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = ug.color;
    ctx.font = Math.round(16 * s) + 'px monospace';
    ctx.fillText(ug.icon, px + 24 * s, cy + cardH / 2);

    // Name
    ctx.textAlign = 'left';
    ctx.fillStyle = ug.canAfford ? '#ccd6f6' : '#666';
    ctx.font = Math.round(11 * s) + 'px monospace';
    ctx.fillText(ug.label, px + 40 * s, cy + cardH / 2);

    // Cost
    ctx.textAlign = 'right';
    if (ug.canAfford) {
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold ' + Math.round(10 * s) + 'px monospace';
    } else {
      ctx.fillStyle = '#e94560';
      ctx.font = Math.round(10 * s) + 'px monospace';
    }
    ctx.fillText('$' + ug.cost, px + pw - 60 * s, cy + cardH / 2);

    // Buy button
    var bw = Math.round(40 * s), bh = Math.round(20 * s);
    var bBtnX = px + pw - 16 - bw;
    var bBtnY = cy + (cardH - bh) / 2;
    if (ug.canAfford) {
      ctx.shadowColor = ug.color;
      ctx.shadowBlur = 6;
      ctx.fillStyle = ug.color;
    } else {
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#333';
    }
    ctx.beginPath();
    this._roundRect(ctx, bBtnX, bBtnY, bw, bh, 4);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#000';
    ctx.font = 'bold ' + Math.round(8 * s) + 'px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('COMPRAR', bBtnX + bw / 2, bBtnY + bh / 2);

    ctx.restore();

    cardRects.push({ x: px + 8, y: cy, w: contentW, h: cardH, id: 'shop_' + ug.id, type: ug.type });
  }

  ctx.restore(); // clip
  ctx.restore(); // panel
  return cardRects;
};

// ── TOOLTIP ──
UIManager.prototype.drawTooltip = function(lines, mx, my) {
  if (!lines || lines.length === 0) return;
  var ctx = this.ctx;
  var cw = ctx.canvas.width, ch = ctx.canvas.height;
  var s = this._getScale();
  var lh = Math.round(16 * s);
  var pad = Math.round(8 * s);
  var maxW = 0;
  ctx.font = Math.round(11 * s) + 'px monospace';
  for (var i = 0; i < lines.length; i++) {
    var m = ctx.measureText(lines[i]);
    if (m.width > maxW) maxW = m.width;
  }
  var tw = maxW + pad * 2;
  var th = lines.length * lh + pad * 2;

  // Smart positioning
  var tx = mx + 14 * s;
  var ty = my - 10 * s;
  if (tx + tw > cw - SAFE_ZONE.right) tx = mx - tw - 14 * s;
  if (ty + th > ch - SAFE_ZONE.bottom) ty = ch - SAFE_ZONE.bottom - th;
  if (ty < SAFE_ZONE.top) ty = SAFE_ZONE.top;

  ctx.save();
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
  ctx.clearRect(tx - 1, ty - 1, tw + 2, th + 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  this._roundRect(ctx, tx, ty, tw, th, 4);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#ccd6f6';
  ctx.font = Math.round(11 * s) + 'px monospace';
  for (var i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], tx + pad, ty + pad + i * lh);
  }
  ctx.restore();
};

// ── OVERLAYS ──

// Offline popup
UIManager.prototype.drawOfflinePopup = function(earnings) {
  var ctx = this.ctx;
  var w = ctx.canvas.width, h = ctx.canvas.height;
  var s = this._getScale();
  var pw = Math.min(400, w - 40);
  var ph = 260;
  var px = (w - pw) / 2, py = (h - ph) / 2;

  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.fillRect(0, 0, w, h);
  var bgGrad = ctx.createLinearGradient(px, py, px, py + ph);
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
  ctx.font = 'bold ' + Math.round(22 * s) + 'px monospace';
  ctx.fillText('¡Bienvenido de vuelta!', w / 2, py + 20);
  ctx.fillStyle = '#a8b2d1';
  ctx.font = Math.round(13 * s) + 'px monospace';
  ctx.fillText('Tus droids trabajaron mientras', w / 2, py + 58);
  ctx.fillText('estabas fuera:', w / 2, py + 76);

  var ly = py + 100;
  if (earnings.goldCoins > 0) {
    ctx.fillStyle = '#ffb703';
    ctx.font = Math.round(12 * s) + 'px monospace';
    ctx.fillText('Oro recolectado: +' + Math.floor(earnings.goldCoins), w / 2, ly);
    ly += 20;
  }
  if (earnings.crystalCoins > 0) {
    ctx.fillStyle = '#00b4d8';
    ctx.font = Math.round(12 * s) + 'px monospace';
    ctx.fillText('Cristales recolectados: +' + Math.floor(earnings.crystalCoins), w / 2, ly);
    ly += 20;
  }
  if (earnings.refineryCoins > 0) {
    ctx.fillStyle = '#f15bb5';
    ctx.font = Math.round(12 * s) + 'px monospace';
    ctx.fillText('Energía procesada: +' + Math.floor(earnings.refineryCoins), w / 2, ly);
    ly += 20;
  }

  var btnW = 160, btnH = 40;
  var btnX = (w - btnW) / 2, btnY = py + ph - 60;
  var pulse = Math.sin(this.time * 0.005) * 0.1 + 1;
  ctx.shadowColor = '#ffd700';
  ctx.shadowBlur = 12 * pulse;
  var btnGrad = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH);
  btnGrad.addColorStop(0, '#f0a500');
  btnGrad.addColorStop(1, '#c77d00');
  ctx.fillStyle = btnGrad;
  ctx.beginPath();
  this._roundRect(ctx, btnX, btnY, btnW, btnH, 6);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#fff';
  ctx.font = 'bold ' + Math.round(16 * s) + 'px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('RECLAMAR', w / 2, btnY + btnH / 2);
  ctx.restore();
  return { x: btnX, y: btnY, w: btnW, h: btnH };
};

// Stats overlay
UIManager.prototype.drawStatsOverlay = function(stats, playTimeMs) {
  var ctx = this.ctx;
  var w = ctx.canvas.width, h = ctx.canvas.height;
  var s = this._getScale();
  var pw = Math.min(380, w - 40);
  var ph = 320;
  var px = (w - pw) / 2, py = (h - ph) / 2;

  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(0, 0, w, h);
  var bgGrad = ctx.createLinearGradient(px, py, px, py + ph);
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
  ctx.font = 'bold ' + Math.round(20 * s) + 'px monospace';
  ctx.fillText('ESTADÍSTICAS', w / 2, py + 16);

  var totalSec = Math.floor(playTimeMs / 1000);
  var totalMin = Math.floor(totalSec / 60);
  var totalHr = Math.floor(totalMin / 60);
  var timeStr = totalHr > 0 ? totalHr + 'h ' + (totalMin % 60) + 'm ' + (totalSec % 60) + 's'
    : totalMin > 0 ? totalMin + 'm ' + (totalSec % 60) + 's' : totalSec + 's';

  var lines = [
    { label: 'Tiempo de juego', value: timeStr },
    { label: 'Oro recolectado', value: UIManager.formatNum(stats.totalGold || 0) },
    { label: 'Cristales recolectados', value: UIManager.formatNum(stats.totalCrystals || 0) },
    { label: 'Monedas totales', value: UIManager.formatNum(stats.totalCoins || 0) },
    { label: 'Prestigios', value: String(stats.prestigeCount || 0) },
  ];

  var ly = py + 52;
  for (var i = 0; i < lines.length; i++) {
    ctx.fillStyle = '#a8b2d1';
    ctx.font = Math.round(13 * s) + 'px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(lines[i].label, px + 30, ly);
    ctx.fillStyle = '#ccd6f6';
    ctx.textAlign = 'right';
    ctx.fillText(lines[i].value, px + pw - 30, ly);
    ly += 30;
  }

  var btnW = 140, btnH = 36;
  var btnX = (w - btnW) / 2, btnY = py + ph - 50;
  ctx.fillStyle = '#e94560';
  ctx.beginPath();
  this._roundRect(ctx, btnX, btnY, btnW, btnH, 6);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold ' + Math.round(14 * s) + 'px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('CERRAR', w / 2, btnY + btnH / 2);
  ctx.restore();
  return { x: btnX, y: btnY, w: btnW, h: btnH };
};

// Milestone panel
UIManager.prototype.drawMilestonePanel = function(milestone, progress) {
  if (!milestone) return;
  var ctx = this.ctx;
  var w = ctx.canvas.width;
  var s = this._getScale();
  var pw = Math.min(200, w * 0.3);
  var ph = Math.round(60 * s);
  var px = 10, py = SAFE_ZONE.top + 52 * s;

  ctx.save();
  ctx.fillStyle = 'rgba(8, 10, 20, 0.75)';
  ctx.beginPath();
  this._roundRect(ctx, px, py, pw, ph, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  this._roundRect(ctx, px, py, pw, ph, 8);
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold ' + Math.round(9 * s) + 'px monospace';
  ctx.fillText('OBJETIVO', px + 8, py + 6);
  ctx.fillStyle = '#ccd6f6';
  ctx.font = Math.round(9 * s) + 'px monospace';
  ctx.fillText(milestone.desc, px + 8, py + 20);

  var barW = pw - 16, barH = Math.round(6 * s);
  var barX = px + 8, barY = py + ph - barH - 6;
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.beginPath();
  this._roundRect(ctx, barX, barY, barW, barH, 3);
  ctx.fill();

  var pct = Math.min(progress / milestone.target, 1);
  if (pct > 0) {
    var pulse = Math.sin(this.time * 0.004) * 0.15 + 0.85;
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 6 * pulse;
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    this._roundRect(ctx, barX, barY, barW * pct, barH, 3);
    ctx.fill();
  }
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#a8b2d1';
  ctx.font = Math.round(7 * s) + 'px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(progress + '/' + milestone.target, px + pw - 8, barY - 10);
  ctx.restore();
};

// Pause menu
UIManager.prototype.drawPauseMenu = function(economy) {
  var ctx = this.ctx;
  var w = ctx.canvas.width, h = ctx.canvas.height;
  var s = this._getScale();
  var pw = Math.min(420, w - 40);
  var ph = 280;
  var px = (w - pw) / 2, py = (h - ph) / 2;

  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(0, 0, w, h);
  var bgGrad = ctx.createLinearGradient(px, py, px, py + ph);
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
  ctx.font = 'bold ' + Math.round(24 * s) + 'px monospace';
  ctx.fillText('■ PAUSADO', w / 2, py + 20);

  var runSec = Math.floor(economy.playTime / 1000);
  var runMin = Math.floor(runSec / 60);
  var runHr = Math.floor(runMin / 60);
  var timeStr = runHr > 0 ? runHr + 'h ' + (runMin % 60) + 'm ' + (runSec % 60) + 's'
    : runMin > 0 ? runMin + 'm ' + (runSec % 60) + 's' : runSec + 's';

  var lines = [
    { label: 'Tiempo de partida:', value: timeStr },
    { label: 'Energía vendida:', value: economy.totalEnergySold + ' coins' },
    { label: 'Mejor prestigio:', value: economy.fastestPrestige === Infinity ? '--' : (function() {
      var bs = Math.floor(economy.fastestPrestige / 1000);
      var bm = Math.floor(bs / 60);
      var bh = Math.floor(bm / 60);
      return bh > 0 ? bh + 'h ' + (bm % 60) + 'm ' + (bs % 60) + 's'
        : bm > 0 ? bm + 'm ' + (bs % 60) + 's' : bs + 's';
    })() },
  ];

  var lx = py + 70;
  for (var i = 0; i < lines.length; i++) {
    ctx.fillStyle = '#a8b2d1';
    ctx.font = Math.round(14 * s) + 'px monospace';
    ctx.fillText(lines[i].label, w / 2, lx);
    ctx.fillStyle = '#ccd6f6';
    ctx.font = Math.round(16 * s) + 'px monospace';
    ctx.fillText(lines[i].value, w / 2, lx + 22);
    lx += 55;
  }
  ctx.fillStyle = '#555';
  ctx.font = Math.round(13 * s) + 'px monospace';
  ctx.fillText('ESC / P para continuar', w / 2, py + ph - 30);
  ctx.restore();
};

// ── HELPERS ──
UIManager.formatNum = function(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return Math.floor(n).toString();
};

UIManager.prototype._roundRect = function(ctx, x, y, w, h, r) {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
};
