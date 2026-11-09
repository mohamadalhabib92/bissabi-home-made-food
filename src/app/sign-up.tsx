import { useRouter } from 'expo-router';
import { useState } from 'react';
import { appGateway, redirectTo } from '@/lib/auth/supabaseAuth';
import { signInWithSocial } from '@/lib/auth/gateway';
import type { SignupRole } from '@/lib/auth/rules';
import { supabaseStatus } from '@/lib/supabase';
import { useL } from '@/lib/data';
import { Button, Field, Muted, Notice, Screen, Segmented, Spacer } from '@/ui/kit';

export default function SignUp() {
  const { L } = useL();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<SignupRole>('client');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const status = supabaseStatus();
  const submit = async () => {
    setBusy(true);
    setError(null);
    const result = await appGateway().signUp({
      email, password, displayName: name, role, redirectTo: redirectTo('/sign-in'),
    });
    setBusy(false);
    if (!result.ok) {
      const known: Record<string, string> = {
        invalid_email: L('Courriel invalide.', 'Invalid email.'),
        weak_password: L('Mot de passe : 8 caractères minimum.', 'Password: 8 characters minimum.'),
        missing_name: L('Indiquez votre nom.', 'Enter your name.'),
        auth_not_configured: status.message ?? L('Configuration requise', 'Configuration required'),
      };
      setError(known[result.error] ?? result.error);
      return;
    }
    setSent(true);
  };
  return (
    <Screen>
      <Notice tone="info" title={L('Créer un compte', 'Create an account')} text={L('Le rôle est enregistré côté serveur. Un cuisinier commence en « dossier en cours » et ne peut pas vendre tant que Bissabi n’a pas approuvé le dossier et que le courriel n’est pas confirmé.', 'The role is stored on the server. A cook starts as “file in progress” and cannot sell until Bissabi approves the file and the email is confirmed.')} />
      {sent ? <Notice tone="success" title={L('Vérifiez votre courriel', 'Check your email')} text={L('Ouvrez le message pour confirmer le compte. Rien n’a été effacé sur cet appareil.', 'Open the message to confirm the account. Nothing on this device was erased.')} /> : null}
      <Field label={L('Nom', 'Name')} value={name} onChangeText={setName} />
      <Field label={L('Courriel', 'Email')} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <Field label={L('Mot de passe', 'Password')} value={password} onChangeText={setPassword} secureTextEntry />
      <Segmented
        label={L('Je suis', 'I am')}
        options={[{ label: L('Client', 'Client'), value: 'client' as const }, { label: L('Cuisinier', 'Cook'), value: 'cook' as const }]}
        value={role}
        onChange={setRole}
      />
      {role === 'cook' ? <Muted>{L('Dossier en cours. Publication bloquée jusqu’à l’approbation Bissabi.', 'File in progress. Publishing stays blocked until Bissabi approves it.')}</Muted> : null}
      {error ? <Notice tone="danger" title={error} /> : null}
      <Button title={L('Créer le compte', 'Create the account')} loading={busy} onPress={submit} />
      <Spacer />
      <Button variant="secondary" title={L('Apple — pas branché', 'Apple — not connected')} onPress={() => setError(signInWithSocial('apple').ok ? '' : L('Apple n’est pas branché. Utilisez le courriel.', 'Apple is not connected. Use email.'))} />
      <Button variant="secondary" title={L('Google — pas branché', 'Google — not connected')} onPress={() => setError(L('Google n’est pas branché. Utilisez le courriel.', 'Google is not connected. Use email.'))} />
      <Button variant="ghost" title={L('Déjà un compte', 'Already have an account')} onPress={() => router.push('/sign-in')} />
    </Screen>
  );
}
