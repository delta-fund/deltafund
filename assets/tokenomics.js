(function(){
  const provider = new ethers.providers.JsonRpcProvider('https://polygon-rpc.com');
  const tokenAddress = '0xB0cea145750E76Ccb24a0007206f2485dd5bf21a';
  const erc20 = new ethers.Contract(tokenAddress, [
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function totalSupply() view returns (uint256)'
  ], provider);

  async function readToken() {
    try {
      document.getElementById('polygonscanLink').href = 'https://polygonscan.com/address/' + tokenAddress;
      const name = await erc20.name();
      const symbol = await erc20.symbol();
      const decimals = await erc20.decimals();
      const rawSupply = await erc20.totalSupply();

      const supply = ethers.utils.formatUnits(rawSupply, decimals);
      document.getElementById('name').innerText = name;
      document.getElementById('symbol').innerText = symbol;
      document.getElementById('decimals').innerText = decimals;
      document.getElementById('totalSupply').innerText = supply + ' ' + symbol;

      // Circulating supply requires off-chain verification
      document.getElementById('circulating').innerText = 'Not available (requires off-chain indexer/data)';

    } catch (err) {
      console.error('Token read failed', err);
      document.getElementById('totalSupply').innerText = 'Read failed';
      document.getElementById('decimals').innerText = '—';
    }
  }

  window.addEventListener('DOMContentLoaded', readToken);
})();
