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

// Helper functions to get min and max valuation amounts
function getMinValuation(methodologies) {
    if (!methodologies || methodologies.length === 0) return '₹0.00';
    
    let minVal = Number.MAX_SAFE_INTEGER;
    let minValCurrency = '';
    
    methodologies.forEach(method => {
        const amount = parseFloat(method.valuation_amount.replace(/[^0-9.]/g, ''));
        if (!isNaN(amount) && amount < minVal) {
            minVal = amount;
            minValCurrency = method.currency || '';
        }
    });
    
    // Format using Indian numeric system
    return '₹' + formatIndianNumber(minVal);
}

function getMaxValuation(methodologies) {
    if (!methodologies || methodologies.length === 0) return '₹0.00';
    
    let maxVal = 0;
    let maxValCurrency = '';
    
    methodologies.forEach(method => {
        const amount = parseFloat(method.valuation_amount.replace(/[^0-9.]/g, ''));
        if (!isNaN(amount) && amount > maxVal) {
            maxVal = amount;
            maxValCurrency = method.currency || '';
        }
    });
    
    // Format using Indian numeric system
    return '₹' + formatIndianNumber(maxVal);
}

// Helper function to format numbers in Indian numeric system (lakhs, crores)
function formatIndianNumber(num) {
    if (isNaN(num)) return num;
    
    // Convert to number if it's a string
    num = typeof num === 'string' ? parseFloat(num.replace(/[^\d.-]/g, '')) : num;
    
    // Format with 2 decimal places
    let formattedNum = num.toFixed(2);
    
    // Extract the whole and decimal parts
    let parts = formattedNum.split('.');
    let wholePart = parts[0];
    let decimalPart = parts.length > 1 ? parts[1] : '';
    
    // Format the whole part according to Indian system
    let lastThree = wholePart.length > 3 ? wholePart.substring(wholePart.length - 3) : wholePart;
    let remaining = wholePart.length > 3 ? wholePart.substring(0, wholePart.length - 3) : '';
    let formattedWhole = '';
    
    // Add commas for remaining digits in groups of 2
    if (remaining) {
        let i = remaining.length;
        while (i > 0) {
            let chunk = i >= 2 ? remaining.substring(i - 2, i) : remaining.substring(0, i);
            formattedWhole = ',' + chunk + formattedWhole;
            i -= 2;
        }
        formattedWhole = formattedWhole.substring(1); // Remove leading comma
    }
    
    // Combine the formatted whole part with the last three digits
    formattedWhole = formattedWhole ? formattedWhole + ',' + lastThree : lastThree;
    
    // Add the decimal part if it exists
    return formattedWhole + (decimalPart ? '.' + decimalPart : '');
}

// Helper function to convert number to Indian words (lakhs, crores)
function numberToIndianWords(num) {
    if (isNaN(num)) return '';
    
    // Convert to number if it's a string
    num = typeof num === 'string' ? parseFloat(num.replace(/[^\d.-]/g, '')) : num;
    
    if (num >= 10000000) {
        return (num / 10000000).toFixed(2) + ' crores';
    } else if (num >= 100000) {
        return (num / 100000).toFixed(2) + ' lakhs';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(2) + ' thousand';
    } else {
        return num.toFixed(2);
    }
}

