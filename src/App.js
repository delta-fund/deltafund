import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ethers } from 'ethers';

const TARGET_CHAIN_ID = 137;
const SWITCH_CHAIN_HEX = '0x89';
const CONNECT_TIMEOUT = 45000;

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Wallet connection timed out. Please reopen your wallet and try again.')), ms)),
  ]);
}

function shorten(value = '') {
  return value ? `${value.slice(0, 6)}…${value.slice(-4)}` : '';
}

function stringify(value) {
  if (value == null) return '—';
  if (typeof value === 'bigint') return value.toString();
  if (Array.isArray(value)) return value.map(stringify).join(' · ');
  if (typeof value === 'object') {
    const entries = Object.entries(value).filter(([key]) => Number.isNaN(Number(key)));
    return entries.length ? entries.map(([key, item]) => `${key}: ${stringify(item)}`).join('\n') : String(value);
  }
  return String(value);
}

function contractFrom(binding, signer) {
  if (!binding || !ethers.isAddress(binding.address) || !Array.isArray(binding.abi) || !binding.abi.length) {
    throw new Error('The primary contract binding is missing or invalid. Check the QuickDapp configuration.');
  }
  return new ethers.Contract(binding.address, binding.abi, signer);
}

export default function App() {
  const config = window.__QUICK_DAPP_CONFIG__ || {};
  const contracts = Array.isArray(config.contracts) ? config.contracts : [];
  const primaryBinding = useMemo(
    () => contracts.find((item) => item.id === config.primaryContractId),
    [contracts, config.primaryContractId]
  );
  const bindingError = !primaryBinding || !ethers.isAddress(primaryBinding.address) || !Array.isArray(primaryBinding.abi) || !primaryBinding.abi.length;

  const [account, setAccount] = useState('');
  const [chainId, setChainId] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [pending, setPending] = useState('');
  const [notice, setNotice] = useState({ type: 'idle', text: 'Connect a wallet to open the contract console.' });
  const [metadata, setMetadata] = useState({ name: '—', symbol: '—', decimals: '—', supply: '—' });
  const [profile, setProfile] = useState('—');
  const [balance, setBalance] = useState('—');
  const [amounts, setAmounts] = useState({ claim: '', mine: '', tier: '', market: '' });
  const [addresses, setAddresses] = useState({ referrer: '', recipient: '', lookup: '' });

  const rawProviderRef = useRef(null);
  const listenerRef = useRef({ accounts: null, chain: null });
  const bindingRef = useRef(primaryBinding);
  const accountRef = useRef(account);
  useEffect(() => { bindingRef.current = primaryBinding; }, [primaryBinding]);
  useEffect(() => { accountRef.current = account; }, [account]);

  const clearSession = useCallback(() => {
    setAccount(''); setChainId(null); setProvider(null); setSigner(null); setContract(null);
    setMetadata({ name: '—', symbol: '—', decimals: '—', supply: '—' });
    setBalance('—'); setProfile('—');
  }, []);

  const detachListeners = useCallback((raw) => {
    if (!raw?.removeListener) return;
    if (listenerRef.current.accounts) raw.removeListener('accountsChanged', listenerRef.current.accounts);
    if (listenerRef.current.chain) raw.removeListener('chainChanged', listenerRef.current.chain);
  }, []);

  useEffect(() => {
    async function rebuildSession(nextAccount) {
      const raw = rawProviderRef.current;
      if (!raw || !nextAccount) return;
      try {
        const nextProvider = new ethers.BrowserProvider(raw);
        const nextSigner = await nextProvider.getSigner();
        const nextContract = contractFrom(bindingRef.current, nextSigner);
        setProvider(nextProvider); setSigner(nextSigner); setContract(nextContract);
      } catch (error) {
        setContract(null);
        setNotice({ type: 'error', text: error.shortMessage || error.message });
      }
    }
    function handleAccountsChanged(accounts) {
      if (!Array.isArray(accounts) || !accounts.length) {
        clearSession();
        setNotice({ type: 'idle', text: 'Wallet disconnected. Connect again to continue.' });
        return;
      }
      setAccount(accounts[0]);
      void rebuildSession(accounts[0]);
    }
    function handleChainChanged(chainHex) {
      const nextChain = Number.parseInt(chainHex, 16);
      setChainId(nextChain);
      if (accountRef.current) void rebuildSession(accountRef.current);
    }
    listenerRef.current = { accounts: handleAccountsChanged, chain: handleChainChanged };
    return () => {
      detachListeners(rawProviderRef.current);
      listenerRef.current = { accounts: null, chain: null };
    };
  }, [clearSession, detachListeners]);

  const attachListeners = useCallback((raw) => {
    if (!raw?.on) return;
    raw.on('accountsChanged', listenerRef.current.accounts);
    raw.on('chainChanged', listenerRef.current.chain);
  }, []);

  const connectWallet = async () => {
    setConnecting(true);
    setNotice({ type: 'busy', text: 'Waiting for wallet authorization…' });
    try {
      if (bindingError) throw new Error('The primary contract binding is missing or invalid. Check the QuickDapp configuration.');
      const selected = window.__qdapp_getProvider
        ? await withTimeout(Promise.resolve(window.__qdapp_getProvider()), CONNECT_TIMEOUT)
        : window.ethereum;
      if (!selected?.request) throw new Error('No compatible wallet was found. Install or unlock a browser wallet and retry.');
      console.info('[QDBinding] wallet.connect', { stage: 'provider-selected' });
      const accounts = await withTimeout(selected.request({ method: 'eth_requestAccounts' }), CONNECT_TIMEOUT);
      console.info('[QDBinding] wallet.connect', { stage: 'accounts-authorized' });
      if (!Array.isArray(accounts) || !accounts.length) throw new Error('The wallet returned no accounts. Select an account and retry.');
      const nextProvider = new ethers.BrowserProvider(selected);
      const network = await nextProvider.getNetwork();
      const nextSigner = await nextProvider.getSigner();
      const nextContract = contractFrom(primaryBinding, nextSigner);
      if (rawProviderRef.current) detachListeners(rawProviderRef.current);
      rawProviderRef.current = selected;
      attachListeners(selected);
      setProvider(nextProvider); setSigner(nextSigner); setContract(nextContract);
      setAccount(accounts[0]); setChainId(Number(network.chainId));
      console.info('[QDBinding] wallet.connect', { stage: 'connected' });
      setNotice({ type: 'success', text: Number(network.chainId) === TARGET_CHAIN_ID ? 'Wallet connected. Console ready.' : 'Wallet connected on the wrong network. Switch to Polygon to continue.' });
    } catch (error) {
      clearSession();
      setNotice({ type: 'error', text: error.shortMessage || error.message || 'Connection failed. Please retry.' });
    } finally {
      setConnecting(false);
    }
  };

  const disconnectWallet = () => {
    detachListeners(rawProviderRef.current);
    rawProviderRef.current = null;
    localStorage.removeItem('__qdapp_wallet_rdns');
    clearSession();
    setNotice({ type: 'idle', text: 'Wallet disconnected.' });
  };

  const switchNetwork = async () => {
    try {
      const raw = rawProviderRef.current;
      if (!raw?.request) throw new Error('Connect your wallet before switching networks.');
      await raw.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: SWITCH_CHAIN_HEX }] });
      setNotice({ type: 'success', text: 'Network switched to Polygon.' });
    } catch (error) {
      setNotice({ type: 'error', text: error.message || 'Unable to switch network.' });
    }
  };

  const loadOverview = useCallback(async () => {
    if (!contract || chainId !== TARGET_CHAIN_ID || !account) return;
    try {
      const [name, symbol, decimals, supply, tokenBalance, user] = await Promise.all([
        contract.name(), contract.symbol(), contract.decimals(), contract.totalSupply(), contract.tokenBalances(account), contract.users(account)
      ]);
      setMetadata({ name, symbol, decimals: decimals.toString(), supply: ethers.formatUnits(supply, decimals) });
      setBalance(ethers.formatUnits(tokenBalance, decimals));
      setProfile(stringify(user));
    } catch (error) {
      setNotice({ type: 'error', text: error.shortMessage || error.message });
    }
  }, [contract, chainId, account]);

  useEffect(() => { void loadOverview(); }, [loadOverview]);

  const transact = async (label, method, args) => {
    if (!contract || !signer) return setNotice({ type: 'error', text: 'Connect your wallet first.' });
    if (chainId !== TARGET_CHAIN_ID) return setNotice({ type: 'error', text: 'Switch to Polygon before submitting.' });
    setPending(label);
    try {
      setNotice({ type: 'busy', text: `${label}: confirm the transaction in your wallet.` });
      const tx = await contract[method](...args);
      setNotice({ type: 'busy', text: `${label}: transaction submitted. Waiting for confirmation…` });
      await tx.wait();
      setNotice({ type: 'success', text: `${label} confirmed on-chain.` });
      await loadOverview();
    } catch (error) {
      setNotice({ type: 'error', text: error.shortMessage || error.reason || error.message });
    } finally { setPending(''); }
  };

  const updateAmount = (key, value) => setAmounts((old) => ({ ...old, [key]: value }));
  const updateAddress = (key, value) => setAddresses((old) => ({ ...old, [key]: value }));
  const ready = Boolean(account && contract && chainId === TARGET_CHAIN_ID && !bindingError);
  const title = config.title || 'My DApp';

  return (
    <main className="min-h-screen pb-12">
      <header className="border-b rule bg-[#090b0d]/85 backdrop-blur-xl sticky top-0 z-20">
        <div className="shell h-[74px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {config.logo ? <img src={config.logo} alt="" className="w-9 h-9 rounded-lg object-cover" /> : <div className="w-9 h-9 rounded-lg bg-[#b7ff58] text-black grid place-items-center font-extrabold">Δ</div>}
            <div className="min-w-0"><div className="font-extrabold truncate">{title}</div><div className="eyebrow">contract terminal / polygon</div></div>
          </div>
          <div className="flex items-center gap-2">
            {account && <span className="hidden sm:block mono text-xs text-[#aab2ae] px-3">{shorten(account)}</span>}
            {!account ? <button className="btn btn-primary" disabled={connecting || bindingError} onClick={connectWallet}>{connecting ? 'Connecting…' : 'Connect Wallet'}</button> : <button className="btn" onClick={disconnectWallet}>Disconnect</button>}
          </div>
        </div>
      </header>

      <div className="shell pt-8">
        <section className="grid lg:grid-cols-[1fr_340px] gap-5 items-start">
          <div>
            <div className="eyebrow mb-3">live operations</div>
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-[-.05em] leading-[.98] max-w-3xl">A focused console for your token economy.</h1>
            <p className="text-[#919a96] mt-5 max-w-xl leading-7">Inspect your position, claim allocations, mine supply, and manage market issuance without leaving one operational view.</p>
          </div>
          <aside className="panel rounded-2xl p-5">
            <div className="flex items-center justify-between"><span className="eyebrow">session</span><span className={`status-dot ${ready ? 'live' : ''}`}></span></div>
            <div className="mt-5 grid grid-cols-2 gap-y-4 text-sm">
              <span className="text-[#727b77]">Wallet</span><span className="mono text-right">{account ? shorten(account) : 'offline'}</span>
              <span className="text-[#727b77]">Network</span><span className="text-right">{chainId ? (chainId === TARGET_CHAIN_ID ? 'Polygon' : `Chain ${chainId}`) : '—'}</span>
              <span className="text-[#727b77]">Status</span><span className={`text-right ${ready ? 'text-[#b7ff58]' : 'text-[#d7aa72]'}`}>{ready ? 'ready' : 'action needed'}</span>
            </div>
            {account && chainId !== TARGET_CHAIN_ID && <button className="btn btn-primary w-full mt-5" onClick={switchNetwork}>Switch Network</button>}
          </aside>
        </section>

        {(bindingError || notice.text) && <div className={`mt-6 rounded-xl border px-4 py-3 text-sm ${bindingError || notice.type === 'error' ? 'border-[#713c3c] bg-[#241516] text-[#ffb4b4]' : notice.type === 'success' ? 'border-[#3e5a30] bg-[#142014] text-[#caff91]' : 'border-[#343a3c] bg-[#101416] text-[#aeb7b2]'}`}>{bindingError ? 'Configuration error: the primary contract binding is unavailable or invalid.' : notice.text}</div>}

        <section className="grid lg:grid-cols-[340px_1fr] gap-5 mt-6">
          <div className="panel rounded-2xl overflow-hidden">
            <div className="p-5 border-b rule flex justify-between items-center"><span className="eyebrow">asset readout</span><button className="text-xs text-[#b7ff58]" disabled={!ready} onClick={loadOverview}>Refresh</button></div>
            <div className="p-5">
              <div className="text-4xl font-extrabold tracking-tight">{balance}</div><div className="text-[#8b9590] mt-1">{metadata.symbol} wallet balance</div>
              <div className="grid grid-cols-2 gap-3 mt-6">
                {[['Token', metadata.name], ['Decimals', metadata.decimals], ['Supply', metadata.supply], ['Symbol', metadata.symbol]].map(([label, value]) => <div key={label} className="bg-[#0b0e10] rounded-xl p-3 border rule"><div className="eyebrow">{label}</div><div className="mt-2 text-sm break-all">{value}</div></div>)}
              </div>
              <div className="mt-5"><div className="eyebrow mb-2">user record</div><pre className="mono whitespace-pre-wrap text-xs text-[#a9b2ad] bg-[#0b0e10] border rule rounded-xl p-3 max-h-40 overflow-auto scrollbar">{profile}</pre></div>
            </div>
          </div>

          <div className="panel rounded-2xl overflow-hidden">
            <div className="p-5 border-b rule"><div className="eyebrow">write queue</div><h2 className="font-bold text-xl mt-1">Contract actions</h2></div>
            <div className="divide-y divide-[#252a2d]">
              <Action title="Claim tokens" detail="Claim an available token allocation by amount." value={amounts.claim} onChange={(v) => updateAmount('claim', v)} button="Claim" disabled={!ready || !!pending} busy={pending === 'Claim tokens'} onSubmit={() => transact('Claim tokens', 'claimTokens', [amounts.claim])} />
              <Action title="Mine coins" detail="Execute the mining function for a specified amount." value={amounts.mine} onChange={(v) => updateAmount('mine', v)} button="Mine" disabled={!ready || !!pending} busy={pending === 'Mine coins'} onSubmit={() => transact('Mine coins', 'mineCoins', [amounts.mine])} />
              <Action title="Join tier one" detail="Enter an amount and referring wallet address." value={amounts.tier} onChange={(v) => updateAmount('tier', v)} second={addresses.referrer} onSecond={(v) => updateAddress('referrer', v)} secondPlaceholder="Referrer address" button="Join tier" disabled={!ready || !!pending} busy={pending === 'Join tier one'} onSubmit={() => transact('Join tier one', 'joinTier1', [amounts.tier, addresses.referrer])} />
              <Action title="Mint for market" detail="Mint an amount directly to a recipient address." value={amounts.market} onChange={(v) => updateAmount('market', v)} second={addresses.recipient} onSecond={(v) => updateAddress('recipient', v)} secondPlaceholder="Recipient address" button="Mint" disabled={!ready || !!pending} busy={pending === 'Mint for market'} onSubmit={() => transact('Mint for market', 'mintCoinsForMarket', [addresses.recipient, amounts.market])} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Action({ title, detail, value, onChange, second, onSecond, secondPlaceholder, button, disabled, busy, onSubmit }) {
  return <div className="p-5 grid md:grid-cols-[210px_1fr] gap-4 md:gap-6">
    <div><h3 className="font-bold">{title}</h3><p className="text-sm text-[#7f8984] mt-1 leading-6">{detail}</p></div>
    <div className="space-y-2">
      {secondPlaceholder && <input className="field mono text-sm" value={second} onChange={(e) => onSecond(e.target.value)} placeholder={secondPlaceholder} />}
      <div className="action-row"><input className="field mono" inputMode="numeric" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Raw amount" /><button className="btn btn-primary min-w-28" disabled={disabled || !value || (secondPlaceholder && !second)} onClick={onSubmit}>{busy ? 'Pending…' : button}</button></div>
    </div>
  </div>;
}
