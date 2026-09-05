import { createContext, useContext } from 'react';
import { useProfileStore } from '../store/profileStore';

const PatientContext = createContext(null);

export function PatientProvider({ children }) {
  const activeProfile = useProfileStore((s) => s.activeProfile);
  const setActiveProfile = useProfileStore((s) => s.setActiveProfile);
  const clearActiveProfile = useProfileStore((s) => s.clearActiveProfile);

  return (
    <PatientContext.Provider
      value={{
        activeProfile,
        setActiveProfile,
        clearActiveProfile,
      }}
    >
      {children}
    </PatientContext.Provider>
  );
}

export function usePatientContext() {
  const context = useContext(PatientContext);
  if (!context) {
    const activeProfile = useProfileStore.getState().activeProfile;
    const setActiveProfile = useProfileStore.getState().setActiveProfile;
    const clearActiveProfile = useProfileStore.getState().clearActiveProfile;
    return { activeProfile, setActiveProfile, clearActiveProfile };
  }
  return context;
}

export default PatientContext;
