try {
  Chart.register(ChartDataLabels);

  fetch('data.json')
    .then(response => {
      if (!response.ok) throw new Error("Could not load data.json.");
      return response.json();
    })
    .then(data => {
      
      // 1. Header Data & Dates
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

      // 3. Escrow Chart
      const quarters = data.timeSeries.map(q => q.quarter);
      const collected = data.timeSeries.map(q => q.escrow.collected);
      const withdrawn = data.timeSeries.map(q => q.escrow.withdrawn);
      const balance = data.timeSeries.map(q => q.escrow.balance);
      new Chart(document.getElementById('escrowChart').getContext('2d'), {
        type: 'bar',
        data: {
          labels: quarters,
          datasets: [
            { type: 'line', label: 'Escrow Balance', data: balance, borderColor: '#10b981', backgroundColor: '#10b981', borderWidth: 3, tension: 0.3, pointRadius: 5, pointBackgroundColor: '#fff' },
            { type: 'bar', label: 'Total Collected', data: collected, backgroundColor: '#3b82f6', borderRadius: 4, barPercentage: 0.7 },
            { type: 'bar', label: 'Total Withdrawn', data: withdrawn, backgroundColor: '#f43f5e', borderRadius: 4, barPercentage: 0.7 }
          ]
        },
        options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, layout: { padding: { top: 20, right: 20 } }, plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, font: { size: 11, family: 'sans-serif' }, padding: 20 } }, tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.95)', titleFont: { size: 13 }, bodyFont: { size: 12 }, padding: 12, cornerRadius: 8, boxPadding: 6, callbacks: { label: function(context) { return context.dataset.label + ': ' + formatINR(context.raw); } } }, datalabels: { display: function(context) { return context.dataset.type === 'line'; }, align: 'top', anchor: 'bottom', backgroundColor: '#10b981', borderRadius: 4, color: 'white', font: { weight: 'bold', size: 10 }, padding: { x: 6, y: 4 }, formatter: function(value) { return formatShortINR(value); } } }, scales: { x: { grid: { display: false } }, y: { border: { display: false }, ticks: { maxTicksLimit: 6, callback: function(value) { return formatINR(value); } } } } }
      });

      // 4. Sales Chart
      const booked = data.timeSeries.map(q => q.sales.booked);
      const unsold = data.timeSeries.map(q => q.sales.unsold);
      new Chart(document.getElementById('salesChart').getContext('2d'), {
        type: 'bar',
        data: {
          labels: quarters,
          datasets: [
            { type: 'line', label: 'Unsold Inventory', data: unsold, borderColor: '#64748b', backgroundColor: '#64748b', borderWidth: 3, tension: 0.3, pointRadius: 5, pointBackgroundColor: '#fff' },
            { type: 'bar', label: 'Cumulative Bookings', data: booked, backgroundColor: '#6366f1', borderRadius: 4, barPercentage: 0.5 }
          ]
        },
        options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, layout: { padding: { top: 20, right: 20 } }, plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, font: { size: 11, family: 'sans-serif' }, padding: 20 } }, tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.95)', titleFont: { size: 13 }, bodyFont: { size: 12 }, padding: 12, cornerRadius: 8, boxPadding: 6 }, datalabels: { display: function(context) { return context.dataset.type === 'line'; }, align: 'top', anchor: 'bottom', backgroundColor: '#64748b', borderRadius: 4, color: 'white', font: { weight: 'bold', size: 10 }, padding: { x: 6, y: 4 } } }, scales: { x: { grid: { display: false } }, y: { border: { display: false }, ticks: { maxTicksLimit: 6 } } } }
      });

      // 5. Financial Cost Tracker
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

      // 6. Encumbrance Bar Animation
      const total = data.inventoryMeta.totalUnits;
      const mortgaged = data.inventoryMeta.mortgaged;
      const unencumbered = data.inventoryMeta.unencumbered;
      const mortPercent = (mortgaged / total) * 100;
      document.getElementById('totalUnitsText').textContent = total;
      setTimeout(() => {
        const mortBar = document.getElementById('mortgageBar');
        mortBar.style.width = `${mortPercent}%`;
        mortBar.textContent = `${mortgaged} Units`;
        document.getElementById('unencumberedText').textContent = `${unencumbered} Units`;
      }, 300);

      // 7. General Progress Bar Generator
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

      // 8. Inject Sub & Super Structure
      const subContainer = document.getElementById('subStructureContainer');
      data.subStructure.forEach(item => { subContainer.innerHTML += generateProgressBar(item); });

      const superContainer = document.getElementById('superStructureContainer');
      data.superStructure.forEach(item => { superContainer.innerHTML += generateProgressBar(item); });

      // 9. Tower Elevation & Inventory Injection
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

        // Inventory Footer
        let inv = tower.inventory;
        let breakdownHTML = '';
        inv.breakdown.forEach(b => {
          breakdownHTML += `
            <div class="flex justify-between items-center text-[10px] border-b border-slate-100 pb-1 mb-1">
              <span class="font-bold text-slate-600">${b.type}</span>
              <div class="flex gap-3 text-right">
                <span class="w-8 text-slate-500">${b.total}</span>
                <span class="w-8 text-indigo-600 font-bold">${b.booked}</span>
                <span class="w-8 text-emerald-600 font-bold">${b.available}</span>
              </div>
            </div>
          `;
        });
        
        towerContainer.innerHTML += `
          <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col h-[500px]">
            <h3 class="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3 flex justify-between items-center">
              ${tower.wing} 
              <span class="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
                Overall: ${tower.overallCompletion}%
              </span>
            </h3>
            
            <div class="overflow-y-auto flex-1 thin-scrollbar flex flex-col gap-2.5 pr-2 w-full mb-4">
              ${floorsHTML}
            </div>

            <!-- Inventory Footer -->
            <div class="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div class="flex justify-between items-center text-[10px] uppercase font-black tracking-wider text-slate-400 mb-2 border-b border-slate-200 pb-1">
                <span>Unit Type</span>
                <div class="flex gap-3 text-right">
                  <span class="w-8">Total</span>
                  <span class="w-8 text-indigo-400">Booked</span>
                  <span class="w-8 text-emerald-400">Avail</span>
                </div>
              </div>
              ${breakdownHTML}
              <div class="flex justify-between items-center text-[11px] pt-1 font-black text-slate-700">
                <span>TOTAL UNITS</span>
                <div class="flex gap-3 text-right">
                  <span class="w-8">${inv.totalUnits}</span>
                  <span class="w-8 text-indigo-600">${inv.bookedUnits}</span>
                  <span class="w-8 text-emerald-600">${inv.availableUnits}</span>
                </div>
              </div>
              <div class="flex justify-between items-center text-[10px] pt-2 mt-2 border-t border-slate-200 font-bold text-slate-500">
                <span>Car Parkings</span>
                <div class="flex gap-3 text-right">
                  <span class="w-8">${inv.parkings.total}</span>
                  <span class="w-8 text-indigo-500">${inv.parkings.booked}</span>
                  <span class="w-8 text-emerald-500">${inv.parkings.available}</span>
                </div>
              </div>
            </div>
          </div>
        `;
      });

      // 10. Sort and Inject Legal Risk Matrix
      const riskContainer = document.getElementById('riskMatrixContainer');
      const generateLegalCard = (title, status, frontDesc, backDesc) => {
        let colorClass = 'bg-slate-100 text-slate-700';
        if (status === 'Cleared') colorClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
        else if (status.includes('Progress')) colorClass = 'bg-amber-100 text-amber-800 border-amber-200';
        else if (status === 'Pending') colorClass = 'bg-rose-100 text-rose-800 border-rose-200';

        return `
          <div class="flip-card perspective h-52 w-full cursor-pointer">
            <div class="flip-card-inner relative w-full h-full transition-transform duration-700 preserve-3d">
              <div class="absolute w-full h-full backface-hidden bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div class="flex justify-between items-start mb-2">
                    <h3 class="font-bold text-slate-800 text-base leading-tight pr-1">${title}</h3>
                    <span class="px-2 py-0.5 text-[10px] font-bold rounded border whitespace-nowrap ${colorClass}">${status}</span>
                  </div>
                  <p class="text-slate-600 text-sm font-medium line-clamp-3">${frontDesc}</p>
                </div>
                <div class="text-[11px] text-indigo-500 font-bold flex items-center gap-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"></path></svg>
                  Tap for details
                </div>
              </div>
              <div class="absolute w-full h-full backface-hidden rotate-y-180 bg-slate-800 text-white border border-slate-700 rounded-2xl p-5 shadow-lg overflow-y-auto thin-scrollbar flex flex-col justify-start pt-5 pr-2">
                <h3 class="font-bold text-indigo-300 text-sm mb-2 border-b border-slate-600 pb-2">${title}</h3>
                <p class="text-xs text-slate-200 leading-relaxed whitespace-pre-line">${backDesc}</p>
              </div>
            </div>
          </div>
        `;
      };

      data.legalRiskMatrix.sort((a, b) => {
        if (a.title.includes("Litigation")) return -1;
        if (b.title.includes("Litigation")) return 1;
        const weights = { "Cleared": 1, "In Progress": 2, "Pending": 3 };
        return weights[a.status] - weights[b.status];
      }).forEach(item => { 
        riskContainer.innerHTML += generateLegalCard(item.title, item.status, item.frontDesc, item.backDesc); 
      });

      // 11. Inject Amenities & Common Areas Progress
      const amenitiesContainer = document.getElementById('amenitiesContainer');
      data.amenitiesProgress.forEach(am => { amenitiesContainer.innerHTML += generateProgressBar(am); });

      const commonAreasContainer = document.getElementById('commonAreasContainer');
      data.commonAreasProgress.forEach(ca => { commonAreasContainer.innerHTML += generateProgressBar(ca); });

      // Trigger all custom progress bar animations globally
      setTimeout(() => {
        document.querySelectorAll('[data-target]').forEach(bar => {
          bar.style.width = bar.getAttribute('data-target');
        });
      }, 500);

      // 12. Inject Project Team
      const teamContainer = document.getElementById('projectTeamContainer');
      data.projectTeam.forEach(member => {
        teamContainer.innerHTML += `
          <div class="bg-white border border-slate-200 rounded-xl p-4 flex flex-col">
            <span class="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1">${member.role}</span>
            <span class="text-lg font-bold text-slate-800">${member.name}</span>
            <p class="text-xs text-slate-500 mt-2 leading-relaxed">${member.detail}</p>
          </div>
        `;
      });

      // 13. Attach Mobile Tap Listeners
      document.querySelectorAll('.flip-card').forEach(card => {
        card.addEventListener('click', () => { card.querySelector('.flip-card-inner').classList.toggle('flipped'); });
      });

    })
    .catch(error => {
      document.getElementById('projectName').textContent = "⚠️ Data Loading Error";
      document.getElementById('projectDetails').textContent = "Check if data.json is properly formatted. Error: " + error.message;
      console.error(error);
    });

} catch (error) {
  document.getElementById('projectName').textContent = "⚠️ Script Error";
  document.getElementById('projectDetails').textContent = "There is a typo in app.js. Error: " + error.message;
  console.error(error);
}
