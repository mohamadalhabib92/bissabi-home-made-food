import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, View } from 'react-native';
import { DishVisual } from '@/components/brand';
import { confirmAsk } from '@/lib/confirm';
import { useData, useL } from '@/lib/data';
import { ALLERGENS, CUISINES, type Allergen, type Cuisine, type Dish, type Ingredient } from '@/lib/model';
import { MIN_LEAD_HOURS } from '@/lib/pricing';
import { uid } from '@/lib/storage';
import { Button, Card, Chip, Empty, Field, H2, IconButton, Muted, Notice, Row, Screen, Spacer, Toggle } from '@/ui/kit';

const EMOJIS = ['🍲', '🍛', '🥘', '🍗', '🥙', '🥗', '🍝', '🥟', '🍰', '🧆', '🫓', '🍚'];

export default function DishEditor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { myCook, dishes, setDishes } = useData();
  const { L, lang } = useL();
  const router = useRouter();
  const ex = dishes.find((d) => d.id === id && d.cookId === myCook?.id);
  const [title, setTitle] = useState(ex?.title ?? '');
  const [description, setDescription] = useState(ex?.description ?? '');
  const [cuisine, setCuisine] = useState<Cuisine>(ex?.cuisine ?? 'sahel');
  const [price, setPrice] = useState(ex ? ex.price.toFixed(2) : '');
  const [allergens, setAllergens] = useState<Allergen[]>(ex?.allergens ?? []);
  const [noneConfirmed, setNoneConfirmed] = useState(ex ? ex.allergensConfirmed && !ex.allergens.length : false);
  const [halal, setHalal] = useState(ex?.halal ?? !!myCook?.halalKitchen);
  const [veg, setVeg] = useState(ex?.vegetarian ?? false);
  const [spicy, setSpicy] = useState(ex?.spicy ?? false);
  const [lead, setLead] = useState(String(ex?.leadHours ?? MIN_LEAD_HOURS));
  const [ings, setIngs] = useState<{ name: string; qty: string; unit: string }[]>(ex?.ingredients.map((i) => ({ ...i, qty: String(i.qty) })) ?? [{ name: '', qty: '', unit: 'g' }]);
  const [emoji, setEmoji] = useState(ex?.emoji ?? '🍲');
  const [photo, setPhoto] = useState<string | undefined>(ex?.photo);
  const [active, setActive] = useState(ex?.active ?? true);
  if (!myCook) return <Screen><Empty title={L('Créez d’abord votre profil', 'Create your profile first')} /></Screen>;
  const p = Number(price.replace(',', '.'));
  const lh = Number(lead);
  const cleanIngs: Ingredient[] = ings.filter((i) => i.name.trim() && Number(i.qty.replace(',', '.')) > 0).map((i) => ({ name: i.name.trim(), qty: Number(i.qty.replace(',', '.')), unit: i.unit.trim() || 'g' }));
  const errs = {
    title: title.trim().length < 3 ? L('3 caractères minimum', '3 characters minimum') : undefined,
    price: !(p >= 2 && p <= 200) ? L('Prix par portion entre CHF 2 et 200', 'Price per portion between CHF 2 and 200') : undefined,
    allergens: !allergens.length && !noneConfirmed ? L('Obligatoire : cochez les allergènes présents OU confirmez qu’il n’y en a aucun.', 'Required: tick the allergens present OR confirm there are none.') : undefined,
    lead: !(lh >= MIN_LEAD_HOURS && lh <= 168) ? L(`Entre ${MIN_LEAD_HOURS} et 168 h`, `Between ${MIN_LEAD_HOURS} and 168 h`) : undefined,
  };
  const valid = !Object.values(errs).some(Boolean) && description.trim().length >= 10;
  const pick = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.5, allowsEditing: true, aspect: [4, 3], base64: Platform.OS === 'web' });
    const a = r.canceled ? null : r.assets[0];
    if (a) setPhoto(Platform.OS === 'web' && a.base64 ? `data:${a.mimeType ?? 'image/jpeg'};base64,${a.base64}` : a.uri);
  };
  const save = () => {
    const d: Dish = { id: ex?.id ?? uid('dish_'), cookId: myCook.id, title: title.trim(), description: description.trim(), cuisine, price: Math.round(p * 20) / 20, allergens, allergensConfirmed: true, halal, vegetarian: veg, spicy, ingredients: cleanIngs, leadHours: lh, photo, emoji, active };
    setDishes((l) => (ex ? l.map((x) => (x.id === d.id ? d : x)) : [...l, d]));
    router.back();
  };
  const preview: Dish = { id: ex?.id ?? 'new', cookId: myCook.id, title, description, cuisine, price: p || 0, allergens, allergensConfirmed: true, halal, vegetarian: veg, spicy, ingredients: [], leadHours: lh, photo, emoji, active };
  return (
    <Screen>
      <DishVisual dish={preview} height={160} />
      <Spacer h={8} />
      <Row wrap>
        <Button small variant="secondary" icon="image-outline" title={photo ? L('Changer la photo', 'Change photo') : L('Ajouter une photo', 'Add a photo')} onPress={pick} />
        {photo ? <Button small variant="ghost" title={L('Retirer', 'Remove')} onPress={() => setPhoto(undefined)} /> : null}
      </Row>
      {!photo ? <Row wrap>{EMOJIS.map((e) => <Chip key={e} label={e} active={emoji === e} onPress={() => setEmoji(e)} />)}</Row> : null}
      <Muted style={{ fontSize: 12 }}>{L('Photo stockée sur cet appareil uniquement (pas encore d’hébergement en ligne).', 'Photo stored on this device only (no online hosting yet).')}</Muted>
      <Spacer />
      <Field label={L('Nom du plat', 'Dish name')} value={title} onChangeText={setTitle} error={title ? errs.title : undefined} />
      <Field label={L('Description', 'Description')} value={description} onChangeText={setDescription} multiline placeholder={L('Ce qui le rend unique, la portion (ex. 450 g)…', 'What makes it special, the portion (e.g. 450 g)…')} />
      <Muted>{L('Cuisine', 'Cuisine')}</Muted>
      <Row wrap>{CUISINES.map((c) => <Chip key={c.key} label={c[lang]} active={cuisine === c.key} onPress={() => setCuisine(c.key)} />)}</Row>
      <Spacer h={8} />
      <Row>
        <View style={{ flex: 1 }}><Field label={L('Prix / portion (CHF)', 'Price / portion (CHF)')} value={price} onChangeText={setPrice} keyboardType="decimal-pad" error={price ? errs.price : undefined} /></View>
        <View style={{ flex: 1 }}><Field label={L('Délai min. (h)', 'Min. notice (h)')} value={lead} onChangeText={setLead} keyboardType="number-pad" error={errs.lead} /></View>
      </Row>
      <Card>
        <H2>{L('Allergènes (obligatoire)', 'Allergens (required)')}</H2>
        <Muted style={{ marginBottom: 8 }}>{L('Les 14 allergènes à déclarer (OIDAl, annexe 6).', 'The 14 allergens to declare (Swiss OIDAl, annex 6).')}</Muted>
        <Row wrap>{ALLERGENS.map((a) => <Chip key={a.key} label={a[lang]} active={allergens.includes(a.key)} color="#C8152A" onPress={() => { setNoneConfirmed(false); setAllergens((l) => (l.includes(a.key) ? l.filter((x) => x !== a.key) : [...l, a.key])); }} />)}</Row>
        <Toggle label={L('Je confirme : aucun de ces 14 allergènes', 'I confirm: none of these 14 allergens')} value={noneConfirmed} onChange={(v) => { setNoneConfirmed(v); if (v) setAllergens([]); }} />
        {errs.allergens ? <Notice tone="warning" title={errs.allergens} /> : null}
      </Card>
      <Toggle label="Halal" value={halal} onChange={setHalal} />
      <Toggle label={L('Végétarien', 'Vegetarian')} value={veg} onChange={setVeg} />
      <Toggle label={L('Épicé', 'Spicy')} value={spicy} onChange={setSpicy} />
      <Card>
        <H2>{L('Ingrédients par portion', 'Ingredients per portion')}</H2>
        <Muted style={{ marginBottom: 8 }}>{L('Servent à générer votre liste de courses.', 'Used to build your shopping list.')}</Muted>
        {ings.map((i, k) => (
          <Row key={k} gap={6}>
            <View style={{ flex: 3 }}><Field label={L('Ingrédient', 'Ingredient')} value={i.name} onChangeText={(v) => setIngs((l) => l.map((x, j) => (j === k ? { ...x, name: v } : x)))} /></View>
            <View style={{ flex: 1.3 }}><Field label={L('Qté', 'Qty')} value={i.qty} keyboardType="decimal-pad" onChangeText={(v) => setIngs((l) => l.map((x, j) => (j === k ? { ...x, qty: v } : x)))} /></View>
            <View style={{ flex: 1.1 }}><Field label={L('Unité', 'Unit')} value={i.unit} onChangeText={(v) => setIngs((l) => l.map((x, j) => (j === k ? { ...x, unit: v } : x)))} /></View>
            <IconButton icon="trash-outline" label={L('Supprimer', 'Delete')} onPress={() => setIngs((l) => l.filter((_, j) => j !== k))} />
          </Row>
        ))}
        <Button small variant="ghost" icon="add" title={L('Ajouter un ingrédient', 'Add ingredient')} onPress={() => setIngs((l) => [...l, { name: '', qty: '', unit: 'g' }])} />
      </Card>
      <Toggle label={L('Plat visible (actif)', 'Dish visible (active)')} value={active} onChange={setActive} />
      <Button title={L('Enregistrer le plat', 'Save dish')} disabled={!valid} onPress={save} />
      {ex ? <><Spacer h={8} /><Button variant="danger" title={L('Supprimer le plat', 'Delete dish')} onPress={() => confirmAsk(L('Supprimer ce plat ?', 'Delete this dish?'), () => { setDishes((l) => l.filter((x) => x.id !== ex.id)); router.back(); })} /></> : null}
    </Screen>
  );
}
