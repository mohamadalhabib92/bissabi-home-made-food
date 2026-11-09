import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { allergenLabel } from '@/i18n/allergens';
import { authoredText } from '@/i18n/authored';
import { DishVisual } from '@/components/brand';
import { useI18n } from '@/i18n';
import { confirmAsk } from '@/lib/confirm';
import { useData, useL } from '@/lib/data';
import { allergensFromStatus, publishIssues, statusFromDish, type AllergenDraft, type PublishIssue } from '@/lib/dishPublish';
import { ALLERGENS, CUISINES, type Allergen, type AllergenLevel, type AnimalOrigin, type Cuisine, type Dish, type Ingredient } from '@/lib/model';
import { MIN_LEAD_HOURS } from '@/lib/pricing';
import { uid } from '@/lib/storage';
import { Button, Card, Chip, Empty, Field, H2, IconButton, Muted, Notice, Row, Screen, Segmented, Spacer, Toggle } from '@/ui/kit';
import { theme as ui } from '@/ui/theme';

const EMOJIS = ['🍲', '🍛', '🥘', '🍗', '🥙', '🥗', '🍝', '🥟', '🍰', '🧆', '🫓', '🍚'];
const LEVELS: AllergenLevel[] = ['present', 'traces', 'absent'];
const ISSUE_KEY: Record<PublishIssue, 'publishAllergens' | 'publishIngredients' | 'publishPhoto' | 'publishConservation' | 'publishReheating' | 'publishAnimal' | 'publishProvenance' | 'publishBakery' | 'publishCountry'> = {
  allergens: 'publishAllergens',
  ingredients: 'publishIngredients',
  photo: 'publishPhoto',
  conservation: 'publishConservation',
  reheating: 'publishReheating',
  animal: 'publishAnimal',
  provenance: 'publishProvenance',
  bakery: 'publishBakery',
  country: 'publishCountry',
};

