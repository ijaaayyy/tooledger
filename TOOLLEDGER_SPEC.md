ToolLedger
Equipment Borrowing Management System with Automated Notifications

1. Overview
The ToolLedger system is designed to streamline the borrowing and returning of equipment within an institution. It provides dedicated interfaces for both Students and Administrators, supports secure authentication, and automates communication through email notifications.

Tech Stack (Recommended):
- Frontend: Next.js
- Backend: Next.js API Routes / Node.js
- Database: XAMPP
- Authentication: NextAuth.js or JWT-based
- Styling: Tailwind CSS

2. Features

2.1 User Features (Students)
- Login using student email and password
- Borrowing Form submission
- On-screen request confirmation (“Request Sent Successfully”, “Awaiting Approval”)
- Email notifications for request approval, borrowing details, and return confirmation
- No visibility of approval/return status inside dashboard (email-only updates)

2.2 Admin Features
- Admin login using designated admin emails
- Manage equipment availability (inventory)
- Approve/decline borrow requests
- Record item returns
- View complete borrower records
- Access system reports
- Trigger automated notifications when updating request status

2.3 Common Features
- Clean, responsive interface
- Real-time updates (optional)
- Secure authentication
- Structured data validation
- Automated email notification system

3. UI / Screens

3.1 Student Screens
- Login Page
  - Email, Password
- Student Dashboard
  - Borrowing form
  - Submit request
  - Status confirmation messages
  - No internal tracking of approval/return; notifications sent via email

Notifications (Email-Based)
- Borrowing request approval
- Borrowing details (item, borrow date, return schedule)
- Return confirmation

3.2 Admin Screens
- Admin Dashboard
  - Overview of items, borrowers, pending requests
- Manage Tools/Inventory
  - Add, edit, adjust availability
- Borrow Requests Management
  - Approve/Reject requests
  - Mark item as returned

Reports
- View full borrower history
- Generate downloadable reports

4. Functionality

4.1 Student Functional Flow
- Login → Access student dashboard
- Fill Borrowing Form → Submit request
- Get on-screen confirmation
- Receive email updates
  - Request approval
  - Borrowing details
  - Return acknowledgment

4.2 Admin Functional Flow
- Login → Access admin dashboard
- Review pending requests
- Approve/Reject request
- Record return transactions
- System auto-sends email notifications

5. Automated Email Notification System

5.1 Email Triggers
Emails are automatically sent when:
- A borrow request is approved
- An item return is recorded
- An item is overdue (if implemented)

5.2 Email Contents
Each notification includes:
- Student name
- Item name
- Borrowed date/time
- Return schedule or return completion details

5.3 Email Examples

Borrow Request Approved
Subject: Borrowing Update – Request Approved

Good morning, [Student Name]!

Your borrowing request has been approved. Here are your details:
- Item Name: [Item Name]
- Date & Time Borrowed: [Borrow Date & Time]
- Return Schedule: [Return Date & Time]

Please handle the item responsibly and return it on time. Thank you!

— Borrowing System
Holy Cross of Davao College

Item Return Confirmation
Subject: ToolLedger Return Confirmation – Thank You!

Good morning, [Student Name]!

Your return has been successfully recorded. Below are your transaction details:
- Item Name: [Item Name]
- Date & Time Borrowed: [Borrow Date & Time]
- Date & Time Returned: [Return Date & Time]

Thank you for returning the item on time. Have a great day ahead!

— ToolLedger System
Holy Cross of Davao College
