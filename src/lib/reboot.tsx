import { createContext, useContext, type ReactNode } from 'react';

const RebootContext = createContext<() => void>(() => {});

export function RebootProvider({ reboot, children }: { reboot: () => void; children: ReactNode }) {
  return <RebootContext.Provider value={reboot}>{children}</RebootContext.Provider>;
}

export function useReboot(): () => void {
  return useContext(RebootContext);
}
