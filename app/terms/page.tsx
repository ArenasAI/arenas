import React from 'react';
import TermsOfServiceContent from '@/components/terms-of-service';

const TermsOfService: React.FC = () => {
    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <TermsOfServiceContent />
        </div>
    );
};

export default TermsOfService;