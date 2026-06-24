const Y = '#F5C000', YD = '#B8900A', BK = '#1C1C1E'

const LEGAL = {
  privacy: {
    title: 'Privacy Policy',
    icon: '🔒',
    lastUpdated: 'January 2025',
    sections: [
      {
        heading: '1. Information We Collect',
        body: `We collect information you provide directly:\n• Mobile number and/or email address for authentication\n• Name and profile photo (optional)\n• City and address for service delivery\n• Booking history and service preferences\n• Device information and approximate location (GPS, with permission)\n• UPI transaction metadata (not your bank credentials)\n\nWe do NOT collect passwords, bank account numbers, or card details.`
      },
      {
        heading: '2. How We Use Your Information',
        body: `• Connect you with verified local workers\n• Send booking confirmations, OTPs, and notifications\n• Resolve disputes and provide customer support\n• Improve platform quality and safety\n• Send service updates and promotional offers (opt-out available)\n\nWe never sell your personal data to third parties.`
      },
      {
        heading: '3. Data Sharing',
        body: `We share limited data only as necessary:\n• Worker receives your name, area, and contact number after booking\n• Payment processor (UPI) receives transaction amount\n• Supabase (our database provider) stores your data securely\n• Sentry (error tracking) receives anonymised crash reports\n\nAll third parties are bound by data processing agreements.`
      },
      {
        heading: '4. Data Storage & Security',
        body: `• All data is stored on encrypted servers in India\n• Aadhaar documents (worker KYC) are stored in private, access-controlled storage\n• We use row-level security to ensure users can only access their own data\n• Sessions expire automatically for security\n• We follow ISO 27001-aligned security practices`
      },
      {
        heading: '5. Your Rights',
        body: `You have the right to:\n• Access your personal data at any time\n• Correct inaccurate information in your profile\n• Delete your account and all associated data\n• Opt out of marketing communications\n• Request a copy of your data\n\nContact support@kaamready.in to exercise any of these rights.`
      },
      {
        heading: '6. Cookies & Tracking',
        body: `We use minimal cookies for session management and security. We do not use advertising trackers or sell data to ad networks. Our app uses local storage for offline preferences only.`
      },
      {
        heading: '7. Children\'s Privacy',
        body: `Kaam Ready is not intended for users under 18. We do not knowingly collect data from minors. If you believe a minor has created an account, contact us immediately.`
      },
      {
        heading: '8. Contact Us',
        body: `Privacy Officer: Kaam Ready Technologies\nEmail: privacy@kaamready.in\nAddress: Bengaluru, Karnataka 560001\nPhone: 1800-KR-HELP`
      },
    ]
  },
  terms: {
    title: 'Terms & Conditions',
    icon: '📜',
    lastUpdated: 'January 2025',
    sections: [
      {
        heading: '1. Acceptance of Terms',
        body: `By using the Kaam Ready platform (app, website, or services), you agree to these Terms & Conditions. If you do not agree, please do not use our platform. These terms constitute a legally binding agreement.`
      },
      {
        heading: '2. Services Provided',
        body: `Kaam Ready is a marketplace platform that connects customers with independent skilled workers. We do not employ workers directly. Workers are independent contractors.\n\nWe facilitate:\n• Booking and worker matching\n• Payment tracking\n• Dispute resolution\n• Trust and safety features`
      },
      {
        heading: '3. Customer Responsibilities',
        body: `As a customer, you agree to:\n• Provide accurate location and service description\n• Be present (or have a representative) when the worker arrives\n• Pay the agreed amount via UPI after job completion\n• Treat workers respectfully and professionally\n• Not share login credentials with others\n• Report genuine issues only — false reports are grounds for account suspension`
      },
      {
        heading: '4. Payments',
        body: `• All payments are UPI-only. Cash payments are not supported.\n• Price is set by the worker after assessing the job. Customer must approve before paying.\n• Minimum prices apply per service category.\n• The platform earns a 10% commission from the worker — not from the customer.\n• Receipts are available in the app booking history.`
      },
      {
        heading: '5. Cancellations',
        body: `• Free cancellation before a worker accepts your request.\n• After acceptance: a ₹50–₹150 cancellation fee applies to compensate the worker.\n• No-show after booking: full cancellation fee + booking blocked for 24 hours.\n• Workers who cancel without valid reason are penalised.`
      },
      {
        heading: '6. Liability Limitations',
        body: `Kaam Ready is a marketplace and cannot guarantee the quality of every service. We are not liable for:\n• Property damage caused by workers (workers carry personal liability)\n• Delays due to worker unavailability\n• Losses from false information provided by either party\n\nWe strongly recommend reporting issues immediately via the app.`
      },
      {
        heading: '7. Account Suspension',
        body: `We may suspend or terminate accounts that:\n• Provide false information\n• Abuse workers or platform staff\n• Attempt fraudulent payments\n• Submit false dispute reports\n• Violate any of these terms`
      },
      {
        heading: '8. Governing Law',
        body: `These terms are governed by the laws of India. Disputes shall be subject to the exclusive jurisdiction of courts in Bengaluru, Karnataka.`
      },
    ]
  },
  refund: {
    title: 'Refund Policy',
    icon: '💸',
    lastUpdated: 'January 2025',
    sections: [
      {
        heading: 'Refund Eligibility',
        body: `You may be eligible for a refund in the following cases:\n• Payment was made but no worker was ever assigned\n• Worker did not arrive after confirmed assignment\n• Service was not completed as described\n• Duplicate payment was charged\n• Technical error in payment processing`
      },
      {
        heading: 'Non-Refundable Situations',
        body: `Refunds are NOT issued for:\n• Work completed to agreed specification (even if you change your mind)\n• Cancellations after job completion\n• Disputes raised more than 7 days after job completion\n• Issues caused by customer-provided incorrect information`
      },
      {
        heading: 'Refund Process',
        body: `1. Raise a dispute via the app (Bookings → Report Problem)\n2. Our team reviews within 24–48 hours\n3. If eligible, refund is initiated to your UPI account\n4. Refund credit time: 3–7 business days (depends on your bank)\n\nFor urgent issues, call 1800-KR-HELP.`
      },
      {
        heading: 'Refund Amounts',
        body: `• Full refund: No worker assigned, technical failure, duplicate charge\n• Partial refund: Service started but not completed (case-by-case)\n• No refund: Service completed, customer changed mind\n\nAll refund decisions by Kaam Ready are final.`
      },
    ]
  },
  cancel: {
    title: 'Cancellation Policy',
    icon: '❌',
    lastUpdated: 'January 2025',
    sections: [
      {
        heading: 'Customer Cancellation',
        body: `Before Worker Accepts:\n• Cancel anytime, completely free. No charges.\n\nAfter Worker Accepts (within 10 min):\n• ₹50 cancellation fee applies\n\nAfter Worker Accepts (10–30 min):\n• ₹100 cancellation fee applies\n\nAfter Worker Departs (30+ min or en route):\n• ₹150 cancellation fee or service minimum (whichever is higher)\n\nRepeat cancellations (3+ in 30 days): Account review initiated.`
      },
      {
        heading: 'Worker Cancellation',
        body: `Workers who cancel accepted jobs:\n• First cancellation: Warning\n• Second cancellation in 7 days: 24-hour online ban\n• Third cancellation in 7 days: 7-day suspension\n• Cancellations with fraudulent reasons: Permanent ban\n\nWorkers must accept at least 70% of jobs offered to maintain active status.`
      },
      {
        heading: 'Auto-Cancellation',
        body: `Bookings are automatically cancelled if:\n• No worker accepts within 3 minutes (off-peak hours)\n• No worker accepts within 5 minutes (peak hours)\n• Customer does not respond within 10 minutes of worker assignment\n\nAuto-cancelled bookings are always free for the customer.`
      },
      {
        heading: 'Rescheduling',
        body: `Instead of cancelling, you can reschedule up to 2 hours before a scheduled booking:\n• Open the booking in the app\n• Tap "Reschedule"\n• Select new date and time\n\nRescheduling is free and unlimited for scheduled bookings.`
      },
    ]
  },
  contact: {
    title: 'Contact & Grievance Officer',
    icon: '📨',
    lastUpdated: 'June 2025',
    sections: [
      {
        heading: 'Grievance Officer',
        body: `In accordance with the Information Technology Act, 2000 and the rules made thereunder, and the Digital Personal Data Protection Act, 2023, the Grievance Officer details are below:\n\nName: Grievance Officer, Kaam Ready Technologies\nEmail: grievance@kaamready.in\nPhone: 6362869636\nAddress: Bengaluru, Karnataka 560001\n\nWe acknowledge complaints within 24 hours and aim to resolve them within 15 days.`
      },
      {
        heading: 'Customer Support',
        body: `For general help, bookings, refunds or payment issues:\n\nEmail: support@kaamready.in\nPhone: 6362869636\nHours: Mon–Sun, 8 AM – 10 PM\n\nYou can also raise a ticket from Help & Support in the app.`
      },
      {
        heading: 'Data Protection Requests',
        body: `To access, correct, or delete your personal data, or to withdraw consent, email privacy@kaamready.in or use "Delete My Account" in your Profile. We process verified requests within statutory timelines.`
      },
    ]
  },
  about: {
    title: 'About Us',
    icon: '⚡',
    lastUpdated: 'June 2025',
    sections: [
      {
        heading: 'Who We Are',
        body: `Kaam Ready is a home-services marketplace that connects customers across Karnataka with verified, skilled local workers — electricians, plumbers, cleaners, carpenters, painters, and more. We make it simple to find trusted help, fast.`
      },
      {
        heading: 'Our Mission',
        body: `To give every household quick access to reliable skilled workers, and to give hardworking professionals a fair, dignified way to earn — with transparent pricing and no middlemen taking unfair cuts.`
      },
      {
        heading: 'How It Works',
        body: `Pick your city, choose a service, and book in seconds. A verified worker accepts your request, completes the job, and you pay securely via UPI — no cash, full record. Every worker is KYC-verified before they can take jobs.`
      },
      {
        heading: 'Why Kaam Ready',
        body: `• Aadhaar-verified, rated workers\n• Transparent pricing set after the job\n• Secure UPI payments with dispute support\n• Workers keep the majority of every payment\n• Local teams across 15 Karnataka cities`
      },
      {
        heading: 'Contact',
        body: `Kaam Ready Technologies\nBengaluru, Karnataka, India\nEmail: support@kaamready.in\nPhone: 6362869636`
      },
    ]
  },
}

