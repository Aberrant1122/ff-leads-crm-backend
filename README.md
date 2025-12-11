# 📱 WhatsApp CRM Backend - Complete Guide

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd ff-leads-crm-backend
npm install
```

### 2. Setup Database
```bash
mysql -u root -p
CREATE DATABASE crm_auth_db;
USE crm_auth_db;
source database/schema.sql;
source database/whatsapp_schema.sql;
```

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env with your credentials
```

### 4. Start Server
```bash
node server.js
```

Server runs on: **http://localhost:5000**

---

## 🔐 Environment Variables

### Required Configuration

```env
# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=crm_auth_db
DB_PORT=3306

# JWT
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRES_IN=7d

# WhatsApp Cloud API
WHATSAPP_TOKEN=EAAxxxxxxxxxxxxxxx
WHATSAPP_PHONE_ID=914079795119204
WHATSAPP_VERIFY_TOKEN=my_secure_token_123
WHATSAPP_BUSINESS_ID=123456789012345
WHATSAPP_APP_SECRET=abc123def456 (optional)
```

### Where to Get WhatsApp Credentials

**WHATSAPP_TOKEN**:
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Your App → WhatsApp → Getting Started
3. Copy "Temporary access token" (24h) or generate permanent token

**WHATSAPP_PHONE_ID**:
1. WhatsApp → API Setup
2. Look for "Phone number ID" under "From"
3. Copy the numeric ID (e.g., `914079795119204`)

**WHATSAPP_VERIFY_TOKEN**:
- Create your own random secure string
- Example: `crm_webhook_2024_secure`
- Must match when configuring webhook in Meta

**Generate Secure Tokens**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🌐 WhatsApp Webhook Setup

### Local Testing with ngrok

1. **Install ngrok**:
```bash
npm install -g ngrok
```

2. **Start your server**:
```bash
node server.js
```

3. **Create public tunnel**:
```bash
ngrok http 5000
```
You'll get: `https://abc123.ngrok.io`

4. **Configure in Meta**:
   - Go to: Your App → WhatsApp → Configuration
   - Click "Edit" next to Webhook
   - **Callback URL**: `https://abc123.ngrok.io/api/webhook/whatsapp`
   - **Verify Token**: Same as your `WHATSAPP_VERIFY_TOKEN`
   - Click "Verify and Save"

5. **Subscribe to fields**:
   - ✅ messages
   - ✅ message_status (optional)

---

## 🧪 Testing

### Test Configuration
```bash
node test-whatsapp.js
```

Expected output:
```
✅ WHATSAPP_TOKEN is set
✅ WHATSAPP_PHONE_ID is set
✅ Database connection successful
✅ API Connection Successful
```

### Test API Endpoints
```bash
node test-api.js
```

### Send Test Message
```bash
node send-test-message.js 1234567890 "Hello!"
```

### Test from Meta Dashboard
1. Go to WhatsApp → API Setup
2. Click "Send test message"
3. Enter your phone number
4. Check console logs for webhook

---

## 📡 API Endpoints

### Webhook Endpoints
```
GET  /api/webhook/whatsapp    - Webhook verification
POST /api/webhook/whatsapp    - Receive WhatsApp messages
```

### Lead Management
```
GET  /api/leads               - Get all leads (with pagination)
GET  /api/leads/:id           - Get lead details with messages & timeline
POST /api/whatsapp/send       - Send WhatsApp message
```

### Authentication
```
POST /api/auth/register       - Register new user
POST /api/auth/login          - Login user
GET  /api/auth/me             - Get current user
POST /api/auth/logout         - Logout user
POST /api/auth/refresh-token  - Refresh access token
```

### Examples

**Get All Leads**:
```bash
curl http://localhost:5000/api/leads
```

**Get Lead Details**:
```bash
curl http://localhost:5000/api/leads/1
```

**Send WhatsApp Message**:
```bash
curl -X POST http://localhost:5000/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{
    "leadId": 1,
    "phone": "1234567890",
    "message": "Hello! How can I help you?"
  }'
```

---

## 🗄️ Database Schema

