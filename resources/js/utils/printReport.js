/**
 * Utility to print an isolated A4 report from a DOM element.
 * Creates a hidden iframe, injects all active styles and fonts,
 * and invokes native print on the isolated document.
 */
export function printReport({ elementId, title = 'Report', orientation = 'portrait' }) {
  const printContent = document.getElementById(elementId);
  if (!printContent) {
    window.print();
    return;
  }

  try {
    let printFrame = document.getElementById('a4-print-iframe');
    if (printFrame) {
      printFrame.remove();
    }

    printFrame = document.createElement('iframe');
    printFrame.id = 'a4-print-iframe';
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    // Collect all stylesheets and inline styles
    const styleTags = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((tag) => tag.outerHTML)
      .join('\n');

    const frameDoc = printFrame.contentWindow.document;
    frameDoc.open();
    frameDoc.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <title>${title}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
          ${styleTags}
          <style>
            @page {
              size: A4 ${orientation};
              margin: 10mm 10mm 10mm 10mm;
            }
            *, *::before, *::after {
              box-sizing: border-box;
            }
            html, body {
              width: 100% !important;
              height: auto !important;
              min-height: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #0f172a !important;
              font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif !important;
              overflow: visible !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .font-mono {
              font-family: 'JetBrains Mono', monospace !important;
            }
            .no-print {
              display: none !important;
            }
            .print-only {
              display: block !important;
            }
            tr, .print-avoid-break {
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }
            thead {
              display: table-header-group !important;
            }
            tfoot {
              display: table-footer-group !important;
            }
            table {
              width: 100% !important;
              border-collapse: collapse !important;
            }
          </style>
        </head>
        <body class="bg-white text-slate-900 font-sans antialiased p-0 m-0">
          <div class="a4-print-wrapper w-full">
            ${printContent.innerHTML}
          </div>
        </body>
      </html>
    `);
    frameDoc.close();

    setTimeout(() => {
      try {
        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();
      } catch (err) {
        console.warn('Iframe print error, falling back to window.print:', err);
        window.print();
      }
    }, 350);
  } catch (e) {
    console.warn('Print initialization error, falling back to window.print:', e);
    window.print();
  }
}
