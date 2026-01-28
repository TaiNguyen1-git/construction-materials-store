import React from 'react';

interface ProjectJsonLdProps {
    project: {
        title: string;
        description: string;
        location: string;
        datePosted: string;
        budget?: number;
    };
}

export default function ProjectJsonLd({ project }: ProjectJsonLdProps) {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'JobPosting', // Using JobPosting for project listings as it fits best for hiring contractors
        title: project.title,
        description: project.description,
        datePosted: project.datePosted,
        jobLocation: {
            '@type': 'Place',
            address: {
                '@type': 'PostalAddress',
                addressLocality: project.location,
                addressCountry: 'VN',
            },
        },
        baseSalary: project.budget ? {
            '@type': 'MonetaryAmount',
            currency: 'VND',
            value: {
                '@type': 'QuantitativeValue',
                value: project.budget,
                unitText: 'TOTAL',
            },
        } : undefined,
        hiringOrganization: {
            '@type': 'Organization',
            name: 'SmartBuild Marketplace',
        },
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    );
}
