'use client'

import { useEffect } from 'react'

const FACEBOOK_APP_ID = '' // Please add NEXT_PUBLIC_FACEBOOK_APP_ID to .env.local

export function useFacebookSDK() {
    useEffect(() => {
        // @ts-ignore
        window.fbAsyncInit = function () {
            // @ts-ignore
            FB.init({
                appId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || FACEBOOK_APP_ID,
                cookie: true,
                xfbml: true,
                version: 'v18.0'
            })
        };

        (function (d, s, id) {
            var js, fjs = d.getElementsByTagName(s)[0]
            if (d.getElementById(id)) return
            js = d.createElement(s); js.id = id
            // @ts-ignore
            js.src = "https://connect.facebook.net/en_US/sdk.js"
            // @ts-ignore
            fjs.parentNode.insertBefore(js, fjs)
        }(document, 'script', 'facebook-jssdk'))
    }, [])
}

export async function loginWithFacebook(): Promise<any> {
    return new Promise((resolve, reject) => {
        // @ts-ignore
        if (!window.FB) {
            reject(new Error('Facebook SDK not loaded'))
            return
        }

        // @ts-ignore
        FB.login((response) => {
            if (response.authResponse) {
                resolve(response.authResponse)
            } else {
                reject(new Error('User cancelled login or did not fully authorize.'))
            }
        }, { scope: 'public_profile,email' })
    })
}
