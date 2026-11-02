import { Component, type ReactNode } from 'react';
import { Text, View } from 'react-native';
import { en, fr } from '@/i18n';
import { reportCrash } from '@/lib/sentry';
import { theme as t } from './theme';

type Props = { children: ReactNode; onReset?: () => void };
type State = { error: Error | null };

/** Filet global : un écran cassé affiche un repli, pas une page blanche. */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error): void {
    reportCrash(error, 'error-boundary');
  }

  private reset = () => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, padding: 24, justifyContent: 'center' }}>
        <Text accessibilityRole="header" style={{ color: t.text, fontSize: t.type.h2, fontWeight: '700', marginBottom: 8 }}>{fr.crashTitle}</Text>
        <Text style={{ color: t.muted, fontSize: t.type.body, lineHeight: 22 }}>{fr.crashBody}</Text>
        <Text style={{ color: t.muted, fontSize: t.type.caption, marginTop: 8 }}>{en.crashTitle}. {en.crashBody}</Text>
        <Text
          accessibilityRole="button"
          onPress={this.reset}
          style={{ marginTop: 20, backgroundColor: t.primary, color: t.onPrimary, textAlign: 'center', paddingVertical: 14, borderRadius: t.radius, fontWeight: '700', overflow: 'hidden' }}
        >
          {fr.crashRetry} · {en.crashRetry}
        </Text>
      </View>
    );
  }
}
