// Import PDF.js (we'll load it from CDN)
const pdfjsLib = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.mjs');
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs';

const modal = document.getElementById('plot-modal');
const modalBackdrop = modal?.querySelector('.modal-backdrop');
const modalClose = document.getElementById('modal-close');
const modalTitle = document.getElementById('modal-title');
const pdfGridContainer = document.getElementById('pdf-grid-container');
const canvas = document.getElementById('pdf-canvas');
const pageInfo = document.getElementById('page-info');
const prevBtn = document.getElementById('prev-page');
const nextBtn = document.getElementById('next-page');

let pdfDoc = null;
let currentPage = 1;
let multiPdfMode = false;

// Open modal when plot card is clicked
document.querySelectorAll('.plot-card').forEach((card) => {
  card.addEventListener('click', async (e) => {
    const button = e.currentTarget;
    const plotFile = button?.dataset?.plotFile;
    const plotFiles = button?.dataset?.plotFiles;
    const plotGridLayout = button?.dataset?.plotGridLayout;
    const plotTitle = button?.dataset?.plotTitle;

    if (modalTitle && plotTitle) {
      modalTitle.textContent = plotTitle;
    }

    modal?.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Check if we have a grid layout
    if (plotGridLayout) {
      const gridLayout = JSON.parse(plotGridLayout);
      multiPdfMode = true;
      await loadGridLayoutPDFs(gridLayout);
    } else if (plotFiles) {
      const files = JSON.parse(plotFiles);
      multiPdfMode = true;
      await loadMultiplePDFs(files);
    } else if (plotFile) {
      multiPdfMode = false;
      await loadPDF(plotFile);
    }
  });
});

// Close modal handlers
const closeModal = () => {
  modal?.classList.remove('active');
  document.body.style.overflow = '';
  pdfDoc = null;
  currentPage = 1;
};

modalBackdrop?.addEventListener('click', closeModal);
modalClose?.addEventListener('click', closeModal);

// ESC key to close
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal?.classList.contains('active')) {
    closeModal();
  }
});

// PDF loading and rendering
async function loadGridLayoutPDFs(gridLayout) {
  if (!pdfGridContainer) return;

  // Hide page controls for grid view
  if (pageInfo) pageInfo.style.display = 'none';
  if (prevBtn) prevBtn.style.display = 'none';
  if (nextBtn) nextBtn.style.display = 'none';

  // Clear container and set it up for table display
  pdfGridContainer.innerHTML = '';
  pdfGridContainer.className = 'table-grid';
  pdfGridContainer.style.gridTemplateColumns = `120px repeat(${gridLayout.cols.length}, 1fr)`;

  // Top-left corner cell
  const cornerCell = document.createElement('div');
  cornerCell.className = 'grid-corner-cell';
  cornerCell.textContent = gridLayout.colHeader;
  pdfGridContainer.appendChild(cornerCell);

  // Column headers
  for (const col of gridLayout.cols) {
    const headerCell = document.createElement('div');
    headerCell.className = 'grid-col-header';
    headerCell.textContent = col;
    pdfGridContainer.appendChild(headerCell);
  }

  // Rows with row headers and PDFs
  for (let rowIdx = 0; rowIdx < gridLayout.rows.length; rowIdx++) {
    // Row header
    const rowHeaderCell = document.createElement('div');
    rowHeaderCell.className = 'grid-row-header';
    rowHeaderCell.textContent = gridLayout.rows[rowIdx];
    pdfGridContainer.appendChild(rowHeaderCell);

    // PDF cells for this row
    const rowFiles = gridLayout.files[rowIdx] || [];
    for (const url of rowFiles) {
      const canvasElement = document.createElement('canvas');
      canvasElement.className = 'pdf-canvas';
      pdfGridContainer.appendChild(canvasElement);

      try {
        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.5 });

        canvasElement.width = viewport.width;
        canvasElement.height = viewport.height;

        const ctx = canvasElement.getContext('2d');
        if (ctx) {
          await page.render({
            canvasContext: ctx,
            viewport: viewport
          }).promise;
        }
      } catch (error) {
        console.error('Error loading PDF:', url, error);
        const ctx = canvasElement.getContext('2d');
        if (ctx) {
          canvasElement.width = 800;
          canvasElement.height = 600;
          canvasElement.classList.add('pdf-error');
          ctx.fillStyle = '#1a1a24';
          ctx.fillRect(0, 0, canvasElement.width, canvasElement.height);
          ctx.fillStyle = '#ef4444';
          ctx.font = '20px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Failed to load PDF', canvasElement.width / 2, canvasElement.height / 2);
        }
      }
    }
  }

  // Add row header label (rotated) on the left
  const rowHeaderLabel = document.createElement('div');
  rowHeaderLabel.className = 'grid-row-header-label';
  rowHeaderLabel.textContent = gridLayout.rowHeader;
  pdfGridContainer.appendChild(rowHeaderLabel);
}

