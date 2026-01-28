import React from 'react';

interface ContractorJsonLdProps {
    contractor: {
        displayName: string;
        description?: string;
        images?: string[];
        rating?: number;
        reviewCount?: number;
        skills?: string[];
        address?: string;
    };
}

export default function ContractorJsonLd({ contractor }: ContractorJsonLdProps) {
    const jsonLd = {
        '@context': 'https://schema.org/',
        '@type': 'HomeAndConstructionBusiness',
        name: contractor.displayName,
        image: contractor.images || [],
        description: contractor.description || `Nhà thầu xây dựng chuyên nghiệp tại SmartBuild - ${contractor.displayName}`,
        address: {
            '@type': 'PostalAddress',
            addressLocality: contractor.address || 'Biên Hòa, Đồng Nai',
            addressCountry: 'VN',
        },
        aggregateRating: contractor.reviewCount ? {
            '@type': 'AggregateRating',
            ratingValue: contractor.rating || 5,
            reviewCount: contractor.reviewCount,
        } : undefined,
        knowsAbout: contractor.skills || [],
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    );
}
