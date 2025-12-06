import nodemailer from 'nodemailer';

const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
const port = Number(process.env.EMAIL_PORT || 465);
const user = process.env.EMAIL_USER;
const pass = process.env.EMAIL_PASS;
// Default sender: use configured EMAIL_FROM, otherwise fall back to the site sender you requested
const from = process.env.EMAIL_FROM || user || 'zandrewijy.tinio@hcdc.edu.ph';

if (!user || !pass) {
  console.warn('EMAIL_USER or EMAIL_PASS not set — outgoing emails will be disabled');
}

function createTransport() {
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
  });
}

function formatDate(d: Date | string | undefined) {
  if (!d) return '';
  const dt = typeof d === 'string' ? new Date(d) : d;
  return dt.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

export async function sendApprovalEmail(opts: {
  to: string;
  studentName: string;
  itemName: string;
  borrowDate: Date | string;
  expectedReturnDate: Date | string;
}) {
  const transporter = createTransport();
  if (!transporter) {
    console.warn('Skipping sendApprovalEmail because transporter is not configured');
    return;
  }

  const subject = 'Borrowing Update – Request Approved';
  const html = `
    <p>Good day, ${opts.studentName}!</p>
    <p>Your borrowing request has been <strong>approved</strong>. Here are your details:</p>
    <ul>
      <li><strong>Item Name:</strong> ${opts.itemName}</li>
      <li><strong>Date & Time Borrowed:</strong> ${formatDate(opts.borrowDate)}</li>
      <li><strong>Return Schedule:</strong> ${formatDate(opts.expectedReturnDate)}</li>
    </ul>
    <p>Please handle the item responsibly and return it on time. Thank you!</p>
    <p>— ToolLedger System<br/>Holy Cross of Davao College</p>
  `;

  await transporter.sendMail({
    from: from || user,
    to: opts.to,
    subject,
    html,
  });
}

export async function sendReturnEmail(opts: {
  to: string;
  studentName: string;
  itemName: string;
  borrowDate: Date | string;
  returnDate: Date | string;
}) {
  const transporter = createTransport();
  if (!transporter) {
    console.warn('Skipping sendReturnEmail because transporter is not configured');
    return;
  }

  const subject = 'ToolLedger Return Confirmation – Thank You!';
  const html = `
    <p>Good day, ${opts.studentName}!</p>
    <p>Your return has been successfully recorded. Below are your transaction details:</p>
    <ul>
      <li><strong>Item Name:</strong> ${opts.itemName}</li>
      <li><strong>Date & Time Borrowed:</strong> ${formatDate(opts.borrowDate)}</li>
      <li><strong>Date & Time Returned:</strong> ${formatDate(opts.returnDate)}</li>
    </ul>
    <p>Thank you for returning the item on time. Have a great day ahead!</p>
    <p>— ToolLedger System<br/>Holy Cross of Davao College</p>
  `;

  await transporter.sendMail({
    from: from || user,
    to: opts.to,
    subject,
    html,
  });
}
