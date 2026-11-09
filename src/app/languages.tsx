import { LanguagePicker } from '@/components/language-picker';
import { useL } from '@/lib/data';
import { Muted, Screen } from '@/ui/kit';

export default function Languages() {
  const { L } = useL();
  return (
    <Screen>
      <Muted style={{ marginBottom: 8 }}>
        {L(
          'Français et anglais sont complets. Les autres langues affichent l’anglais en attendant une traduction relue. Les allergènes et les mentions légales ne sont pas traduits automatiquement.',
          'French and English are complete. Other languages show English until a reviewed translation exists. Allergens and legal text are not machine-translated.',
        )}
      </Muted>
      <LanguagePicker />
    </Screen>
  );
}
