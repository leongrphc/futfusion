(function (root) {
  'use strict';
  const run = async (persona, action) => {
    if (!root.navigator?.locks) throw new Error('Bu tarayıcı işlem kilidini desteklemiyor. Güncel Chrome veya Brave kullan.');
    return root.navigator.locks.request(`futfusion-account-${persona}`, { ifAvailable: true }, (lock) => {
      if (!lock) throw new Error('Bu EA hesabı başka bir sekmede işlem yapıyor. O işlemin bitmesini bekle.');
      return action();
    });
  };
  root.FutFox.accountLock = { run };
})(globalThis);
