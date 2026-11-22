function checkMilestones(economy) {
  const completed = economy.completedMilestones;
  const stats = economy.stats;
  const newCompletions = [];

  for (const m of MILESTONES) {
    if (completed.includes(m.id)) continue;

    let progress = 0;
    switch (m.type) {
      case 'gold_deposited':
        progress = stats.goldDeposited || 0;
        break;
      case 'buy_helper1':
        progress = economy.hasHelper1 ? 1 : 0;
        break;
      case 'unlock_crystal':
        progress = economy.crystalUnlocked ? 1 : 0;
        break;
      case 'crystals_processed':
        progress = stats.crystalsProcessed || 0;
        break;
      case 'coins_reached':
        progress = stats.totalCoins || 0;
        break;
    }

    if (progress >= m.target) {
      completed.push(m.id);
      economy.addCoins(m.reward);
      newCompletions.push(m);
    }
  }

  return newCompletions;
}

function getCurrentMilestone(economy) {
  const completed = economy.completedMilestones;
  for (const m of MILESTONES) {
    if (!completed.includes(m.id)) return m;
  }
  return null;
}

function getMilestoneProgress(milestone, economy) {
  const stats = economy.stats;
  switch (milestone.type) {
    case 'gold_deposited': return Math.min(stats.goldDeposited || 0, milestone.target);
    case 'buy_helper1': return economy.hasHelper1 ? 1 : 0;
    case 'unlock_crystal': return economy.crystalUnlocked ? 1 : 0;
    case 'crystals_processed': return Math.min(stats.crystalsProcessed || 0, milestone.target);
    case 'coins_reached': return Math.min(stats.totalCoins || 0, milestone.target);
  }
  return 0;
}
