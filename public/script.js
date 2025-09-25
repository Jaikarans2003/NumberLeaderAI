// Add event listener when the document is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('generateBtn').addEventListener('click', generateReport);
    document.getElementById('downloadPdfBtn').addEventListener('click', downloadPDF);
});

async function generateReport() {
    const companyName = document.getElementById('companyName').value;
    const companyDescription = document.getElementById('companyDescription').value;
    const dcf = document.getElementById('dcf').value;
    const cca = document.getElementById('cca').value;
    const ptm = document.getElementById('ptm').value;
    const abv = document.getElementById('abv').value;

    const reportOutput = document.getElementById('reportOutput');
    const downloadBtn = document.getElementById('downloadPdfBtn');

    if (!companyName || !companyDescription || !dcf || !cca || !ptm || !abv) {
        reportOutput.innerHTML = `<p>Please fill in all fields.</p>`;
        return;
    }

    reportOutput.innerHTML = `<p>Generating report...</p>`;

    try {
        // Use current hostname (works with both 127.0.0.1 and 192.168.1.8)
        const apiUrl = `http://${window.location.hostname}:5001/generate-report`;
        console.log('Calling API at:', apiUrl);
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ companyName, companyDescription, dcf, cca, ptm, abv })
        });

        const data = await response.json();

        if (data.report) {
            // Format the report using the new multi-page format
            const formattedReport = formatMultiPageReport(data.report);
            reportOutput.innerHTML = formattedReport;
            downloadBtn.style.display = 'block'; // Show download button
            
            // Smooth scroll to report
            document.getElementById('report-content').scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        } else {
            reportOutput.innerHTML = `<p>Failed to generate report</p>`;
            downloadBtn.style.display = 'none';
        }
    } catch (error) {
        console.error('❌ Error:', error);
        reportOutput.innerHTML = `<p>Failed to generate report</p>`;
        downloadBtn.style.display = 'none';
    }
}

function formatMultiPageReport(reportData) {
    // Get the current date
    const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Get the original company description directly from the form
    const companyName = document.getElementById('companyName').value;
    const companyDescription = document.getElementById('companyDescription').value;
    
    // Get valuation values for the methods
    const dcf = document.getElementById('dcf').value;
    const cca = document.getElementById('cca').value;
    const ptm = document.getElementById('ptm').value;
    const abv = document.getElementById('abv').value;
    
    // Format the pages
    const page1 = formatPage1(companyName, currentDate, 'Number Leader', companyDescription);
    const page2 = formatPage2(dcf, cca, ptm, companyName);
    const page3 = formatPage3(abv, companyName);
    const page4 = formatPage4(companyName, dcf, cca, ptm, abv);
    
    // Combine all pages
    return `
        <div id="report-content">
            <div class="report-page page-1">${page1}</div>
            <div class="page-break"></div>
            <div class="report-page page-2">${page2}</div>
            <div class="page-break"></div>
            <div class="report-page page-3">${page3}</div>
            <div class="page-break"></div>
            <div class="report-page page-4">${page4}</div>
        </div>
    `;
}

