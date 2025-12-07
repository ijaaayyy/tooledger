import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const {
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_USER,
  EMAIL_PASS,
  EMAIL_FROM,
} = process.env;

if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASS || !EMAIL_FROM) {
  throw new Error("Email configuration missing in .env");
}

const portNum = Number(EMAIL_PORT) || 465;
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: portNum,
  secure: portNum === 465,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

transporter
  .verify()
  .then(() => {
    console.log("Mailer ready: SMTP verified");
  })
  .catch((err) => {
    console.error("Mailer verify failed:", err);
  });

export async function sendMail(
  to: string,
  subject: string,
  text: string,
  html?: string
) {
  const mailOptions: any = {
    from: EMAIL_FROM,
    to,
    subject,
    text,
    html,
    priority: "high",
    headers: {
      "X-Priority": "1 (Highest)",
      "X-MSMail-Priority": "High",
      Importance: "High",
    },
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId, "to:", to);
    return info;
  } catch (err) {
    console.error("sendMail error:", err);
    throw err;
  }
}

function formatDate(d?: Date | string | null) {
  if (!d) return "N/A";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return String(d);
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* Helpers to build message bodies for "approve" and "return" */

export function approveEmailBody(params: {
  recipientName: string;
  toolName: string;
  requestId?: string | number;
  approveUrl?: string;
  notes?: string;
  pickupLocation?: string;
  pickupWindow?: string;
  borrowDate?: Date | string;
  expectedReturnDate?: Date | string;
}) {
  const {
    recipientName,
    toolName,
    requestId,
    approveUrl,
    notes,
    pickupLocation,
    pickupWindow,
    borrowDate,
    expectedReturnDate,
  } = params;
  const subject = `Tool Request Approved — ${toolName}`;
  const text =
    `Hello ${recipientName},\n\n` +
    `Good news — your request for "${toolName}" has been APPROVED.\n\n` +
    (borrowDate ? `Borrow date: ${formatDate(borrowDate)}\n` : "") +
    (expectedReturnDate ? `Expected return: ${formatDate(expectedReturnDate)}\n\n` : "\n") +
    (notes ? `Notes: ${notes}\n\n` : "") +
    (pickupLocation ? `Pickup location: ${pickupLocation}\n` : "") +
    (pickupWindow ? `Pickup window: ${pickupWindow}\n\n` : "") +
    (approveUrl ? `View details: ${approveUrl}\n\n` : "") +
    `Request ID: ${requestId ?? "N/A"}\n\n` +
    `Please bring a valid ID when picking up the tool. If you need to reschedule, reply to this email or contact the admin.\n\n` +
    `Thank you,\nToolLedger`;

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;color:#111;">
    <h2 style="margin:0 0 8px 0;color:#0b5cff">Tool Request Approved</h2>
    <p>Hello ${recipientName},</p>
    <p>Your request for <strong>${toolName}</strong> has been <strong style="color:#0b5cff">approved</strong>.</p>
    ${borrowDate ? `<p><strong>Borrow date:</strong> ${formatDate(borrowDate)}</p>` : ""}
    ${expectedReturnDate ? `<p><strong>Expected return:</strong> ${formatDate(expectedReturnDate)}</p>` : ""}
    ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ""}
    ${pickupLocation || pickupWindow ? `<p><strong>Pickup</strong><br/>${pickupLocation ? `Location: ${pickupLocation}<br/>` : ""}${pickupWindow ? `Window: ${pickupWindow}` : ""}</p>` : ""}
    ${approveUrl ? `<p style="margin:16px 0;"><a href="${approveUrl}" style="display:inline-block;padding:10px 16px;background:#0b5cff;color:#fff;text-decoration:none;border-radius:4px">View Request</a></p>` : ""}
    <p><small>Request ID: ${requestId ?? "N/A"}</small></p>
    <hr style="border:none;border-top:1px solid #eee"/>
    <p style="font-size:13px;color:#555">Please bring a valid ID when picking up the tool. Reply to this email for questions.</p>
    <p style="font-size:13px;color:#555">Thank you,<br/>ToolLedger</p>
  </div>`.trim();

  return { subject, text, html };
}

export function returnEmailBody(params: {
  recipientName: string;
  toolName: string;
  returnDate?: Date | string;
  instructions?: string;
  requestId?: string | number;
}) {
  const { recipientName, toolName, returnDate, instructions, requestId } = params;
  const subject = `Tool Return Reminder — ${toolName}`;
  const text =
    `Hello ${recipientName},\n\n` +
    `This is a reminder to return the tool: "${toolName}".\n\n` +
    (returnDate ? `Planned return date: ${formatDate(returnDate)}\n\n` : "") +
    (instructions ? `Return instructions: ${instructions}\n\n` : "") +
    `Request ID: ${requestId ?? "N/A"}\n\n` +
    `If you have already returned the tool, please ignore this message. Otherwise, please follow the instructions above.\n\n` +
    `Thank you,\nToolLedger`;

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;color:#111;">
    <h2 style="margin:0 0 8px 0;color:#d9534f">Tool Return Reminder</h2>
    <p>Hello ${recipientName},</p>
    <p>This is a reminder to return <strong>${toolName}</strong>.</p>
    ${returnDate ? `<p><strong>Return by:</strong> ${formatDate(returnDate)}</p>` : ""}
    ${instructions ? `<p><strong>Instructions:</strong> ${instructions}</p>` : ""}
    <p><small>Request ID: ${requestId ?? "N/A"}</small></p>
    <hr style="border:none;border-top:1px solid #eee"/>
    <p style="font-size:13px;color:#555">If you already returned the tool, please ignore this message. Reply to this email if you need assistance.</p>
    <p style="font-size:13px;color:#555">Thank you,<br/>ToolLedger</p>
  </div>`.trim();

  return { subject, text, html };
}

/**
 * Convenience wrappers used by routes.ts
 */
export async function sendApprovalEmail(options: {
  to: string;
  studentName: string;
  itemName: string;
  borrowDate?: Date | string;
  expectedReturnDate?: Date | string;
  pickupLocation?: string;
  pickupWindow?: string;
  requestId?: string | number;
  approveUrl?: string;
  notes?: string;
}) {
  const { to, studentName, itemName, borrowDate, expectedReturnDate, pickupLocation, pickupWindow, requestId, approveUrl, notes } = options;
  const { subject, text, html } = approveEmailBody({
    recipientName: studentName,
    toolName: itemName,
    requestId,
    approveUrl,
    notes,
    pickupLocation,
    pickupWindow,
    borrowDate,
    expectedReturnDate,
  });
  return sendMail(to, subject, text, html);
}

export async function sendReturnEmail(options: {
  to: string;
  studentName: string;
  itemName: string;
  borrowDate?: Date | string;
  returnDate?: Date | string;
  instructions?: string;
  requestId?: string | number;
}) {
  const { to, studentName, itemName, borrowDate, returnDate, instructions, requestId } = options;
  const { subject, text, html } = returnEmailBody({
    recipientName: studentName,
    toolName: itemName,
    returnDate,
    instructions,
    requestId,
  });
  return sendMail(to, subject, text, html);
}
