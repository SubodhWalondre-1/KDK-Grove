/**
 * Application-wide configuration and metadata.
 */
export const APP_CONFIG = {
  name: 'Mediora',
  tagline: 'Intelligent Longitudinal Health Tracking & Clinical Insights',
  version: '0.1.0',
  storageKeys: {
    token: 'mediora_token',
    user: 'mediora_user',
    activeProfileId: 'mediora_active_profile_id',
    language: 'mediora_lang',
  },
  routes: {
    home: '/',
    login: '/login',
    category: '/category',
    upload: '/upload',
    trends: '/trends',
    dietPlan: '/diet-plan',
    sharing: '/sharing',
    profiles: '/profiles',
  },
};

export default APP_CONFIG;
