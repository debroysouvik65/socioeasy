const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
      port: 587,
      auth: { user: 'apikey', pass: process.env.SENDGRID_API_KEY }
    });
  }

  async sendWelcomeEmail(user) {
    await this.transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: 'Welcome to SocioEasy!',
      html: `<h1>Welcome ${user.name}!</h1><p>Your API key is ready to use.</p>`
    });
  }
}

module.exports = new EmailService();
