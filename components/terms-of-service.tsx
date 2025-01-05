import React from 'react';

const TermsOfServiceContent: React.FC = () => {
    return (
        <div className="max-w-3xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <h1 className="text-3xl font-bold text-center text-blue-600 dark:text-blue-400 mb-4">Terms of Service</h1>
            <p className="text-center text-gray-600 dark:text-gray-300 mb-8">Last updated: [Date]</p>

            <section className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 border-b-2 border-blue-100 dark:border-blue-900 pb-2 mb-3">1. Introduction</h2>
                <p className="text-justify text-gray-700 dark:text-gray-300">
                    Welcome to ArenasAI. These Terms of Service govern your use of our website and services.
                </p>
            </section>

            <section className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 border-b-2 border-blue-100 dark:border-blue-900 pb-2 mb-3">2. Acceptance of Terms</h2>
                <p className="text-justify text-gray-700 dark:text-gray-300">
                    By accessing or using our services, you agree to be bound by these Terms of Service.
                </p>
            </section>

            <section className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 border-b-2 border-blue-100 dark:border-blue-900 pb-2 mb-3">3. Changes to Terms</h2>
                <p className="text-justify text-gray-700 dark:text-gray-300">
                    We reserve the right to modify these terms at any time. We will notify you of any changes by posting the new terms on our website.
                </p>
            </section>

            <section className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 border-b-2 border-blue-100 dark:border-blue-900 pb-2 mb-3">4. Use of Services</h2>
                <p className="text-justify text-gray-700 dark:text-gray-300">
                    You agree to use our services only for lawful purposes and in accordance with these terms.
                </p>
            </section>

            <section className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 border-b-2 border-blue-100 dark:border-blue-900 pb-2 mb-3">5. Account Registration</h2>
                <p className="text-justify text-gray-700 dark:text-gray-300">
                    To access certain features, you may need to register for an account. You must provide accurate and complete information during the registration process.
                </p>
            </section>

            <section className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 border-b-2 border-blue-100 dark:border-blue-900 pb-2 mb-3">6. Termination</h2>
                <p className="text-justify text-gray-700 dark:text-gray-300">
                    We may terminate or suspend your account and access to our services at any time, without prior notice or liability, for any reason.
                </p>
            </section>

            <section className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 border-b-2 border-blue-100 dark:border-blue-900 pb-2 mb-3">7. Limitation of Liability</h2>
                <p className="text-justify text-gray-700 dark:text-gray-300">
                    In no event shall ArenasAI be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of our services.
                </p>
            </section>

            <section className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 border-b-2 border-blue-100 dark:border-blue-900 pb-2 mb-3">8. Governing Law</h2>
                <p className="text-justify text-gray-700 dark:text-gray-300">
                    These terms shall be governed and construed in accordance with the laws of [Your Country/State], without regard to its conflict of law provisions.
                </p>
            </section>

            <section className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 border-b-2 border-blue-100 dark:border-blue-900 pb-2 mb-3">9. Contact Us</h2>
                <p className="text-justify text-gray-700 dark:text-gray-300">
                    If you have any questions about these Terms of Service, please contact us at [Your Contact Information].
                </p>
            </section>
        </div>
    );
};

export default TermsOfServiceContent;