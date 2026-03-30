/**
 * Service to manage user identity and Google Authentication.
 */
export default class AuthService {
    constructor() {
        this.user = null;
    }

    /**
     * Obtains the current Google User profile information.
     * @returns {Promise<Object|null>} user profile (email, id)
     */
    async getUserInfo() {
        if (!chrome || !chrome.identity) return null;
        try {
            // chrome.identity.getProfileUserInfo only returns email/id if user is signed in to Sync.
            const userInfo = await chrome.identity.getProfileUserInfo();
            if (userInfo && userInfo.email) {
                this.user = {
                    email: userInfo.email,
                    id: userInfo.id,
                    name: userInfo.email.split('@')[0], // Fallback name
                    avatar: `https://ui-avatars.com/api/?name=${userInfo.email}&background=8ab4f8&color=1e1f20`
                };
                return this.user;
            }
            return null;
        } catch (e) {
            console.error("AuthService: Error fetching user info", e);
            return null;
        }
    }

    /**
     * Check if user is logged in.
     */
    async isAuthenticated() {
        const info = await this.getUserInfo();
        return !!info;
    }
}