// Function to clean AI-generated content
function cleanAIContent(content) {
    if (!content) return '';
    
    // Remove common AI introductory phrases
    const phrasesToRemove = [
        /^Here is a professionally crafted .+?:/i,
        /^Of course\.\s*/i,
        /^Sure\.\s*/i,
        /^I'd be happy to .+?:/i,
        /^Here's .+?:/i,
        /^\*\*\*.+?\*\*\*/,
        /^\*\*.+?\*\*/,
        /^Based on the information provided,\s*/i,
        /^As requested,\s*/i,
        /^Let me .+?:/i,
        /^Below is .+?:/i,
        /^The following .+?:/i,
        /^This is .+?:/i,
        /^Please find .+?:/i,
        /^In this .+?:/i,
        /^For .+?:/i,
        /^To .+?:/i,
        /^I will .+?:/i,
        /^I have .+?:/i,
        /^I've .+?:/i,
        /^Here are .+?:/i
    ];
    
    let cleanedContent = content;
    phrasesToRemove.forEach(phrase => {
        cleanedContent = cleanedContent.replace(phrase, '');
    });
    
    // Remove markdown formatting that might be in the AI response
    cleanedContent = cleanedContent.replace(/^\s*#+ /gm, ''); // Remove heading markers
    cleanedContent = cleanedContent.replace(/^\*\*VALUATION REPORT.+?\*\*/gmi, ''); // Remove report headers
    cleanedContent = cleanedContent.replace(/^\d+\.\s+\*\*.+?\*\*/gm, ''); // Remove numbered bold headers
    cleanedContent = cleanedContent.replace(/^\*\*.+?\*\*$/gm, ''); // Remove bold headers
    
    // Remove any lines that contain these phrases
    const linesToRemove = [
        /^introduction$/i,
        /^summary$/i,
        /^conclusion$/i,
        /^recommendations$/i,
        /^valuation report$/i,
        /^executive summary$/i,
        /^company profile$/i,
        /^business overview$/i,
        /^valuation methodologies$/i,
        /^final opinion$/i
    ];
    
    cleanedContent = cleanedContent.split('\n')
        .filter(line => {
            return !linesToRemove.some(pattern => pattern.test(line.trim()));
        })
        .join('\n');
    
    // Fix common typos
    cleanedContent = cleanedContent.replace(/\bBuisness\b/g, 'Business');
    
    // Standardize currency formatting to use ₹ symbol
    cleanedContent = cleanedContent.replace(/INR\s+/g, '₹');
    cleanedContent = cleanedContent.replace(/\$/g, '₹');
    cleanedContent = cleanedContent.replace(/USD\s+/g, '₹');
    
    // Convert "Million" to lakhs/crores
    cleanedContent = cleanedContent.replace(/(\d+(\.\d+)?)\s*million/gi, function(match, number) {
        const numValue = parseFloat(number);
        // 1 million = 10 lakhs
        return numberToIndianWords(numValue * 1000000);
    });
    
    // Trim any leading/trailing whitespace
    return cleanedContent.trim();
}

// Function to call DeepSeek API for generating report content
async function generateDeepSeekContent(prompt) {
    try {
        const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
            model: 'deepseek-chat',
            messages: [
                {
                    role: 'system',
                    content: 'You are a professional business valuation expert. Provide ONLY the exact information requested without any introductions, conclusions, or explanatory phrases. Do not use headers, titles, or section names. Be direct, concise, and factual.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.5,
            max_tokens: 500
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
            }
        });

        const content = response.data.choices[0].message.content;
        return cleanAIContent(content);
    } catch (error) {
        console.error('Error calling DeepSeek API:', error.response?.data || error.message);
        // Return a fallback message if the API call fails
        return 'Unable to generate content. Using default template.';
    }
}

