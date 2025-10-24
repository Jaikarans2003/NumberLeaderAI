# Valuation Report Generator

A professional web application to generate comprehensive company valuation reports using multiple methodologies.

## Features

- **Professional Report Generation**: Creates detailed 4-page valuation reports
- **Multiple Valuation Methods**: Implements four industry-standard valuation methodologies:
  - Discounted Cash Flow (DCF)
  - Comparable Company Analysis (CCA)
  - Price to Metrics (PTM)
  - Asset-Based Valuation (ABV)
- **Dynamic Content**: Customizes content based on company description and data
- **PDF Export**: Generates high-quality, well-formatted PDF documents
- **Modern UI**: Clean, responsive interface for inputting company data
- **Smart Recommendations**: AI-powered valuation recommendations

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/valuation-report-generator.git
   cd valuation-report-generator
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the project root and add your API keys:
   ```
   DEEPSEEK_API_KEY=your_api_key_here
  
   PORT=5000
   ```

4. Start the server:
   ```
   node server.js
   ```

5. Open your browser and navigate to:
   ```
   http://localhost:5000
   ```

## Usage

1. Enter your company information in the form fields:
   - Company Name
   - Company Description
   - Valuation Date
   - Author Name
   - Valuation figures for each method (DCF, CCA, PTM, ABV)

2. Click "Generate Report" to create a customized valuation report

3. Review the multi-page report with all valuation methodologies

4. Click "Download PDF" to save the report as a professional PDF document

## Technologies Used

- Node.js and Express for the backend server
- HTML5, CSS3, and JavaScript for the frontend
- jsPDF and html2canvas for PDF generation
- DeepSeek API for AI-powered recommendations
- CORS for cross-origin resource sharing

## License

MIT License

## Author

Created by Jaikaran S 
