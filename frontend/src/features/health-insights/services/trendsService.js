import {
  getTrendOverview,
  getTrendList,
  getTestTrend,
  getTrendInsight,
} from '../../../services/api/trends';
import {
  getRecommendations,
  generateRecommendations,
} from '../../../services/api/recommendations';

export const trendsService = {
  getTrendOverview,
  getTrendList,
  getTestTrend,
  getTrendInsight,
  getRecommendations,
  generateRecommendations,
};

export default trendsService;
