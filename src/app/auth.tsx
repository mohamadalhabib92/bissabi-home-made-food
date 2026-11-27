import { useState } from 'react';
import { useData, useL } from '@/lib/data';
import type { AuthRole } from '@/lib/accountLink';
import { planAccountLink, validateCredentials } from '@/lib/accountLink';
import { sendMagicLink, sendPasswordReset, signInWithEmail, signOutEmail, signUpWithEmail } from '@/lib/authPort';
import { isDemoMode } from '@/lib/supabase';
import { Button, Field, H1, Muted, Notice, Screen, Segmented, Spacer } from '@/ui/kit';

export default function AuthScreen() {
  const { prefs, setPrefs, myCook, myCourier, orders } = useData();
  const { L } = useL();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AuthRole>('client');
  const [msg, setMsg] = useState<string | null>(null);
  const [pendingUser, setPendingUser] = useState<string | null>(null);
  const localHas = !!myCook || !!myCourier || orders.some((o) => !o.demo);
  const device = isDemoMode();

  const applyRole = (next: AuthRole) => {
    setRole(next);
    setPrefs((p) => ({
      ...p,
      mode: next === 'client' ? 'buyer' : next === 'courier' ? 'courier' : 'cook',
      pendingSellerKind: next === 'traiteur' ? 'caterer' : next === 'cook' ? 'home' : p.pendingSellerKind,
    }));
  };

  const afterSignIn = (userId: string) => {
    if (!localHas || prefs.accountLink?.userId === userId) {
      setMsg(L('Connecté. Les données de cet appareil restent en place.', 'Signed in. Data on this device stays put.'));
      return;
    }
    setPendingUser(userId);
  };

  const choose = (choice: 'skip' | 'link') => {
    if (!pendingUser) return;
    const plan = planAccountLink(choice, localHas, false);
    setPrefs((p) => ({ ...p, accountLink: { userId: pendingUser, choice, at: new Date().toISOString() } }));
    setPendingUser(null);
    setMsg(plan.uploadLocal
      ? L('Lien enregistré. Rien n’a été écrasé : l’envoi vers le serveur attend un projet Supabase approuvé.', 'Link saved. Nothing was overwritten: upload waits for an approved Supabase project.')
      : L('Données de l’appareil conservées, sans envoi.', 'Device data kept, nothing sent.'));
  };

  const submit = async (kind: 'up' | 'in') => {
    const invalid = validateCredentials(email, password);
    if (invalid) {
      setMsg(invalid === 'email' ? L('E-mail invalide', 'Invalid email') : L('Mot de passe : 8 caractères minimum', 'Password: 8 characters minimum'));
      return;
    }
    const result = kind === 'up' ? await signUpWithEmail(email, password, role) : await signInWithEmail(email, password);
    if (!result.ok) {
      setMsg(result.reason === 'device_only'
        ? L('Mode sur cet appareil : pas de serveur. Le rôle choisi est gardé ici.', 'On-device mode: no server. The chosen role stays here.')
        : result.message);
      if (result.reason === 'device_only') applyRole(role);
      return;
    }
    applyRole(role);
    afterSignIn(result.userId);
  };

  return (
    <Screen>
      <H1>{L('Compte', 'Account')}</H1>
      {device ? <Notice tone="info" title={L('Mode sur cet appareil', 'On-device mode')} text={L('Supabase n’est pas configuré. Création, connexion et mot de passe oublié ne quittent pas cet écran. Vos plats et commandes restent ici.', 'Supabase is not configured. Sign-up, sign-in and password reset do not leave this screen. Your dishes and orders stay here.')} /> : null}
      <Segmented label={L('Rôle', 'Role')} options={[{ label: L('Client·e', 'Customer'), value: 'client' as const }, { label: L('Cuisine', 'Kitchen'), value: 'cook' as const }, { label: L('Traiteur', 'Caterer'), value: 'traiteur' as const }, { label: L('Livreur·euse', 'Courier'), value: 'courier' as const }]} value={role} onChange={setRole} />
      <Field label={L('E-mail', 'Email')} value={email} onChangeText={setEmail} autoComplete="email" keyboardType="email-address" />
      <Field label={L('Mot de passe', 'Password')} value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" />
      <Button title={L('Créer le compte', 'Create account')} onPress={() => submit('up')} />
      <Spacer h={8} />
      <Button variant="secondary" title={L('Se connecter', 'Sign in')} onPress={() => submit('in')} />
      <Spacer h={8} />
      <Button variant="ghost" title={L('Lien magique', 'Magic link')} onPress={async () => {
        if (!email.includes('@')) { setMsg(L('E-mail invalide', 'Invalid email')); return; }
        const result = await sendMagicLink(email, role);
        if (result.ok) applyRole(role);
        setMsg(result.ok ? L('Lien envoyé si le serveur est là.', 'Link sent if the server is there.') : result.reason === 'device_only' ? L('Mode sur cet appareil : le lien ne part pas.', 'On-device mode: the link is not sent.') : result.message);
      }} />
      <Spacer h={8} />
      <Button variant="ghost" title={L('Mot de passe oublié', 'Forgot password')} onPress={async () => {
        const result = await sendPasswordReset(email);
        setMsg(result.ok ? L('Message envoyé si le serveur est là.', 'Message sent if the server is there.') : result.message);
      }} />
      <Spacer h={8} />
      <Button variant="ghost" title={L('Se déconnecter', 'Sign out')} onPress={async () => { await signOutEmail(); setMsg(L('Déconnecté. Les données de l’appareil restent.', 'Signed out. Device data remains.')); }} />
      {pendingUser ? (
        <>
          <Spacer />
          <Notice tone="warning" title={L('Lier cet appareil ?', 'Link this device?')} text={L('Vos profils déjà ici ne seront pas effacés. Un compte distant déjà rempli n’est pas remplacé.', 'Profiles already here will not be erased. A remote account that already has data is not replaced.')} />
          <Button title={L('Lier sans écraser', 'Link without overwriting')} onPress={() => choose('link')} />
          <Spacer h={8} />
          <Button variant="ghost" title={L('Garder seulement ici', 'Keep only here')} onPress={() => choose('skip')} />
        </>
      ) : null}
      {msg ? <Muted style={{ marginTop: 12 }}>{msg}</Muted> : null}
    </Screen>
  );
}
