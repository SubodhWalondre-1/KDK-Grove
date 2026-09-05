import {
  uploadReport,
  getReportStatus,
  getReportDetail,
  correctReportValues,
  reprocessReport,
  getReferenceRanges,
} from '../../../services/api/reports';
import { getDashboard, getProfileHealthScore, getProfileReports } from '../../../services/api/dashboard';

export const reportService = {
  uploadReport,
  getReportStatus,
  getReportDetail,
  correctReportValues,
  reprocessReport,
  getReferenceRanges,
  getDashboard,
  getProfileHealthScore,
  getProfileReports,
};

export default reportService;
