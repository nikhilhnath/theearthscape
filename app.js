try {
  Chart.register(ChartDataLabels);

  let chartsRendered = false;
  
  // Gatekeeper Logic
  const loginBtn = document.getElementById('loginBtn');
  const passInput = document.getElementById('passcodeData');
  const loginScreen = document.getElementById('loginScreen');
  const mainDashboard = document.getElementById('mainDashboard');
  const mobileNav = document.getElementById('mobileNav');
  const loginError = document.getElementById('loginError');
  
  const grantAccess = () => {
    loginScreen.style.opacity = '0';
    setTimeout(() => {
      loginScreen.style.display = 'none';
      mainDashboard.classList.remove('opacity-0', 'pointer-events-none');
      if (window.innerWidth < 768) {
        mobileNav.classList.remove('opacity-0', 'pointer-events-none');
      }
      if(window.appData && !chartsRendered) {
         renderCharts(window.appData);
         chartsRendered = true;
         // Setup zoom after rendering
         if(window.mediumZoom) mediumZoom('.zoom-image', { margin: 24, background: 'rgba(15, 23, 42, 0.95)' });
      }
    }, 500);
  };
  
  loginBtn.addEventListener('click', () => {
    if(passInput.value === 'TEOA@2030') grantAccess();
    else {
      loginError.style.opacity = '1';
      setTimeout(() => { loginError.style.opacity = '0'; }, 2000);
    }
  });
  
  passInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') loginBtn.click();
  });

  // Setup Tab Logic
  const setupTabs = () => {
    const tabs = document.querySelectorAll('.tab-content');
    const btns = document.querySelectorAll('.tab-btn');

    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        tabs.forEach(t => t.classList.remove('active'));
        const targetTab = document.getElementById(targetId);
        if(targetTab) targetTab.classList.add('active');

        btns.forEach(b => {
          b.classList.remove('text-indigo-600', 'active');
          if(b.closest('#mobileNav')) b.classList.add('text-slate-400');
          if(b.closest('#desktopNav')) {
            b.classList.remove('text-indigo-600', 'border-indigo-600', 'bg-indigo-50');
            b.classList.add('text-slate-500', 'border-transparent');
          }
        });

        document.querySelectorAll(`.tab-btn[data-target="${targetId}"]`).forEach(b => {
           b.classList.add('active');
           if(b.closest('#mobileNav')) {
             b.classList.remove('text-slate-400');
             b.classList.add('text-indigo-600');
           }
           if(b.closest('#desktopNav')) {
             b.classList.remove('text-slate-500', 'border-transparent');
             b.classList.add('text-indigo-600', 'border-indigo-600', 'bg-indigo-50');
           }
        });
        
        // Re-attach zoom to new visible images just in case
        if(window.mediumZoom) mediumZoom('.zoom-image', { margin: 24, background: 'rgba(15, 23, 42, 0.95)' });
      });
    });
  };
  setupTabs();

  // Load Data
  fetch('data.json')
    .then(response => {
      if (!response.ok) throw new Error("Could not load data.json.");
      return response.json();
    })
    .then(data => {
      window.appData = data; 
      
      const formatINR = (value) => {
        if (value >= 10000000) return '₹' + (value / 10000000).toFixed(2) + ' Cr';
        if (value >= 100000) return '₹' + (value / 100000).toFixed(2) + ' L';
        return '₹' + value.toLocaleString('en-IN');
      };

      if(document.getElementById('projectName')) document.getElementById('projectName').textContent = data.projectMeta.name;
      if(document.getElementById('projectDetails')) document.getElementById('projectDetails').textContent = `${data.projectMeta.location} | RERA ID: ${data.projectMeta.reraNumber}`;
      if(document.getElementById('handoverDate')) document.getElementById('handoverDate').textContent = data.projectMeta.targetHandover;
      if(document.getElementById('validityDate')) document.getElementById('validityDate').textContent = data.projectMeta.reraValidity;
      if(document.getElementById('overallPercentText')) document.getElementById('overallPercentText').textContent = `${data.projectMeta.overallProgress}%`;
      
      const latestSales = data.timeSeries[data.timeSeries.length - 1].sales;
      const salesPercent = Math.round((latestSales.booked / (latestSales.booked + latestSales.unsold)) * 100);
      if(document.getElementById('salesPercentText')) document.getElementById('salesPercentText').textContent = `${salesPercent}%`;
      
      const costPercent = Math.round((data.financialHealth.actualCost / data.financialHealth.estimatedCost) * 100);
      if(document.getElementById('costPercentRingText')) document.getElementById('costPercentRingText').textContent = `${costPercent}%`;
      
      setTimeout(() => {
        if(document.getElementById('timeProgressBar')) document.getElementById('timeProgressBar').style.width = '28%';
        if(document.getElementById('timeElapsedText')) document.getElementById('timeElapsedText').textContent = 'Timeline Elapsed: 28%';
      }, 500);

      // Pipelines
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
      
      // Site Plan Interactive Overlays
      const sitePlanContainer = document.getElementById('sitePlanMarkers');
      if (sitePlanContainer && data.sitePlanServices) {
         data.sitePlanServices.forEach((service) => {
           let badgeColor = service.progress === 100 ? 'bg-emerald-500' : (service.progress > 0 ? 'bg-amber-500' : 'bg-slate-700');
           let pingAnimation = service.progress > 0 && service.progress < 100 ? `<div class="absolute inset-0 rounded-full border-2 border-emerald-500 marker-pulse"></div>` : '';
           
           sitePlanContainer.innerHTML += `
             <div class="absolute flex flex-col items-center transform -translate-x-1/2 -translate-y-1/2 z-10" style="top: ${service.top}; left: ${service.left};">
                <div class="relative w-5 h-5 sm:w-6 sm:h-6 rounded-full ${badgeColor} shadow-md border-2 border-white flex items-center justify-center text-white text-[10px] sm:text-xs font-bold z-10">
                   ${service.id}
                   ${pingAnimation}
                </div>
                <div class="mt-1 bg-white/90 backdrop-blur border border-slate-200 px-1.5 py-0.5 rounded shadow-sm text-center whitespace-nowrap">
                  <span class="block text-[8px] sm:text-[9px] font-bold text-slate-800">${service.name}</span>
                  <span class="block text-[8px] sm:text-[9px] font-black text-indigo-600">${service.progress}%</span>
                </div>
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
      if(superContainer && data.superStructure) data.superStructure.forEach(item => superContainer.innerHTML += generateProgressBar(item));
      
      const finishContainer = document.getElementById('finishingStructureContainer');
      if(finishContainer && data.finishingStructure) data.finishingStructure.forEach(item => finishContainer.innerHTML += generateProgressBar(item));

      // Towers
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
            <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col h-[750px]">
              <h3 class="text-lg font-bold text-slate-800 mb-3 border-b border-slate-100 pb-3 flex justify-between items-center">
                ${tower.wing} 
                <span class="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
                  Overall: ${tower.overallCompletion}%
                </span>
              </h3>
              
              <div class="mb-4 rounded-xl overflow-hidden shadow-sm border border-slate-100 relative h-36">
                <img src="${tower.imageUrl}" loading="lazy" alt="${tower.wing} site picture" class="w-full h-full object-cover zoom-image cursor-zoom-in" data-zoom-src="${tower.imageUrl}" onerror="this.src='https://via.placeholder.com/400x200?text=Image+Not+Found'" />
                <div class="absolute bottom-2 right-2 bg-black/50 backdrop-blur text-white px-2 py-1 rounded text-[9px] font-bold uppercase pointer-events-none">
                  Q2 Status
                </div>
              </div>

              <!-- Handover Targets -->
              <div class="flex gap-2 mb-4">
                <div class="flex-1 bg-amber-50 border border-amber-100 rounded-lg p-2 text-center">
                  <span class="block text-[9px] font-bold uppercase tracking-wider text-amber-500">Planned Civil</span>
                  <span class="text-sm font-black text-amber-900">${tower.plannedCivil}</span>
                </div>
                <div class="flex-1 bg-emerald-50 border border-emerald-100 rounded-lg p-2 text-center">
                  <span class="block text-[9px] font-bold uppercase tracking-wider text-emerald-500">Planned Handover</span>
                  <span class="text-sm font-black text-emerald-900">${tower.plannedHandover}</span>
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
      }

      // Financial Flow
      if(document.getElementById('flowCollectedText')) document.getElementById('flowCollectedText').textContent = formatINR(data.financialHealth.advanceCollected);
      if(document.getElementById('flowEscrowText')) document.getElementById('flowEscrowText').textContent = formatINR(data.financialHealth.amountWithdrawn);
      if(document.getElementById('flowCostText')) document.getElementById('flowCostText').textContent = formatINR(data.financialHealth.actualCost);

      // Engineering & Visual Highlights
      const engGrid = document.getElementById('engineeringGrid');
      if (engGrid && data.engineeringSpecs) {
        data.engineeringSpecs.forEach(spec => {
          engGrid.innerHTML += `
            <div class="bg-slate-50 border border-slate-100 rounded-lg p-4 text-center flex flex-col justify-center">
              <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">${spec.label}</span>
              <span class="block text-xl font-black text-slate-800 mb-1">${spec.value}</span>
              <span class="block text-[10px] font-medium text-slate-500 leading-tight">${spec.detail}</span>
            </div>
          `;
        });
      }

      const engVisGrid = document.getElementById('engineeringVisualsGrid');
      if (engVisGrid && data.engineeringHighlights) {
         data.engineeringHighlights.forEach(highlight => {
            engVisGrid.innerHTML += `
              <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                 <div class="h-48 bg-slate-100 w-full relative">
                    <img src="${highlight.image}" loading="lazy" alt="${highlight.title}" class="w-full h-full object-cover zoom-image cursor-zoom-in" data-zoom-src="${highlight.image}" onerror="this.src='https://via.placeholder.com/600x300?text=Please+Upload+${highlight.image}'">
                 </div>
                 <div class="p-5">
                    <h4 class="font-bold text-slate-800 mb-1">${highlight.title}</h4>
                    <p class="text-xs text-slate-500 leading-relaxed">${highlight.desc}</p>
                 </div>
              </div>
            `;
         });
      }

      const brandsGrid = document.getElementById('brandsGrid');
      if (brandsGrid && data.premiumBrands) {
        data.premiumBrands.forEach(brand => {
          brandsGrid.innerHTML += `
            <div class="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-lg p-3">
              <div class="flex flex-col flex-1 pr-2">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">${brand.category}</span>
                <span class="text-xs font-medium text-slate-500 leading-tight">${brand.detail}</span>
              </div>
              <div class="w-20 h-10 shrink-0 flex items-center justify-end">
                  <img src="${brand.logoUrl}" class="max-h-full max-w-full object-contain mix-blend-multiply" alt="${brand.brand} logo" onerror="this.outerHTML='<span class=\'text-sm font-black text-slate-800 text-right\'>${brand.brand}</span>'">
              </div>
            </div>
          `;
        });
      }

      const partGrid = document.getElementById('partnersGrid');
      if (partGrid && data.projectPartners) {
        data.projectPartners.forEach(partner => {
          partGrid.innerHTML += `
            <div class="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-lg p-3">
              <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">${partner.role}</span>
              <span class="text-sm font-bold text-slate-800 text-right">${partner.name}</span>
            </div>
          `;
        });
      }

      // Amenities
      const buildIconGrid = (containerId, items) => {
        const container = document.getElementById(containerId);
        if(!container) return;
        items.forEach(item => {
          let isActive = item.progress > 0;
          let ringColor = isActive ? `conic-gradient(#10b981 ${item.progress}%, #f1f5f9 0)` : 'bg-slate-100';
          let iconColor = isActive ? 'text-emerald-600' : 'text-slate-300';
          let textColor = isActive ? 'text-slate-800' : 'text-slate-400';
          let bgInner = isActive ? 'bg-emerald-50' : 'bg-white';
          
          let noteHTML = item.note ? `<span class="block text-[8px] font-medium text-slate-400 mt-1">${item.note}</span>` : '';

          container.innerHTML += `
            <div class="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-100 rounded-xl text-center">
              <div class="w-14 h-14 rounded-full flex items-center justify-center mb-3 shadow-sm relative" style="background: ${isActive ? '' : 'transparent'}; ${isActive ? 'background-image:' + ringColor : ''}">
                <div class="absolute inset-0 m-1 rounded-full ${bgInner} flex items-center justify-center">
                  <svg class="w-6 h-6 ${iconColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${item.icon}"></path></svg>
                </div>
              </div>
              <span class="text-[10px] font-bold uppercase tracking-wider ${textColor} leading-tight">${item.name}</span>
              ${isActive ? `<span class="text-xs font-black text-emerald-600 mt-1">${item.progress}%</span>` : `<span class="text-[10px] font-bold text-slate-300 mt-1">0%</span>`}
              ${noteHTML}
            </div>
          `;
        });
      };
      
      if(data.amenitiesProgress) buildIconGrid('amenitiesGridContainer', data.amenitiesProgress);
      if(data.commonAreasProgress) buildIconGrid('commonAreasGridContainer', data.commonAreasProgress);

      // Docs & FAQ
      const docBody = document.getElementById('documentTableBody');
      if(docBody && data.documentMatrix) {
        data.documentMatrix.forEach(doc => {
          let badgeColor = doc.status.includes('Approved') || doc.status.includes('Uploaded') || doc.status.includes('Received') ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800';
          docBody.innerHTML += `
            <tr class="hover:bg-slate-50 transition-colors">
              <td class="p-4 text-xs font-bold text-slate-500 whitespace-nowrap">${doc.category}</td>
              <td class="p-4 text-sm font-bold text-slate-800">${doc.title}</td>
              <td class="p-4"><span class="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${badgeColor}">${doc.status}</span></td>
              <td class="p-4 text-xs text-slate-500 font-medium whitespace-nowrap">${doc.date}</td>
              <td class="p-4 text-right">
                <a href="${doc.file}" target="_blank" class="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                  View
                </a>
              </td>
            </tr>
          `;
        });
      }

      // Visual FAQ
      const visFaqContainer = document.getElementById('visualFaqContainer');
      if (visFaqContainer && data.faq) {
        data.faq.forEach((item, index) => {
          let imageHTML = item.image ? `
             <div class="mt-4 rounded-xl overflow-hidden shadow-sm border border-slate-200">
                <img src="${item.image}" loading="lazy" class="w-full h-auto zoom-image cursor-zoom-in" data-zoom-src="${item.image}" alt="FAQ clarification" onerror="this.style.display='none'">
             </div>` : '';
          
          visFaqContainer.innerHTML += `
            <details class="group p-6 [&_summary::-webkit-details-marker]:hidden">
              <summary class="flex cursor-pointer items-center justify-between gap-1.5 text-slate-800">
                <h2 class="font-bold text-base md:text-lg">${item.q}</h2>
                <span class="relative size-5 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" class="absolute inset-0 size-5 opacity-100 group-open:opacity-0 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <svg xmlns="http://www.w3.org/2000/svg" class="absolute inset-0 size-5 opacity-0 group-open:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </span>
              </summary>
              <div class="mt-4">
                 <p class="leading-relaxed text-sm text-slate-600 mb-2">${item.a}</p>
                 ${imageHTML}
              </div>
            </details>
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

  // Global Chart Renderer function
  const renderCharts = (data) => {
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

    if(!document.getElementById('overallProgressChart').classList.contains('rendered')) {
        createDonut('overallProgressChart', data.projectMeta.overallProgress, '#4f46e5');
        document.getElementById('overallProgressChart').classList.add('rendered');
    }

    const latestSales = data.timeSeries[data.timeSeries.length - 1].sales;
    const salesPercent = Math.round((latestSales.booked / (latestSales.booked + latestSales.unsold)) * 100);
    if(!document.getElementById('salesDonutChart').classList.contains('rendered')) {
        createDonut('salesDonutChart', salesPercent, '#10b981');
        document.getElementById('salesDonutChart').classList.add('rendered');
    }

    const costPercent = Math.round((data.financialHealth.actualCost / data.financialHealth.estimatedCost) * 100);
    if(!document.getElementById('costDonutChart').classList.contains('rendered')) {
        createDonut('costDonutChart', costPercent, '#3b82f6');
        document.getElementById('costDonutChart').classList.add('rendered');
    }

    const histCanvas = document.getElementById('historicalProgressChart');
    if (histCanvas && data.timeSeries && !histCanvas.classList.contains('rendered')) {
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
      histCanvas.classList.add('rendered');
    }
  };

} catch (error) {
  console.error("Script Execution Error:", error);
}
