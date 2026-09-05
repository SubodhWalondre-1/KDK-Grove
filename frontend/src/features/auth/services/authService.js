import { loginUser, signupUser } from '../../../services/api/auth';

export const authService = {
  login: loginUser,
  signup: signupUser,
};

export default authService;
