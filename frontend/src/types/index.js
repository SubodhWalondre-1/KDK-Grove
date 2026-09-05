/**
 * @typedef {Object} User
 * @property {string} email
 * @property {string} [name]
 *
 * @typedef {Object} Profile
 * @property {number} id
 * @property {string} profile_name
 * @property {'human' | 'animal'} species
 * @property {string} [breed]
 * @property {number} [age_years]
 * @property {string} [gender]
 *
 * @typedef {Object} TestParameter
 * @property {string} test_name
 * @property {number} value
 * @property {string} unit
 * @property {'green' | 'yellow' | 'red' | null} status
 *
 * @typedef {Object} HealthTrendOverview
 * @property {number} health_score
 * @property {string} health_score_trend
 * @property {TestParameter[]} tests
 */

export {};
