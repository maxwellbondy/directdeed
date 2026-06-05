export default function LegalTab({ section = "privacy" }) {
  const today = "May 5, 2026";

  const privacy = (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px", lineHeight: 1.8, color: "#444", fontSize: 15 }}>
      <h1 style={{ fontSize: 38, fontWeight: 400, marginBottom: 8, color: "#1a1208" }}>Privacy Policy</h1>
      <p style={{ color: "#888", fontSize: 13, marginBottom: 40 }}>Last updated: {today}</p>
      <p style={{ marginBottom: 24 }}>This Privacy Policy describes how Bondy Technologies LLC collects, uses, and shares information about you when you use DirectDeed.</p>
      <h2 style={{ fontSize: 22, fontWeight: 500, marginBottom: 12, marginTop: 36, color: "#1a1208" }}>1. Information We Collect</h2>
      <p style={{ marginBottom: 12 }}><strong>Account information:</strong> When you create an account, we collect your name, email address, and password (stored securely and never in plain text).</p>
      <p style={{ marginBottom: 12 }}><strong>Listing information:</strong> When you post a property, we collect the address, price, photos, and contact information you provide.</p>
      <p style={{ marginBottom: 12 }}><strong>Messages:</strong> We store messages sent between buyers and sellers through the platform.</p>
      <p style={{ marginBottom: 24 }}><strong>Usage data:</strong> We may collect information about how you use the Service.</p>
      <h2 style={{ fontSize: 22, fontWeight: 500, marginBottom: 12, marginTop: 36, color: "#1a1208" }}>2. How We Use Your Information</h2>
      <ul style={{ paddingLeft: 24, marginBottom: 24 }}>
        <li style={{ marginBottom: 8 }}>Provide, operate, and improve the Service</li>
        <li style={{ marginBottom: 8 }}>Enable communication between buyers and sellers</li>
        <li style={{ marginBottom: 8 }}>Display your property listings to other users</li>
        <li style={{ marginBottom: 8 }}>Send you account-related emails</li>
        <li style={{ marginBottom: 8 }}>Respond to your questions or support requests</li>
      </ul>
      <p style={{ marginBottom: 24 }}>We do not sell your personal information to third parties.</p>
      <h2 style={{ fontSize: 22, fontWeight: 500, marginBottom: 12, marginTop: 36, color: "#1a1208" }}>3. How We Share Your Information</h2>
      <p style={{ marginBottom: 24 }}>Information in a public listing is visible to all users. We use Supabase (SOC 2 compliant) to store your data. We do not share private information with third parties except as required by law.</p>
      <h2 style={{ fontSize: 22, fontWeight: 500, marginBottom: 12, marginTop: 36, color: "#1a1208" }}>4. Data Retention</h2>
      <p style={{ marginBottom: 24 }}>We retain your data while your account is active. You may delete listings from your Profile page. To delete your account, contact us.</p>
      <h2 style={{ fontSize: 22, fontWeight: 500, marginBottom: 12, marginTop: 36, color: "#1a1208" }}>5. Security</h2>
      <p style={{ marginBottom: 24 }}>We use encrypted passwords, HTTPS, and row-level database security. No method of internet transmission is 100% secure.</p>
      <h2 style={{ fontSize: 22, fontWeight: 500, marginBottom: 12, marginTop: 36, color: "#1a1208" }}>6. Age Requirement</h2>
      <p style={{ marginBottom: 24 }}>This Service is intended for users 18 years of age or older. We do not knowingly collect information from anyone under 18.</p>
      <h2 style={{ fontSize: 22, fontWeight: 500, marginBottom: 12, marginTop: 36, color: "#1a1208" }}>7. Contact Us</h2>
      <p>Bondy Technologies LLC - Michigan, United States<br />maxbondy@hotmail.com</p>
    </div>
  );

  const terms = (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px", lineHeight: 1.8, color: "#444", fontSize: 15 }}>
      <h1 style={{ fontSize: 38, fontWeight: 400, marginBottom: 8, color: "#1a1208" }}>Terms of Service</h1>
      <p style={{ color: "#888", fontSize: 13, marginBottom: 40 }}>Last updated: {today}</p>
      <p style={{ marginBottom: 24 }}>These Terms govern your use of DirectDeed, operated by Bondy Technologies LLC, a Michigan limited liability company. By using DirectDeed, you agree to these Terms.</p>
      <h2 style={{ fontSize: 22, fontWeight: 500, marginBottom: 12, marginTop: 36, color: "#1a1208" }}>1. Description of Service</h2>
      <p style={{ marginBottom: 24 }}>DirectDeed is a for-sale-by-owner (FSBO) real estate platform. <strong>DirectDeed is not a licensed real estate brokerage and does not provide brokerage services.</strong> We do not represent buyers or sellers in any transaction.</p>
      <h2 style={{ fontSize: 22, fontWeight: 500, marginBottom: 12, marginTop: 36, color: "#1a1208" }}>2. Not Legal or Real Estate Advice</h2>
      <p style={{ marginBottom: 24 }}>All documents, contracts, valuations, and AI-generated content are for informational purposes only and do not constitute legal, financial, or real estate advice. Always consult a licensed attorney before entering any real estate transaction. Bondy Technologies LLC is not responsible for losses arising from reliance on content generated by the Service.</p>
      <h2 style={{ fontSize: 22, fontWeight: 500, marginBottom: 12, marginTop: 36, color: "#1a1208" }}>3. User Accounts</h2>
      <p style={{ marginBottom: 24 }}>You must be at least 18 years old to use the Service and must have the legal right to list any property you post. You are responsible for all activity under your account.</p>
      <h2 style={{ fontSize: 22, fontWeight: 500, marginBottom: 12, marginTop: 36, color: "#1a1208" }}>4. Listing Rules</h2>
      <ul style={{ paddingLeft: 24, marginBottom: 24 }}>
        <li style={{ marginBottom: 8 }}>You must own the property or be authorized to list it</li>
        <li style={{ marginBottom: 8 }}>All listing information must be accurate and not misleading</li>
        <li style={{ marginBottom: 8 }}>Listings must comply with all applicable fair housing laws</li>
        <li style={{ marginBottom: 8 }}>You may not discriminate against any protected class</li>
      </ul>
      <h2 style={{ fontSize: 22, fontWeight: 500, marginBottom: 12, marginTop: 36, color: "#1a1208" }}>5. AI-Generated Content</h2>
      <p style={{ marginBottom: 24 }}>AI-generated valuations are estimates only. AI-generated contracts are drafts and have not been reviewed by an attorney. You use this content entirely at your own risk.</p>
      <h2 style={{ fontSize: 22, fontWeight: 500, marginBottom: 12, marginTop: 36, color: "#1a1208" }}>6. Limitation of Liability</h2>
      <p style={{ marginBottom: 24 }}>To the fullest extent permitted by Michigan law, Bondy Technologies LLC shall not be liable for any indirect, incidental, or consequential damages. Our total liability shall not exceed $100.</p>
      <h2 style={{ fontSize: 22, fontWeight: 500, marginBottom: 12, marginTop: 36, color: "#1a1208" }}>7. Governing Law</h2>
      <p style={{ marginBottom: 24 }}>These Terms are governed by the laws of the State of Michigan. Disputes shall be resolved in Michigan courts.</p>
      <h2 style={{ fontSize: 22, fontWeight: 500, marginBottom: 12, marginTop: 36, color: "#1a1208" }}>8. Contact</h2>
      <p>Bondy Technologies LLC - Michigan, United States<br />maxbondy@hotmail.com</p>
    </div>
  );

  return (
    <div style={{ background: "var(--cream)", minHeight: "60vh" }}>
      {section === "privacy" ? privacy : terms}
    </div>
  );
}
