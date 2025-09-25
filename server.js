require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 5001;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

// PostgreSQL connection setup
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'postgres',
    password: process.env.DB_PASSWORD || 'Karan@200314',
    port: process.env.DB_PORT || 5432,
});

// Create database tables if they don't exist
const initializeDatabase = async () => {
    try {
        // Create companies table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS companies (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create valuation_models table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS valuation_models (
                id SERIAL PRIMARY KEY,
                company_id INTEGER REFERENCES companies(id),
                dcf VARCHAR(50) NOT NULL,
                cca VARCHAR(50) NOT NULL,
                ptm VARCHAR(50) NOT NULL,
                abv VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create generated_reports table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS generated_reports (
                id SERIAL PRIMARY KEY,
                company_id INTEGER REFERENCES companies(id),
                report_text TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create report_generation_logs table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS report_generation_logs (
                id SERIAL PRIMARY KEY,
                company_id INTEGER REFERENCES companies(id),
                status VARCHAR(50) NOT NULL,
                message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('✅ Database tables initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing database tables:', error);
    }
};

// Initialize database tables on server startup
initializeDatabase();

// Middleware
app.use(express.json());
app.use(cors({
  origin: '*',  // Allow all origins - restrict this in production
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.static('public'));

// API Documentation Route
app.get('/', (req, res) => {
  res.json({
    name: "Valuation Report Generator API",
    version: "1.0.0",
    description: "API for generating company valuation reports",
    endpoints: [
      {
        path: "/generate-report",
        method: "POST",
        description: "Generate a valuation report for a company",
        parameters: {
          companyName: "string (required) - The name of the company",
          companyDescription: "string (required) - Detailed description of the company",
          dcf: "string (required) - Discounted Cash Flow value",
          cca: "string (required) - Comparable Company Analysis value",
          ptm: "string (required) - Precedent Transaction Method value",
          abv: "string (required) - Asset-Based Valuation value"
        },
        response: {
          report: {
            page1: "string - First page content of the report",
            page2: "string - Second page content of the report",
            page3: "string - Third page content of the report"
          }
        }
      },
      {
        path: "/api-health",
        method: "GET",
        description: "Check the health status of the API",
        response: {
          status: "string - Health status of the API",
          timestamp: "string - Current timestamp"
        }
      }
    ]
  });
});

// API Health Check Endpoint
app.get('/api-health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Generate Report Endpoint
app.post('/generate-report', async (req, res) => {
    const { companyName, companyDescription, dcf, cca, ptm, abv } = req.body;

    if (!companyName || !companyDescription || !dcf || !cca || !ptm || !abv) {
        return res.status(400).json({ 
          error: 'All fields are required',
          missingFields: [
            !companyName ? 'companyName' : null,
            !companyDescription ? 'companyDescription' : null,
            !dcf ? 'dcf' : null,
            !cca ? 'cca' : null,
            !ptm ? 'ptm' : null,
            !abv ? 'abv' : null
          ].filter(Boolean)
        });
    }

    try {
        // Get current date
        const formattedDate = new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        // Create the exact report format as specified
        const reportTemplate = {
            page1: `
# Valuation Report

Produced By: Number Leader
Date: ${formattedDate}

## About Number Leader

At Number Leader, we are more than just an investment bank; we are at the forefront of financial innovation. We specialize in delivering cutting-edge valuation, benchmarking, and market research services by leveraging data, technology, and artificial intelligence. Our mission is to empower businesses with actionable insights and strategic financial solutions to drive growth and success.

## About ${companyName}

${companyDescription}

## Service Provided

Number Leader has been engaged to provide a comprehensive valuation service for ${companyName}. This report outlines the valuation methodologies employed, the results derived, and the conclusions drawn to determine the fair value of ${companyName}.
`,
            page2: `
# Valuation Methodologies

## Method 1: Discounted Cash Flow (DCF)

- **Description:**
The Discounted Cash Flow (DCF) method estimates the value of ${companyName} based on its projected future cash flows, discounted to their present value using an appropriate discount rate. This approach reflects the company's ability to generate cash flows over time and accounts for the time value of money.
- **Valuation:** ${dcf}
👉 Number Leader values ${companyName} at ${dcf} using the DCF method.

## Method 2: Comparable Company Analysis (CCA)

- **Description:**
The Comparable Company Analysis (CCA) method values ${companyName} by comparing it to similar companies in the industry. Key financial metrics and valuation multiples are analyzed to derive a fair market value.
- **Valuation:** ${cca}
👉 Number Leader values ${companyName} at ${cca} using the CCA method.

## Method 3: Precedent Transaction Method (PTM)

- **Description:**
The Precedent Transaction Method (PTM) evaluates ${companyName} based on the purchase prices of similar companies in recent transactions. This method provides insight into the premiums paid for comparable businesses in the market.
- **Valuation:** ${ptm}
👉 Number Leader values ${companyName} at ${ptm} using the PTM method.

## Method 4: Asset-Based Valuation (ABV)

- **Description:**
The Asset-Based Valuation (ABV) method calculates the value of ${companyName} based on its tangible and intangible assets. This approach is particularly relevant for companies with significant intellectual property or other valuable assets.
- **Valuation:** ${abv}
👉 Number Leader values ${companyName} at ${abv} using the ABV method.
`,
            page3: `
# Conclusion

Based on the four valuation methodologies—Discounted Cash Flow (DCF), Comparable Company Analysis (CCA), Precedent Transaction Method (PTM), and Asset-Based Valuation (ABV)—the estimated value of ${companyName} ranges between ${ptm} and ${abv}.

Number Leader recommends considering the following factors to arrive at a fair and strategic valuation for ${companyName}:
1. The company's growth potential and scalability in its target market.
2. The strength of its intellectual property and technological assets.
3. Market trends and investor sentiment in the industry.

This valuation report is a foundation for strategic decision-making, whether for fundraising, mergers and acquisitions, or internal planning purposes.

---

## Prepared by

Number Leader
https://www.numberleader.com
BENGALURU, INDIA
info@numberleader.com

## Disclaimer

This report is intended solely for the use of ${companyName} and its authorized representatives. The valuations provided are based on the information available at the time of analysis and are subject to change based on market conditions, additional data, or other factors. Number Leader assumes no liability for decisions made based on this report.
`
        };
        
        // Generate specific recommendations based on company description
        try {
            const suggestionsPrompt = `
Based on this company description, generate 3 specific valuation factors to consider (one sentence each):
"${companyDescription}"

Format your response as just 3 numbered points, with no introduction or explanation.
`;

            const suggestionsResponse = await axios.post(
                'https://api.deepseek.ai/v1/chat/completions',
                {
                    model: 'deepseek-chat-v1',
                    messages: [{ role: 'user', content: suggestionsPrompt }],
                    max_tokens: 300
                },
                {
                    headers: {
                        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            const suggestions = suggestionsResponse.data.choices[0]?.message?.content;
            
            if (suggestions) {
                // Replace the generic recommendations with specific ones
                reportTemplate.page3 = reportTemplate.page3.replace(
                    "1. The company's growth potential and scalability in its target market.\n2. The strength of its intellectual property and technological assets.\n3. Market trends and investor sentiment in the industry.",
                    suggestions
                );
            }
        } catch (error) {
            console.error('❌ Failed to get custom suggestions, using defaults');
            // Continue with default suggestions if this fails
        }
        
        // Combine all pages into a single report with page markers
        const fullReport = {
            page1: reportTemplate.page1,
            page2: reportTemplate.page2,
            page3: reportTemplate.page3
        };
        
        res.json({ 
          status: 'success',
          message: 'Report generated successfully',
          report: fullReport 
        });
    } catch (error) {
        console.error('❌ Error:', error.response ? error.response.data : error.message);
        
        return res.status(500).json({
          status: 'error',
          message: 'Failed to generate report',
          error: error.message
        });
    }
});

// Text-only API endpoint for valuation report
app.post('/api/text-report', async (req, res) => {
    const { companyName, companyDescription, dcf, cca, ptm, abv } = req.body;

    if (!companyName || !companyDescription || !dcf || !cca || !ptm || !abv) {
        return res.status(400).json({ 
          error: 'All fields are required',
          missingFields: [
            !companyName ? 'companyName' : null,
            !companyDescription ? 'companyDescription' : null,
            !dcf ? 'dcf' : null,
            !cca ? 'cca' : null,
            !ptm ? 'ptm' : null,
            !abv ? 'abv' : null
          ].filter(Boolean)
        });
    }

    // Start a database transaction
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Insert company data
        const companyResult = await client.query(
            'INSERT INTO companies (name, description) VALUES ($1, $2) RETURNING id',
            [companyName, companyDescription]
        );
        const companyId = companyResult.rows[0].id;
        
        // Insert valuation models
        await client.query(
            'INSERT INTO valuation_models (company_id, dcf, cca, ptm, abv) VALUES ($1, $2, $3, $4, $5)',
            [companyId, dcf, cca, ptm, abv]
        );
        
        // Log report generation start
        await client.query(
            'INSERT INTO report_generation_logs (company_id, status, message) VALUES ($1, $2, $3)',
            [companyId, 'STARTED', 'Report generation started']
        );
        
        // Get current date
        const formattedDate = new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        // Create text-only report format
        let textReport = `VALUATION REPORT\n`;
        textReport += `=================\n\n`;
        textReport += `Produced By: Number Leader\n`;
        textReport += `Date: ${formattedDate}\n\n`;
        textReport += `ABOUT NUMBER LEADER\n`;
        textReport += `------------------\n`;
        textReport += `At Number Leader, we are more than just an investment bank; we are at the forefront of financial innovation. We specialize in delivering cutting-edge valuation, benchmarking, and market research services by leveraging data, technology, and artificial intelligence.\n\n`;
        textReport += `ABOUT ${companyName.toUpperCase()}\n`;
        textReport += `${'-'.repeat(companyName.length + 6)}\n`;
        textReport += `${companyDescription}\n\n`;
        textReport += `SERVICE PROVIDED\n`;
        textReport += `----------------\n`;
        textReport += `Number Leader has been engaged to provide a comprehensive valuation service for ${companyName}.\n\n`;
        textReport += `VALUATION METHODOLOGIES\n`;
        textReport += `=======================\n\n`;
        textReport += `Method 1: Discounted Cash Flow (DCF)\n`;
        textReport += `----------------------------------\n`;
        textReport += `Description: The Discounted Cash Flow (DCF) method estimates the value of ${companyName} based on its projected future cash flows, discounted to their present value using an appropriate discount rate.\n`;
        textReport += `Valuation: ${dcf}\n\n`;
        textReport += `Method 2: Comparable Company Analysis (CCA)\n`;
        textReport += `------------------------------------------\n`;
        textReport += `Description: The Comparable Company Analysis (CCA) method values ${companyName} by comparing it to similar companies in the industry.\n`;
        textReport += `Valuation: ${cca}\n\n`;
        textReport += `Method 3: Precedent Transaction Method (PTM)\n`;
        textReport += `--------------------------------------------\n`;
        textReport += `Description: The Precedent Transaction Method (PTM) evaluates ${companyName} based on the purchase prices of similar companies in recent transactions.\n`;
        textReport += `Valuation: ${ptm}\n\n`;
        textReport += `Method 4: Asset-Based Valuation (ABV)\n`;
        textReport += `-------------------------------------\n`;
        textReport += `Description: The Asset-Based Valuation (ABV) method calculates the value of ${companyName} based on its tangible and intangible assets.\n`;
        textReport += `Valuation: ${abv}\n\n`;
        textReport += `CONCLUSION\n`;
        textReport += `==========\n\n`;
        textReport += `Based on the four valuation methodologies, the estimated value of ${companyName} ranges between ${ptm} and ${abv}.\n\n`;
        
        let suggestions = '';
        
        // Try to get custom recommendations from DeepSeek API
        try {
            const suggestionsPrompt = `
Based on this company description, generate 3 specific valuation factors to consider (one sentence each):
"${companyDescription}"

Format your response as just 3 numbered points, with no introduction or explanation.
`;

            const suggestionsResponse = await axios.post(
                'https://api.deepseek.ai/v1/chat/completions',
                {
                    model: 'deepseek-chat-v1',
                    messages: [{ role: 'user', content: suggestionsPrompt }],
                    max_tokens: 300
                },
                {
                    headers: {
                        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            suggestions = suggestionsResponse.data.choices[0]?.message?.content;
            
            if (suggestions) {
                textReport += `RECOMMENDATIONS\n`;
                textReport += `---------------\n`;
                textReport += `${suggestions}\n\n`;
            }
        } catch (error) {
            console.error('❌ Failed to get custom suggestions, using defaults');
            suggestions = '1. The company\'s growth potential and scalability in its target market.\n2. The strength of its intellectual property and technological assets.\n3. Market trends and investor sentiment in the industry.';
            textReport += `RECOMMENDATIONS\n`;
            textReport += `---------------\n`;
            textReport += `${suggestions}\n\n`;
        }
        
        textReport += `DISCLAIMER\n`;
        textReport += `----------\n`;
        textReport += `This report is intended solely for the use of ${companyName} and its authorized representatives. The valuations provided are based on the information available at the time of analysis and are subject to change based on market conditions, additional data, or other factors.\n\n`;
        textReport += `Prepared by Number Leader\n`;
        textReport += `BENGALURU, INDIA\n`;
        textReport += `info@numberleader.com\n`;
        
        // Store the generated report
        await client.query(
            'INSERT INTO generated_reports (company_id, report_text) VALUES ($1, $2)',
            [companyId, textReport]
        );
        
        // Update report generation log
        await client.query(
            'INSERT INTO report_generation_logs (company_id, status, message) VALUES ($1, $2, $3)',
            [companyId, 'COMPLETED', 'Report generated successfully']
        );
        
        // Commit the transaction
        await client.query('COMMIT');
        
        res.setHeader('Content-Type', 'text/plain');
        res.send(textReport);
    } catch (error) {
        // Rollback the transaction in case of error
        await client.query('ROLLBACK');
        
        console.error('❌ Error:', error.response ? error.response.data : error.message);
        
        // Log the error
        try {
            if (companyId) {
                await pool.query(
                    'INSERT INTO report_generation_logs (company_id, status, message) VALUES ($1, $2, $3)',
                    [companyId, 'FAILED', error.message]
                );
            }
        } catch (logError) {
            console.error('❌ Error logging failure:', logError);
        }
        
        return res.status(500).json({
          status: 'error',
          message: 'Failed to generate text report',
          error: error.message
        });
    } finally {
        client.release();
    }
});

app.listen(PORT, () => {
    console.log(`✅ API server running at http://localhost:${PORT}`);
});
