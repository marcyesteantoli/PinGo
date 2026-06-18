import { Component, type ReactNode, type ErrorInfo } from 'react'
import { Text, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Sentry } from '@lib/sentry'

interface Props { children: ReactNode }
interface State { error: Error | null }

export class SentryErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    Sentry.captureException(error, { extra: { componentStack: info.componentStack } })
  }

  render() {
    if (this.state.error) {
      return (
        <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
          <Text style={{ fontSize: 17, fontWeight: '600', textAlign: 'center' }}>
            Algo salió mal
          </Text>
          <Text style={{ fontSize: 15, color: '#666', textAlign: 'center' }}>
            El error ha sido reportado automáticamente.
          </Text>
          <Pressable
            onPress={() => this.setState({ error: null })}
            style={{ paddingVertical: 12, paddingHorizontal: 24, backgroundColor: '#0046de', borderRadius: 12 }}
          >
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>Reintentar</Text>
          </Pressable>
        </SafeAreaView>
      )
    }
    return this.props.children
  }
}
