import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ACCOUNT_LINK_KEY, requestDeletion } from '@/lib/auth/linkLocal';
import { useAccount } from '@/lib/auth/session';
import { appGateway } from '@/lib/auth/supabaseAuth';
import { confirmAsk } from '@/lib/confirm';
import { useData, useL } from '@/lib/data';
import { localeMeta } from '@/i18n/locales';
import { Button, Field, Muted, Notice, Screen, Spacer } from '@/ui/kit';

const ADDRESS_KEY = '@bissabi-home-made-food-account/addresses';

type Address = { label: string; line: string; postalCode: string };

export default function Profile() {
  const { L, lang } = useL();
  const { prefs } = useData();
  const { user, account } = useAccount();
  const router = useRouter();
  const [name, setName] = useState(user?.displayName ?? prefs.buyerName ?? '');
  const [phone, setPhone] = useState('');
  const [label, setLabel] = useState('');
  const [line, setLine] = useState('');
  const [postal, setPostal] = useState('');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [note, setNote] = useState<string | null>(null);
  useEffect(() => {
    void AsyncStorage.getItem(ADDRESS_KEY).then((raw) => {
      if (!raw) return;
      try { setAddresses(JSON.parse(raw) as Address[]); } catch { /* garde la liste vide */ }
    });
  }, []);
  const save = async () => {
    const result = await appGateway().saveProfile({ displayName: name.trim(), phone: phone.trim() || null, locale: prefs.lang });
    setNote(result.ok
      ? L('Profil enregistré sur le compte. Les données de cet appareil n’ont pas été effacées.', 'Profile saved on the account. Data on this device was not erased.')
      : L('Profil gardé à l’écran. Le serveur de comptes n’est pas configuré : rien n’a été effacé ici.', 'Profile kept on screen. The account server is not configured: nothing here was erased.'));
  };
  const addAddress = async () => {
    if (!line.trim() || !postal.trim()) return;
    const next = [...addresses, { label: label.trim() || L('Adresse', 'Address'), line: line.trim(), postalCode: postal.trim() }];
    setAddresses(next);
    await AsyncStorage.setItem(ADDRESS_KEY, JSON.stringify(next));
    await appGateway().saveAddress(next[next.length - 1]);
    setLabel('');
    setLine('');
    setPostal('');
  };
  const deletion = () => confirmAsk(L('Demander la suppression du compte ? Les données de cet appareil ne sont pas effacées par cette demande.', 'Request account deletion? Data on this device is not erased by this request.'), async () => {
    const raw = await AsyncStorage.getItem(ACCOUNT_LINK_KEY);
    const base = raw ? JSON.parse(raw) : { accountId: user?.id ?? 'local', linkedAt: new Date().toISOString(), cookIds: [], dishIds: [], orderIds: [], deletionRequestedAt: null };
    await AsyncStorage.setItem(ACCOUNT_LINK_KEY, JSON.stringify(requestDeletion(base, new Date().toISOString())));
    await appGateway().requestDeletion();
    setNote(L('Demande enregistrée (nLPD). Rien n’a été effacé sur cet appareil.', 'Request recorded (nLPD). Nothing was erased on this device.'));
  });
  return (
    <Screen>
      {!user ? <Notice tone="warning" title={L('Pas de session', 'No session')} text={L('Créez un compte ou connectez-vous. Les plats et commandes déjà sur cet appareil restent.', 'Create an account or sign in. Dishes and orders already on this device stay.')} /> : null}
      {account?.signupRole === 'cook' ? (
        <Notice tone={account.kitchenStatus === 'approved' && account.emailConfirmed ? 'success' : 'warning'} title={L('Dossier cuisine', 'Kitchen file')} text={
          account.kitchenStatus === 'dossier_en_cours'
            ? L('Dossier en cours. Vous ne pouvez pas publier tant que Bissabi n’a pas approuvé et que le courriel n’est pas confirmé.', 'File in progress. You cannot publish until Bissabi approves it and the email is confirmed.')
            : account.kitchenStatus
        } />
      ) : null}
      <Field label={L('Nom', 'Name')} value={name} onChangeText={setName} />
      <Field label={L('Téléphone (facultatif)', 'Phone (optional)')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <Button variant="secondary" title={`${L('Langue', 'Language')} · ${localeMeta(lang).endonym}`} onPress={() => router.push('/languages')} />
      <Button title={L('Enregistrer le profil', 'Save profile')} onPress={save} />
      {account?.signupRole !== 'cook' ? (
        <>
          <Spacer />
          <Muted>{L('Adresses de livraison', 'Delivery addresses')}</Muted>
          {addresses.map((item) => <Muted key={`${item.postalCode}-${item.line}`}>{item.label} · {item.line} · {item.postalCode}</Muted>)}
          <Field label={L('Libellé', 'Label')} value={label} onChangeText={setLabel} />
          <Field label={L('Adresse', 'Address')} value={line} onChangeText={setLine} />
          <Field label={L('Code postal', 'Postal code')} value={postal} onChangeText={setPostal} />
          <Button variant="secondary" title={L('Ajouter l’adresse', 'Add the address')} onPress={addAddress} />
        </>
      ) : null}
      <Spacer />
      <Button variant="secondary" title={L('Se déconnecter', 'Sign out')} onPress={async () => { await appGateway().signOut(); router.back(); }} />
      <Button variant="ghost" title={L('Demander la suppression du compte', 'Request account deletion')} onPress={deletion} />
      {note ? <Notice tone="info" title={note} /> : null}
    </Screen>
  );
}
