try {
  Chart.register(ChartDataLabels);

  fetch('data.json')
    .then(response => {
      if (!response.ok) throw new Error("Could not load data.json.");
      return response.json();
    })
    .then(data => {
      
      // 1. Header Data & Overall Progress
      document.getElementById('projectName').textContent = data.projectMeta.name;
      document.getElementById('projectSubtitle').textContent = data.projectMeta.subtitle;
      document.getElementById('projectDetails').textContent = `${data.projectMeta.location} | RERA ID: ${data.projectMeta.reraNumber}`;
      document.getElementById('updateBadge').textContent = data.projectMeta.updated;
      document.getElementById('overallPercentText').textContent = `${data.projectMeta.overallProgress}%`;

      new Chart(document.getElementById('overallProgressChart').getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: ['Completed', 'Remaining'],
          datasets: [{ data: [data.projectMeta.overallProgress, 100 - data.projectMeta.overallProgress], backgroundColor: ['#4f46e5', '#f1f5f9'], borderWidth: 0 }]
        },
        options: { cutout: '75%', plugins: { tooltip: { enabled: false }, legend: { display: false }, datalabels: { display: false } }, responsive: true, maintainAspectRatio: false }
      });

      // 2. Setup Chart Data Arrays
      const quarters = data.timeSeries.map(q => q.quarter);
      const collected = data.timeSeries.map(q => q.escrow.collected);
      const withdrawn = data.timeSeries.map(q => q.escrow.withdrawn);
      const balance = data.timeSeries.map(q => q.escrow.balance);
      const booked = data.timeSeries.map(q => q.sales.booked);
      const unsold = data.timeSeries.map(q => q.sales.unsold);

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
        options: { 
          responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, layout: { padding: { top: 20, right: 20 } }, 
          plugins: {
            legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, font: { size: 11, family: 'sans-serif' }, padding: 20 } },
            tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.95)', titleFont: { size: 13 }, bodyFont: { size: 12 }, padding: 12, cornerRadius: 8, boxPadding: 6, callbacks: { label: function(context) { return context.dataset.label + ': ' + formatINR(context.raw); } } },
            datalabels: { display: function(context) { return context.dataset.type === 'line'; }, align: 'top', anchor: 'bottom', backgroundColor: '#10b981', borderRadius: 4, color: 'white', font: { weight: 'bold', size: 10 }, padding: { x: 6, y: 4 }, formatter: function(value) { return formatShortINR(value); } }
          },
          scales: { x: { grid: { display: false } }, y: { border: { display: false }, ticks: { maxTicksLimit: 6, callback: function(value) { return formatINR(value); } } } }
        }
      });

      // 4. Sales Chart
      new Chart(document.getElementById('salesChart').getContext('2d'), {
        type: 'bar',
        data: {
          labels: quarters,
          datasets: [
            { type: 'line', label: 'Unsold Inventory', data: unsold, borderColor: '#64748b', backgroundColor: '#64748b', borderWidth: 3, tension: 0.3, pointRadius: 5, pointBackgroundColor: '#fff' },
            { type: 'bar', label: 'Cumulative Bookings', data: booked, backgroundColor: '#6366f1', borderRadius: 4, barPercentage: 0.5 }
          ]
        },
        options: { 
          responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, layout: { padding: { top: 20, right: 20 } }, 
          plugins: {
            legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, font: { size: 11, family: 'sans-serif' }, padding: 20 } },
            tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.95)', titleFont: { size: 13 }, bodyFont: { size: 12 }, padding: 12, cornerRadius: 8, boxPadding: 6 },
            datalabels: { display: function(context) { return context.dataset.type === 'line'; }, align: 'top', anchor: 'bottom', backgroundColor: '#64748b', borderRadius: 4, color: 'white', font: { weight: 'bold', size: 10 }, padding: { x: 6, y: 4 } }
          },
          scales: { x: { grid: { display: false } }, y: { border: { display: false }, ticks: { maxTicksLimit: 6 } } }
        }
      });

      // 5. Encumbrance Bar Animation
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

      // 6. UI Generators (Shrunk cards to h-52)
      const generateLegalCard = (title, status, frontDesc, backDesc) => {
        let colorClass = 'bg-slate-100 text-slate-700';
        if (status === 'Cleared') colorClass = 'bg-emerald-100 text-emerald-800';
        else if (status.includes('Progress')) colorClass = 'bg-amber-100 text-amber-800';
        else if (status === 'Pending') colorClass = 'bg-rose-100 text-rose-800';

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
              <div class="absolute w-full h-full backface-hidden rotate-y-180 bg-slate-800 text-white border border-slate-700 rounded-2xl p-5 shadow-lg overflow-y-auto flex flex-col justify-start pt-5">
                <h3 class="font-bold text-indigo-300 text-sm mb-2 border-b border-slate-600 pb-2">${title}</h3>
                <p class="text-xs text-slate-200 leading-relaxed whitespace-pre-line">${backDesc}</p>
              </div>
            </div>
          </div>
        `;
      };

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
            <!-- Timeline Dot -->
            <div class="w-6 h-6 rounded-full border-4 shadow-sm z-10 mb-4 ${dotColor}"></div>
            
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

      // 7. Inject UI Elements
      const buildContainer = document.getElementById('constructionContainer');
      data.constructionMilestones.forEach(item => { buildContainer.innerHTML += generateTimelineCard(item); });

      const riskContainer = document.getElementById('riskMatrixContainer');
      data.legalRiskMatrix.forEach(item => { riskContainer.innerHTML += generateLegalCard(item.title, item.status, item.frontDesc, item.backDesc); });

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

      // 8. Attach Mobile Tap Listeners
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
