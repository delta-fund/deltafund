(async function(){
  const provider = new ethers.providers.JsonRpcProvider('https://polygon-rpc.com');
  const tokenAddress = '0xB0cea145750E76Ccb24a0007206f2485dd5bf21a';
  const ERC20 = [
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function totalSupply() view returns (uint256)',
    'function balanceOf(address) view returns (uint256)'
  ];

  const nameEl = document.getElementById('t_name');
  const symbolEl = document.getElementById('t_symbol');
  const decEl = document.getElementById('t_decimals');
  const supplyEl = document.getElementById('t_supply');
  const liquidityEl = document.getElementById('t_liquidity');

  async function fetchToken() {
    nameEl.textContent = 'Loading...';
    symbolEl.textContent = 'Loading...';
    decEl.textContent = 'Loading...';
    supplyEl.textContent = 'Loading...';

    try {
      const contract = new ethers.Contract(tokenAddress, ERC20, provider);
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
        contract.totalSupply()
      ]);

      nameEl.textContent = name;
      symbolEl.textContent = symbol;
      decEl.textContent = String(decimals);

      // totalSupply is BigNumber
      const formatted = ethers.utils.formatUnits(totalSupply, decimals);
      supplyEl.textContent = formatted + ' ' + symbol;

      liquidityEl.textContent = 'Not verified from on-chain data in this view. Use verified DEX or indexer for pool details.';

    } catch (err) {
      console.error('token read error', err);
      nameEl.textContent = 'Unavailable';
      symbolEl.textContent = 'Unavailable';
      decEl.textContent = 'Unavailable';
      supplyEl.textContent = 'Unavailable';
      liquidityEl.textContent = 'Unavailable';
    }
  }

  document.getElementById('refreshBtn').addEventListener('click', (e)=>{e.preventDefault();fetchToken()});

  fetchToken();
})();
