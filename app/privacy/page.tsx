import React from 'react';
import PrivacyPolicyContent from '@/components/privacy';

const PrivacyPage: React.FC = () => {
    return (
        <div className="min-h-screen">
            <div className="absolute top-0 left-0 w-full h-full -z-10" />
            <PrivacyPolicyContent />
        </div>
    );
};

export default PrivacyPage;