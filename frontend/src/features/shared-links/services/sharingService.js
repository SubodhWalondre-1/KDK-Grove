import {
  createShareLink,
  getShareLinks,
  getShareLinkLogs,
  revokeShareLink,
  getSharedPreview,
  recordSharedAccess,
} from '../../../services/api/sharing';

export const sharingService = {
  createShareLink,
  getShareLinks,
  getShareLinkLogs,
  revokeShareLink,
  getSharedPreview,
  recordSharedAccess,
};

export default sharingService;
