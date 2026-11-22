function init() {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  const input = new InputManager(canvas);
  let camera;

  function resize() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    if (camera) {
      camera.width = canvas.width;
      camera.height = canvas.height;
    }
  }
  window.addEventListener('resize', resize);
  resize();

  camera = new Camera(canvas.width, canvas.height);

  const renderer = new Renderer(ctx);
  const ui = new UIManager(ctx);
  const player = new Player(BASE.x, BASE.y);
  const economy = new Economy();
  const particles = new ParticlePool(150);
  const textPool = new TextPool(60);
  const refinery = new Refinery(1600, 800);
  const audio = new AudioManager();
  var goldRushManager = null;

  canvas.addEventListener('click', function() { audio.init(); }, { once: true });
  document.addEventListener('keydown', function() { audio.init(); }, { once: true });

  if (typeof initAdsSDK === 'function') initAdsSDK();

  const loadResult = loadGame(player, economy, refinery);
  const savedData = loadResult ? loadResult.data : null;
  const offlineSeconds = loadResult ? loadResult.offlineSeconds : 0;
  if(typeof S!=='undefined'){ S.gr=economy.prestigePoints; if(economy.prestigeInfinite) S.prestigeInfinite=Object.assign({},economy.prestigeInfinite); if(typeof applyPrestigeBonuses==='function') applyPrestigeBonuses(); }

  let helper1 = null;
  let helper2 = null;
  let gameJustStarted = true;

  function createHelper(mode) {
    const h = new Helper(BASE.x, BASE.y, mode);
    for (let i = 0; i < economy.helperSpeedLevel; i++) h.upgradeSpeed();
    for (let i = 0; i < economy.helperCapLevel; i++) h.upgradeCapacity();
    if (gameJustStarted && savedData) {
      if (mode === 'gold') {
        if (typeof savedData.h1Speed === 'number') h.speed = Math.max(h.speed, savedData.h1Speed);
        if (typeof savedData.h1Cap === 'number') h.maxCapacity = Math.max(h.maxCapacity, savedData.h1Cap);
      }
      if (mode === 'crystal') {
        if (typeof savedData.h2Speed === 'number') h.speed = Math.max(h.speed, savedData.h2Speed);
        if (typeof savedData.h2Cap === 'number') h.maxCapacity = Math.max(h.maxCapacity, savedData.h2Cap);
      }
    }
    return h;
  }

  if (economy.hasHelper1) {
    helper1 = createHelper('gold');
  }
  if (economy.hasHelper2) {
    helper2 = createHelper('crystal');
  }
  gameJustStarted = false;

  // ── Offline earnings ──
  let showOfflinePopup = offlineSeconds > 60;
  let offlineEarnings = { goldCoins: 0, crystalCoins: 0, refineryCoins: 0 };
  if (offlineSeconds > 60) {
    const offlineFrames = offlineSeconds * 60;
    if (economy.hasHelper1 && helper1) {
      const h1Interval = CFG.resources.gold.helperHarvestInterval;
      const h1Harvests = Math.floor((offlineFrames * OFFLINE_EFFICIENCY) / h1Interval);
      offlineEarnings.goldCoins = Math.floor(h1Harvests * CFG.resources.gold.value * economy.multiplier);
    }
    if (economy.hasHelper2 && helper2) {
      const h2Interval = CFG.resources.crystal.helperHarvestInterval;
      const h2Harvests = Math.floor((offlineFrames * OFFLINE_EFFICIENCY) / h2Interval);
      if (economy.refineryUnlocked) {
        const processed = Math.min(
          Math.floor((offlineFrames * OFFLINE_EFFICIENCY) / CFG.refinery.processingSpeed),
          refinery ? refinery.input + Math.floor(h2Harvests) : 0
        );
        offlineEarnings.refineryCoins = Math.floor(processed * 15 * economy.multiplier);
      } else {
        offlineEarnings.crystalCoins = Math.floor(h2Harvests * CFG.resources.crystal.value * economy.multiplier);
      }
    }
  }

  // ── Boost ──
  let boostEndTime = 0;

  function activateBoost() {
    boostEndTime = Date.now() + BOOST_DURATION_MS;
  }

  function instantRefinery() {
    if (!refinery || refinery.input <= 0) return;
    const transfer = Math.min(refinery.input, refinery.maxOutput - refinery.output);
    if (transfer > 0) {
      refinery.output += transfer;
      refinery.input -= transfer;
    }
  }

  function getPrestigeCost(level) {
    return Math.round(CFG.prestige.baseCost * Math.pow(CFG.prestige.costMultiplier, level));
  }

  function doPrestige(cost) {
    renderer.triggerPrestigeFlash();
    audio.playPrestige();
    announceStage('★ PRESTIGE: +1 PP', '#ffd700');
    textPool.emit(BTN.prestige.x, BTN.prestige.y - 30, '+' + Math.round(CFG.prestige.bonusPerPoint * 100) + '% MULT', '#ffbe0b', 99, 120);

    economy.stats.prestigeCount = (economy.stats.prestigeCount || 0) + 1;
    economy.coins -= cost;
    economy.prestigePoints += 1;
    if(typeof economy.recalcMultiplier==='function') economy.recalcMultiplier(); else economy.multiplier = 1 + economy.prestigePoints * CFG.prestige.bonusPerPoint;
    if(typeof S!=='undefined') S.gr=economy.prestigePoints;
    economy.playTime = 0;
    economy.hasHelper1 = false;
    economy.crystalUnlocked = false;
    economy.hasHelper2 = false;
    economy.zone2Unlocked = false;
    economy.refineryUnlocked = false;
    economy.helperSpeedLevel = 0;
    economy.helperCapLevel = 0;
    economy._resetCosts();

    helper1 = null;
    helper2 = null;
    player.speed = CFG.player.speed;
    player.maxCapacity = CFG.player.maxCapacity;
    player.inventory = 0;
    player.depositValue = 1;
    applyResourceLocks();
    saveGame(player, economy, helper1, helper2, refinery);
  }

  // ── Stats & Milestones ──
  let showStatsOverlay = false;
  let milestoneCompletionTimer = 0;
  let milestoneCompleteX = 0, milestoneCompleteY = 0;

  // Resources: 9 nodes — zone 1 gold moved closer to base
  const resources = [
    new Resource(350, 700, 'gold'),      // 0
    new Resource(350, 1300, 'gold'),     // 1
    new Resource(600, 400, 'crystal'),   // 2
    new Resource(600, 1600, 'crystal'),  // 3
    new Resource(1800, 400, 'gold'),     // 4
    new Resource(1800, 1600, 'gold'),    // 5
    new Resource(1400, 400, 'crystal'),  // 6
    new Resource(1600, 1000, 'crystal'), // 7
    new Resource(1400, 1600, 'crystal'), // 8
  ];

  function applyResourceLocks() {
    for (let i = 0; i < resources.length; i++) {
      const r = resources[i];
      if (i <= 1) {
        r.locked = false;
      } else if (i <= 3) {
        r.locked = !economy.crystalUnlocked;
      } else if (i <= 5) {
        r.locked = !economy.zone2Unlocked;
      } else {
        r.locked = !(economy.crystalUnlocked && economy.zone2Unlocked);
      }
    }
  }
  applyResourceLocks();

  // ── Pause ──
  let isPaused = false;
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
      isPaused = !isPaused;
      e.preventDefault();
    }
  });

  // ── Timers ──
  let harvestTimer = 0;
  let depositTimer = 0;
  let purchaseTimer = 0;
  let outputTimer = 0;

  // ── FPS ──
  let fps = 0, fpsFrameCount = 0, fpsAccum = 0;
  let lastTime = 0;

  // ── Screen-center stage announcement ──
  function announceStage(text, color) {
    const w = renderer.ctx.canvas.width;
    const h = renderer.ctx.canvas.height;
    const worldX = camera.x + w / 2;
    const worldY = camera.y + h / 3;
    textPool.emit(worldX, worldY, text, color, 99, 200);
  }

  goldRushManager = new GoldRushManager(function() {
    announceStage('⚡ GOLD RUSH x3!', '#ffd700');
    camera.shake(6);
  }, function() {
    announceStage('GOLD RUSH terminado', '#a8b2d1');
  });

  // ── Helper action handler ──
  function processHelperAction(helper, action, isCrystal) {
    const energyColor = '#ffbe0b';
    if (action === 1) {
      audio.playBlip();
      const color = isCrystal ? '#00b4d8' : '#ffb703';
      if (helper.target) {
        particles.emit(helper.target.x, helper.target.y, color, 3, 2, helper.x, helper.y);
        textPool.emit(helper.target.x, helper.target.y - 16, '+1', '#ffffff');
      }
    } else if (action === 2) {
      const value = Math.round(helper.depositValue * economy.multiplier * goldRushManager.getMultiplier());
      economy.stats.totalCoins += value;
      if (helper.depositValue >= 15) {
        particles.emit(helper.x, helper.y, energyColor, 9, 4, BASE.x, BASE.y, 3.0);
        camera.shake(3);
        textPool.emit(helper.x, helper.y - 16, '+' + value, energyColor, value);
        economy.totalEnergySold += value;
      } else {
        economy.stats.totalGold += 1;
        economy.stats.goldDeposited = (economy.stats.goldDeposited || 0) + 1;
        if (helper.depositValue > 1) economy.stats.totalCrystals += 1;
        particles.emit(helper.x, helper.y, helper.depositValue > 1 ? '#00b4d8' : '#2a9d8f', 3, 2, BASE.x, BASE.y);
        textPool.emit(helper.x, helper.y - 16, '+' + value, '#90ee90', value);
      }
      audio.playCoin();
      economy.addCoins(value);
      // Check milestones
      const completedMilestones = checkMilestones(economy);
      for (const m of completedMilestones) {
        textPool.emit(BASE.x, BASE.y - 40, '✦ ' + m.id + ' +$' + m.reward, '#ffd700', 99, 120);
        particles.emit(BASE.x, BASE.y, '#ffd700', 15, 5, BASE.x, BASE.y - 80, 4);
        milestoneCompletionTimer = 30;
        milestoneCompleteX = BASE.x;
        milestoneCompleteY = BASE.y;
      }
      saveGame(player, economy, helper1, helper2, refinery);
    } else if (action === 3) {
      particles.emit(helper.x, helper.y, '#00b4d8', 6, 3, refinery.inputPad.x, refinery.inputPad.y, 1.8);
      textPool.emit(helper.x, helper.y - 16, '>IN', '#00b4d8');
      saveGame(player, economy, helper1, helper2, refinery);
    } else if (action === 4) {
      particles.emit(refinery.outputPad.x, refinery.outputPad.y, '#f15bb5', 6, 3, helper.x, helper.y, 2.0);
      textPool.emit(helper.x, helper.y - 16, '+E', '#f15bb5');
      saveGame(player, economy, helper1, helper2, refinery);
    }
  }

  // ── Game Loop ──
  function gameLoop(time) {
    const dt = time - lastTime;
    lastTime = time;

    fpsFrameCount++;
    fpsAccum += dt;
    if (fpsAccum >= 1000) { fps = fpsFrameCount; fpsFrameCount = 0; fpsAccum -= 1000; }

    economy.playTime += dt;
    ui.update(time);

    // Shop scroll via wheel
    var wheelDelta = input.getWheelDelta();
    if (ui.shopOpen && wheelDelta !== 0) {
      ui.shopScroll += wheelDelta * 0.5;
    }

    if (!isPaused && !showStatsOverlay) {
      const px = player.x;
      const py = player.y;
      const moving = input.isMoving();

      if (moving && !player.hasMoved) player.hasMoved = true;

      const boostMult = Date.now() < boostEndTime ? 2 : 1;
      player.update(input.dx * boostMult, input.dy * boostMult, WORLD_WIDTH, WORLD_HEIGHT);
      camera.update(player, WORLD_WIDTH, WORLD_HEIGHT);

      for (let i = 0; i < resources.length; i++) resources[i].update();
      if (goldRushManager) goldRushManager.update();
      if (economy.refineryUnlocked) refinery.update();

      particles.update();
      textPool.update();

      if (helper1) {
        const action = helper1.update(resources, BASE, refinery, economy.zone2Unlocked, economy.refineryUnlocked);
        processHelperAction(helper1, action, false);
      }
      if (helper2) {
        const action = helper2.update(resources, BASE, refinery, economy.zone2Unlocked, economy.refineryUnlocked);
        processHelperAction(helper2, action, true);
      }

      // ── Player harvest ──
      if (!moving && player.inventory < player.maxCapacity) {
        harvestTimer++;
        for (let i = 0; i < resources.length; i++) {
          const res = resources[i];
          if (res.isRegenerating || res.currentAmount <= 0 || res.locked) continue;
          const dx = px - res.x;
          const dy = py - res.y;
          if (Math.sqrt(dx * dx + dy * dy) < player.radius + res.size / 2 && harvestTimer >= res.harvestInterval) {
            res.decrease(1);
            player.inventory++;
            audio.playBlip();
            player.depositValue = res.valuePerUnit;
            particles.emit(res.x, res.y, res.type === 'crystal' ? '#00b4d8' : '#ffb703', 4, 3, px, py);
            textPool.emit(res.x, res.y - 20, '+1', '#ffffff');
            harvestTimer = 0;
            break;
          }
        }
      } else {
        harvestTimer = 0;
      }

      // ── Deposit at base ──
      if (player.inventory > 0) {
        const bDist = Math.sqrt((px - BASE.x) ** 2 + (py - BASE.y) ** 2);
        if (bDist < player.radius + BASE.radius) {
          depositTimer++;
          if (depositTimer >= CFG.timing.depositInterval) {
            player.inventory--;
            const value = Math.round(player.depositValue * economy.multiplier * goldRushManager.getMultiplier());
            economy.addCoins(value);
            player.hasDeposited = true;
            economy.stats.totalCoins += value;
            if (player.depositValue >= 15) {
              particles.emit(px, py, '#ffbe0b', 12, 5, BASE.x, BASE.y, 3.0);
              camera.shake(4);
              textPool.emit(px, py - 20, '+' + value, '#ffbe0b', value);
              economy.totalEnergySold += value;
              economy.stats.crystalsProcessed = (economy.stats.crystalsProcessed || 0) + 1;
            } else {
              economy.stats.totalGold += 1;
              economy.stats.goldDeposited = (economy.stats.goldDeposited || 0) + 1;
              if (player.depositValue > 1) {
                economy.stats.totalCrystals += 1;
              }
              particles.emit(px, py, player.depositValue > 1 ? '#00b4d8' : '#2a9d8f', 4, 3, BASE.x, BASE.y);
              textPool.emit(px, py - 20, '+' + value, '#90ee90', value);
            }
            audio.playCoin();
            depositTimer = 0;
            // Check milestones
            const completedMilestones = checkMilestones(economy);
            for (const m of completedMilestones) {
              textPool.emit(BASE.x, BASE.y - 40, '✦ ' + m.id + ' +$' + m.reward, '#ffd700', 99, 120);
              particles.emit(BASE.x, BASE.y, '#ffd700', 15, 5, BASE.x, BASE.y - 80, 4);
              milestoneCompletionTimer = 30;
              milestoneCompleteX = BASE.x;
              milestoneCompleteY = BASE.y;
            }
            saveGame(player, economy, helper1, helper2, refinery);
          }
        } else {
          depositTimer = 0;
        }
      } else {
        depositTimer = 0;
      }

      // ── Refinery input ──
      if (economy.refineryUnlocked && player.inventory > 0 && player.depositValue === 3 && refinery.input < refinery.maxInput) {
        const iDist = Math.sqrt((px - refinery.inputPad.x) ** 2 + (py - refinery.inputPad.y) ** 2);
        if (iDist < player.radius + refinery.inputPad.radius) {
          const transfer = Math.min(player.inventory, refinery.maxInput - refinery.input);
          if (transfer > 0) {
            player.inventory -= transfer;
            refinery.input += transfer;
            particles.emit(refinery.inputPad.x, refinery.inputPad.y, '#00b4d8', 5, 3, refinery.x, refinery.y);
            textPool.emit(refinery.inputPad.x, refinery.inputPad.y - 20, '-' + transfer, '#00b4d8');
            saveGame(player, economy, helper1, helper2, refinery);
          }
        }
      }

      // ── Refinery output ──
      if (economy.refineryUnlocked && refinery.output > 0 && player.inventory < player.maxCapacity) {
        const oDist = Math.sqrt((px - refinery.outputPad.x) ** 2 + (py - refinery.outputPad.y) ** 2);
        if (oDist < player.radius + refinery.outputPad.radius) {
          outputTimer++;
          if (outputTimer >= CFG.timing.outputInterval) {
            outputTimer = 0;
            refinery.output--;
            player.inventory++;
            player.depositValue = 15;
            particles.emit(refinery.outputPad.x, refinery.outputPad.y, '#f15bb5', 4, 3, px, py);
            textPool.emit(refinery.outputPad.x, refinery.outputPad.y - 20, '+1', '#f15bb5');
            saveGame(player, economy, helper1, helper2, refinery);
          }
        } else {
          outputTimer = 0;
        }
      } else {
        outputTimer = 0;
      }

      // ── Purchases ──
      purchaseTimer++;
      if (!moving && purchaseTimer >= CFG.timing.purchaseCooldown) {
        let purchased = false;

        const tryBuy = (btn, upgradeType, cb) => {
          if (purchased) return;
          const dist = Math.sqrt((px - btn.x) ** 2 + (py - btn.y) ** 2);
          if (dist < player.radius + btn.r) {
            if (economy.buyUpgrade(upgradeType)) {
              particles.emit(btn.x, btn.y, '#fff', 6, 3, px, py);
              if (cb) cb();
              purchased = true;
              applyResourceLocks();
              saveGame(player, economy, helper1, helper2, refinery);
            }
          }
        };

        // Stage 1: speed / capacity
        tryBuy(BTN.speed, 'speed', () => player.upgradeSpeed());
        tryBuy(BTN.cap, 'capacity', () => player.upgradeCapacity());

        if (!economy.hasHelper1) {
          tryBuy(BTN.helper1, 'helper1', () => {
            helper1 = createHelper('gold');
            player.hasBoughtDroid = true;
            particles.emit(BASE.x, BASE.y, '#9b5de5', 14, 5, BASE.x, BASE.y - 60, 3.0);
            announceStage('▸ DROID ONLINE', '#9b5de5');
            camera.shake(4);
            // Check milestones after purchase
            const completedMilestones = checkMilestones(economy);
            for (const m of completedMilestones) {
              textPool.emit(BASE.x, BASE.y - 40, '✦ ' + m.id + ' +$' + m.reward, '#ffd700', 99, 120);
              particles.emit(BASE.x, BASE.y, '#ffd700', 15, 5, BASE.x, BASE.y - 80, 4);
              milestoneCompletionTimer = 30;
              milestoneCompleteX = BASE.x;
              milestoneCompleteY = BASE.y;
            }
          });
        }

        if (economy.hasHelper1) {
          tryBuy(BTN.hSpeed, 'helperSpeed', () => {
            if (helper1) helper1.upgradeSpeed();
            if (helper2) helper2.upgradeSpeed();
          });
          tryBuy(BTN.hCap, 'helperCapacity', () => {
            if (helper1) helper1.upgradeCapacity();
            if (helper2) helper2.upgradeCapacity();
          });
        }

        // Stage 2: crystal unlock
        if (economy.hasHelper1 && !economy.crystalUnlocked) {
          tryBuy(BTN.crystal, 'crystal', () => {
            announceStage('✦ CRYSTALS UNLOCKED', '#00b4d8');
            camera.shake(6);
          });
        }

        // Stage 3: helper2
        if (economy.crystalUnlocked && !economy.hasHelper2) {
          tryBuy(BTN.helper2, 'helper2', () => {
            helper2 = createHelper('crystal');
            particles.emit(BASE.x, BASE.y, '#48cae4', 14, 5, BASE.x, BASE.y - 60, 3.0);
            announceStage('▸ DROID MKII ONLINE', '#48cae4');
            camera.shake(4);
          });
        }

        // Stage 4: zone 2
        if (economy.hasHelper2 && !economy.zone2Unlocked) {
          tryBuy(BTN.zone2, 'unlockZone2', () => {
            announceStage('⚡ ZONE 2 UNLOCKED', '#f77f00');
            camera.shake(8);
          });
        }

        // Stage 5: refinery
        if (economy.zone2Unlocked && !economy.refineryUnlocked) {
          tryBuy(BTN.refinery, 'refinery', () => {
            announceStage('⎔ REFINERY ONLINE', '#f15bb5');
            camera.shake(8);
          });
        }

        // Stage 6: prestige (dynamic cost)
        const pCost = getPrestigeCost(economy.prestigePoints);
        if (!purchased && economy.coins >= pCost) {
          const pDist = Math.sqrt((px - BTN.prestige.x) ** 2 + (py - BTN.prestige.y) ** 2);
          if (pDist < player.radius + BTN.prestige.r) {
            doPrestige(pCost);
            purchased = true;
          }
        }

        if (purchased) purchaseTimer = 0;
      }
    }

    // ── RENDER ──
    renderer.clear(time);

    renderer.applyCamera(camera);
    renderer.drawGrid();
    renderer.drawZoneBoundary(economy.zone2Unlocked);

    for (let i = 0; i < resources.length; i++) {
      renderer.drawResource(resources[i]);
    }

    if (economy.refineryUnlocked) {
      renderer.drawRefinery(refinery);
    } else {
      const { ctx } = renderer;
      ctx.save();
      ctx.globalAlpha = 0.08;
      ctx.strokeStyle = '#f15bb5';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.strokeRect(1600 - 30, 800 - 20, 60, 40);
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(241, 91, 181, 0.15)';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', 1600, 800);
      ctx.restore();
    }

    renderer.drawBase();
    renderer.drawUpgradeBtns(economy);

    const prestigeCost = getPrestigeCost(economy.prestigePoints);
    renderer.drawPrestigeBtn(economy.coins >= prestigeCost);

    if (helper1) {
      renderer.drawHelper(helper1, Math.sin(helper1.bobPhase) * 1.5, 'gold');
    }
    if (helper2) {
      renderer.drawHelper(helper2, Math.sin(helper2.bobPhase) * 1.5, 'crystal');
    }

    const pBob = Math.sin(player.bobPhase) * 2;
    renderer.drawPlayer(player.x, player.y, player.radius + pBob);
    renderer.drawParticles(particles);
    renderer.drawFloatingTexts(textPool);
    renderer.restoreCamera();

    renderer.drawVignette();
    renderer.drawPrestigeFlash();
    renderer.drawJoystick(input);

    // ── Screen-space UI via UIManager ──
    if (!showOfflinePopup && !showStatsOverlay) {
      // Glassmorphism top bar
      var topBarStatsRect = ui.drawTopBar(economy);

      // Floating inventory over player
      var screenPx = player.x - camera.x;
      var screenPy = player.y - camera.y;
      ui.drawInventoryBar(player, screenPx, screenPy, camera);

      // Bottom-right action buttons
      var boostActive = Date.now() < boostEndTime;
      var boostTimeLeft = Math.max(0, boostEndTime - Date.now());
      var actionRects = ui.drawBottomActions(boostActive, boostTimeLeft, economy, refinery, camera);

      // Milestone panel
      var currentMs = getCurrentMilestone(economy);
      if (currentMs) {
        ui.drawMilestonePanel(currentMs, getMilestoneProgress(currentMs, economy));
      }

      // Shop toggle
      var shopToggleRect = ui.drawShopToggle();

      // Shop panel (if open)
      var shopCardRects = ui.drawShopPanel(economy, player);

      // World-space refinery instant button
      var refineryBtnRect = null;
      if (economy.refineryUnlocked && refinery.input > 0 && refinery.output < refinery.maxOutput) {
        refineryBtnRect = renderer.drawRefineryInstantBtn(refinery, camera, true);
      }

      // ── Tooltip (hover) ──
      var mx = input.mouseX, my = input.mouseY;
      var tooltipLines = null;

      // Check hover on helpers
      if (mx >= 0 && my >= 0) {
        if (helper1) {
          var h1sx = helper1.x - camera.x, h1sy = helper1.y - camera.y;
          if (Math.abs(mx - h1sx) < 20 && Math.abs(my - h1sy) < 20) {
            tooltipLines = ['Droid 1 (Oro)', 'Vel: ' + helper1.speed.toFixed(1), 'Cap: ' + helper1.maxCapacity];
          }
        }
        if (!tooltipLines && helper2) {
          var h2sx = helper2.x - camera.x, h2sy = helper2.y - camera.y;
          if (Math.abs(mx - h2sx) < 20 && Math.abs(my - h2sy) < 20) {
            tooltipLines = ['Droid 2 (Cristal)', 'Vel: ' + helper2.speed.toFixed(1), 'Cap: ' + helper2.maxCapacity];
          }
        }
        if (!tooltipLines && economy.refineryUnlocked) {
          var rsx = refinery.x - camera.x, rsy = refinery.y - camera.y;
          if (Math.abs(mx - rsx) < 40 && Math.abs(my - rsy) < 30) {
            tooltipLines = [
              'Refinería',
              'Procesando: ' + refinery.processingTimer + '/' + refinery.processingSpeed + ' frames',
              'Cola: ' + refinery.input + ' Cristales',
              'Energía: ' + refinery.output + '/' + refinery.maxOutput,
            ];
          }
        }
      }

      if (tooltipLines) {
        ui.drawTooltip(tooltipLines, mx, my);
      }

      // ── Click handling ──
      var clicks = input.getClicks();
      var inRect = function(r, c) {
        return c.x >= r.x && c.x <= r.x + r.w && c.y >= r.y && c.y <= r.y + r.h;
      };

      for (var ci = 0; ci < clicks.length; ci++) {
        var click = clicks[ci];

        // Top bar stats button
        if (topBarStatsRect && inRect(topBarStatsRect, click)) {
          showStatsOverlay = true;
          continue;
        }

        // Bottom-right boost button
        if (actionRects && actionRects.boost && !boostActive && inRect(actionRects.boost, click)) {
          showRewardedAd(function() { activateBoost(); });
          ui.press('boost');
          continue;
        }

        // Bottom-right stats button
        if (actionRects && actionRects.stats && inRect(actionRects.stats, click)) {
          showStatsOverlay = true;
          continue;
        }

        // Shop toggle
        if (shopToggleRect && inRect(shopToggleRect, click)) {
          ui.shopOpen = !ui.shopOpen;
          ui.press('shop_toggle');
          continue;
        }

        // Shop upgrade cards
        if (ui.shopOpen && shopCardRects) {
          for (var sci = 0; sci < shopCardRects.length; sci++) {
            var card = shopCardRects[sci];
            if (inRect(card, click)) {
              // Attempt purchase via proximity (old system) ... for now use direct buy
              if (card.type === 'prestige') {
                var pCost = getPrestigeCost(economy.prestigePoints);
                if (economy.coins >= pCost) {
                  doPrestige(pCost);
                  ui.press(card.id);
                }
              } else if(card.type && card.type.indexOf('inf_')===0){
                var infId=card.type.slice(4);
                var ok=false;
                if(typeof buyInfinitePrestigeNode==='function' && typeof S!=='undefined'){
                  S.gr=economy.prestigePoints;
                  ok=buyInfinitePrestigeNode(infId);
                  if(ok){ economy.prestigePoints=S.gr; economy.prestigeInfinite=Object.assign({},S.prestigeInfinite); economy.applyInfiniteBonuses(); saveGame(player, economy, helper1, helper2, refinery); ui.press(card.id); textPool.emit(BASE.x, BASE.y-40,'∞ '+infId+' Lv'+(S.prestigeInfinite[infId]),'#ffd700',99,120); }
                } else if(typeof economy.buyInfinitePrestigeNode==='function'){
                  ok=economy.buyInfinitePrestigeNode(infId);
                  if(ok){ if(typeof S!=='undefined'){ S.gr=economy.prestigePoints; S.prestigeInfinite=Object.assign({},economy.prestigeInfinite); } saveGame(player, economy, helper1, helper2, refinery); ui.press(card.id); }
                }
              } else {
                if (economy.buyUpgrade(card.type)) {
                  particles.emit(BTN[card.type] ? BTN[card.type].x : BASE.x, BTN[card.type] ? BTN[card.type].y : BASE.y, '#fff', 6, 3, player.x, player.y);
                  if (card.type === 'helper1') {
                    helper1 = createHelper('gold');
                    player.hasBoughtDroid = true;
                    announceStage('▸ DROID ONLINE', '#9b5de5');
                    camera.shake(4);
                    var ms = checkMilestones(economy);
                    for (var mi = 0; mi < ms.length; mi++) {
                      textPool.emit(BASE.x, BASE.y - 40, '✦ ' + ms[mi].id + ' +$' + ms[mi].reward, '#ffd700', 99, 120);
                      particles.emit(BASE.x, BASE.y, '#ffd700', 15, 5, BASE.x, BASE.y - 80, 4);
                      milestoneCompletionTimer = 30;
                      milestoneCompleteX = BASE.x;
                      milestoneCompleteY = BASE.y;
                    }
                  } else if (card.type === 'helper2') {
                    helper2 = createHelper('crystal');
                    announceStage('▸ DROID MKII ONLINE', '#48cae4');
                    camera.shake(4);
                  } else if (card.type === 'crystal') {
                    announceStage('✦ CRYSTALS UNLOCKED', '#00b4d8');
                    camera.shake(6);
                  } else if (card.type === 'unlockZone2') {
                    announceStage('⚡ ZONE 2 UNLOCKED', '#f77f00');
                    camera.shake(8);
                  } else if (card.type === 'refinery') {
                    announceStage('⎔ REFINERY ONLINE', '#f15bb5');
                    camera.shake(8);
                  } else if (card.type === 'speed') {
                    player.upgradeSpeed();
                  } else if (card.type === 'capacity') {
                    player.upgradeCapacity();
                  } else if (card.type === 'helperSpeed') {
                    if (helper1) helper1.upgradeSpeed();
                    if (helper2) helper2.upgradeSpeed();
                  } else if (card.type === 'helperCapacity') {
                    if (helper1) helper1.upgradeCapacity();
                    if (helper2) helper2.upgradeCapacity();
                  }
                  applyResourceLocks();
                  ui.press(card.id);
                  saveGame(player, economy, helper1, helper2, refinery);
                }
              }
              continue;
            }
          }
        }

        // World-space refinery instant button
        if (refineryBtnRect && inRect(refineryBtnRect, click)) {
          showRewardedAd(function() { instantRefinery(); });
          continue;
        }
      }
    }

    // ── Pause menu (drawn before overlays) ──
    if (isPaused && !showStatsOverlay) {
      ui.drawPauseMenu(economy);
    }

    // ── Overlay popups ──
    var offlineBtnRect = null;
    if (showOfflinePopup) {
      offlineBtnRect = ui.drawOfflinePopup(offlineEarnings);
    }

    var statsCloseRect = null;
    if (showStatsOverlay) {
      statsCloseRect = ui.drawStatsOverlay(economy.stats, economy.playTime);
    }

    // Overlay click handling
    var clicks = input.getClicks();
    var inRect = function(r, c) {
      return c.x >= r.x && c.x <= r.x + r.w && c.y >= r.y && c.y <= r.y + r.h;
    };
    for (var ci = 0; ci < clicks.length; ci++) {
      var click = clicks[ci];
      if (showOfflinePopup && offlineBtnRect && inRect(offlineBtnRect, click)) {
        var totalOffline = Math.floor(offlineEarnings.goldCoins + offlineEarnings.crystalCoins + offlineEarnings.refineryCoins);
        economy.addCoins(totalOffline);
        economy.stats.totalCoins += totalOffline;
        showOfflinePopup = false;
        continue;
      }
      if (showStatsOverlay && statsCloseRect && inRect(statsCloseRect, click)) {
        showStatsOverlay = false;
        continue;
      }
    }

    // ── Milestone completion effect ──
    if (milestoneCompletionTimer > 0) {
      milestoneCompletionTimer--;
      particles.emit(milestoneCompleteX + (Math.random() - 0.5) * 100, milestoneCompleteY + (Math.random() - 0.5) * 100, '#ffd700', 2, 3, milestoneCompleteX, milestoneCompleteY - 40, 2);
    }

    // ── Guide arrows (onboarding) ──
    if (!showOfflinePopup && !showStatsOverlay) {
      if (!player.hasMoved) {
        var nearestGold = null;
        for (var gi = 0; gi < resources.length; gi++) {
          if (resources[gi].type === 'gold' && !resources[gi].locked) { nearestGold = resources[gi]; break; }
        }
        if (nearestGold) {
          var dx = nearestGold.x - player.x;
          var dy = nearestGold.y - player.y;
          var angle = Math.atan2(dy, dx);
          renderer.applyCamera(camera);
          renderer.drawGuideArrow(player.x, player.y, angle, 1);
          renderer.restoreCamera();
        }
      } else if (player.inventory >= player.maxCapacity && !player.hasDeposited) {
        var angle = Math.atan2(BASE.y - player.y, BASE.x - player.x);
        renderer.applyCamera(camera);
        renderer.drawGuideArrow(player.x, player.y, angle, 1);
        renderer.restoreCamera();
      } else if (!player.hasBoughtDroid && economy.coins >= economy.upgradeCosts.helper1 && !economy.hasHelper1) {
        var angle = Math.atan2(BTN.helper1.y - player.y, BTN.helper1.x - player.x);
        renderer.applyCamera(camera);
        renderer.drawGuideArrow(player.x, player.y, angle, 1);
        renderer.restoreCamera();
      }
    }

    requestAnimationFrame(gameLoop);
  }

  gameLoop(0);
}

init();
