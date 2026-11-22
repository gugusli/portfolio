var lastGardenerTick = 0;
var lastRobotMowerTick = 0;
var lastDroneTick = 0;
var lastAutoHarvest = 0;

function chargeUpkeep(now){
  if(now - S.lastUpkeepCharge < 60000) return;
  var active = S.helpers.filter(function(id){ return S.helpersDisabled.indexOf(id) < 0; });
  var totalUpkeep = 0;
  for(var i=0;i<active.length;i++){
    var h = HELPERS.find(function(x){ return x.id===active[i]; });
    if(h) totalUpkeep += h.upkeep;
  }
  if(totalUpkeep===0){
    S.lastUpkeepCharge = now;
    return;
  }
  if(S.coins >= totalUpkeep){
    S.coins -= totalUpkeep;
    if(typeof economy !== 'undefined') economy.coins = S.coins;
    S.helpersDisabled = S.helpersDisabled.filter(function(id){ return S.helpers.indexOf(id) < 0; });
    if(S.helpersDisabled.length>0){
      var stillOwnedDisabled = S.helpersDisabled.filter(function(id){ return S.helpers.indexOf(id) >=0; });
      if(stillOwnedDisabled.length===0) S.helpersDisabled=[];
      else S.helpersDisabled=[];
    }
    S.helpersDisabled = [];
  } else {
    var sorted = active.slice().sort(function(a,b){
      var ha = HELPERS.find(function(x){ return x.id===a; });
      var hb = HELPERS.find(function(x){ return x.id===b; });
      return (hb?hb.upkeep:0) - (ha?ha.upkeep:0);
    });
    var remaining = totalUpkeep;
    for(var j=0;j<sorted.length;j++){
      var hid = sorted[j];
      if(S.helpersDisabled.indexOf(hid) < 0) S.helpersDisabled.push(hid);
      var hh = HELPERS.find(function(x){ return x.id===hid; });
      if(hh) remaining -= hh.upkeep;
      if(remaining <= S.coins) break;
    }
  }
  S.lastUpkeepCharge = now;
}

function tick(now){
  if(!now) now = Date.now();
  chargeUpkeep(now);
  if(S.helpers.indexOf('gardener') >= 0 && S.helpersDisabled.indexOf('gardener') < 0){
    if(now - lastGardenerTick >= 3000){
      lastGardenerTick = now;
    }
  }
  if(S.helpers.indexOf('robot_mower') >= 0 && S.helpersDisabled.indexOf('robot_mower') < 0){
    if(now - lastRobotMowerTick >= 2000){
    }
  }
  if(S.helpers.indexOf('drone') >= 0 && S.helpersDisabled.indexOf('drone') < 0){
    if(now - lastDroneTick >= 2000){
    }
  }
  var now2 = now;
  if(S.helpers.indexOf('robot_mower') >= 0 && S.helpersDisabled.indexOf('robot_mower') < 0){
    if(now2 - lastRobotMower >= 2000){
      lastRobotMower = now2;
    }
  }
  if(S.helpers.indexOf('gardener') >= 0 && S.helpersDisabled.indexOf('gardener') < 0){
    if(now2 - lastAutoHarvest >= 3000){
      lastAutoHarvest = now2;
    }
  }
}
var lastRobotMower = 0;
