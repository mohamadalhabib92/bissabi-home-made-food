import { useRouter } from 'expo-router';
import { useState } from 'react';
import { appGateway, redirectTo } from '@/lib/auth/supabaseAuth';
import { socialProviders } from '@/lib/auth/gateway';
import { supabaseStatus } from '@/lib/supabase';
import { useL } from '@/lib/data';
import { Button, Field, Muted, Notice, Screen, Spacer } from '@/ui/kit';

export default function SignIn() {
  const { L } = useL();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const status = supabaseStatus();
  const submit = async () => {
    setBusy(true);
    setError(null);
    const result = await appGateway().signIn(email, password);
    setBusy(false);
    if (!result.ok) {
      setError(result.error === 'auth_not_configured' ? (status.message ?? L('Configuration requise', 'Configuration required')) : L('Connexion impossible. Vérifiez le courriel, le mot de passe, et que le courriel est confirmé.', 'Sign-in failed. Check the email, the password, and that the email is confirmed.'));
      return;
    }
    if (!result.value.emailConfirmed) {
      setError(L('Courriel pas encore confirmé. Ouvrez le message de Bissabi, puis réessayez.', 'Email not confirmed yet. Open the message from Bissabi, then try again.'));
      return;
    }
    router.back();
  };
  return (
    <Screen>
      <Notice tone="info" title={L('Connexion', 'Sign in')} text={L('Le courriel et le mot de passe d’abord. Apple et Google ne sont pas branchés.', 'Email and password first. Apple and Google are not connected.')} />
      {!status.configured ? <Notice tone="warning" title={status.message ?? ''} /> : null}
      <Field label={L('Courriel', 'Email')} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <Field label={L('Mot de passe', 'Password')} value={password} onChangeText={setPassword} secureTextEntry />
      {error ? <Notice tone="danger" title={error} /> : null}
      <Button title={L('Se connecter', 'Sign in')} loading={busy} onPress={submit} />
      <Spacer />
      <Button variant="secondary" title={L('Créer un compte', 'Create an account')} onPress={() => router.push('/sign-up')} />
      <Button variant="ghost" title={L('Mot de passe oublié', 'Forgot password')} onPress={() => router.push('/reset-password')} />
      <Muted>{L('Apple', 'Apple')} · {socialProviders.apple.enabled ? '' : L('pas branché', 'not connected')}</Muted>
      <Muted>{L('Google', 'Google')} · {socialProviders.google.enabled ? '' : L('pas branché', 'not connected')}</Muted>
    </Screen>
  );
}