### leads
```sql
CREATE TABLE leads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    phone VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255),
    stage ENUM('New', 'Incoming', 'Contacted', 'Qualified', 
               'Proposal', 'Negotiation', 'Won', 'Lost') DEFAULT 'New',
    source ENUM('WhatsApp', 'Website', 'Referral', 'Cold Call', 
                'Email', 'Social Media', 'Other') DEFAULT 'WhatsApp',
    last_message TEXT,
    last_message_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### lead_messages
```sql
CREATE TABLE lead_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lead_id INT NOT NULL,
    message_id VARCHAR(255),
    direction ENUM('inbound', 'outbound') NOT NULL,
    message_text TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text',
    status ENUM('sent', 'delivered', 'read', 'failed') DEFAULT 'sent',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
);
```

### lead_timeline
```sql
CREATE TABLE lead_timeline (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lead_id INT NOT NULL,
    event_type ENUM('message_received', 'message_sent', 'stage_changed', 
                    'note_added', 'call_made', 'email_sent') NOT NULL,
    description TEXT NOT NULL,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
);
```

---

## 🔄 How It Works

### Incoming WhatsApp Message Flow

1. **Customer sends message** → WhatsApp Cloud API
2. **Webhook triggered** → POST to `/api/webhook/whatsapp`
3. **Backend processes**:
   - Extract phone, name, message
   - Check if lead exists (by phone)
   - **New lead**: Create with stage "Incoming"
   - **Existing lead**: Update to stage "Contacted"
   - Save message to `lead_messages`
   - Add timeline entry
4. **Lead ready** in database for frontend to display

### Outgoing Message Flow

1. **Frontend calls** → POST `/api/whatsapp/send`
2. **Backend**:
   - Validates data
   - Calls WhatsApp Cloud API
   - Saves message to database
   - Updates lead's last_message
   - Adds timeline entry
3. **Customer receives** message on WhatsApp

---

## 🎯 Lead Stages

| Stage | Description | When Applied |
|-------|-------------|--------------|
| **New** | Manually created lead | Manual creation |
| **Incoming** | New WhatsApp message | First message received |
| **Contacted** | Lead replied | Existing lead messages again |
| **Qualified** | Meets criteria | Manual update |
| **Proposal** | Proposal sent | Manual update |
| **Negotiation** | In negotiation | Manual update |
| **Won** | Deal closed | Manual update |
| **Lost** | Deal lost | Manual update |

---

## 📁 Project Structure

```
leads-crm-backend/
├── src/
│   ├── config/
│   │   └── database.js           # Database connection
│   ├── controllers/
│   │   ├── authController.js     # Authentication logic
│   │   └── whatsappController.js # WhatsApp & leads logic
│   ├── middleware/
│   │   └── authMiddleware.js     # JWT verification
│   ├── models/
│   │   ├── User.js               # User model
│   │   └── Lead.js               # Lead model
│   ├── routes/
│   │   ├── index.js              # Route mounting
│   │   ├── authRoutes.js         # Auth routes
│   │   └── whatsappRoutes.js     # WhatsApp routes
│   └── services/
│       └── whatsappService.js    # WhatsApp API calls
├── database/
│   ├── schema.sql                # User tables
│   └── whatsapp_schema.sql       # Lead tables
├── server.js                     # Express server
├── test-whatsapp.js              # Config test
├── test-api.js                   # API test
├── send-test-message.js          # Message test
└── .env                          # Configuration
```

---

## 🐛 Troubleshooting

### Webhook Not Receiving Messages
- ✅ Check ngrok is running: `ngrok http 5000`
- ✅ Verify webhook URL in Meta dashboard
- ✅ Check `WHATSAPP_VERIFY_TOKEN` matches exactly
- ✅ Ensure subscribed to "messages" field
- ✅ Check server logs for errors

### "Invalid Access Token" Error
- ✅ Token expired (temporary tokens last 24h)
- ✅ Generate permanent token
- ✅ Check token has correct permissions
- ✅ Verify no extra spaces in `.env`

### Lead Not Created
- ✅ Check database connection
- ✅ Verify tables exist: `SHOW TABLES;`
- ✅ Check server logs for SQL errors
- ✅ Ensure phone format is correct (no + sign)

### Message Not Sending
- ✅ Verify `WHATSAPP_TOKEN` and `WHATSAPP_PHONE_ID`
- ✅ Check recipient number format
- ✅ Ensure recipient opted in (sent message first)
- ✅ Check Meta Business Manager for restrictions

### Database Connection Failed
- ✅ MySQL is running
- ✅ Credentials in `.env` are correct
- ✅ Database exists: `CREATE DATABASE crm_auth_db;`
- ✅ User has permissions

---

## 🔒 Security Best Practices

### Production Checklist
- [ ] Use permanent access tokens (not temporary)
- [ ] Enable webhook signature validation
- [ ] Use HTTPS (SSL certificate)
- [ ] Rotate JWT secrets regularly
- [ ] Use environment-specific configs
- [ ] Never commit `.env` file
- [ ] Implement rate limiting
- [ ] Add request logging
- [ ] Set up monitoring/alerts

### Webhook Signature Validation
```javascript
// Add to whatsappController.js
const signature = req.headers['x-hub-signature-256'];
const isValid = whatsappService.validateSignature(
    signature, 
    JSON.stringify(req.body)
);
if (!isValid) {
    return res.status(403).json({ error: 'Invalid signature' });
}
```

---

## 📊 Rate Limits

WhatsApp Cloud API limits:
- **Free tier**: 1,000 messages/day
- **Paid tier**: Unlimited (with approved business)
- **Rate limit**: 80 messages/second

---

## 🎉 Success Checklist

- [ ] Server starts without errors
- [ ] Database connected successfully
- [ ] All tables created
- [ ] Webhook verified in Meta
- [ ] Test message received
- [ ] Lead created in database
- [ ] Can send message via API
- [ ] Timeline tracking works
- [ ] Frontend can connect

---

## 📚 Additional Resources

- [WhatsApp Cloud API Docs](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Webhook Setup Guide](https://developers.facebook.com/docs/whatsapp/cloud-api/guides/set-up-webhooks)
- [Message Templates](https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-message-templates)
- [Rate Limits](https://developers.facebook.com/docs/whatsapp/cloud-api/overview#throughput)

---

## 🚀 Next Steps

1. Configure WhatsApp webhook
2. Test with real messages
3. Connect frontend
4. Add message templates
5. Implement rich media support
6. Add chatbot logic
7. Set up monitoring

---

**Need help?** Check the console logs - they're detailed and will guide you! 🎯
