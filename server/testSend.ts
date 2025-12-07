import { sendMail, approveEmailBody } from './mailer.ts';

(async () => {
  try {
    const { subject, text, html } = approveEmailBody({
      recipientName: 'Test',
      toolName: 'Drill',
      requestId: 'TST-1',
      notes: 'Test send',
    });
    await sendMail('zandrewijy.tinio@hcdc.edu.ph', subject, text, html);
    console.log('Test email attempted');
  } catch (e) {
    console.error('Test send failed:', e);
  }
})();