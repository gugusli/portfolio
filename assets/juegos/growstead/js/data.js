const PRESTIGE_TREE = [
  {id:'pt_root', name:'Root Power', desc:'+10% sell price', cost:1, eff:{sellBonus:0.1}},
  {id:'pt_growth', name:'Fast Growth', desc:'+10% grow speed', cost:1, eff:{growSpeed:0.1}, requires:['pt_root']},
  {id:'pt_mutation', name:'Mutation Chance', desc:'+5% mut chance', cost:2, eff:{mutChance:0.05}, requires:['pt_growth']},
  {id:'pt_harvest', name:'Rich Harvest', desc:'+15% sell price', cost:2, eff:{sellBonus:0.15}, requires:['pt_root']},
];
const PRESTIGE_INFINITE = [
  {id:'pti_sell', name:'Market Mastery', desc:'+1% sell price per level', baseCost:5, costMult:1.5, eff:{sellBonus:0.01}},
  {id:'pti_speed', name:'Endless Growth', desc:'+0.5% grow speed per level', baseCost:5, costMult:1.5, eff:{growSpeed:0.005}},
  {id:'pti_mut', name:'Mutation Insight', desc:'+0.3% mutation chance per level', baseCost:8, costMult:1.6, eff:{mutChance:0.003}},
];
const EXPANSIONS = [
  {id:'sprout_field', name:'Sprout Field', emoji:'🌱', cost:500, lv:1, plots:4, desc:'A small patch to get you started'},
  {id:'bloom_corner', name:'Bloom Corner', emoji:'🌷', cost:1500, lv:4, plots:6, desc:'Flowers begin to bloom'},
  {id:'herb_garden', name:'Herb Garden', emoji:'🌿', cost:3500, lv:7, plots:8, desc:'Aromatic herbs fill the air'},
  {id:'berry_patch', name:'Berry Patch', emoji:'🫐', cost:6000, lv:10, plots:8, desc:'Berries ripe for picking'},
  {id:'cactus_flats', name:'Cactus Flats', emoji:'🌵', cost:9000, lv:13, plots:10, desc:'Dry lands with rare blooms'},
  {id:'orchid_terrace', name:'Orchid Terrace', emoji:'🌸', cost:13000, lv:16, plots:10, desc:'Exotic orchids on display'},
  {id:'sunflower_plains', name:'Sunflower Plains', emoji:'🌻', cost:17500, lv:19, plots:12, desc:'Endless sunflowers sway'},
  {id:'mystic_grove', name:'Mystic Grove', emoji:'🌳', cost:22000, lv:22, plots:12, desc:'Ancient grove of secrets'},
];
const INFINITE_EXPANSION = {
  id: 'endless_acres',
  name: 'Endless Acres',
  emoji: '🌾',
  baseCost: 30000,
  costMult: 1.35,
  plotsPerLevel: 2,
  desc: 'Push the garden\'s borders even further',
};
const HELPERS = [
  {id:'gardener',name:'Gardener',emoji:'👨‍🌾',cost:250,upkeep:5,desc:'Harvests and replants one plot every 3 seconds'},
  {id:'robot_mower',name:'Robot Mower',emoji:'🤖',cost:800,upkeep:20,desc:'Harvests every ready plot every 2 seconds'},
  {id:'drone',name:'Collector Drone',emoji:'🛸',cost:2500,upkeep:50,desc:'Scouts empty plots and plants your selected seed'},
];
