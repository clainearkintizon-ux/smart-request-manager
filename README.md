# Smart Request Manager

AI-powered request management system with real-time tracking and email notifications.

## Features

- 🏠 **Landing Page** - Professional home page with features showcase
- 🔐 **Login/Register** - Create admin or user accounts
- 📊 **Admin Dashboard** - View all requests from all users
- 👤 **User Dashboard** - Submit and track personal requests
- 🤖 **AI Auto-Categorization** - Automatic request categorization
- 📧 **Email Notifications** - Send emails when requests are completed
- 📢 **Broadcast Emails** - Send emails to all users
- 🔍 **Track Requests** - Track any request by ID
- 📈 **Analytics** - View categorization and status charts

## Demo Accounts

- **Admin**: username: `admin`, password: `admin`
- **User**: username: `user`, password: `user`

## Installation

1. Download all files
2. Open `index.html` in your browser
3. No server required - runs completely in browser

## Email Setup (Optional)

1. Create free account at [EmailJS](https://www.emailjs.com)
2. Create email service (Gmail, Outlook, etc.)
3. Create email template with variables:
   - `{{to_email}}` - Recipient email
   - `{{to_name}}` - User name
   - `{{subject}}` - Email subject
   - `{{message}}` - Email message
   - `{{request_id}}` - Request ID
   - `{{request_title}}` - Request title
   - `{{request_status}}` - Status
   - `{{admin_note}}` - Admin notes

4. In the app:
   - Login as admin
   - Click "⚙️ Email Setup"
   - Enter Service ID, Template ID, and Public Key
   - Save configuration

## Usage

### For Users:
1. Register an account (select "User" role)
2. Login with your credentials
3. Click "Submit Request"
4. Fill in request details
5. View your requests in "My Requests"

### For Admins:
1. Login with admin account
2. View all requests from all users
3. Update request status
4. View analytics
5. Send broadcast emails to all users

## Technologies

- HTML5
- CSS3
- JavaScript (Vanilla)
- EmailJS for email notifications
- LocalStorage for data persistence

## File Structure

```
smart-request-manager/
├── index.html      # Main HTML file
├── style.css       # Styling
├── script.js       # JavaScript logic
└── README.md       # Documentation
```

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## License

MIT License - Free to use and modify

## Support

For issues or questions, please open an issue on GitHub.
