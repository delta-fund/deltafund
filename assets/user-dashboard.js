(async function(){
  const connectBtn = document.getElementById('connectBtn');
  const statusEl = document.getElementById('status');
  const acctEl = document.getElementById('acct');
  const netEl = document.getElementById('network');
  const balEl = document.getElementById('dlcbal');
  const tokenAddress = '0xB0cea145750E76Ccb24a0007206f2485dd5bf21a';
  const ERC20 = [
    'function balanceOf(address) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)'
  ];

  function short(addr){ if(!addr) return '—'; return addr.substring(0,6)+'...'+addr.substring(addr.length-4); }

  async function readTokenBalance(account){
    try{
      const provider = new ethers.providers.JsonRpcProvider('https://polygon-rpc.com');
      const contract = new ethers.Contract(tokenAddress, ERC20, provider);
      const [rawBal, decimals, symbol] = await Promise.all([
        contract.balanceOf(account),
        contract.decimals(),
        contract.symbol()
      ]);
      const formatted = ethers.utils.formatUnits(rawBal, decimals);
      balEl.textContent = formatted + ' ' + symbol;
    }catch(err){
      console.error('balance fetch', err);
      balEl.textContent = 'Unavailable';
    }
  }

  async function onConnect(){
    if(typeof window.ethereum === 'undefined'){
      statusEl.textContent = 'No injected web3 provider detected. Use a Web3 browser or wallet app.';
      return;
    }
    try{
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();
      statusEl.textContent = 'Connected';
      acctEl.textContent = address;
      netEl.textContent = network.name + ' (' + network.chainId + ')';
      await readTokenBalance(address);

      // handle chain/account changes
      window.ethereum.on('accountsChanged', async (accounts)=>{ acctEl.textContent = accounts[0] || '—'; if(accounts[0]) await readTokenBalance(accounts[0]); });
      window.ethereum.on('chainChanged', async ()=>{ location.reload(); });

    }catch(err){
      console.error('connect error', err);
      statusEl.textContent = 'Connection failed or rejected.';
    }
  }

  connectBtn.addEventListener('click', async (e)=>{ e.preventDefault(); await onConnect(); });
})();
