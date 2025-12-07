import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM } = process.env;
if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASS || !EMAIL_FROM) {
  throw new Error("Email configuration missing in .env");
}

const portNum = Number(EMAIL_PORT) || 465;
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: portNum,
  secure: portNum === 465,
  auth: { user: EMAIL_USER, pass: EMAIL_PASS },
});

transporter.verify()
  .then(() => console.log("Mailer ready: SMTP verified"))
  .catch((err) => console.error("Mailer verify failed:", err));

export async function sendMail(to: string, subject: string, text: string, html?: string) {
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

function fmtDate(d?: Date | string | null) {
  if (!d) return "N/A";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return String(d);
  return date.toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

/* Professional inline design tokens */
function T() {
  const primary = "#0b5cff";
  const bg = "#f5f7fb";
  const text = "#0f172a";
  const muted = "#6b7280";
  return {
    outer: `background:${bg};padding:28px 12px;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${text};-webkit-font-smoothing:antialiased;`,
    container: "max-width:640px;margin:0 auto;background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 10px 30px rgba(16,24,40,0.08);",
    header: `background:linear-gradient(90deg, ${primary} 0%, #0a4fe6 100%);padding:18px 20px;display:flex;align-items:center;gap:14px;color:#fff;`,
    logo: "width:44px;height:44px;border-radius:8px;background:#fff;color:" + primary + ";display:flex;align-items:center;justify-content:center;font-weight:700;font-size:16px;box-shadow:0 2px 6px rgba(2,6,23,0.06);",
    title: "margin:0;font-size:17px;font-weight:600;line-height:1",
    subtitle: "font-size:13px;opacity:0.95;margin-top:2px",
    pre: "display:none!important;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;",
    body: "padding:22px;color:" + text + ";font-size:15px;line-height:1.55",
    label: "color:#374151;width:140px;padding:8px 0;font-size:14px;font-weight:600",
    value: "color:" + text + ";padding:8px 0;font-size:14px",
    button: `display:inline-block;padding:10px 14px;background:${primary};color:#fff;border-radius:8px;text-decoration:none;font-weight:600`,
    footer: "padding:14px 20px;background:#fbfdff;color:" + muted + ";font-size:13px;text-align:center",
    badge: "display:inline-block;padding:6px 10px;background:rgba(255,255,255,0.18);color:#fff;border-radius:999px;font-size:13px;font-weight:700",
  };
}

/* Approve template */
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
  const s = T();
  const { recipientName, toolName, requestId, approveUrl, notes, pickupLocation, pickupWindow, borrowDate, expectedReturnDate } = params;

  const subject = `Tool Request Approved — ${toolName}`;
  const text =
    `Hello ${recipientName}\n\nYour request for "${toolName}" has been approved.\nReturn by: ${fmtDate(expectedReturnDate)}\nRequest ID: ${requestId ?? "N/A"}\n\nPlease bring a valid ID at pickup.\n\nToolLedger`;

  const html = `
  <div style="${s.outer}">
    <div style="${s.container}">
      <span style="${s.pre}">Your ToolLedger request has been approved. Details inside.</span>
      <div style="${s.header}">
        <div style="${s.logo}">TL</div>
        <div style="flex:1">
          <h1 style="${s.title}">ToolLedger</h1>
          <div style="${s.subtitle}">Request Approved</div>
        </div>
        <div style="${s.badge}">Important</div>
      </div>

      <div style="${s.body}">
        <p style="margin:0 0 12px 0">Hello <strong>${recipientName}</strong>,</p>

        <p style="margin:0 0 16px 0">Good news — your request for <strong>${toolName}</strong> has been <strong style="color:#0b5cff">approved</strong>.</p>

        <table role="presentation" style="width:100%;border-collapse:collapse;margin-top:6px">
          <tr>
            <td style="${s.label}">Borrow date</td>
            <td style="${s.value}">${borrowDate ? fmtDate(borrowDate) : "N/A"}</td>
          </tr>
          <tr>
            <td style="${s.label}">Return by</td>
            <td style="${s.value}">${expectedReturnDate ? fmtDate(expectedReturnDate) : "N/A"}</td>
          </tr>
          <tr>
            <td style="${s.label}">Pickup</td>
            <td style="${s.value}">${pickupLocation ?? "Main Office"}${pickupWindow ? " • " + pickupWindow : ""}</td>
          </tr>
        </table>

        ${notes ? `<p style="margin:16px 0 0 0"><strong>Notes:</strong> ${notes}</p>` : ""}

        ${approveUrl ? `<p style="margin:20px 0"><a href="${approveUrl}" style="${s.button}">View request</a></p>` : ""}

        <p style="margin-top:10px;color:#6b7280;font-size:13px">Request ID: ${requestId ?? "N/A"}</p>
      </div>

      <div style="${s.footer}">ToolLedger • Holy Cross of Davao College • Reply to this email for questions</div>
    </div>
  </div>`.trim();

  return { subject, text, html };
}

/* Return reminder */
export function returnEmailBody(params: {
  recipientName: string;
  toolName: string;
  returnDate?: Date | string;
  instructions?: string;
  requestId?: string | number;
}) {
  const s = T();
  const { recipientName, toolName, returnDate, instructions, requestId } = params;

  const subject = `Return Reminder — ${toolName}`;
  const text = `Reminder: please return "${toolName}"${returnDate ? ` by ${fmtDate(returnDate)}` : ""}. Request ID: ${requestId ?? "N/A"}`;

  const html = `
  <div style="${s.outer}">
    <div style="${s.container}">
      <div style="${s.header}">
        <div style="${s.logo}">TL</div>
        <div style="flex:1">
          <h1 style="${s.title}">Return Reminder</h1>
          <div style="${s.subtitle}">Please return the borrowed item</div>
        </div>
        <div style="${s.badge}">Important</div>
      </div>

      <div style="${s.body}">
        <p style="margin:0 0 12px 0">Hello <strong>${recipientName}</strong>,</p>
        <p style="margin:0 0 12px 0">This is a reminder to return <strong>${toolName}</strong> ${returnDate ? `by <strong>${fmtDate(returnDate)}</strong>` : ""}.</p>
        ${instructions ? `<p style="margin:8px 0"><strong>Instructions:</strong> ${instructions}</p>` : ""}
        <p style="margin-top:10px;color:#6b7280;font-size:13px">Request ID: ${requestId ?? "N/A"}</p>
      </div>

      <div style="${s.footer}">ToolLedger • Please contact admin for extensions</div>
    </div>
  </div>`.trim();

  return { subject, text, html };
}

/* Thank you */
export function thankYouEmailBody(params: {
  recipientName: string;
  toolName: string;
  requestId?: string | number;
}) {
  const s = T();
  const { recipientName, toolName, requestId } = params;

  const subject = `Thank you — ${toolName} returned`;
  const text = `Thank you for returning "${toolName}". Request ID: ${requestId ?? "N/A"}`;

  const html = `
  <div style="${s.outer}">
    <div style="${s.container}">
      <div style="${s.header}">
        <div style="${s.logo}">TL</div>
        <div style="flex:1">
          <h1 style="${s.title}">Thank you</h1>
          <div style="${s.subtitle}">We received the returned item</div>
        </div>
        <div style="${s.badge}">Important</div>
      </div>

      <div style="${s.body}">
        <p style="margin:0 0 12px 0">Hello <strong>${recipientName}</strong>,</p>
        <p style="margin:0 0 12px 0">Thank you for returning <strong>${toolName}</strong>. We appreciate you keeping our inventory healthy.</p>
        <p style="margin-top:10px;color:#6b7280;font-size:13px">Request ID: ${requestId ?? "N/A"}</p>
      </div>

      <div style="${s.footer}">ToolLedger • If you have feedback about the equipment, reply to this email</div>
    </div>
  </div>`.trim();

  return { subject, text, html };
}

/* Convenience wrappers (typed as any to avoid mismatches with DB shapes) */
export async function sendApprovalEmail(opts: any) {
  const { to, studentName, itemName, borrowDate, expectedReturnDate, pickupLocation, pickupWindow, requestId, approveUrl, notes } = opts;
  const { subject, text, html } = approveEmailBody({
    recipientName: studentName, toolName: itemName, borrowDate, expectedReturnDate, pickupLocation, pickupWindow, requestId, approveUrl, notes,
  });
  return sendMail(to, subject, text, html);
}

export async function sendReturnEmail(opts: any) {
  const { to, studentName, itemName, returnDate, instructions, requestId } = opts;
  const { subject, text, html } = returnEmailBody({ recipientName: studentName, toolName: itemName, returnDate, instructions, requestId });
  return sendMail(to, subject, text, html);
}

export async function sendThankYouEmail(opts: any) {
  const { to, studentName, itemName, requestId } = opts;
  const { subject, text, html } = thankYouEmailBody({ recipientName: studentName, toolName: itemName, requestId });
  return sendMail(to, subject, text, html);
}
