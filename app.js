try {
  Chart.register(ChartDataLabels);

  fetch('data.json')
    .then(response => {
      if (!response.ok) throw new Error("Could not load data.json.");
      return response.json();
    })
    .then(data => {
      
      const formatINR = (value) => {
        if (value >= 10000000) return '₹' + (value / 10000000).toFixed(2) + ' Cr';
        if (value >= 100000) return '₹' + (value / 100000).toFixed(2) + ' L';
        return '₹' + value.toLocaleString('en-IN');
      };

      if(document.getElementById('projectName')) document.getElementById('projectName').textContent = data.projectMeta.name;
      if(document.getElementById('projectSubtitle')) document.getElementById('projectSubtitle').textContent = data.projectMeta.subtitle;
      if(document.getElementById('projectDetails')) document.getElementById('projectDetails').textContent = `${data.projectMeta.location} | RERA ID: ${data.projectMeta.reraNumber}`;
      if(document.getElementById('handoverDate')) document.getElementById('handoverDate').textContent = data.projectMeta.targetHandover;
      if(document.getElementById('validityDate')) document.getElementById('validityDate').textContent = data.projectMeta.reraValidity;

      const createDonut = (elementId, percentage, color) => {
        const el = document.getElementById(elementId);
        if (!el) return;
        new Chart(el.getContext('2d'), {
          type: 'doughnut',
          data: {
            labels: ['Completed', 'Remaining'],
            datasets: [{ data: [percentage, 100 - percentage], backgroundColor: [color, '#f1f5f9'], borderWidth: 0 }]
          },
          options: { cutout: '75%', plugins: { tooltip: { enabled: false }, legend: { display: false }, datalabels: { display: false } }, responsive: true, maintainAspectRatio: false }
        });
      };

      if(document.getElementById('overallPercentText')) document.getElementById('overallPercentText').textContent = `${data.projectMeta.overallProgress}%`;
      createDonut('overallProgressChart', data.projectMeta.overallProgress, '#4f46e5');

      const latestSales = data.timeSeries[data.timeSeries.length - 1].sales;
      const salesPercent = Math.round((latestSales.booked / (latestSales.booked + latestSales.unsold)) * 100);
      if(document.getElementById('salesPercentText')) document.getElementById('salesPercentText').textContent = `${salesPercent}%`;
      createDonut('salesDonutChart', salesPercent, '#10b981');

      const costPercent = Math.round((data.financialHealth.actualCost / data.financialHealth.estimatedCost) * 100);
      if(document.getElementById('costPercentRingText')) document.getElementById('costPercentRingText').textContent = `${costPercent}%`;
      createDonut('costDonutChart', costPercent, '#3b82f6');

      setTimeout(() => {
        if(document.getElementById('timeProgressBar')) document.getElementById('timeProgressBar').style.width = '28%';
        if(document.getElementById('timeElapsedText')) document.getElementById('timeElapsedText').textContent = 'Timeline Elapsed: 28%';
      }, 500);

      const pipeContainer = document.getElementById('subPipelineContainer');
      if (pipeContainer && data.subStructure) {
        data.subStructure.forEach((item) => {
          let activeClass = item.progress > 0 ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-slate-400 border-slate-200';
          let lineClass = item.progress === 100 ? 'active' : '';
          pipeContainer.innerHTML += `
            <div class="pipeline-step ${lineClass}">
              <div class="pipeline-dot ${activeClass}">${item.progress}%</div>
              <div class="text-[11px] font-bold text-slate-600 px-2">${item.name}</div>
            </div>
          `;
        });
      }

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
      };
      
      const superContainer = document.getElementById('superStructureContainer');
      if(superContainer && data.superStructure) {
          data.superStructure.forEach(item => superContainer.innerHTML += generateProgressBar(item));
      }
      
      const finishContainer = document.getElementById('finishingStructureContainer');
      if(finishContainer && data.finishingStructure) {
          data.finishingStructure.forEach(item => finishContainer.innerHTML += generateProgressBar(item));
      }

      const towerContainer = document.getElementById('towerContainer');
      if (towerContainer && data.towerProgress) {
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
                <img src="${tower.imageUrl}" alt="${tower.wing} site picture" class="w-full h-full object-cover zoom-image cursor-zoom-in" data-zoom-src="${tower.imageUrl}" onerror="this.src='https://via.placeholder.com/400x200?text=Image+Not+Found'" />
                <div class="absolute bottom-2 right-2 bg-black/50 backdrop-blur text-white px-2 py-1 rounded text-[9px] font-bold uppercase pointer-events-none">
                  Q2 Status
                </div>
              </div>
              
              <div class="overflow-y-auto flex-1 thin-scrollbar flex flex-col gap-2.5 pr-2 w-full mb-4">
                ${floorsHTML}
              </div>

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
        
        if(window.mediumZoom) mediumZoom('.zoom-image', { margin: 24, background: 'rgba(15, 23, 42, 0.9)' });
      }

      const histCanvas = document.getElementById('historicalProgressChart');
      if (histCanvas && data.timeSeries) {
        const quarters = data.timeSeries.map(q => q.quarter);
        const overallProg = data.timeSeries.map(q => q.construction.overall);
        const subProg = data.timeSeries.map(q => q.construction.sub);
        const superProg = data.timeSeries.map(q => q.construction.super);
        new Chart(histCanvas.getContext('2d'), {
          type: 'line',
          data: { labels: quarters, datasets: [ 
            { label: 'Overall Completion %', data: overallProg, borderColor: '#10b981', backgroundColor: '#10b981', borderWidth: 4, tension: 0.3, pointRadius: 6, pointBackgroundColor: '#fff' },
            { label: 'Sub-Structure %', data: subProg, borderColor: '#3b82f6', backgroundColor: '#3b82f6', borderDash: [5, 5], borderWidth: 2, tension: 0.3, pointRadius: 4, pointBackgroundColor: '#fff' },
            { label: 'Super-Structure %', data: superProg, borderColor: '#8b5cf6', backgroundColor: '#8b5cf6', borderDash: [5, 5], borderWidth: 2, tension: 0.3, pointRadius: 4, pointBackgroundColor: '#fff' }
          ] },
          options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: { position: 'bottom' }, datalabels: { display: function(context) { return context.datasetIndex === 0; }, align: 'top', backgroundColor: '#10b981', borderRadius: 4, color: 'white', font: { weight: 'bold', size: 10 }, padding: 4, formatter: (val) => val + '%' } }, scales: { x: { grid: { display: false } }, y: { beginAtZero: true, max: 100 } } }
        });
      }

      if(document.getElementById('flowCollectedText')) document.getElementById('flowCollectedText').textContent = formatINR(data.financialHealth.advanceCollected);
      if(document.getElementById('flowEscrowText')) document.getElementById('flowEscrowText').textContent = formatINR(data.financialHealth.amountWithdrawn);
      if(document.getElementById('flowCostText')) document.getElementById('flowCostText').textContent = formatINR(data.financialHealth.actualCost);

      const buildIconGrid = (containerId, items) => {
        const container = document.getElementById(containerId);
        if(!container) return;
        items.forEach(item => {
          let isActive = item.progress > 0;
          let ringColor = isActive ? `conic-gradient(#10b981 ${item.progress}%, #f1f5f9 0)` : 'bg-slate-100';
          let iconColor = isActive ? 'text-emerald-600' : 'text-slate-300';
          let textColor = isActive ? 'text-slate-800' : 'text-slate-400';
          let bgInner = isActive ? 'bg-emerald-50' : 'bg-white';
          
          container.innerHTML += `
            <div class="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-100 rounded-xl text-center">
              <div class="w-14 h-14 rounded-full flex items-center justify-center mb-3 shadow-sm relative" style="background: ${isActive ? '' : 'transparent'}; ${isActive ? 'background-image:' + ringColor : ''}">
                <div class="absolute inset-0 m-1 rounded-full ${bgInner} flex items-center justify-center">
                  <svg class="w-6 h-6 ${iconColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${item.icon}"></path></svg>
                </div>
              </div>
              <span class="text-[10px] font-bold uppercase tracking-wider ${textColor} leading-tight">${item.name}</span>
              ${isActive ? `<span class="text-xs font-black text-emerald-600 mt-1">${item.progress}%</span>` : `<span class="text-[10px] font-bold text-slate-300 mt-1">0%</span>`}
            </div>
          `;
        });
      };
      
      if(data.amenitiesProgress) buildIconGrid('amenitiesGridContainer', data.amenitiesProgress);
      if(data.commonAreasProgress) buildIconGrid('commonAreasGridContainer', data.commonAreasProgress);

      const docBody = document.getElementById('documentTableBody');
      if(docBody && data.documentMatrix) {
        data.documentMatrix.forEach(doc => {
          let badgeColor = doc.status.includes('Approved') || doc.status.includes('Uploaded') ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800';
          let fileExt = doc.file.split('.').pop().toUpperCase();
          docBody.innerHTML += `
            <tr class="hover:bg-slate-50 transition-colors">
              <td class="p-4 text-xs font-bold text-slate-500 whitespace-nowrap">${doc.category}</td>
              <td class="p-4 text-sm font-bold text-slate-800">${doc.title}</td>
              <td class="p-4"><span class="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${badgeColor}">${doc.status}</span></td>
              <td class="p-4 text-xs text-slate-500 font-medium whitespace-nowrap">${doc.date}</td>
              <td class="p-4 text-right">
                <a href="${doc.file}" target="_blank" class="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                  View PDF
                </a>
              </td>
            </tr>
          `;
        });
      }

      setTimeout(() => {
        document.querySelectorAll('[data-target]').forEach(bar => {
          bar.style.width = bar.getAttribute('data-target');
        });
      }, 500);

    })
    .catch(error => {
      console.error("Dashboard Load Error:", error);
      const errEl = document.getElementById('projectDetails');
      if (errEl) errEl.textContent = "Error loading data.json: " + error.message;
    });

} catch (error) {
  console.error("Script Execution Error:", error);
}
