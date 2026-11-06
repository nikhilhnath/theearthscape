try {
  Chart.register(ChartDataLabels);

  fetch('data.json')
    .then(response => {
      if (!response.ok) throw new Error("Could not load data.json.");
      return response.json();
    })
    .then(data => {
      
      // 1. Header Data
      document.getElementById('projectName').textContent = data.projectMeta.name;
      document.getElementById('projectSubtitle').textContent = data.projectMeta.subtitle;
      document.getElementById('projectDetails').textContent = `${data.projectMeta.location} | RERA ID: ${data.projectMeta.reraNumber}`;
      document.getElementById('updateBadge').textContent = data.projectMeta.updated;
      document.getElementById('handoverDate').textContent = data.projectMeta.targetHandover;
      document.getElementById('validityDate').textContent = data.projectMeta.reraValidity;
      document.getElementById('overallPercentText').textContent = `${data.projectMeta.overallProgress}%`;

      new Chart(document.getElementById('overallProgressChart').getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: ['Completed', 'Remaining'],
          datasets: [{ data: [data.projectMeta.overallProgress, 100 - data.projectMeta.overallProgress], backgroundColor: ['#4f46e5', '#f1f5f9'], borderWidth: 0 }]
        },
        options: { cutout: '75%', plugins: { tooltip: { enabled: false }, legend: { display: false }, datalabels: { display: false } }, responsive: true, maintainAspectRatio: false }
      });

      // 2. Formatters
      const formatINR = (value) => {
        if (value >= 10000000) return '₹' + (value / 10000000).toFixed(2) + ' Cr';
        if (value >= 100000) return '₹' + (value / 100000).toFixed(2) + ' L';
        return '₹' + value.toLocaleString('en-IN');
      };
      const formatShortINR = (value) => {
        if (value >= 10000000) return (value / 10000000).toFixed(1) + ' Cr';
        if (value >= 100000) return (value / 100000).toFixed(1) + ' L';
        return value.toLocaleString('en-IN');
      };

      // 3. Horizontal Timeline Component
      const generateTimelineCard = (item) => {
        let statusColor = item.status.includes('100%') ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200';
        let dotColor = item.status.includes('100%') ? 'border-emerald-500 bg-white' : 'border-indigo-500 bg-white';
        let varColor = 'text-slate-500';
        if(item.variance === 'Completed') varColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
        if(item.variance === 'Ahead of Schedule') varColor = 'text-blue-700 bg-blue-50 border-blue-200';
        if(item.variance === 'On Track') varColor = 'text-indigo-700 bg-indigo-50 border-indigo-200';
        if(item.variance === 'Delayed') varColor = 'text-rose-700 bg-rose-50 border-rose-200';

        return `
          <div class="relative w-72 md:w-80 shrink-0 flex flex-col items-center">
            <div class="w-6 h-6 rounded-full border-4 shadow-sm z-20 bg-white ${dotColor}"></div>
            <div class="w-1 h-6 bg-slate-200 z-10"></div>
            
            <div class="flip-card perspective h-52 w-full cursor-pointer">
              <div class="flip-card-inner relative w-full h-full transition-transform duration-700 preserve-3d">
                <div class="absolute w-full h-full backface-hidden bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                  <div>
                    <div class="flex justify-between items-start mb-2">
                      <h3 class="font-bold text-slate-800 text-base leading-tight pr-2">${item.title}</h3>
                      <span class="px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded border whitespace-nowrap ${statusColor}">${item.status}</span>
                    </div>
                    <span class="inline-block px-2 py-1 mb-2 text-[11px] font-bold rounded border ${varColor}">${item.variance}</span>
                    <p class="text-slate-600 text-sm font-medium line-clamp-2">${item.frontDesc}</p>
                  </div>
                  <div class="text-[11px] text-indigo-500 font-bold flex items-center gap-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"></path></svg>
                    Tap for RERA dates
                  </div>
                </div>
                <div class="absolute w-full h-full backface-hidden rotate-y-180 bg-slate-800 text-white border border-slate-700 rounded-2xl p-5 shadow-lg overflow-y-auto flex flex-col justify-start pt-5">
                  <h3 class="font-bold text-indigo-300 text-sm mb-2 border-b border-slate-600 pb-2">${item.title} Dates</h3>
                  <p class="text-xs text-slate-200 leading-relaxed whitespace-pre-line">${item.backDesc}</p>
                </div>
              </div>
            </div>
          </div>
        `;
      };
      const buildContainer = document.getElementById('constructionContainer');
      data.constructionMilestones.forEach(item => { buildContainer.innerHTML += generateTimelineCard(item); });

      // 4. Bar Generators (Sub/Super/Amenities)
      const generateProgressBar = (item) => {
        let barColor = item.progress === 100 ? 'bg-emerald-500' : (item.progress > 0 ? 'bg-indigo-500' : 'bg-slate-200');
        let labelColor = item.progress === 100 ? 'text-emerald-700' : 'text-slate-700';
        return `
          <div>
            <div class="flex justify-between items-end mb-2">
              <span class="font-bold ${labelColor} text-[13px]">${item.name}</span>
              <span class="text-xs font-black text-slate-400">${item.progress}%</span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden shadow-inner">
              <div class="${barColor} h-2 rounded-full transition-all duration-1000 ease-out" style="width: 0%" data-target="${item.progress}%"></div>
            </div>
          </div>
        `;
      }
      
      const subContainer = document.getElementById('subStructureContainer');
      data.subStructure.forEach(item => { subContainer.innerHTML += generateProgressBar(item); });

      const superContainer = document.getElementById('superStructureContainer');
      data.superStructure.forEach(item => { superContainer.innerHTML += generateProgressBar(item); });

      // 5. Tower Elevation & Images Injection
      const towerContainer = document.getElementById('towerContainer');
      data.towerProgress.forEach(tower => {
        let floorsHTML = '';
        tower.floors.forEach(floor => {
          let barColor = floor.progress === 100 ? 'bg-emerald-500' : (floor.progress > 0 ? 'bg-indigo-500' : 'bg-slate-200');
          let labelColor = floor.progress === 100 ? 'text-emerald-700' : 'text-slate-500';
          floorsHTML += `
            <div class="flex items-center gap-3 w-full">
              <span class="w-16 text-xs font-bold ${labelColor} text-right shrink-0">${floor.name}</span>
              <div class="flex-1 h-5 bg-slate-100 rounded overflow-hidden flex shadow-inner">
                <div class="h-full ${barColor} transition-all duration-1000 ease-out" style="width: 0%" data-target="${floor.progress}%"></div>
              </div>
              <span class="w-8 text-[10px] font-black text-slate-400 shrink-0">${floor.progress}%</span>
            </div>
          `;
        });

        let inv = tower.inventory;
        let breakdownHTML = '';
        inv.breakdown.forEach(b => {
          breakdownHTML += `
            <div class="flex justify-between items-center text-[10px] border-b border-slate-100 pb-1 mb-1">
              <span class="font-bold text-slate-600">${b.type}</span>
              <div class="flex gap-2 text-right">
                <span class="w-10 text-slate-500">${b.total}</span>
                <span class="w-10 text-indigo-600 font-bold">${b.booked}</span>
                <span class="w-10 text-emerald-600 font-bold">${b.available}</span>
              </div>
            </div>
          `;
        });
        
        towerContainer.innerHTML += `
          <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col h-[650px]">
            <h3 class="text-lg font-bold text-slate-800 mb-3 border-b border-slate-100 pb-3 flex justify-between items-center">
              ${tower.wing} 
              <span class="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
                Overall: ${tower.overallCompletion}%
              </span>
            </h3>
            
            <div class="mb-4 rounded-xl overflow-hidden shadow-sm border border-slate-100 relative h-36">
              <img src="${tower.imageUrl}" alt="${tower.wing} site picture" class="w-full h-full object-cover zoom-image cursor-zoom-in" data-zoom-src="${tower.imageUrl}" />
              <div class="absolute bottom-2 right-2 bg-black/50 backdrop-blur text-white px-2 py-1 rounded text-[9px] font-bold uppercase pointer-events-none">
                Q2 Status
              </div>
            </div>
            
            <div class="overflow-y-auto flex-1 thin-scrollbar flex flex-col gap-2.5 pr-2 w-full mb-4">
              ${floorsHTML}
            </div>

            <!-- Inventory Footer -->
            <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 shrink-0">
              <div class="flex justify-between items-center text-[10px] uppercase font-black tracking-wider text-slate-400 mb-2 border-b border-slate-200 pb-1">
                <span>Unit Type</span>
                <div class="flex gap-2 text-right">
                  <span class="w-10">Total</span>
                  <span class="w-10 text-indigo-400">BKD</span>
                  <span class="w-10 text-emerald-400">AVL</span>
                </div>
              </div>
              ${breakdownHTML}
              <div class="flex justify-between items-center text-[11px] pt-1 font-black text-slate-700">
                <span>TOTAL UNITS</span>
                <div class="flex gap-2 text-right">
                  <span class="w-10">${inv.totalUnits}</span>
                  <span class="w-10 text-indigo-600">${inv.bookedUnits}</span>
                  <span class="w-10 text-emerald-600">${inv.availableUnits}</span>
                </div>
              </div>
            </div>
          </div>
        `;
      });
      
      // Initialize Medium Zoom for Images
      mediumZoom('.zoom-image', { margin: 24, background: 'rgba(15, 23, 42, 0.9)' });

      // 6. Time-Series Charts (Historical, Escrow, Sales)
      const quarters = data.timeSeries.map(q => q.quarter);
      
      const overallProg = data.timeSeries.map(q => q.construction.overall);
      const subProg = data.timeSeries.map(q => q.construction.sub);
      const superProg = data.timeSeries.map(q => q.construction.super);
      new Chart(document.getElementById('historicalProgressChart').getContext('2d'), {
        type: 'line',
        data: { labels: quarters, datasets: [ 
          { label: 'Overall Completion %', data: overallProg, borderColor: '#10b981', backgroundColor: '#10b981', borderWidth: 4, tension: 0.3, pointRadius: 6, pointBackgroundColor: '#fff' },
          { label: 'Sub-Structure %', data: subProg, borderColor: '#3b82f6', backgroundColor: '#3b82f6', borderDash: [5, 5], borderWidth: 2, tension: 0.3, pointRadius: 4, pointBackgroundColor: '#fff' },
          { label: 'Super-Structure %', data: superProg, borderColor: '#8b5cf6', backgroundColor: '#8b5cf6', borderDash: [5, 5], borderWidth: 2, tension: 0.3, pointRadius: 4, pointBackgroundColor: '#fff' }
        ] },
        options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: { position: 'bottom' }, datalabels: { display: function(context) { return context.datasetIndex === 0; }, align: 'top', backgroundColor: '#10b981', borderRadius: 4, color: 'white', font: { weight: 'bold', size: 10 }, padding: 4, formatter: (val) => val + '%' } }, scales: { x: { grid: { display: false } }, y: { beginAtZero: true, max: 100 } } }
      });

      const collected = data.timeSeries.map(q => q.escrow.collected);
      const withdrawn = data.timeSeries.map(q => q.escrow.withdrawn);
      const balance = data.timeSeries.map(q => q.escrow.balance);
      new Chart(document.getElementById('escrowChart').getContext('2d'), {
        type: 'bar',
        data: { labels: quarters, datasets: [ { type: 'line', label: 'Escrow Balance', data: balance, borderColor: '#10b981', backgroundColor: '#10b981', borderWidth: 3, tension: 0.3, pointRadius: 5, pointBackgroundColor: '#fff' }, { type: 'bar', label: 'Total Collected', data: collected, backgroundColor: '#3b82f6', borderRadius: 4, barPercentage: 0.7 }, { type: 'bar', label: 'Total Withdrawn', data: withdrawn, backgroundColor: '#f43f5e', borderRadius: 4, barPercentage: 0.7 } ] },
        options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: { position: 'bottom' }, datalabels: { display: function(context) { return context.dataset.type === 'line'; }, align: 'top', backgroundColor: '#10b981', borderRadius: 4, color: 'white', font: { weight: 'bold', size: 10 }, padding: 4, formatter: function(value) { return formatShortINR(value); } } }, scales: { x: { grid: { display: false } }, y: { border: { display: false }, ticks: { maxTicksLimit: 6, callback: function(value) { return formatINR(value); } } } } }
      });

      const booked = data.timeSeries.map(q => q.sales.booked);
      const unsold = data.timeSeries.map(q => q.sales.unsold);
      new Chart(document.getElementById('salesChart').getContext('2d'), {
        type: 'bar',
        data: { labels: quarters, datasets: [ { type: 'line', label: 'Unsold Inventory', data: unsold, borderColor: '#64748b', backgroundColor: '#64748b', borderWidth: 3, tension: 0.3, pointRadius: 5, pointBackgroundColor: '#fff' }, { type: 'bar', label: 'Cumulative Bookings', data: booked, backgroundColor: '#6366f1', borderRadius: 4, barPercentage: 0.5 } ] },
        options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: { position: 'bottom' }, datalabels: { display: function(context) { return context.dataset.type === 'line'; }, align: 'top', backgroundColor: '#64748b', borderRadius: 4, color: 'white', font: { weight: 'bold', size: 10 }, padding: 4 } }, scales: { x: { grid: { display: false } }, y: { border: { display: false }, ticks: { maxTicksLimit: 6 } } } }
      });

      // 7. Financial Cost Tracker & Certificates
      const estCost = data.financialHealth.estimatedCost;
      const actCost = data.financialHealth.actualCost;
      const costPercent = ((actCost / estCost) * 100).toFixed(1);
      document.getElementById('costEstText').textContent = formatINR(estCost);
      document.getElementById('costSpentText').textContent = formatINR(actCost);
      document.getElementById('costPercentText').textContent = `${costPercent}% Spent`;
      setTimeout(() => {
        const costBar = document.getElementById('costProgressBar');
        costBar.style.width = `${costPercent}%`;
        if (costPercent > 5) costBar.textContent = `${costPercent}%`;
      }, 400);

      document.getElementById('advanceCollectedText').textContent = formatINR(data.financialHealth.advanceCollected);
      document.getElementById('amountWithdrawnText').textContent = formatINR(data.financialHealth.amountWithdrawn);
      
      const certContainer = document.getElementById('certificatesContainer');
      data.financialHealth.certificates.forEach(cert => {
        certContainer.innerHTML += `
          <div class="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
              <span class="text-sm font-bold text-slate-700">${cert.name}</span>
            </div>
            <span class="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">${cert.status}</span>
          </div>
        `;
      });

      // 8. Legal Risk Matrix
      const riskContainer = document.getElementById('riskMatrixContainer');
      data.legalRiskMatrix.forEach(item => {
        let colorClass = item.status === 'Cleared' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200';
        riskContainer.innerHTML += `
          <div class="flip-card perspective h-52 w-full cursor-pointer">
            <div class="flip-card-inner relative w-full h-full transition-transform duration-700 preserve-3d">
              <div class="absolute w-full h-full backface-hidden bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div class="flex justify-between items-start mb-2">
                    <h3 class="font-bold text-slate-800 text-base leading-tight pr-1">${item.title}</h3>
                    <span class="px-2 py-0.5 text-[10px] font-bold rounded border whitespace-nowrap ${colorClass}">${item.status}</span>
                  </div>
                  <p class="text-slate-600 text-sm font-medium line-clamp-3">${item.frontDesc}</p>
                </div>
              </div>
              <div class="absolute w-full h-full backface-hidden rotate-y-180 bg-slate-800 text-white border border-slate-700 rounded-2xl p-5 shadow-lg overflow-y-auto flex flex-col pt-5">
                <p class="text-xs text-slate-200 leading-relaxed whitespace-pre-line">${item.backDesc}</p>
              </div>
            </div>
          </div>
        `;
      });

      // Global bar animation trigger
      setTimeout(() => {
        document.querySelectorAll('[data-target]').forEach(bar => {
          bar.style.width = bar.getAttribute('data-target');
        });
      }, 500);

      // Mobile Tap Fix
      document.querySelectorAll('.flip-card').forEach(card => {
        card.addEventListener('click', () => { card.querySelector('.flip-card-inner').classList.toggle('flipped'); });
      });

    })
    .catch(error => console.error(error));

} catch (error) {
  console.error(error);
}
