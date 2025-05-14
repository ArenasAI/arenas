"use client"

import { Navbar } from "../nav";

export default function TermsOfServiceContent() {
    return (
        <>
        <Navbar />
        <div className="max-w-8xl text-white p-8 shadow-lg py-24 px-24 bg-[#CD4630] mx-auto">
            <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>
        </div>
        <div className="justify-left py-10 px-24 space-y-6">
            <h3 className="text-2xl font-bold">ArenasAI Terms of Service</h3>
            <p className="text-base text-gray-200">
              Welcome to ArenasAI. By accessing or using our platform, you agree to be bound by these Terms of Service. Please read them carefully before using our services.
            </p>
            
            <h3 className="text-2xl font-bold pt-8">1. Acceptance of Terms</h3>
            <p className="text-base text-gray-200">
              By accessing or using ArenasAI&aposs services, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this platform.
            </p>
            
            <h3 className="text-2xl font-bold pt-8">2. Description of Service</h3>
            <p className="text-base text-gray-200">
              ArenasAI provides a platform for users to interact with AI models and tools. The services offered by ArenasAI are subject to change or termination at our sole discretion without notice.
            </p>
            
            <h3 className="text-2xl font-bold pt-8">3. User Accounts</h3>
            <p className="text-base text-gray-200">
              To access certain features of our platform, you may be required to create an account. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account. You agree to notify ArenasAI immediately of any unauthorized use of your account.
            </p>
            
            <h3 className="text-2xl font-bold pt-8">4. User Content</h3>
            <p className="text-base text-gray-200">
              By submitting, uploading, or sharing content through our platform, you grant ArenasAI a worldwide, royalty-free license to use, reproduce, modify, adapt, publish, translate, distribute, and display such content for the purpose of providing and improving our services.
            </p>
            <p className="text-base text-gray-200">
              You are solely responsible for the content you submit through our platform and must ensure it does not infringe upon third-party rights, contains malware, or violates any applicable laws.
            </p>
            
            <h3 className="text-2xl font-bold pt-8">5. Prohibited Uses</h3>
            <p className="text-base text-gray-200">
              You agree not to use our platform for any illegal or unauthorized purpose, including but not limited to:
            </p>
            <ul className="list-disc pl-8 text-gray-200 py-3 space-y-2">
              <li>Violating any laws or regulations</li>
              <li>Infringing upon intellectual property rights</li>
              <li>Transmitting harmful code or malware</li>
              <li>Attempting to gain unauthorized access to our systems</li>
              <li>Harassing, abusing, or harming others</li>
              <li>Submitting false or misleading information</li>
            </ul>
            
            <h3 className="text-2xl font-bold pt-8">6. Termination</h3>
            <p className="text-base text-gray-200">
              ArenasAI reserves the right to terminate or suspend your account and access to our services at our sole discretion, without notice, for conduct that we believe violates these Terms of Service or is harmful to other users, ArenasAI, or third parties, or for any other reason.
            </p>
            
            <h3 className="text-2xl font-bold pt-8">7. Limitation of Liability</h3>
            <p className="text-base text-gray-200">
              ArenasAI and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use of our services, even if ArenasAI has been advised of the possibility of such damages.
            </p>
            
            <h3 className="text-2xl font-bold pt-8">8. Disclaimer of Warranties</h3>
            <p className="text-base text-gray-200">
              Our services are provided &quotas is&quot and &quotas available&quot without any warranties, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement. ArenasAI does not guarantee that our services will be uninterrupted, secure, or error-free.
            </p>
            
            <h3 className="text-2xl font-bold pt-8">9. Changes to Terms</h3>
            <p className="text-base text-gray-200">
              ArenasAI reserves the right to modify or replace these Terms of Service at any time. We will make reasonable efforts to notify users of substantial changes, but it is your responsibility to review these Terms periodically. Continued use of our platform after any modifications constitutes acceptance of the updated Terms.
            </p>
            
            <h3 className="text-2xl font-bold pt-8">10. Governing Law</h3>
            <p className="text-base text-gray-200">
              These Terms of Service are governed by and construed in accordance with the laws of the jurisdiction in which ArenasAI operates, without regard to its conflict of law principles.
            </p>
            
            <h3 className="text-2xl font-bold pt-8">11. Contact Information</h3>
            <p className="text-base text-gray-200 mb-8">
              If you have any questions or concerns about these Terms of Service, please contact us at legal@arenas.ai.
            </p>
            
            <p className="text-sm text-gray-400 italic">
              Last updated: May 13, 2025
            </p>
        </div>
        </>
    )
}