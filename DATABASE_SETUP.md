# Database Setup Guide

This guide will help you set up the MySQL database for the CRM backend.

## Quick Setup

### Option 1: Using XAMPP (Recommended for Windows)

1. **Download and Install XAMPP**
   - Go to https://www.apachefriends.org/
   - Download XAMPP for Windows
   - Install and start the XAMPP Control Panel

2. **Start MySQL**
   - Open XAMPP Control Panel
   - Click "Start" next to MySQL
   - MySQL will run on port 3306 by default

3. **Update .env file**
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=fortune-crm
   DB_PORT=3306
   ```

4. **Setup Database**
   ```bash
   npm run setup-db
   ```

### Option 2: Using MySQL Server

1. **Install MySQL Server**
   - Download from https://dev.mysql.com/downloads/mysql/
   - Install with default settings
   - Remember the root password you set

2. **Update .env file**
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=fortune-crm
   DB_PORT=3306
   ```

3. **Setup Database**
   ```bash
   npm run setup-db
   ```

## Current Configuration

Your current .env file is configured for:
- Host: localhost
- Port: 3307 (non-standard)
- User: root
- Password: (empty)
- Database: fortune-crm

## Troubleshooting

### Error: Database connection failed

**Check if MySQL is running:**
```bash
# Windows (if using XAMPP)
# Open XAMPP Control Panel and start MySQL

# Or check if MySQL service is running
net start mysql
```

**Test connection manually:**
```bash
mysql -h localhost -P 3307 -u root -p
```

### Error: Access denied

1. **Check credentials in .env file**
2. **Reset MySQL root password if needed**
3. **Create a new MySQL user:**
   ```sql
   CREATE USER 'crm_user'@'localhost' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON fortune_crm.* TO 'crm_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

### Port 3307 vs 3306

If you're using port 3307, you might have:
- Multiple MySQL installations
- XAMPP configured for a different port
- MySQL running as a service on 3306

**To check what's running on port 3307:**
```bash
netstat -an | findstr 3307
```

## Migration Commands

Once database is set up:

```bash
# Check migration status
npm run migrate:status

# Run pending migrations
npm run migrate

# Create new migration
npm run create-migration "add_new_feature"

# Start server (runs migrations automatically)
npm start

# Start server without migrations
npm run start:force
```

## Database Schema

After migrations, you'll have these tables:
- `users` - User accounts
- `refresh_tokens` - JWT refresh tokens
- `leads` - Lead management
- `lead_messages` - WhatsApp messages
- `lead_timeline` - Lead activity timeline
- `tasks` - Task management
- `google_oauth_tokens` - Google OAuth credentials
- `meetings` - Calendar meetings
- `meeting_participants` - Meeting participants
- `schema_migrations` - Migration tracking

## Need Help?

1. **Check MySQL is running** on the correct port
2. **Verify .env credentials** match your MySQL setup
3. **Run setup-db** to create the database
4. **Check migration status** to see what's pending
5. **Start server** - migrations run automatically

For XAMPP users, the most common solution is changing DB_PORT to 3306 in your .env file.