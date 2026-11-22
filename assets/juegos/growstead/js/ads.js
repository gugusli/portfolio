var _sdkType = null;

function initAdsSDK() {
  try {
    if (typeof PokiSDK !== 'undefined' && PokiSDK && typeof PokiSDK.init === 'function') {
      PokiSDK.init();
      _sdkType = 'poki';
      try {
        if (typeof PokiSDK.gameplayStart === 'function') PokiSDK.gameplayStart();
      } catch (e) {}
      return;
    }
  } catch (e) {}
  try {
    if (typeof CrazyGames !== 'undefined' && CrazyGames && CrazyGames.advertisement) {
      _sdkType = 'crazygames';
    }
  } catch (e) {}
}

function sdkWatchAd(onComplete, onError) {
  try {
    if (_sdkType === 'poki') {
      try {
        if (typeof PokiSDK.gameplayStop === 'function') PokiSDK.gameplayStop();
      } catch (e) {}
      PokiSDK.rewardedBreak().then(function(result) {
        try {
          if (result === true) {
            if (typeof onComplete === 'function') onComplete();
          } else {
            if (typeof onError === 'function') onError();
          }
        } finally {
          try {
            if (typeof PokiSDK.gameplayStart === 'function') PokiSDK.gameplayStart();
          } catch (e) {}
        }
      }).catch(function(err) {
        try {
          if (typeof PokiSDK.gameplayStart === 'function') PokiSDK.gameplayStart();
        } catch (e) {}
        if (typeof onError === 'function') onError(err);
      });
      return true;
    }
    if (_sdkType === 'crazygames') {
      CrazyGames.advertisement.requestAd({
        adType: 'rewarded',
        adShown: function() {},
        adFinished: onComplete,
        adError: onError
      });
      return true;
    }
  } catch (e) {
    if (typeof onError === 'function') {
      try { onError(e); } catch (err) {}
    }
    return true;
  }
  return false;
}

function showRewardedAd(callback) {
  var onError = function(err) {
    console.warn('Ad failed or was skipped, reward not granted.', err);
  };
  var result = false;
  try {
    result = sdkWatchAd(callback, onError);
  } catch (e) {
    console.warn('Ad error:', e);
    return;
  }
  if (result === false) {
    setTimeout(callback, 3000);
  }
}