// Function to generate valuation report
async function generateValuationReport(
    companyName,
    incorporationDate,
    businessDescription,
    companyStatus,
    registeredOffice,
    valuationDate,
    reportDate,
    valuationMethodologies,
    dcfAssumptions,
    valuationOutput
) {
    // Set default valuation purpose
    const valuationPurpose = "Issuance of Equity & Preference Shares";
    
    // Format the valuation methodologies table
    let methodologiesTable = '';
    valuationMethodologies.forEach(method => {
        methodologiesTable += `${method.method_name}\t${method.description}\t${method.valuation_amount}\t${method.currency}\n`;
    });

    // Generate AI content for Executive Summary 
     const executiveSummaryPrompt = `Provide only the executive summary text for ${companyName}'s valuation report. 
     Valuation date: ${valuationDate}. Purpose: ${valuationPurpose}. 
     Business: ${businessDescription}. 
     Methodologies used: ${valuationMethodologies.map(m => m.method_name).join(", ")}.`; 
     
     // Generate AI content for Company Information 
     const companyInfoPrompt = `Provide only factual company profile information for ${companyName}. 
     Incorporation date: ${incorporationDate}. Status: ${companyStatus}. 
     Registered office: ${registeredOffice}. Business: ${businessDescription}.`; 
     
     // Generate AI content for Business Overview 
     const businessOverviewPrompt = `Provide only business overview details for ${companyName}. 
     Business description: ${businessDescription}.`; 
     
     // Generate AI content for Methodology Explanations 
     const methodologyPrompt = `For each of these valuation methodologies: 
     ${valuationMethodologies.map(m => m.method_name).join(", ")},
     provide a brief rationale explaining why it is appropriate 
     for a company in: ${businessDescription}.
     Format as a numbered list with each methodology having its own rationale paragraph.`; 
     
     // Generate AI content for Final Opinion 
     const finalOpinionPrompt = `Provide a formal, professional interpretation of valuation results for ${companyName}. 
     Equity value: ${valuationOutput.equity_value_pre_money} ${valuationMethodologies[0]?.currency || 'INR'}. 
     Fair value per share: ${valuationOutput.fair_value_per_share} ${valuationMethodologies[0]?.currency || 'INR'}.
     Use formal business language appropriate for a professional valuation report.`; 
     
     // Generate AI content for Recommendations 
     const recommendationsPrompt = `Provide 3-4 specific business recommendations for ${companyName} 
     in the ${businessDescription} business. For each recommendation:
     1. Provide a clear, actionable recommendation title
     2. Include a brief rationale explaining the business value
     Format as a numbered list with titles in bold and rationale as regular text.`;

    // Call DeepSeek API to generate content
    const [executiveSummary, companyInfo, businessOverview, methodologyExplanation, finalOpinion, recommendations] = await Promise.all([
        generateDeepSeekContent(executiveSummaryPrompt),
        generateDeepSeekContent(companyInfoPrompt),
        generateDeepSeekContent(businessOverviewPrompt),
        generateDeepSeekContent(methodologyPrompt),
        generateDeepSeekContent(finalOpinionPrompt),
        generateDeepSeekContent(recommendationsPrompt)
    ]);

    // Format recommendations as bullet points
    const formattedRecommendations = recommendations
        .split('\n')
        .filter(line => line.trim() !== '')
        .map((line, index) => `${index + 1}. **${line.replace(/^\d+\.\s*\*\*/, '').trim()}**`)
        .join('  \n');

    // Generate the report
    return `
Valuation Report
 
Produced By: Number Leader
Report Date: ${reportDate}
 
1. About Number Leader
 
At Number Leader, we specialize in delivering cutting-edge valuation, benchmarking, and market research services by leveraging data, technology, and artificial intelligence. Our mission is to provide actionable insights that empower businesses to make strategic financial decisions.
 
2. Service Provided
 
Number Leader has been engaged to provide a comprehensive valuation service for ${companyName}.
 
3. Company Profile
 
Incorporation Date: ${incorporationDate}
Company Status: ${companyStatus}
Registered Office: ${registeredOffice}
Business Description: ${businessDescription}
 
Company Information Table
 
Field | Details
------|--------
Company Name | ${companyName}
Incorporation Date | ${incorporationDate}
Business Description | ${businessDescription}
Company Status | ${companyStatus}
Registered Office | ${registeredOffice}
 
4. Executive Summary
 
Valuation Date: ${valuationDate}
Purpose of Valuation: ${valuationPurpose}
 
${executiveSummary}
 
${businessOverview}
 
A multi-method approach was used to determine the fair market value, including:
 
Discounted Cash Flow (DCF): Projected future cash flows discounted to present value, reflecting growth potential and risk profile.
 
Comparable Company Analysis (CCA): Benchmarked against publicly traded peers to derive market-based valuation multiples.
 
Past Transaction Multiples (PTM): Analyzed recent M&A transactions of similar companies to assess strategic premiums.
 
Adjusted Book Value (ABV): Evaluated net assets and adjusted for intangible assets and market conditions.
 
Based on these methodologies, the valuation range is ${getMinValuation(valuationMethodologies)} to ${getMaxValuation(valuationMethodologies)}. The results were weighted to arrive at a fair market value, supporting the ${valuationPurpose.toLowerCase()} strategy.
 
5. Valuation Methodologies & Rationale
${methodologyExplanation}
 
6. DCF Assumptions
Assumption | Value
----------|------
Weighted Avg. Cost of Capital (WACC) | ${dcfAssumptions?.wacc || '-'}
Long-Term Growth Rate | ${dcfAssumptions?.long_term_growth_rate || '-'}
Tax Rate | ${dcfAssumptions?.tax_rate || '-'}
Risk-Free Rate | ${dcfAssumptions?.risk_free_rate || '-'}
Equity Cost | ${dcfAssumptions?.equity_cost || '-'}
Beta | ${dcfAssumptions?.beta || '-'}
 
7. Valuation Results
Method Name | Description | Valuation Amount
------------|-------------|----------------
${methodologiesTable}
 
Final Valuation (Pre-Money): ${valuationOutput.equity_value_pre_money} ${valuationMethodologies[0]?.currency || 'INR'}
Fair Value Per Share: ${valuationOutput.fair_value_per_share} ${valuationMethodologies[0]?.currency || 'INR'}
Face Value Per Share: ${valuationOutput.face_value} ${valuationMethodologies[0]?.currency || 'INR'}
 
Interpretation:
${finalOpinion}
 
8. Recommendations
 
${formattedRecommendations}
 
9. Disclaimer
 
This report is intended solely for ${companyName} and its authorized representatives. The valuations provided are based on information available at the time of analysis and are subject to change due to market conditions or additional data. Number Leader assumes no liability for decisions made based on this report.
 
Prepared By:
Number Leader
www.numberleader.com
 
Bengaluru, India
📧 info@numberleader.com
`;
}

