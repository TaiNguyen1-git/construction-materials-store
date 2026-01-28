import React from 'react';

export default function OrganizationJsonLd() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'SmartBuild',
        url: 'https://smartbuild.vn',
        logo: 'https://smartbuild.vn/logo.png',
        contactPoint: {
            '@type': 'ContactPoint',
            telephone: '+84-123-456-789',
            contactType: 'customer service',
            areaServed: 'VN',
            availableLanguage: 'Vietnamese',
        },
        sameAs: [
            'https://www.facebook.com/smartbuildvn',
            'https://www.linkedin.com/company/smartbuildvn',
        ],
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    );
}
