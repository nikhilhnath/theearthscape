fetch('data.json')
  .then(response => response.json())
  .then(data => {
    
    // 1. Header Data
    document.getElementById('projectName').textContent = data.projectMeta.name;
    document.getElementById('projectSubtitle').textContent = data.projectMeta.subtitle;
    document.getElementById('projectDetails').textContent = `${data.projectMeta.location} | RERA ID: ${data.projectMeta.reraNumber}`;
    document.getElementById('updateBadge').textContent = data.projectMeta.updated;

    // 2. Setup Chart Data Arrays
    const quarters = data.timeSeries.map(q => q.quarter);
    const collected = data.timeSeries.map(q => q.escrow.collected);
    const withdrawn = data.timeSeries.map(q => q.escrow.withdrawn);
    const balance = data.timeSeries.map(q => q.escrow.balance);
    const booked = data.timeSeries.map(q => q.sales.booked);
    const unsold = data.timeSeries.map(q => q.sales.unsold);

    // HELPER: Convert raw numbers to Indian formats (Crores & Lakhs)
    const formatINR = (value) => {
      if (value >= 10000000) return '₹' + (value / 10000000).toFixed(2) + ' Cr';
      if (value >= 100000) return '₹' + (value / 100000).toFixed(2) + ' L';
      return '₹' + value.toLocaleString('en-IN');
    };

    // 3. Escrow Combo Chart (Includes INR Tooltips & Y-Axis formatting)
    new Chart(document.getElementById('escrowChart').getContext('2d'), {
      type: 'bar',
      data: {
        labels: quarters,
        datasets: [
          { type: 'line', label: 'Escrow Balance', data: balance, borderColor: '#10b981', backgroundColor: '#10b981', borderWidth: 3, tension: 0.3 },
          { type: 'bar', label: 'Total Collected', data: collected, backgroundColor: '#3b82f6', borderRadius: 4 },
          { type: 'bar', label: 'Total Withdrawn', data: withdrawn, backgroundColor: '#f43f5e', borderRadius: 4 }
        ]
      },
      options: { 
        responsive: true, 
        maintainAspectRatio: false, 
        interaction: { mode: 'index', intersect: false },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                return context.dataset.label + ': ' + formatINR(context.raw);
              }
            }
          }
        },
        scales: {
          y: {
            ticks: {
              callback: function(value) {
                return formatINR(value);
              }
            }
          }
        }
      }
    });

    // 4. Sales Combo Chart (Unit count, no INR formatting needed)
    new Chart(document.getElementById('salesChart').getContext('2d'), {
      type: 'bar',
      data: {
        labels: quarters,
        datasets: [
          { type: 'line', label: 'Unsold Inventory', data: unsold, borderColor: '#64748b', backgroundColor: '#64748b', borderWidth: 3, tension: 0.3 },
          { type: 'bar', label: 'Cumulative Bookings', data: booked, backgroundColor: '#6366f1', borderRadius: 4 }
        ]
      },
      options: { 
        responsive: true, 
        maintainAspectRatio: false, 
        interaction: { mode: 'index', intersect: false } 
      }
    });

    // 5. Reusable Flipcard Generator Function
    const generateFlipCard = (title, status, frontDesc, backDesc, isRisk = false) => {
      let colorClass = 'bg-slate-100 text-slate-700';
      if (status.includes('100%') || status === 'Cleared') colorClass = 'bg-emerald-100 text-emerald-800';
      else if (status.includes('Progress') || status.includes('%')) colorClass = 'bg-amber-100 text-amber-800';
      else if (status === 'Pending') colorClass = 'bg-rose-100 text-rose-800';

      return `
        <div class="flip-card perspective h-64 w-full cursor-pointer">
          <div class="flip-card-inner relative w-full h-full transition-transform duration-700 preserve-3d">
            <!-- Front of Card -->
            <div class="absolute w-full h-full backface-hidden bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div class="flex justify-between items-start mb-3">
                  <h3 class="font-bold text-slate-800 text-lg leading-tight pr-2">${title}</h3>
                  <span class="px-2 py-1 text-xs font-bold rounded-md whitespace-nowrap ${colorClass}">${status}</span>
                </div>
                <p class="text-slate-600 font-medium">${frontDesc}</p>
              </div>
              <div class="text-xs text-indigo-500 font-bold flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"></path></svg>
                Tap to flip for details
              </div>
            </div>
            <!-- Back of Card -->
            <div class="absolute w-full h-full backface-hidden rotate-y-180 bg-slate-800 text-white border border-slate-700 rounded-2xl p-6 shadow-lg overflow-y-auto flex flex-col justify-center">
              <h3 class="font-bold text-indigo-300 mb-2 border-b border-slate-600 pb-2">${title} (Details)</h3>
              <p class="text-sm text-slate-200 leading-relaxed whitespace-pre-line">${backDesc}</p>
            </div>
          </div>
        </div>
      `;
    };

    // 6. Inject Flipcards
    const buildContainer = document.getElementById('constructionContainer');
    data.constructionMilestones.forEach(item => {
      buildContainer.innerHTML += generateFlipCard(item.title, item.status, item.frontDesc, item.backDesc, false);
    });

    const riskContainer = document.getElementById('riskMatrixContainer');
    data.legalRiskMatrix.forEach(item => {
      riskContainer.innerHTML += generateFlipCard(item.title, item.status, item.frontDesc, item.backDesc, true);
    });

    // 7. Attach Mobile Tap Listeners
    document.querySelectorAll('.flip-card').forEach(card => {
      card.addEventListener('click', () => {
        card.querySelector('.flip-card-inner').classList.toggle('flipped');
      });
    });

    // 8. Photo Timeline
    const gallery = document.getElementById('photoGalleryContainer');
    data.photos.forEach(photo => {
      gallery.innerHTML += `
        <div class="group relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm cursor-pointer">
          <img src="${photo.url}" alt="${photo.caption}" class="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out">
          <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/90 via-slate-900/50 to-transparent p-4 pt-12">
            <p class="text-white font-bold text-sm tracking-wide">${photo.caption}</p>
            <p class="text-slate-300 text-xs mt-1 font-medium">${photo.date}</p>
          </div>
        </div>
      `;
    });
  });
