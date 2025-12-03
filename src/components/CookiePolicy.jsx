import React from "react";

export default function CookiePolicy() {
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

            <h1 className="text-xl font-extrabold mb-3 text-white">Cookie Policy</h1>
            <p className="mb-4 text-white/90">
                We use cookies and similar technologies to operate the Client Area, remember preferences, analyze performance, and keep accounts secure. You can manage cookies in your browser settings. Disabling essential cookies may impact functionality.
            </p>

            <div className="border border-white/10 rounded-lg overflow-hidden mb-4">
                <table className="min-w-full divide-y divide-white/10 text-sm">
                    <thead className="bg-white/5">
                        <tr>
                            <th scope="col" className="px-4 py-3 text-left font-bold text-white">
                                Type
                            </th>
                            <th scope="col" className="px-4 py-3 text-left font-bold text-white">
                                Purpose
                            </th>
                            <th scope="col" className="px-4 py-3 text-left font-bold text-white">
                                Examples
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 bg-transparent text-white/80">
                        <tr>
                            <td className="px-4 py-3 whitespace-nowrap">Essential</td>
                            <td className="px-4 py-3">Authentication, session management, security</td>
                            <td className="px-4 py-3 whitespace-nowrap">auth_session, csrf_token</td>
                        </tr>
                        <tr>
                            <td className="px-4 py-3 whitespace-nowrap">Preferences</td>
                            <td className="px-4 py-3">Language, UI settings</td>
                            <td className="px-4 py-3 whitespace-nowrap">lang, theme_mode</td>
                        </tr>
                        <tr>
                            <td className="px-4 py-3 whitespace-nowrap">Analytics</td>
                            <td className="px-4 py-3">Usage metrics to improve performance and content</td>
                            <td className="px-4 py-3 whitespace-nowrap">analytics_id, perf_sample</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h2 className="text-base font-bold mt-4 text-white">Managing Cookies</h2>
            <p className="text-white/90">
                Most browsers allow you to block or delete cookies. You can also use built-in privacy modes or dedicated extensions to limit tracking.
            </p>
        </div>
    );
}