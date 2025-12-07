"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMail = sendMail;
exports.approveEmailBody = approveEmailBody;
exports.returnEmailBody = returnEmailBody;
var nodemailer_1 = require("nodemailer");
var dotenv_1 = require("dotenv");
dotenv_1.default.config();
var _a = process.env, EMAIL_HOST = _a.EMAIL_HOST, EMAIL_PORT = _a.EMAIL_PORT, EMAIL_USER = _a.EMAIL_USER, EMAIL_PASS = _a.EMAIL_PASS, EMAIL_FROM = _a.EMAIL_FROM;
if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASS || !EMAIL_FROM) {
    throw new Error('Email configuration missing in .env');
}
var portNum = Number(EMAIL_PORT) || 465;
var transporter = nodemailer_1.default.createTransport({
    host: EMAIL_HOST,
    port: portNum,
    secure: portNum === 465, // true for 465
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
    },
});
transporter.verify().then(function () {
    console.log('Mailer ready: SMTP verified');
}).catch(function (err) {
    console.error('Mailer verify failed:', err);
});
function sendMail(to, subject, text, html) {
    return __awaiter(this, void 0, void 0, function () {
        var info, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, transporter.sendMail({
                            from: EMAIL_FROM,
                            to: to,
                            subject: subject,
                            text: text,
                            html: html,
                        })];
                case 1:
                    info = _a.sent();
                    console.log('Email sent:', info.messageId);
                    return [2 /*return*/, info];
                case 2:
                    err_1 = _a.sent();
                    console.error('sendMail error:', err_1);
                    throw err_1;
                case 3: return [2 /*return*/];
            }
        });
    });
}
/* Helpers to build message bodies for "approve" and "return" */
function approveEmailBody(params) {
    var recipientName = params.recipientName, toolName = params.toolName, requestId = params.requestId, approveUrl = params.approveUrl, notes = params.notes;
    var subject = "Tool Request Approved: ".concat(toolName);
    var text = "Hello ".concat(recipientName, ",\n\nYour request for \"").concat(toolName, "\" has been approved.\n").concat(notes ? "Notes: ".concat(notes, "\n\n") : '', "\n").concat(approveUrl ? "You can view or confirm here: ".concat(approveUrl, "\n\n") : '', "\nRequest ID: ").concat(requestId !== null && requestId !== void 0 ? requestId : 'N/A', "\n\nPlease pick up the tool at the scheduled time or contact the admin for changes.\n\nThank you,\nToolLedger");
    var html = "<p>Hello ".concat(recipientName, ",</p>\n<p>Your request for \"<strong>").concat(toolName, "</strong>\" has been <strong>approved</strong>.</p>\n").concat(notes ? "<p><strong>Notes:</strong> ".concat(notes, "</p>") : '', "\n").concat(approveUrl ? "<p><a href=\"".concat(approveUrl, "\">Click here to view/confirm your request</a></p>") : '', "\n<p>Request ID: ").concat(requestId !== null && requestId !== void 0 ? requestId : 'N/A', "</p>\n<p>Please pick up the tool at the scheduled time or contact the admin for changes.</p>\n<p>Thank you,<br/>ToolLedger</p>");
    return { subject: subject, text: text, html: html };
}
function returnEmailBody(params) {
    var recipientName = params.recipientName, toolName = params.toolName, returnDate = params.returnDate, instructions = params.instructions, requestId = params.requestId;
    var subject = "Tool Return: ".concat(toolName);
    var text = "Hello ".concat(recipientName, ",\n\nThis is a reminder regarding the return of \"").concat(toolName, "\".\n").concat(returnDate ? "Planned return date: ".concat(returnDate, "\n\n") : '', "\n").concat(instructions ? "Instructions: ".concat(instructions, "\n\n") : '', "\nRequest ID: ").concat(requestId !== null && requestId !== void 0 ? requestId : 'N/A', "\n\nIf you have already returned the tool, please ignore this message. Otherwise, please follow the instructions above.\n\nThank you,\nToolLedger");
    var html = "<p>Hello ".concat(recipientName, ",</p>\n<p>This is a reminder regarding the return of \"<strong>").concat(toolName, "</strong>\".</p>\n").concat(returnDate ? "<p><strong>Planned return date:</strong> ".concat(returnDate, "</p>") : '', "\n").concat(instructions ? "<p><strong>Instructions:</strong> ".concat(instructions, "</p>") : '', "\n<p>Request ID: ").concat(requestId !== null && requestId !== void 0 ? requestId : 'N/A', "</p>\n<p>If you have already returned the tool, please ignore this message. Otherwise, please follow the instructions above.</p>\n<p>Thank you,<br/>ToolLedger</p>");
    return { subject: subject, text: text, html: html };
}
