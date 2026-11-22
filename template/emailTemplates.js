/**
 * Generates the HTML structure for the Fixify welcome email.
 * @param {string} name - The user's name.
 * @returns {string} - The complete HTML template.
 */
const getWelcomeTemplate = (name) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Fixify</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f9; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
        .email-container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
        .header { background-color: #2563eb; padding: 30px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 0.5px; }
        .content { padding: 40px 30px; color: #334155; line-height: 1.6; }
        .content h2 { color: #1e293b; margin-top: 0; font-size: 22px; }
        .btn-container { text-align: center; margin: 30px 0; }
        .btn { background-color: #2563eb; color: #ffffff !important; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: 600; display: inline-block; }
        .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="email-container">
        <!-- Header -->
        <div class="header">
          <h1>Fixify</h1>
        </div>
        
        <!-- Content -->
        <div class="content">
          <h2>Hello ${name},</h2>
          <p>Welcome to <strong>Fixify</strong>! We're absolutely thrilled to have you join our community.</p>
          <p>Whether you're looking to track issues, manage tasks smoothly, or fix bugs faster, Fixify provides all the tools you need to stay organised and productive.</p>
          
          <div class="btn-container">
            <a href="https://fixify.com" class="btn" target="_blank">Go to Your Dashboard</a>
          </div>
          
          <p>If you have any questions or need a helping hand getting started, simply reply to this email. Our support team is always ready to assist.</p>
          <p>Cheers,<br>The Fixify Team</p>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          &copy; ${new Date().getFullYear()} Fixify. All rights reserved.<br>
          You are receiving this email because you signed up for Fixify.
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = getWelcomeTemplate;
