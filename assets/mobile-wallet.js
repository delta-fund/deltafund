const WALLET_DEEP_LINKS = {
  metamask: {
    ios: 'https://metamask.app.link/dapp/' + location.host + location.pathname,
    android: 'https://metamask.app.link/dapp/' + location.host + location.pathname,
    fallback: 'https://metamask.io/download/'
  },
  trust: {
    ios: 'https://link.trustwallet.com/open_url?coin_id=966&url=' + encodeURIComponent(window.location.href),
    android: 'https://link.trustwallet.com/open_url?coin_id=966&url=' + encodeURIComponent(window.location.href),
    fallback: 'https://trustwallet.com/'
  }
};

function getMobilePlatform() {
  const ua = navigator.userAgent || '';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'desktop';
}

function openWalletDeepLink() {
  const platform = getMobilePlatform();
  if (platform === 'desktop') return false;

  const target = (typeof navigator !== 'undefined' && navigator.userAgent && /MetaMask/i.test(navigator.userAgent))
    ? 'metamask'
    : (typeof navigator !== 'undefined' && navigator.userAgent && /Trust/i.test(navigator.userAgent))
      ? 'trust'
      : 'metamask';

  const config = WALLET_DEEP_LINKS[target];
  const link = config[platform] || config.fallback;
  window.location.href = link;
  return true;
}

function safeConnectWallet() {
  if (typeof window.connectWallet === 'function') {
    try {
      return window.connectWallet();
    } catch (err) {
      console.warn('connectWallet failed', err);
    }
  }

  if (typeof window.ethereum === 'undefined' && getMobilePlatform() !== 'desktop') {
    openWalletDeepLink();
    return false;
  }

  return false;
}

window.addEventListener('DOMContentLoaded', () => {
  const walletButton = document.getElementById('connectWalletBtn');
  if (!walletButton) return;

  const buttonText = walletButton.textContent.trim();
  const originalHandler = walletButton.onclick;

  walletButton.addEventListener('click', (event) => {
    event.preventDefault();
    if (typeof window.ethereum === 'undefined' && getMobilePlatform() !== 'desktop') {
      const opened = openWalletDeepLink();
      if (opened) {
        walletButton.textContent = 'Opening wallet app…';
        return;
      }
    }

    if (typeof originalHandler === 'function') {
      originalHandler.call(walletButton, event);
      return;
    }

    if (typeof window.connectWallet === 'function') {
      window.connectWallet();
      return;
    }

    walletButton.textContent = buttonText;
  });
});
