// some color bg-[#3083DC]
import { Navbar } from "./nav";

export default function PrivacyPolicyContent() {
    return (
        <>
        <Navbar />
        <div className="max-w-8xl text-white p-8 shadow-lg py-24 px-24 bg-[#CD4630] mx-auto">
            <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
        </div>
        <div className="justify-left py-10 px-24 space-y-6">
            <h3 className="text-2xl font-bold">ArenasAI Privacy Policy</h3>
            <p className="text-base text-gray-200">
              At ArenasAI, we are committed to protecting your privacy. We collect only the minimal personal data necessary to provide and improve our services, including your name, email address, usage data, and any information you choose to share through our platform.
            </p>
            <p className=" text-gray-200">
              We use industry-standard measures to secure your data, and we never share your personal information with third parties without your explicit consent, except when required by law. You can access, update, or delete your data at any time through your account settings.
            </p>
            <p className="text-base text-gray-200">
              For more details about our data practices and your rights, please contact our support team at privacy@arenas.ai. By using ArenasAI, you agree to the terms of this Privacy Policy.
            </p>
            <h3 className="text-2xl font-bold py-10">Personal Information We Collect Automatically</h3>
            <p className="text-base text-gray-200">
              We automatically collect certain information when you use our services, including log data (such as IP address, device type, operating system, and referring URLs), usage data (pages visited, features used, and interaction timestamps), analytics data to understand how our services are used, and cookies or similar tracking technologies. This information helps us improve performance, troubleshoot issues, and enhance your user experience.
            </p>
            <h3 className="text-2xl font-bold">How We Use Your Information</h3>
            <p className="text-base text-gray-200">
              We use the information we collect to operate, maintain, and provide you with the features and functionality of our services, to personalize content and recommendations, to communicate with you (including sending updates, security alerts, and support messages), to monitor and analyze trends and usage, and to detect, investigate, and prevent fraudulent or unauthorized activities.
            </p>
            <h3 className="text-2xl font-bold">Data Storage and Retention</h3>
            <p className="text-base text-gray-200">
              We store your information on secure servers and retain it only as long as necessary to fulfill the purposes for which it was collected, comply with legal obligations, resolve disputes, and enforce our agreements. You may request deletion of your personal data at any time by contacting privacy@arenas.ai.
            </p>
        </div>
        </>
    )
}