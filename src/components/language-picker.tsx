import { pilotText } from '@/i18n/catalog';
import { detectedLocale } from '@/i18n/deviceLocale';
import { LOCALES, localeMeta } from '@/i18n/locales';
import { useData, useL } from '@/lib/data';
import { Badge, Card, ListItem, Muted } from '@/ui/kit';

export function LanguagePicker() {
  const { prefs, setPrefs } = useData();
  const { lang } = useL();
  const device = detectedLocale();
  const text = (key: Parameters<typeof pilotText>[1]) => pilotText(lang, key).text;
  return (
    <>
      <Muted style={{ marginBottom: 8 }}>{text('localeDevice')} : {localeMeta(device).endonym}</Muted>
      <Card>
        <ListItem
          icon="phone-portrait-outline"
          title={text('localeUseDevice')}
          subtitle={localeMeta(device).endonym}
          onPress={() => setPrefs((current) => ({ ...current, lang: device }))}
        />
        {LOCALES.map((locale) => (
          <ListItem
            key={locale.id}
            icon={prefs.lang === locale.id ? 'radio-button-on' : 'radio-button-off'}
            title={locale.endonym}
            subtitle={locale.direction === 'rtl' ? text('localeRtl') : undefined}
            right={<Badge label={locale.complete ? text('localeComplete') : text('localeFallback')} tone={locale.complete ? 'success' : 'warning'} />}
            onPress={() => setPrefs((current) => ({ ...current, lang: locale.id }))}
          />
        ))}
      </Card>
    </>
  );
}
