"use client";

import { motion } from "framer-motion";
import { Settings, User, Bell, Shield, Building2 } from "lucide-react";

export default function SettingsPage() {
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-gray-900">Settings</h2>
                <p className="text-gray-500 mt-1">Manage your account and organization preferences.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                    { icon: User, title: "Profile", desc: "Name, email, and contact details" },
                    { icon: Building2, title: "Organization", desc: "Company and team settings" },
                    { icon: Bell, title: "Notifications", desc: "Alerts and email preferences" },
                    { icon: Shield, title: "Security", desc: "Password and two-factor auth" },
                ].map((item, i) => (
                    <motion.button
                        key={item.title}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-start gap-4 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all text-left"
                    >
                        <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 flex-shrink-0">
                            <item.icon size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">{item.title}</h3>
                            <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
                        </div>
                    </motion.button>
                ))}
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-amber-800"
            >
                <p className="text-sm font-medium">
                    Settings panels will be wired to Firebase Auth and backend when the profile API is ready.
                </p>
            </motion.div>
        </div>
    );
}
