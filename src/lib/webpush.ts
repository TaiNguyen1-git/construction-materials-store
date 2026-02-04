import webpush from 'web-push'

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BDZf_lS7ABOkMrnaKKoDY_u1KWuL7xJDoMU4F_7lZeyq5d4xa0SyIlXVNJR7JVKpYfdfBMGiDAxCet0jmz83Xvs'
const privateKey = process.env.VAPID_PRIVATE_KEY || 'f9RP1dIJgHR-fY_kAcKj_Mu99i5u7CDb8Z0-vYEwzTQ'

webpush.setVapidDetails(
    'mailto:support@smartbuild.vn',
    publicKey,
    privateKey
)

export default webpush
