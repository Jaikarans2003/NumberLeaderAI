# Valuation Report Generator API Documentation

## Text-Only Valuation Report API

### Endpoint

```
POST /api/text-report
```

### Description

This endpoint generates a plain text valuation report based on company information and valuation metrics provided in the request. The report includes company details, valuation methodologies, and AI-generated recommendations.

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| companyName | String | Yes | Name of the company being valued |
| companyDescription | String | Yes | Brief description of the company's business |
| dcf | String | Yes | Discounted Cash Flow valuation (e.g., "$10M") |
| cca | String | Yes | Comparable Company Analysis valuation (e.g., "$12M") |
| ptm | String | Yes | Precedent Transaction Method valuation (e.g., "$9M") |
| abv | String | Yes | Asset-Based Valuation (e.g., "$11M") |

### Response

**Content Type**: `text/plain`

The response is a plain text formatted valuation report that includes:
- Report header with date
- Company information
- Valuation methodologies and results
- Conclusion
- AI-generated recommendations (using DeepSeek API)
- Disclaimer

### Example Request

```powershell
# PowerShell
Invoke-RestMethod -Uri "http://localhost:5001/api/text-report" -Method Post -ContentType "application/json" -Body '{
  "companyName": "Test Company",
  "companyDescription": "A technology startup focused on AI solutions",
  "dcf": "$10M",
  "cca": "$12M",
  "ptm": "$9M",
  "abv": "$11M"
}'
```

```bash
# cURL (for non-Windows systems)
curl -X POST http://localhost:5001/api/text-report \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Test Company",
    "companyDescription": "A technology startup focused on AI solutions",
    "dcf": "$10M",
    "cca": "$12M",
    "ptm": "$9M",
    "abv": "$11M"
  }'
```

### Error Responses

- **400 Bad Request**: If any required fields are missing
  ```json
  {
    "error": "All fields are required",
    "missingFields": ["companyName", "dcf", ...]
  }
  ```

- **500 Internal Server Error**: If there's an error generating the report
  ```json
  {
    "status": "error",
    "message": "Failed to generate text report",
    "error": "Error message details"
  }
  ```

### Notes

- The API integrates with DeepSeek AI to generate custom recommendations based on the company description.
- If the DeepSeek API call fails, default recommendations will be provided.
- The report is formatted as plain text for easy integration with other systems.