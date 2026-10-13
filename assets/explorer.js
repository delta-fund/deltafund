(function(){
  const provider = new ethers.providers.JsonRpcProvider('https://polygon-rpc.com');
  const form = document.getElementById('lookupForm');
  const input = document.getElementById('lookupInput');
  const result = document.getElementById('result');

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const q = (input.value || '').trim();
    if(!q) return;
    result.style.display = 'block';
    result.innerHTML = '<p>Loading…</p>';

    try {
      if(q.startsWith('0x') && q.length === 66) {
        // tx hash
        const tx = await provider.getTransaction(q);
        const receipt = await provider.getTransactionReceipt(q);
        if(!tx) { result.innerHTML = '<p>Transaction not found on RPC — try PolygonScan.</p>'; return; }
        const el = [];
        el.push('<h3>Transaction</h3>');
        el.push('<p><strong>Hash:</strong> '+q+' (<a href="https://polygonscan.com/tx/'+q+'" target="_blank">view on PolygonScan</a>)</p>');
        el.push('<p><strong>From:</strong> '+tx.from+'</p>');
        el.push('<p><strong>To:</strong> '+(tx.to || 'Contract creation')+'</p>');
        el.push('<p><strong>Value (native):</strong> '+(ethers.utils.formatEther(tx.value || 0))+' MATIC</p>');
        el.push('<p><strong>Status:</strong> '+(receipt ? (receipt.status === 1 ? 'Success' : 'Failed') : 'Pending')+'</p>');
        el.push('<p><strong>Block:</strong> '+(tx.blockNumber || 'Pending')+'</p>');
        result.innerHTML = el.join('');
        return;
      }

      if(q.startsWith('0x') && q.length === 42) {
        // address
        const addr = q;
        const balance = await provider.getBalance(addr);
        const el = [];
        el.push('<h3>Address</h3>');
        el.push('<p><strong>Address:</strong> '+addr+' (<a href="https://polygonscan.com/address/'+addr+'" target="_blank">view on PolygonScan</a>)</p>');
        el.push('<p><strong>Native balance:</strong> '+ethers.utils.formatEther(balance)+' MATIC</p>');
        el.push('<p>For token transfers and holder history use PolygonScan or an indexer for complete data.</p>');
        result.innerHTML = el.join('');
        return;
      }

      result.innerHTML = '<p>Input not recognized as a transaction hash or address. Use a full tx hash (0x...) or address (0x...).</p>';

    } catch(err) {
      console.error(err);
      result.innerHTML = '<p>Error querying the RPC. Try again later or view on PolygonScan.</p>';
    }
  });
})();
