import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useData } from '@/lib/data';
import { getSupabase } from '@/lib/supabase';
import { ACCOUNT_LINK_KEY, linkWithoutWipe } from './linkLocal';
import type { Account } from './rules';
import { loadAccount, userFromSession, type AuthUser } from './supabaseAuth';

type AuthState = {
  ready: boolean;
  user: AuthUser | null;
  account: Account | null;
  session: Session | null;
};

const Ctx = createContext<AuthState>({ ready: false, user: null, account: null, session: null });

export function useAccount() {
  return useContext(Ctx);
}

/**
 * Branche la session. Ne vide pas les clés locales.
 * Au premier jeton, enregistre seulement le lien sous le préfixe compte.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const data = useData();
  const localRef = useRef(data);
  localRef.current = data;
  const [state, setState] = useState<AuthState>({ ready: false, user: null, account: null, session: null });

  useEffect(() => {
    const client = getSupabase();
    if (!client) {
      setState({ ready: true, user: null, account: null, session: null });
      return;
    }
    let alive = true;
    const apply = async (session: Session | null) => {
      const user = userFromSession(session?.user);
      if (!user) {
        if (alive) setState({ ready: true, user: null, account: null, session });
        return;
      }
      const current = localRef.current;
      const { link } = linkWithoutWipe(user.id, {
        prefs: current.prefs,
        cooks: current.cooks,
        dishes: current.dishes,
        orders: current.orders,
      }, new Date().toISOString());
      void AsyncStorage.setItem(ACCOUNT_LINK_KEY, JSON.stringify(link));
      const account = await loadAccount(client, user);
      if (!alive) return;
      setState({ ready: true, user, account, session });
    };
    client.auth.getSession().then(({ data: initial }) => apply(initial.session)).catch(() => {
      if (alive) setState({ ready: true, user: null, account: null, session: null });
    });
    const { data: sub } = client.auth.onAuthStateChange((_event, session) => {
      void apply(session);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(() => state, [state]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
