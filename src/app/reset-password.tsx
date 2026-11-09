import { useState } from 'react';
import { appGateway, redirectTo } from '@/lib/auth/supabaseAuth';
import { useAccount } from '@/lib/auth/session';
import { supabaseStatus } from '@/lib/supabase';
import { useL } from '@/lib/data';
import { Button, Field, Notice, Screen, Spacer } from '@/ui/kit';

export default function ResetPassword() {
  const { L } = useL();
  const { user } = useAccount();
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const status = supabaseStatus();
  const send = async () => {
    setError(null);
    const result = await appGateway().resetPassword(email, redirectTo('/reset-password'));
    if (!result.ok) {
      setError(result.error === 'auth_not_configured' ? (status.message ?? '') : L('Envoi impossible.', 'Could not send.'));
      return;
    }
    setNote(L('Si ce courriel a un compte, un message de réinitialisation part. Les données de cet appareil restent.', 'If this email has an account, a reset message is sent. Data on this device stays.'));
  };
  const change = async () => {
    setError(null);
    const result = await appGateway().updatePassword(password);
    if (!result.ok) {
      setError(result.error === 'weak_password' ? L('8 caractères minimum.', '8 characters minimum.') : L('Le nouveau mot de passe n’est possible qu’après le lien reçu par courriel.', 'A new password is possible only after the link in the email.'));
      return;
    }
    setNote(L('Mot de passe mis à jour.', 'Password updated.'));
  };
  return (
    <Screen>
      <Notice tone="info" title={L('Mot de passe', 'Password')} text={L('Demandez un lien, ouvrez-le, puis choisissez un nouveau mot de passe.', 'Request a link, open it, then choose a new password.')} />
      <Field label={L('Courriel', 'Email')} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <Button title={L('Envoyer le lien', 'Send the link')} onPress={send} />
      <Spacer />
      <Field label={L('Nouveau mot de passe', 'New password')} value={password} onChangeText={setPassword} secureTextEntry />
      <Button variant="secondary" title={L('Enregistrer le nouveau mot de passe', 'Save the new password')} onPress={change} />
      {note ? <Notice tone="success" title={note} /> : null}
      {error ? <Notice tone="danger" title={error} /> : null}
    </Screen>
  );
}