export default function LegalScreen({ section = 'privacy', onBack }) {
  const content = LEGAL[section] || LEGAL.privacy

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: '#F2F2F7', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: BK, padding: '48px 20px 24px', flexShrink: 0 }}>
        <button onClick={onBack}
          style={{ background: 'rgba(255,255,255,.1)', border: 'none', borderRadius: 10, padding: '6px 14px', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
          ← Back
        </button>
        <div style={{ fontSize: 36, marginBottom: 8 }}>{content.icon}</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: Y, marginBottom: 4 }}>{content.title}</h1>
        <p style={{ fontSize: 12, color: '#555' }}>Last updated: {content.lastUpdated}</p>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {content.sections.map((sec, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 16, padding: 18 }}>
            <h2 style={{ fontSize: 14, fontWeight: 800, color: BK, marginBottom: 10 }}>{sec.heading}</h2>
            <p style={{ fontSize: 13, color: '#444', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{sec.body}</p>
          </div>
        ))}

        {/* Contact footer */}
        <div style={{ background: Y + '33', border: '1.5px solid ' + Y, borderRadius: 14, padding: 16, textAlign: 'center' }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: BK, marginBottom: 4 }}>Questions about this policy?</p>
          <p style={{ fontSize: 12, color: '#555' }}>Email us at <strong>legal@kaamready.in</strong><br />or call 1800-KR-HELP</p>
        </div>

        <div style={{ height: 16 }} />
      </div>
    </div>
  )
}
