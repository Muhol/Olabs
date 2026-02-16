import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Olabs Student Portal',
        short_name: 'StudentPortal',
        description: 'Student portal for Olabs school management system',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#000000ff',
        icons: [
            {
                src: '/icon-192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'maskable',
            },
            {
                src: '/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
            },
        ],
    }
}
