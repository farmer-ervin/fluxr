import mixpanel, { Config } from 'mixpanel-browser';

// Initialize Mixpanel with your project token from environment variables
const token = import.meta.env.VITE_MIXPANEL_TOKEN;

if (!token) {
  console.warn('Mixpanel token not found in environment variables');
}

mixpanel.init(token, {
  debug: false, // Disable debug logging
  track_pageview: "full-url",
  persistence: 'localStorage',
  // Session Replay Configuration
  record_sessions_percent: 100, // Record 100% of sessions
  record_block_selector: `
    /* Payment and Billing */
    .stripe-element,
    [data-testid='payment-form'],
    .payment-form,
    #payment-form,
    .billing-portal,
    .subscription-form,
    
    /* Authentication */
    .auth-form,
    [data-testid='auth-form'],
    #auth-form,
    .login-form,
    .signup-form,
    .reset-password-form,
    
    /* Profile and User Data */
    .profile-form,
    [data-testid='profile-form'],
    #profile-form,
    .user-settings,
    .account-settings,
    
    /* Sensitive Data */
    [data-sensitive='true'],
    [data-private='true'],
    
    /* Media */
    img,
    video
  `,
  record_mask_text_selector: `
    /* Input Fields */
    input,
    textarea,
    
    /* Sensitive Content */
    [data-sensitive='true'] *,
    [data-private='true'] *,
    
    /* Payment and Billing */
    .stripe-element *,
    [data-testid='payment-form'] *,
    .payment-form *,
    #payment-form *,
    .billing-portal *,
    .subscription-form *,
    
    /* Authentication */
    .auth-form *,
    [data-testid='auth-form'] *,
    #auth-form *,
    .login-form *,
    .signup-form *,
    .reset-password-form *,
    
    /* Profile and User Data */
    .profile-form *,
    [data-testid='profile-form'] *,
    #profile-form *,
    .user-settings *,
    .account-settings *
  `,
  record_collect_fonts: true,
  record_canvas: false, // Disable canvas recording as it's not needed for this app
  record_idle_timeout_ms: 1800000, // 30 minutes
  record_max_ms: 86400000 // 24 hours
});

interface UserProfile {
  name: string;
  email: string;
  [key: string]: any; // Allow for additional properties
}

export const identifyUser = (userId: string) => {
  mixpanel.identify(userId);
};

export const updateUserProfile = (profile: UserProfile) => {
  mixpanel.people.set({
    '$name': profile.name,
    '$email': profile.email,
    ...profile // Include any additional properties
  });
};

export const resetUser = () => {
  mixpanel.reset();
};

export default mixpanel; 