async function loadMultiplePDFs(urls) {
  if (!pdfGridContainer) return;

  // Hide page controls for multi-PDF view
  if (pageInfo) pageInfo.style.display = 'none';
  if (prevBtn) prevBtn.style.display = 'none';
  if (nextBtn) nextBtn.style.display = 'none';

  // Clear container and set it up for grid display
  pdfGridContainer.innerHTML = '';
  pdfGridContainer.className = 'multi-pdf-grid';

  // Load and render each PDF
  for (const url of urls) {
    const canvasElement = document.createElement('canvas');
    canvasElement.className = 'pdf-canvas';
    pdfGridContainer.appendChild(canvasElement);

    try {
      const loadingTask = pdfjsLib.getDocument(url);
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1.5 });

      canvasElement.width = viewport.width;
      canvasElement.height = viewport.height;

      const ctx = canvasElement.getContext('2d');
      if (ctx) {
        await page.render({
          canvasContext: ctx,
          viewport: viewport
        }).promise;
      }
    } catch (error) {
      console.error('Error loading PDF:', url, error);
      // Show placeholder for failed PDFs
      const ctx = canvasElement.getContext('2d');
      if (ctx) {
        canvasElement.width = 800;
        canvasElement.height = 600;
        canvasElement.classList.add('pdf-error');
        ctx.fillStyle = '#1a1a24';
        ctx.fillRect(0, 0, canvasElement.width, canvasElement.height);
        ctx.fillStyle = '#ef4444';
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Failed to load PDF', canvasElement.width / 2, canvasElement.height / 2);
      }
    }
  }
}

async function loadPDF(url) {
  if (!pdfGridContainer) return;

  // Show page controls for single-PDF view
  if (pageInfo) pageInfo.style.display = '';
  if (prevBtn) prevBtn.style.display = '';
  if (nextBtn) nextBtn.style.display = '';

  // Reset container for single canvas
  pdfGridContainer.className = '';
  pdfGridContainer.innerHTML = '';
  
  const canvasElement = document.createElement('canvas');
  canvasElement.id = 'pdf-canvas';
  canvasElement.className = 'pdf-canvas-single';
  pdfGridContainer.appendChild(canvasElement);

  try {
    const loadingTask = pdfjsLib.getDocument(url);
    pdfDoc = await loadingTask.promise;
    currentPage = 1;
    renderPage(currentPage, canvasElement);
  } catch (error) {
    console.error('Error loading PDF:', error);
    // For demo purposes, show placeholder
    if (canvasElement && modalTitle) {
      const ctx = canvasElement.getContext('2d');
      if (ctx) {
        canvasElement.width = 800;
        canvasElement.height = 600;
        canvasElement.classList.add('pdf-placeholder');
        ctx.fillStyle = '#1a1a24';
        ctx.fillRect(0, 0, canvasElement.width, canvasElement.height);
        ctx.fillStyle = '#6366f1';
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('PDF Plot Placeholder', canvasElement.width / 2, canvasElement.height / 2);
        ctx.fillStyle = '#9ca3af';
        ctx.font = '16px sans-serif';
        ctx.fillText('Place your PDF files in /public/plots/', canvasElement.width / 2, canvasElement.height / 2 + 40);
      }
    }
  }
}

async function renderPage(num, canvasElement) {
  if (!pdfDoc || !canvasElement) return;

  const page = await pdfDoc.getPage(num);
  const viewport = page.getViewport({ scale: 1.5 });

  canvasElement.width = viewport.width;
  canvasElement.height = viewport.height;

  const ctx = canvasElement.getContext('2d');
  if (ctx) {
    await page.render({
      canvasContext: ctx,
      viewport: viewport
    }).promise;
  }

  // Update page info and buttons
  if (pageInfo) {
    pageInfo.textContent = `Page ${num} of ${pdfDoc.numPages}`;
  }
  if (prevBtn) {
    prevBtn.disabled = num <= 1;
  }
  if (nextBtn) {
    nextBtn.disabled = num >= pdfDoc.numPages;
  }
}

// Page navigation
prevBtn?.addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--;
    const canvasElement = pdfGridContainer?.querySelector('#pdf-canvas');
    if (canvasElement) renderPage(currentPage, canvasElement);
  }
});

nextBtn?.addEventListener('click', () => {
  if (pdfDoc && currentPage < pdfDoc.numPages) {
    currentPage++;
    const canvasElement = pdfGridContainer?.querySelector('#pdf-canvas');
    if (canvasElement) renderPage(currentPage, canvasElement);
  }
});
