// Fetch data from the JSON file
fetch('data.json')
  .then(response => response.json())
  .then(data => {
    
    // 1. Populate Header
    document.getElementById('projectName').textContent = data.projectMeta.name;
    document.getElementById('projectDetails').textContent = `${data.projectMeta.location} | RERA: ${data.projectMeta.reraNumber}`;
    document.getElementById('updateBadge').textContent = `Data as of ${data.projectMeta.updated}`;

    // 2. Draw Escrow Donut Chart
    const ctxEscrow = document.getElementById('escrowChart').getContext('2d');
    new Chart(ctxEscrow, {
      type: 'doughnut',
      data: {
        labels: ['Withdrawn (INR)', 'Balance (INR)'],
        datasets: [{
          data: [data.escrow.withdrawn, data.escrow.balance],
          backgroundColor: ['#f43f5e', '#10b981'], // Rose and Emerald colors
          borderWidth: 0
        }]
      }
    });

    // 3. Draw Sales Bar Chart
    const ctxSales = document.getElementById('salesChart').getContext('2d');
    new Chart(ctxSales, {
      type: 'bar',
      data: {
        labels: ['Phase 1 Inventory'],
        datasets: [
          { label: 'Booked Units', data: [data.sales.booked], backgroundColor: '#3b82f6' }, // Blue
          { label: 'Unsold Units', data: [data.sales.unsold], backgroundColor: '#cbd5e1' }  // Slate
        ]
      },
      options: { scales: { y: { beginAtZero: true } } }
    });

    // 4. Populate Risk Matrix
    const container = document.getElementById('riskMatrixContainer');
    data.legalRiskMatrix.forEach(item => {
      // Pick color based on status
      let colorClass = 'bg-slate-100 text-slate-700';
      if (item.status === 'Cleared') colorClass = 'bg-emerald-100 text-emerald-800';
      if (item.status === 'In Progress') colorClass = 'bg-amber-100 text-amber-800';
      if (item.status === 'Pending') colorClass = 'bg-rose-100 text-rose-800';

      // Create HTML block
      const block = document.createElement('div');
      block.className = 'border border-slate-100 rounded-lg p-4 bg-slate-50/50';
      block.innerHTML = `
        <div class="flex justify-between items-start mb-2">
          <h3 class="font-bold text-slate-700">${item.title}</h3>
          <span class="px-2 py-1 text-xs font-bold rounded-md ${colorClass}">${item.status}</span>
        </div>
        <p class="text-sm text-slate-600">${item.desc}</p>
      `;
      container.appendChild(block);
    });
  });