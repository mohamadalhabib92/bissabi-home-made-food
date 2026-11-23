import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import { useL } from '@/lib/data';
import { Notice } from './kit';

/** Bandeau quand le réseau est coupé. Les données locales restent lisibles. */
export function OfflineNotice() {
  const { L } = useL();
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const sub = NetInfo.addEventListener((state) => {
      setOffline(state.isConnected === false);
    });
    return () => sub();
  }, []);
  if (!offline) return null;
  return (
    <Notice
      tone="warning"
      title={L('Hors ligne', 'Offline')}
      text={L('Les données de cet appareil restent disponibles. Le paiement réel est injoignable.', 'Data on this device stays available. Real payment cannot be reached.')}
    />
  );
}
