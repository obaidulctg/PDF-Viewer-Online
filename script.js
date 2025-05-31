pdfjsLib.GlobalWorkerOptions.workerSrc = "scriptpdf2.js";

    const upload = document.getElementById('upload');
    const container = document.getElementById('pdf-container');
    const prevBtn = document.getElementById('prev');
    const nextBtn = document.getElementById('next');
    const pageInfo = document.getElementById('page-info');
    const pageNumInput = document.getElementById('page-num');
    const jumpBtn = document.getElementById('jump');
    const zoomInBtn = document.getElementById('zoom-in');
    const zoomOutBtn = document.getElementById('zoom-out');
    const toggleTheme = document.getElementById('toggle-theme');
    const printBtn = document.getElementById('print');
    const downloadBtn = document.getElementById('download');
    const urlInput = document.getElementById('pdf-url');
    const loadUrlBtn = document.getElementById('load-url');

    let pdfDoc = null;
    let totalPages = 0;
    let currentPage = 1;
    let scale = 1.2;
    let currentFile = null;
    const pageCanvases = [];

    const setTheme = (mode) => {
      document.body.classList.toggle('dark', mode === 'dark');
      toggleTheme.textContent = mode === 'dark' ? '☀ Light Mode' : '🌙 Dark Mode';
      localStorage.setItem('theme', mode);
    };

    toggleTheme.addEventListener('click', () => {
      const isDark = document.body.classList.contains('dark');
      setTheme(isDark ? 'light' : 'dark');
    });

    setTheme(localStorage.getItem('theme') || 'light');

    function renderAllPages() {
      container.innerHTML = '';
      pageCanvases.length = 0;

      for (let i = 1; i <= totalPages; i++) {
        pdfDoc.getPage(i).then(page => {
          const viewport = page.getViewport({ scale: scale });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');

          page.render({ canvasContext: ctx, viewport: viewport });
          container.appendChild(canvas);
          pageCanvases[i] = canvas;
        });
      }
    }

    function updateNav() {
      pageInfo.textContent = `Page ${currentPage} / ${totalPages}`;
      prevBtn.disabled = currentPage <= 1;
      nextBtn.disabled = currentPage >= totalPages;
      pageNumInput.value = currentPage;
    }

    function scrollToPage(pageNum) {
      if (pageNum < 1 || pageNum > totalPages) return;
      currentPage = pageNum;
      updateNav();
      const target = pageCanvases[pageNum];
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    function rerenderPages() {
      if (!pdfDoc) return;
      renderAllPages();
      setTimeout(() => scrollToPage(currentPage), 500);
    }

    function loadPDF(src) {
      pdfjsLib.getDocument(src).promise.then(pdf => {
        pdfDoc = pdf;
        totalPages = pdf.numPages;
        currentPage = 1;
        updateNav();
        renderAllPages();
      }).catch(err => {
        alert("Error loading PDF: " + err.message);
      });
    }

    upload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file || file.type !== 'application/pdf') return;
      currentFile = file;

      const reader = new FileReader();
      reader.onload = function () {
        loadPDF(new Uint8Array(this.result));
      };
      reader.readAsArrayBuffer(file);
    });

    loadUrlBtn.addEventListener('click', () => {
      const url = urlInput.value.trim();
      if (url) {
        currentFile = null;
        loadPDF(url);
      }
    });

    prevBtn.addEventListener('click', () => scrollToPage(currentPage - 1));
    nextBtn.addEventListener('click', () => scrollToPage(currentPage + 1));
    jumpBtn.addEventListener('click', () => scrollToPage(parseInt(pageNumInput.value)));

    zoomInBtn.addEventListener('click', () => {
      scale = Math.min(scale + 0.2, 3);
      rerenderPages();
    });

    zoomOutBtn.addEventListener('click', () => {
      scale = Math.max(scale - 0.2, 0.4);
      rerenderPages();
    });

    printBtn.addEventListener('click', () => window.print());

    downloadBtn.addEventListener('click', () => {
      if (currentFile) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(currentFile);
        link.download = currentFile.name || 'download.pdf';
        link.click();
      } else {
        alert('PDF must be uploaded to enable download.');
      }
    });