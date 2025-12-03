import React from "react";

export default function PrivacyPolicy() {
    return (
        <div>
            <div className="flex space-x-2 mb-4">
                <span className="inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold bg-[#23b0ff] text-[#0b0d13]">
                    Last updated: Oct 2025
                </span>
                <span className="inline-flex items-center rounded-full px-3 py-0.5 text-xs font-medium bg-white/10 text-white/90">
                    XPG Client Area
                </span>
            </div>
            <h1 className="text-xl font-extrabold mb-3 text-white">Privacy Policy</h1>
            <p className="mb-4 text-white/90">
                This policy describes how we collect, use, and protect information in connection with the XPG Client Area. The Client Area is intended for authorized business partners and contains marketing assets, demos, and related materials.
            </p>

            <div className="space-y-4">
                <section>
                    <h2 className="text-base font-bold text-white mb-1">Information We Collect</h2>
                    <p className="text-white/90">
                        Account data such as name, company, department, and business email. Usage data such as pages viewed, downloads, device, and approximate region. Operational logs for security and fraud prevention.
                    </p>
                </section>

                <section>
                    <h2 className="text-base font-bold text-white mb-1">How We Use Information</h2>
                    <p className="text-white/90">
                        To provide secure access, personalize content, deliver notices, improve performance, and comply with legal obligations. We may aggregate usage data to understand product adoption and content quality.
                    </p>
                </section>

                <section>
                    <h2 className="text-base font-bold text-white mb-1">Sharing</h2>
                    <p className="text-white/90">
                        We do not sell personal data. Limited sharing may occur with infrastructure providers, analytics, or anti-abuse services under contracts requiring confidentiality and appropriate safeguards.
                    </p>
                </section>

                <section>
                    <h2 className="text-base font-bold text-white mb-1">Security</h2>
                    <p className="text-white/90">
                        Access is authenticated and monitored. Data is transmitted over TLS and stored with role-based controls. Incidents are reviewed and mitigated according to internal procedures.
                    </p>
                </section>

                <section>
                    <h2 className="text-base font-bold text-white mb-1">Retention</h2>
                    <p className="text-white/90">
                        We retain account and audit records for as long as necessary to provide the service and meet legal and contractual requirements. You may request deletion subject to applicable obligations.
                    </p>
                </section>

                <section>
                    <h2 className="text-base font-bold text-white mb-1">Your Choices</h2>
                    <p className="text-white/90">
                        You can update profile details, opt out of marketing emails, and request access or deletion of your data by contacting your XPG representative.
                    </p>
                </section>

                <section>
                    <h2 className="text-base font-bold text-white mb-1">Contact</h2>
                    <p className="text-white/90">
                        For privacy inquiries, contact privacy@xpg.com.
                    </p>
                </section>
            </div>
        </div>
    );
}