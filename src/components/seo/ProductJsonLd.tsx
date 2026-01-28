import React from 'react';

interface ProductJsonLdProps {
    product: {
        name: string;
        description: string;
        images: string[];
        sku: string;
        price: number;
        unit: string;
        category?: { name: string };
        brand?: string;
    };
}

export default function ProductJsonLd({ product }: ProductJsonLdProps) {
    const jsonLd = {
        '@context': 'https://schema.org/',
        '@type': 'Product',
        name: product.name,
        image: product.images,
        description: product.description,
        sku: product.sku,
        mpn: product.sku,
        brand: {
            '@type': 'Brand',
            name: product.brand || 'SmartBuild',
        },
        offers: {
            '@type': 'Offer',
            url: typeof window !== 'undefined' ? window.location.href : '',
            priceCurrency: 'VND',
            price: product.price,
            itemCondition: 'https://schema.org/NewCondition',
            availability: 'https://schema.org/InStock',
            seller: {
                '@type': 'Organization',
                name: 'SmartBuild Materials Store',
            },
        },
        category: product.category?.name,
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    );
}