// Middleware
app.use(express.json());
app.use(cors({
  origin: '*',  // Allow all origins - restrict this in production
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.static('public'));

// Function to generate business plan using Gemini API
async function generateBusinessPlan(businessName, industry, targetMarket, productService, planFormat) {
  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    // Define sections based on plan format
    const sections = {
      comprehensive: [
        '1. Executive Summary',
        '2. Company Description / Overview',
        '3. Products and Services',
        '4. Market Analysis',
        '5. Marketing and Sales Strategy',
        '6. Organization and Management Team',
        '7. Operating Plan',
        '8. Financial Plan/Projections',
        '9. Funding Request (if applicable)',
        '10. Appendix/Appendices'
      ],
      concise: [
        '1. Executive Summary',
        '2. Company Description / Overview',
        '3. Products and Services',
        '4. Market Analysis',
        '5. Financial Plan/Projections'
      ],
      investor: [
        '1. Executive Summary',
        '2. Company Description / Overview',
        '3. Market Analysis',
        '4. Products and Services',
        '5. Marketing and Sales Strategy',
        '6. Organization and Management Team',
        '7. Financial Plan/Projections',
        '8. Funding Request',
        '9. Appendix/Appendices'
      ]
    };

    // Create the prompt with the user's specific instructions
    const prompt = `
      Generate a detailed business plan for a business with the following details:
      
      Business Name: ${businessName}
      Industry: ${industry}
      Target Market: ${targetMarket}
      Product/Service Description: ${productService}
      
      The business plan must include the following sections:
      
      ${sections[planFormat].join('\n')}
      
      Format the business plan in a professional, well-structured manner with clear headings and subheadings.
      Include realistic market data and financial projections based on the industry standards.
      Provide actionable insights and recommendations specific to the business type and industry.
    `;

    // Call Gemini API
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent',
      {
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
          topP: 0.95,
          topK: 40
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY
        }
      }
    );

    // Extract and return the generated business plan
    return response.data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error generating business plan:', error.response?.data || error.message);
    throw new Error('Failed to generate business plan');
  }
}