export default function DishEditor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { myCook, dishes, setDishes } = useData();
  const { L, lang } = useL();
  const { t } = useI18n();
  const router = useRouter();
  const ex = dishes.find((d) => d.id === id && d.cookId === myCook?.id);
  const [title, setTitle] = useState(ex?.title ?? '');
  const [description, setDescription] = useState(ex?.description ?? '');
  const [cuisine, setCuisine] = useState<Cuisine>(ex?.cuisine ?? 'sahel');
  const [price, setPrice] = useState(ex ? ex.price.toFixed(2) : '');
  const [status, setStatus] = useState<AllergenDraft>(() => statusFromDish(ex));
  const [halal, setHalal] = useState(ex?.halal ?? !!myCook?.halalKitchen);
  const [veg, setVeg] = useState(ex?.vegetarian ?? false);
  const [spicy, setSpicy] = useState(ex?.spicy ?? false);
  const [lead, setLead] = useState(String(ex?.leadHours ?? MIN_LEAD_HOURS));
  const [ings, setIngs] = useState<{ name: string; qty: string; unit: string }[]>(ex?.ingredients.map((i) => ({ ...i, qty: String(i.qty) })) ?? [{ name: '', qty: '', unit: 'g' }]);
  const [emoji, setEmoji] = useState(ex?.emoji ?? '🍲');
  const [photo, setPhoto] = useState<string | undefined>(ex?.photo);
  const [active, setActive] = useState(ex?.active ?? true);
  const [animal, setAnimal] = useState<AnimalOrigin | null>(ex?.animalOrigin ?? null);
  const [provenance, setProvenance] = useState(ex?.provenance ?? '');
  const [bakery, setBakery] = useState<boolean | null>(ex?.isBakery ?? null);
  const [country, setCountry] = useState(ex?.productionCountry ?? '');
  const [conservation, setConservation] = useState(ex?.conservation ?? '');
  const [reheating, setReheating] = useState(ex?.reheating ?? '');
  const [portion, setPortion] = useState(ex?.portionLabel ?? '');
  if (!myCook) return <Screen><Empty title={L('Créez d’abord votre profil', 'Create your profile first')} /></Screen>;
  const p = Number(price.replace(',', '.'));
  const lh = Number(lead);
  const cleanIngs: Ingredient[] = ings.filter((i) => i.name.trim() && Number(i.qty.replace(',', '.')) > 0).map((i) => ({ name: i.name.trim(), qty: Number(i.qty.replace(',', '.')), unit: i.unit.trim() || 'g' }));
  const allergenOk = ALLERGENS.every((a) => status[a.key] === 'present' || status[a.key] === 'traces' || status[a.key] === 'absent');
  const issues = publishIssues({
    allergenStatus: status, ingredients: cleanIngs, photo, conservation, reheating,
    animalOrigin: animal, provenance, isBakery: bakery, productionCountry: country,
  });
  const errs = {
    title: title.trim().length < 3 ? L('3 caractères minimum', '3 characters minimum') : undefined,
    price: !(p >= 2 && p <= 200) ? L('Prix par portion entre CHF 2 et 200', 'Price per portion between CHF 2 and 200') : undefined,
    lead: !(lh >= MIN_LEAD_HOURS && lh <= 168) ? L(`Entre ${MIN_LEAD_HOURS} et 168 h`, `Between ${MIN_LEAD_HOURS} and 168 h`) : undefined,
  };
  const valid = !Object.values(errs).some(Boolean) && description.trim().length >= 10 && allergenOk && (!active || issues.length === 0);
  const levelLabel = (level: AllergenLevel) => (level === 'present' ? t('allergenPresent') : level === 'traces' ? t('allergenTraces') : t('allergenAbsent'));
  const setLevel = (key: Allergen, level: AllergenLevel) => setStatus((s) => ({ ...s, [key]: level }));
  const markNone = (v: boolean) => {
    if (!v) return;
    const next: AllergenDraft = {};
    for (const a of ALLERGENS) next[a.key] = 'absent';
    setStatus(next);
  };
  const pick = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.5, allowsEditing: true, aspect: [4, 3], base64: Platform.OS === 'web' });
    const a = r.canceled ? null : r.assets[0];
    if (a) setPhoto(Platform.OS === 'web' && a.base64 ? `data:${a.mimeType ?? 'image/jpeg'};base64,${a.base64}` : a.uri);
  };
  const save = () => {
    const d: Dish = {
      ...(ex ?? { cookId: myCook.id, emoji, active }),
      id: ex?.id ?? uid('dish_'), cookId: myCook.id, title: title.trim(), description: description.trim(), cuisine,
      price: Math.round(p * 20) / 20,
      allergens: allergensFromStatus(status), allergensConfirmed: true, allergenStatus: status,
      halal, vegetarian: veg, spicy, ingredients: cleanIngs, leadHours: lh, photo, emoji, active,
      animalOrigin: animal ?? undefined, provenance: provenance.trim() || undefined,
      isBakery: bakery ?? undefined, productionCountry: country.trim() || undefined,
      conservation: conservation.trim() || undefined, reheating: reheating.trim() || undefined,
      portionLabel: portion.trim() || undefined,
    };
    setDishes((l) => (ex ? l.map((x) => (x.id === d.id ? d : x)) : [...l, d]));
    router.back();
  };
  const preview: Dish = {
    id: ex?.id ?? 'new', cookId: myCook.id, title, description, cuisine, price: p || 0,
    allergens: allergensFromStatus(status), allergensConfirmed: allergenOk, allergenStatus: status,
    halal, vegetarian: veg, spicy, ingredients: cleanIngs, leadHours: lh, photo, emoji, active,
  };
  return (
    <Screen>
      <DishVisual dish={preview} wide />
      <Spacer h={8} />
      <Row wrap>
        <Button small variant="secondary" icon="image-outline" title={photo ? L('Changer la photo', 'Change photo') : L('Ajouter une photo', 'Add a photo')} onPress={pick} />
        {photo ? <Button small variant="ghost" title={L('Retirer', 'Remove')} onPress={() => setPhoto(undefined)} /> : null}
      </Row>
      {!photo ? <Row wrap>{EMOJIS.map((e) => <Chip key={e} label={e} active={emoji === e} onPress={() => setEmoji(e)} />)}</Row> : null}
      <Muted style={{ fontSize: 12 }}>{L('Photo stockée sur cet appareil uniquement (pas encore d’hébergement en ligne). Une photo est obligatoire pour publier.', 'Photo stored on this device only (no online hosting yet). A photo is required to publish.')}</Muted>
      <Spacer />
      <Field label={L('Nom du plat', 'Dish name')} value={title} onChangeText={setTitle} error={title ? errs.title : undefined} />
      <Field label={L('Description', 'Description')} value={description} onChangeText={setDescription} multiline placeholder={L('Ce qui le rend unique…', 'What makes it special…')} />
      <Field label={L('Portion (g ou nombre de personnes, facultatif)', 'Portion (g or servings, optional)')} value={portion} onChangeText={setPortion} placeholder="450 g" />
      <Muted>{L('Cuisine', 'Cuisine')}</Muted>
      <Row wrap>{CUISINES.map((c) => <Chip key={c.key} label={authoredText(c, lang)} active={cuisine === c.key} onPress={() => setCuisine(c.key)} />)}</Row>
      <Spacer h={8} />
      <Row>
        <View style={{ flex: 1 }}><Field label={L('Prix / portion (CHF)', 'Price / portion (CHF)')} value={price} onChangeText={setPrice} keyboardType="decimal-pad" error={price ? errs.price : undefined} /></View>
        <View style={{ flex: 1 }}><Field label={L('Délai min. (h)', 'Min. notice (h)')} value={lead} onChangeText={setLead} keyboardType="number-pad" error={errs.lead} /></View>
      </Row>
      <Card>
        <H2>{L('Allergènes (obligatoire)', 'Allergens (required)')}</H2>
        <Muted style={{ marginBottom: 8 }}>{L('Les 14 allergènes : Présent, Traces ou Absent pour chacun (OIDAl, annexe 6).', 'The 14 allergens: Present, Traces or Absent for each (Swiss OIDAl, annex 6).')}</Muted>
        {allergenLabel('gluten', lang).needsReview ? <Notice tone="warning" title={L('Relecture humaine requise', 'Human review required')} text={L('Les noms d’allergènes affichés sont la version anglaise déjà relue. Ils ne sont pas traduits automatiquement.', 'Allergen names shown are the reviewed English version. They are not machine-translated.')} /> : null}
        {ALLERGENS.map((a) => (
          <View key={a.key} style={{ marginBottom: 8 }}>
            <Text style={{ color: ui.text, fontWeight: '600', marginBottom: 4 }}>{allergenLabel(a.key, lang).text}</Text>
            <Row wrap>
              {LEVELS.map((level) => (
                <Chip key={level} label={levelLabel(level)} active={status[a.key] === level} color={level === 'present' ? ui.primary : level === 'traces' ? ui.warning : ui.secondary} onPress={() => setLevel(a.key, level)} />
              ))}
            </Row>
          </View>
        ))}
        <Toggle label={L('Je confirme : aucun de ces 14 allergènes', 'I confirm: none of these 14 allergens')} value={allergenOk && ALLERGENS.every((a) => status[a.key] === 'absent')} onChange={markNone} />
        {!allergenOk ? <Notice tone="warning" title={t('publishAllergens')} /> : null}
      </Card>
      <Toggle label="Halal" value={halal} onChange={setHalal} />
      <Toggle label={L('Végétarien', 'Vegetarian')} value={veg} onChange={setVeg} />
      <Toggle label={L('Épicé', 'Spicy')} value={spicy} onChange={setSpicy} />
      <Card>
        <H2>{L('Viande, poisson, boulangerie', 'Meat, fish, bakery')}</H2>
        <Segmented<AnimalOrigin | 'unset'>
          label={L('Viande ou poisson', 'Meat or fish')}
          value={animal ?? 'unset'}
          onChange={(v) => { if (v !== 'unset') setAnimal(v); }}
          options={[
            { label: L('Aucun', 'None'), value: 'none' },
            { label: L('Viande', 'Meat'), value: 'meat' },
            { label: L('Poisson', 'Fish'), value: 'fish' },
            { label: L('Les deux', 'Both'), value: 'both' },
          ]}
        />
        {animal && animal !== 'none' ? <Field label={t('provenance')} value={provenance} onChangeText={setProvenance} placeholder={L('Pays ou région d’élevage / de pêche', 'Country or region of farming / fishing')} /> : null}
        <Segmented<'yes' | 'no' | 'unset'>
          label={L('Pain ou pâtisserie (quiche, tarte, pizza, viennoiserie)', 'Bread or pastry (quiche, tart, pizza, viennoiserie)')}
          value={bakery == null ? 'unset' : bakery ? 'yes' : 'no'}
          onChange={(v) => { if (v !== 'unset') setBakery(v === 'yes'); }}
          options={[{ label: L('Non', 'No'), value: 'no' }, { label: L('Oui', 'Yes'), value: 'yes' }]}
        />
        {bakery ? <Field label={t('productionCountry')} value={country} onChangeText={setCountry} placeholder={L('Pays de production', 'Country of production')} /> : null}
        <Muted>{L('Répondez explicitement : « Non » est un choix, pas une case pré-cochée au chargement d’une nouvelle fiche.', 'Answer explicitly: “No” is a choice. A new dish does not pre-select it until you tap.')}</Muted>
      </Card>
      <Field label={t('conservation')} value={conservation} onChangeText={setConservation} placeholder={L('Réfrigérateur ≤ 5 °C, consommer sous … h', 'Fridge ≤ 5 °C, eat within … h')} />
      <Field label={t('reheating')} value={reheating} onChangeText={setReheating} multiline placeholder={L('Four, poêle, température…', 'Oven, pan, temperature…')} />
      <Card>
        <H2>{L('Ingrédients par portion', 'Ingredients per portion')}</H2>
        <Muted style={{ marginBottom: 8 }}>{L('Servent à générer votre liste de courses. Au moins un ingrédient pour publier.', 'Used to build your shopping list. At least one ingredient to publish.')}</Muted>
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
      {active && issues.length ? (
        <Notice tone="warning" title={t('publishBlocked')} text={issues.map((i) => t(ISSUE_KEY[i])).join(' · ')} />
      ) : null}
      <Button title={L('Enregistrer le plat', 'Save dish')} disabled={!valid} onPress={save} />
      {ex ? <><Spacer h={8} /><Button variant="danger" title={L('Supprimer le plat', 'Delete dish')} onPress={() => confirmAsk(L('Supprimer ce plat ?', 'Delete this dish?'), () => { setDishes((l) => l.filter((x) => x.id !== ex.id)); router.back(); })} /></> : null}
    </Screen>
  );
}
