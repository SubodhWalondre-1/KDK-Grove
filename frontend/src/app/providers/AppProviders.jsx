import { AuthProvider } from '../../context/AuthContext';
import { PatientProvider } from '../../context/PatientContext';

export function AppProviders({ children }) {
  return (
    <AuthProvider>
      <PatientProvider>
        {children}
      </PatientProvider>
    </AuthProvider>
  );
}

export default AppProviders;