function formatPage1(companyName, valuationDate, authorName, companyDescription) {
    // Convert markdown to HTML
    let htmlContent = companyDescription
        .replace(/# (.*)/g, '<h1>$1</h1>') // H1 headers
        .replace(/## (.*)/g, '<h2>$1</h2>') // H2 headers
        .replace(/\n\n/g, '<br><br>') // Double line breaks
        .replace(/\n/g, '<br>') // Single line breaks
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); // Bold text
    
    return `
        <div class="report-header-centered">
            <h1>Valuation Report</h1>
        </div>
        
        <div class="report-subheader">
            <p>Produced By: ${authorName}</p>
            <p>Date: ${valuationDate}</p>
        </div>
        
        <div class="about-section">
            <h2>About Number Leader</h2>
            <p>At Number Leader, we are more than just an investment bank; we are at the forefront of financial innovation. We specialize in delivering cutting-edge valuation, benchmarking, and market research services by leveraging data, technology, and artificial intelligence. Our mission is to empower businesses with actionable insights and strategic financial solutions to drive growth and success.</p>
        </div>
        
        <div class="company-section">
            <h2>About ${companyName}</h2>
            <p>${companyDescription}</p>
        </div>
        
        <div class="service-section">
            <h2>Service Provided</h2>
            <p>Number Leader has been engaged to provide a comprehensive valuation service for ${companyName}. This report outlines the valuation methodologies employed, the results derived, and the conclusions drawn to determine the fair value of ${companyName}.</p>
        </div>
    `;
}

function formatPage2(dcfValue, ccaValue, ptmValue, companyName) {
    return `
        <h1>Valuation Methodologies</h1>
        <div class="methods-container">
            <div class="valuation-method">
                <h2>Discounted Cash Flow (DCF)</h2>
                <div class="method-description">
                    <strong>Description:</strong>
                    <p>The Discounted Cash Flow (DCF) method estimates the value of ${companyName} based on its projected future cash flows, discounted to their present value using an appropriate discount rate. This approach reflects the company's ability to generate cash flows over time and accounts for the time value of money.</p>
                </div>
                <div class="method-value">
                    <strong>Valuation:</strong> ${dcfValue}
                </div>
                <div class="recommendation">
                    Number Leader values ${companyName} at ${dcfValue} using the DCF method.
                </div>
            </div>
            <div class="valuation-method">
                <h2>Comparable Company Analysis (CCA)</h2>
                <div class="method-description">
                    <strong>Description:</strong>
                    <p>The Comparable Company Analysis (CCA) method values ${companyName} by comparing it to similar companies in the industry. Key financial metrics and valuation multiples are analyzed to derive a fair market value.</p>
                </div>
                <div class="method-value">
                    <strong>Valuation:</strong> ${ccaValue}
                </div>
                <div class="recommendation">
                    Number Leader values ${companyName} at ${ccaValue} using the CCA method.
                </div>
            </div>
            <div class="valuation-method">
                <h2>Price to Metrics (PTM)</h2>
                <div class="method-description">
                    <strong>Description:</strong>
                    <p>The Price to Metrics (PTM) evaluates ${companyName} based on the purchase prices of similar companies in recent transactions. This method provides insight into the premiums paid for comparable businesses in the market.</p>
                </div>
                <div class="method-value">
                    <strong>Valuation:</strong> ${ptmValue}
                </div>
                <div class="recommendation">
                    Number Leader values ${companyName} at ${ptmValue} using the PTM method.
                </div>
            </div>
        </div>
    `;
}

function formatPage3(abvValue, companyName) {
    return `
        <h1>Valuation Methodologies</h1>
        <div class="methods-container">
            <div class="valuation-method">
                <h2>Asset-Based Valuation (ABV)</h2>
                <div class="method-description">
                    <strong>Description:</strong>
                    <p>The Asset-Based Valuation (ABV) method calculates the value of ${companyName} based on its tangible and intangible assets. This approach is particularly relevant for companies with significant intellectual property or other valuable assets.</p>
                </div>
                <div class="method-value">
                    <strong>Valuation:</strong> ${abvValue}
                </div>
                <div class="recommendation">
                    Number Leader values ${companyName} at ${abvValue} using the ABV method.
                </div>
            </div>
        </div>
    `;
}

function formatPage4(companyName, dcfValue, ccaValue, ptmValue, abvValue) {
    // In the server.js template, the conclusion indicates a range between PTM and ABV
    // We'll use this format but generate custom recommendations based on the company
    
    // Generate recommendations based on company name and valuation figures
    function generateRecommendations(companyName) {
        // Get the company description for context
        const companyDescription = document.getElementById('companyDescription').value;
        
        // Check if the company description mentions any specific industries or attributes
        const isTech = companyDescription.toLowerCase().includes('tech') || 
                     companyDescription.toLowerCase().includes('software') || 
                     companyDescription.toLowerCase().includes('digital');
                     
        const isManufacturing = companyDescription.toLowerCase().includes('manufactur') || 
                               companyDescription.toLowerCase().includes('product') || 
                               companyDescription.toLowerCase().includes('factory');
                               
        const isService = companyDescription.toLowerCase().includes('service') || 
                         companyDescription.toLowerCase().includes('consulting');
                         
        // Generate appropriate recommendations based on company type
        const recommendations = [];
        
        // First recommendation - Growth potential
        if (isTech) {
            recommendations.push(`${companyName}'s capacity for rapid scaling in the technology sector, particularly considering market expansion opportunities and user acquisition potential.`);
        } else if (isManufacturing) {
            recommendations.push(`${companyName}'s production capacity and potential for operational efficiency improvements, which could significantly impact future growth trajectories.`);
        } else if (isService) {
            recommendations.push(`${companyName}'s client acquisition rates and retention metrics, which are key indicators of sustainable growth in the service industry.`);
        } else {
            recommendations.push(`The company's growth potential and scalability in its target market.`);
        }
        
        // Second recommendation - IP and assets
        if (isTech) {
            recommendations.push(`The competitive advantage provided by ${companyName}'s intellectual property portfolio, including patents, proprietary algorithms, and technical innovations.`);
        } else if (isManufacturing) {
            recommendations.push(`The valuation of ${companyName}'s physical assets, manufacturing equipment, and any proprietary production methodologies.`);
        } else if (isService) {
            recommendations.push(`${companyName}'s established methodologies, brand reputation, and organizational knowledge that create sustainable competitive advantages.`);
        } else {
            recommendations.push(`The strength of its intellectual property and technological assets.`);
        }
        
        // Third recommendation - Market trends
        if (isTech) {
            recommendations.push(`Current funding environment for technology companies, with particular attention to similar companies in ${companyName}'s specific sector and stage of development.`);
        } else if (isManufacturing) {
            recommendations.push(`Supply chain trends, raw material costs, and industry consolidation patterns that may impact ${companyName}'s market position.`);
        } else if (isService) {
            recommendations.push(`Changing client demands and emerging service delivery models that could affect ${companyName}'s competitive positioning.`);
        } else {
            recommendations.push(`Market trends and investor sentiment in the industry.`);
        }
        
        return recommendations;
    }
    
    // Get customized recommendations
    const recommendations = generateRecommendations(companyName);
    
    return `
        <h1>Conclusion</h1>
        <div class="conclusion-section">
            <p>
                Based on the four valuation methodologies—Discounted Cash Flow (DCF), Comparable Company Analysis (CCA), Precedent Transaction Method (PTM), and Asset-Based Valuation (ABV)—the estimated value of ${companyName} ranges between ${ptmValue} and ${abvValue}.
            </p>
            
            <p>
                Number Leader recommends considering the following factors to arrive at a fair and strategic valuation for ${companyName}:
            </p>
            <ol>
                <li>${recommendations[0]}</li>
                <li>${recommendations[1]}</li>
                <li>${recommendations[2]}</li>
            </ol>
            
            <p>
                This valuation report is a foundation for strategic decision-making, whether for fundraising, mergers and acquisitions, or internal planning purposes.
            </p>
            
            <hr>
            
            <div class="footer-section">
                <h2>Prepared by</h2>
                <p>Number Leader<br>
                https://www.numberleader.com<br>
                BENGALURU, INDIA<br>
                info@numberleader.com</p>
                
                <h2>Disclaimer</h2>
                <p>
                    This report is intended solely for the use of ${companyName} and its authorized representatives. 
                    The valuations provided are based on the information available at the time of analysis and are 
                    subject to change based on market conditions, additional data, or other factors. Number Leader 
                    assumes no liability for decisions made based on this report.
                </p>
            </div>
        </div>
    `;
}

// Helper function to extract and format valuation methods
function extractAndFormatMethods(pageContent) {
    const methodsHtml = [];
    
    // Log the page content for debugging
    console.log("Page 2 content:", pageContent);
    
    // First try to extract methods using regex pattern
    const methodPattern = /## Method (\d+): ([^\n]+)\s+- \*\*Description:\*\*\s+([^-]+)- \*\*Valuation:\*\* ([^\n]+)\s+👉 ([^\n]+)/g;
    
    let match;
    let methodCount = 0;
    while ((match = methodPattern.exec(pageContent)) !== null) {
        methodCount++;
        const methodNum = match[1];
        const methodName = match[2].trim();
        const description = match[3].trim();
        const valuation = match[4].trim();
        const recommendation = match[5].trim();
        
        methodsHtml.push(`
            <div class="valuation-method">
                <h2>Method ${methodNum}: ${methodName}</h2>
                <div class="method-description">
                    <strong>Description:</strong>
                    <p>${description}</p>
                </div>
                <div class="method-value">
                    <strong>Valuation:</strong> ${valuation}
                </div>
                <div class="recommendation">
                    👉 ${recommendation}
                </div>
            </div>
        `);
    }
    
    // If we couldn't extract enough methods with the regex, use a simpler approach
    if (methodCount < 4) {
        console.log("Fallback method extraction - only found", methodCount, "methods with regex");
        methodsHtml.length = 0; // Clear the array
        
        // Alternative regex to find each method section
        const sections = pageContent.split(/## Method \d+:/);
        
        // Skip the first element as it's content before the first method
        for (let i = 1; i <= 4 && i < sections.length; i++) {
            const section = sections[i];
            
            // Extract the method name (first line)
            const methodNameMatch = section.match(/^([^\n]+)/);
            const methodName = methodNameMatch ? methodNameMatch[1].trim() : `Method ${i}`;
            
            // Extract description
            const descMatch = section.match(/\*\*Description:\*\*\s+([^*\n]+)/);
            const description = descMatch ? descMatch[1].trim() : '';
            
            // Extract valuation
            const valMatch = section.match(/\*\*Valuation:\*\*\s+([^\n]+)/);
            const valuation = valMatch ? valMatch[1].trim() : '';
            
            // Extract recommendation
            const recMatch = section.match(/👉\s+([^\n]+)/);
            const recommendation = recMatch ? recMatch[1].trim() : '';
            
            methodsHtml.push(`
                <div class="valuation-method">
                    <h2>Method ${i}: ${methodName}</h2>
                    <div class="method-description">
                        <strong>Description:</strong>
                        <p>${description}</p>
                    </div>
                    <div class="method-value">
                        <strong>Valuation:</strong> ${valuation}
                    </div>
                    <div class="recommendation">
                        👉 ${recommendation}
                    </div>
                </div>
            `);
        }
    }
    
    // If we still couldn't extract methods, hardcode them from the form values
    if (methodsHtml.length < 4) {
        console.log("Hardcoded method extraction");
        methodsHtml.length = 0; // Clear the array
        
        const companyName = document.getElementById('companyName').value;
        const dcf = document.getElementById('dcf').value;
        const cca = document.getElementById('cca').value;
        const ptm = document.getElementById('ptm').value;
        const abv = document.getElementById('abv').value;
        
        // Method 1: DCF
        methodsHtml.push(`
            <div class="valuation-method">
                <h2>Method 1: Discounted Cash Flow (DCF)</h2>
                <div class="method-description">
                    <strong>Description:</strong>
                    <p>The Discounted Cash Flow (DCF) method estimates the value of ${companyName} based on its projected future cash flows, discounted to their present value using an appropriate discount rate. This approach reflects the company's ability to generate cash flows over time and accounts for the time value of money.</p>
                </div>
                <div class="method-value">
                    <strong>Valuation:</strong> ${dcf}
                </div>
                <div class="recommendation">
                    👉 Number Leader values ${companyName} at ${dcf} using the DCF method.
                </div>
            </div>
        `);
        
        // Method 2: CCA
        methodsHtml.push(`
            <div class="valuation-method">
                <h2>Method 2: Comparable Company Analysis (CCA)</h2>
                <div class="method-description">
                    <strong>Description:</strong>
                    <p>The Comparable Company Analysis (CCA) method values ${companyName} by comparing it to similar companies in the industry. Key financial metrics and valuation multiples are analyzed to derive a fair market value.</p>
                </div>
                <div class="method-value">
                    <strong>Valuation:</strong> ${cca}
                </div>
                <div class="recommendation">
                    👉 Number Leader values ${companyName} at ${cca} using the CCA method.
                </div>
            </div>
        `);
        
        // Method 3: PTM
        methodsHtml.push(`
            <div class="valuation-method">
                <h2>Method 3: Precedent Transaction Method (PTM)</h2>
                <div class="method-description">
                    <strong>Description:</strong>
                    <p>The Precedent Transaction Method (PTM) evaluates ${companyName} based on the purchase prices of similar companies in recent transactions. This method provides insight into the premiums paid for comparable businesses in the market.</p>
                </div>
                <div class="method-value">
                    <strong>Valuation:</strong> ${ptm}
                </div>
                <div class="recommendation">
                    👉 Number Leader values ${companyName} at ${ptm} using the PTM method.
                </div>
            </div>
        `);
        
        // Method 4: ABV
        methodsHtml.push(`
            <div class="valuation-method">
                <h2>Method 4: Asset-Based Valuation (ABV)</h2>
                <div class="method-description">
                    <strong>Description:</strong>
                    <p>The Asset-Based Valuation (ABV) method calculates the value of ${companyName} based on its tangible and intangible assets. This approach is particularly relevant for companies with significant intellectual property or other valuable assets.</p>
                </div>
                <div class="method-value">
                    <strong>Valuation:</strong> ${abv}
                </div>
                <div class="recommendation">
                    👉 Number Leader values ${companyName} at ${abv} using the ABV method.
                </div>
            </div>
        `);
    }
    
    return methodsHtml.join('');
}

// Helper function to escape HTML entities
function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Function to Download PDF
function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const reportContent = document.getElementById('report-content');

    if (!reportContent) {
        console.error('❌ Report content not found');
        return;
    }

    // Show loading indicator
    const downloadBtn = document.getElementById('downloadPdfBtn');
    const originalBtnText = downloadBtn.innerText;
    downloadBtn.innerText = 'Preparing PDF...';
    downloadBtn.disabled = true;

    // Get all pages
    const pages = reportContent.querySelectorAll('.report-page');
    
    if (pages.length === 0) {
        console.error('❌ No report pages found');
        downloadBtn.innerText = originalBtnText;
        downloadBtn.disabled = false;
        return;
    }
    
    // Create PDF document
    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });
    
    // Add company name from the form as document title
    const companyName = document.getElementById('companyName').value;
    const title = `${companyName} - Valuation Report`;
    pdf.setProperties({
        title: title,
        subject: 'Valuation Report by Number Leader',
        creator: 'Number Leader'
    });
    
    // Debug
    console.log(`Found ${pages.length} pages to render in PDF`);
    
    // Set up for sequential page rendering
    let currentPageIndex = 0;
    
    function renderNextPage() {
        if (currentPageIndex >= pages.length) {
            // All pages rendered, save the PDF
            const cleanCompanyName = companyName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            pdf.save(`${cleanCompanyName}_valuation_report_${date}.pdf`);
            
            // Reset button
            downloadBtn.innerText = originalBtnText;
            downloadBtn.disabled = false;
            return;
        }
        
        const page = pages[currentPageIndex];
        
        // Create a temporary container outside the viewport
        const container = document.createElement('div');
        container.classList.add('pdf-page-container');
        
        // Clone the page and add it to the container
        const clone = page.cloneNode(true);
        
        // Remove any existing PDF container elements before adding new ones
        const existingContainers = document.querySelectorAll('.pdf-page-container');
        existingContainers.forEach(c => c.remove());
        
        container.appendChild(clone);
        document.body.appendChild(container);
        
        // Remove page breaks in the clone (they're not needed for PDF)
        const pageBreaks = container.querySelectorAll('.page-break');
        pageBreaks.forEach(pb => pb.style.display = 'none');
        
        // Debug
        console.log(`Rendering page ${currentPageIndex + 1} of ${pages.length}`);
        
        html2canvas(container, {
            scale: 2,
            useCORS: true,
            logging: false,
            allowTaint: true,
            letterRendering: true
        }).then(canvas => {
            // Remove the temporary container
            document.body.removeChild(container);
            
            // Add a new page for all pages except the first
            if (currentPageIndex > 0) {
            pdf.addPage();
            }
            
            // Add the canvas to the PDF
            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            const pageWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm
            const imgWidth = pageWidth - 20; // Add 10mm margin on each side
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            pdf.addImage(imgData, 'JPEG', 10, 10, imgWidth, imgHeight);
            
            // Add page number
            pdf.setFontSize(10);
            pdf.setTextColor(100, 100, 100);
            pdf.text(`Page ${currentPageIndex + 1} of ${pages.length}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
            
            // Proceed to next page
            currentPageIndex++;
            renderNextPage();
    }).catch(error => {
            console.error(`❌ Error rendering page ${currentPageIndex + 1}:`, error);
            // Try to continue with next page
            currentPageIndex++;
            renderNextPage();
        });
    }
    
    // Start rendering
    renderNextPage();
}

// Format a valuation method section
function formatValuationMethod(methodName, description, value) {
    const companyName = document.getElementById('companyName').value;
    
    return `
        <div class="valuation-method">
            <h2>${methodName}</h2>
            <div class="method-description">
                <strong>Description:</strong>
                <p>${description || `The ${methodName} method evaluates the company based on industry-standard metrics and formulas.`}</p>
            </div>
            <div class="method-value">
                <strong>Valuation:</strong> ${value}
            </div>
            <div class="recommendation">
                Number Leader values ${companyName} at ${value} using the ${methodName} method.
            </div>
        </div>
    `;
}

// Extract method description from content
function extractMethodDescription(content, methodType) {
    if (!content) return '';
    
    const methodDescriptions = {
        'DCF': 'The Discounted Cash Flow (DCF) method estimates the value of a company based on its projected future cash flows, discounted to their present value using an appropriate discount rate. This approach reflects the company\'s ability to generate cash flows over time and accounts for the time value of money.',
        'CCA': 'The Comparable Company Analysis (CCA) method values the company by comparing it to similar companies in the industry. Key financial metrics and valuation multiples are analyzed to derive a fair market value.',
        'PTM': 'The Price to Metrics (PTM) evaluates the company based on the purchase prices of similar companies in recent transactions. This method provides insight into the premiums paid for comparable businesses in the market.',
        'ABV': 'The Asset-Based Valuation (ABV) method calculates the value of the company based on its tangible and intangible assets. This approach is particularly relevant for companies with significant intellectual property or other valuable assets.'
    };
    
    return methodDescriptions[methodType] || '';
}


