# CRM API Documentation

## Pipeline APIs

### Get Pipeline Data
Get all leads grouped by their pipeline stage.

**Endpoint:** `GET /api/pipeline`

**Authentication:** Required (Bearer Token)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "stage": "New",
      "count": 10,
      "leads": [
        {
          "id": 1,
          "name": "John Doe",
          "phone": "+1234567890",
          "email": "john@example.com",
          "source": "WhatsApp",
          "last_message": "Hello, I'm interested",
          "last_message_at": "2024-01-15T10:30:00Z",
          "created_at": "2024-01-15T10:00:00Z",
          "updated_at": "2024-01-15T10:30:00Z"
        }
      ]
    }
  ]
}
```

### Update Lead Stage
Update a lead's pipeline stage (for drag-and-drop functionality).

**Endpoint:** `PATCH /api/pipeline/leads/:id/stage`

**Authentication:** Required (Bearer Token)

**Request Body:**
```json
{
  "stage": "Contacted"
}
```

**Valid Stages:**
- New
- Incoming
- Contacted
- Qualified
- Proposal
- Negotiation
- Won
- Lost

**Response:**
```json
{
  "success": true,
  "message": "Lead stage updated successfully"
}
```

### Get Pipeline Statistics
Get statistics for each pipeline stage.

**Endpoint:** `GET /api/pipeline/stats`

**Authentication:** Required (Bearer Token)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "stage": "New",
      "count": 10,
      "today_count": 2,
      "week_count": 5
    }
  ]
}
```

---

## Analytics APIs

### Get Revenue Trend
Get revenue and leads trend over time.

**Endpoint:** `GET /api/analytics/revenue-trend`

**Authentication:** Required (Bearer Token)

**Query Parameters:**
- `months` (optional): Number of months to retrieve (default: 6)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "month": "Jan",
      "leads": 120,
      "revenue": 45000
    }
  ]
}
```

### Get Conversion Funnel
Get lead conversion funnel data.

**Endpoint:** `GET /api/analytics/conversion-funnel`

**Authentication:** Required (Bearer Token)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "New Leads",
      "value": 400,
      "color": "#64748b"
    },
    {
      "name": "Contacted",
      "value": 300,
      "color": "#3b82f6"
    }
  ]
}
```

### Get Performance Metrics
Get key performance metrics.

**Endpoint:** `GET /api/analytics/performance`

**Authentication:** Required (Bearer Token)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "metric": "Lead Conversion",
      "value": "23.5%",
      "target": "25%",
      "progress": 94
    },
    {
      "metric": "Avg Deal Size",
      "value": "$8,500",
      "target": "$10,000",
      "progress": 85
    }
  ]
}
```

### Get Pipeline Distribution
Get distribution of leads across pipeline stages (for pie chart).

**Endpoint:** `GET /api/analytics/pipeline-distribution`

**Authentication:** Required (Bearer Token)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "New",
      "value": 50,
      "color": "#64748b"
    },
    {
      "name": "Contacted",
      "value": 30,
      "color": "#3b82f6"
    }
  ]
}
```

### Get Analytics Overview
Get all analytics data in a single API call (optimized for dashboard).

**Endpoint:** `GET /api/analytics/overview`

**Authentication:** Required (Bearer Token)

**Query Parameters:**
- `months` (optional): Number of months for revenue trend (default: 6)

**Response:**
```json
{
  "success": true,
  "data": {
    "revenueTrend": [...],
    "conversionFunnel": [...],
    "performanceMetrics": [...],
    "pipelineDistribution": [...]
  }
}
```

---

## Authentication

All pipeline and analytics endpoints require authentication. Include the access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

If the access token expires (401 response), use the refresh token endpoint to get a new access token:

**Endpoint:** `POST /api/auth/refresh-token`

**Request Body:**
```json
{
  "refreshToken": "<refresh_token>"
}
```

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (in development mode)"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (missing or invalid token)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error