// Business Plan Generation Endpoint
app.post('/generate-business-plan', async (req, res) => {
  try {
    const { businessName, industry, targetMarket, productService, planFormat = 'comprehensive' } = req.body;
    
    // Validate required parameters
    if (!businessName || !industry || !targetMarket || !productService) {
      return res.status(400).json({ 
        error: 'Missing required parameters. Please provide businessName, industry, targetMarket, and productService.' 
      });
    }
    
    // Validate plan format
    const validFormats = ['comprehensive', 'concise', 'investor'];
    if (!validFormats.includes(planFormat)) {
      return res.status(400).json({ 
        error: `Invalid plan format. Please use one of: ${validFormats.join(', ')}` 
      });
    }
    
    // Generate business plan
    const businessPlan = await generateBusinessPlan(
      businessName, 
      industry, 
      targetMarket, 
      productService, 
      planFormat
    );
    
    // Return the generated business plan
    res.json({ 
      success: true, 
      businessPlan 
    });
  } catch (error) {
    console.error('Error in /generate-business-plan endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to generate business plan', 
      message: error.message 
    });
  }
});

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
        path: "/generate-business-plan",
        method: "POST",
        description: "Generate a business plan using Gemini AI",
        parameters: {
          businessName: "string (required) - The name of the business",
          industry: "string (required) - The industry of the business",
          targetMarket: "string (required) - The target market of the business",
          productService: "string (required) - Description of the product or service",
          planFormat: "string (optional) - Format of the business plan (comprehensive, concise, or investor). Default is comprehensive."
        },
        response: {
          success: "boolean - Indicates if the request was successful",
          businessPlan: "string - The generated business plan"
        }
      },
      {
        path: "/generate-valuation-report",
        method: "POST",
        description: "Generate a structured valuation report based on provided company and valuation data",
        parameters: {
          company_name: "string (required) - The name of the company",
          incorporation_date: "string (required) - Date of incorporation",
          business_description: "string (required) - Description of the business",
          company_status: "string (required) - Status of the company (e.g., Private / Unlisted)",
          registered_office: "string (required) - Location of registered office",
          valuation_methodologies: "array (required) - Array of valuation methods with details",
          dcf_assumptions: "object (optional) - DCF valuation assumptions",
          valuation_output: "object (required) - Final valuation output details"
        },
        response: {
          report: "string - Formatted valuation report"
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

// Generate Valuation Report Endpoint
app.post('/generate-valuation-report', async (req, res) => {
    const { 
        company_name, 
        incorporation_date, 
        business_description, 
        company_status, 
        registered_office,
        valuation_methodologies,
        dcf_assumptions,
        valuation_output
    } = req.body;

    // Validate required fields
    if (!company_name || !incorporation_date || !business_description || 
        !company_status || !registered_office || !valuation_methodologies || 
        !valuation_output) {
        return res.status(400).json({
            error: 'Required fields are missing',
            missingFields: [
                !company_name ? 'company_name' : null,
                !incorporation_date ? 'incorporation_date' : null,
                !business_description ? 'business_description' : null,
                !company_status ? 'company_status' : null,
                !registered_office ? 'registered_office' : null,
                !valuation_methodologies ? 'valuation_methodologies' : null,
                !valuation_output ? 'valuation_output' : null
            ].filter(Boolean)
        });
    }

    try {
        // Get current date
        const reportDate = new Date().toISOString().split('T')[0];
        const valuationDate = new Date().toISOString().split('T')[0];

        // Generate the report
        const report = await generateValuationReport(
            company_name,
            incorporation_date,
            business_description,
            company_status,
            registered_office,
            valuationDate,
            reportDate,
            valuation_methodologies,
            dcf_assumptions,
            valuation_output
        );

        // Save report to database
        const companyResult = await pool.query(
            'INSERT INTO companies (name, description, created_at) VALUES ($1, $2, CURRENT_TIMESTAMP) RETURNING id',
            [company_name, business_description]
        );
        
        const companyId = companyResult.rows[0].id;
        
        await pool.query(
            'INSERT INTO generated_reports (company_id, report_text, created_at) VALUES ($1, $2, CURRENT_TIMESTAMP)',
            [companyId, report]
        );

        // Log successful report generation
        await pool.query(
            'INSERT INTO report_generation_logs (company_id, status, message, created_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)',
            [companyId, 'success', 'Valuation report generated successfully']
        );

        res.json({ report });
    } catch (error) {
        console.error('Error generating valuation report:', error);
        
        // Log error
        try {
            await pool.query(
                'INSERT INTO report_generation_logs (status, message, created_at) VALUES ($1, $2, CURRENT_TIMESTAMP)',
                ['error', `Error generating report: ${error.message}`]
            );
        } catch (logError) {
            console.error('Error logging report generation failure:', logError);
        }
        
        res.status(500).json({ error: 'Failed to generate valuation report', details: error.message });
    }
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
        
        let textReport = '';
        
        // Create the exact report format as specified
        textReport += `# Valuation Report\n\n`;
        textReport += `Produced By: Number Leader\n`;
        textReport += `Date: ${formattedDate}\n\n`;
        textReport += `## About Number Leader\n\n`;
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
        textReport += `Description: The Comparable Company Analysis (CCA) method values ${companyName} by comparing it to similar companies in the industry. Key financial metrics and valuation multiples are analyzed to derive a fair market value.\n`;
        textReport += `Valuation: ${cca}\n\n`;
        textReport += `Method 3: Precedent Transaction Method (PTM)\n`;
        textReport += `--------------------------------------------\n`;
        textReport += `Description: The Precedent Transaction Method (PTM) evaluates ${companyName} based on the purchase prices of similar companies in recent transactions. This method provides insight into the premiums paid for comparable businesses in the market.\n`;
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
                'https://api.deepseek.com/v1/chat/completions',
                {
                    model: 'deepseek-chat',
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
        
        // Get a client from the pool
        const client = await pool.connect();
        
        try {
            // Begin transaction
            await client.query('BEGIN');
            
            // Insert company data
            const companyResult = await client.query(
                'INSERT INTO companies (name, description, created_at) VALUES ($1, $2, CURRENT_TIMESTAMP) RETURNING id',
                [companyName, companyDescription]
            );
            
            const companyId = companyResult.rows[0].id;
            
            // Insert valuation models
            await client.query(
                'INSERT INTO valuation_models (company_id, dcf, cca, ptm, abv, created_at) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)',
                [companyId, dcf, cca, ptm, abv]
            );
            
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
                await pool.query(
                    'INSERT INTO report_generation_logs (company_id, status, message) VALUES ($1, $2, $3)',
                    [companyId, 'FAILED', error.message]
                );
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
    } catch (error) {
        console.error('❌ Error:', error.response ? error.response.data : error.message);
        
        return res.status(500).json({
          status: 'error',
          message: 'Failed to generate text report',
          error: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`✅ API server running at http://localhost:${PORT}`);
});
