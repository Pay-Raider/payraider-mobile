import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { usePreflight } from '@hooks/usePreflight';
import type {
  PreflightCheckStatus,
  PreflightDecision,
  PreflightResult,
} from '@app-types/preflight';

const DECISIONS: Record<
  PreflightDecision,
  { label: string; color: string; background: string }
> = {
  proceed: { label: 'Proceed', color: '#166534', background: '#DCFCE7' },
  caution: { label: 'Caution', color: '#854D0E', background: '#FEF9C3' },
  hold: { label: 'Hold', color: '#991B1B', background: '#FEE2E2' },
  unknown: { label: 'Unknown', color: '#374151', background: '#F3F4F6' },
};

const CHECK_SYMBOLS: Record<PreflightCheckStatus, string> = {
  pass: '✓',
  warn: '!',
  fail: '✕',
};

const CHECK_COLORS: Record<PreflightCheckStatus, string> = {
  pass: '#16A34A',
  warn: '#CA8A04',
  fail: '#DC2626',
};

const CHECK_NAMES: Record<string, string> = {
  success_rate: 'Success rate',
  liquidity: 'Liquidity',
  sample_size: 'Sample size',
  health_score: 'Health score',
};

function parseAmount(text: string): number | undefined {
  const cleaned = text.replace(/[$,\s]/g, '');
  return cleaned ? Number(cleaned) : undefined;
}

const Result: React.FC<{ result: PreflightResult }> = ({ result }) => {
  const decision = DECISIONS[result.decision] ?? DECISIONS.unknown;

  return (
    <View testID="preflight-result">
      <View
        style={[styles.decision, { backgroundColor: decision.background }]}
        accessible
        accessibilityRole="summary"
        accessibilityLabel={`Decision: ${decision.label}. ${result.summary}`}
      >
        <Text style={[styles.decisionLabel, { color: decision.color }]}>
          {decision.label}
        </Text>
        <Text style={styles.summary}>{result.summary}</Text>
        {result.score !== null ? (
          <Text style={styles.meta}>Health score {result.score.toFixed(0)} of 100</Text>
        ) : null}
      </View>

      {result.checks.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Checks</Text>
          {result.checks.map(item => (
            <View key={item.name} style={styles.checkRow}>
              <Text
                style={[styles.checkSymbol, { color: CHECK_COLORS[item.status] }]}
                accessibilityLabel={item.status}
              >
                {CHECK_SYMBOLS[item.status]}
              </Text>
              <View style={styles.checkBody}>
                <Text style={styles.checkName}>{CHECK_NAMES[item.name] ?? item.name}</Text>
                <Text style={styles.checkDetail}>{item.detail}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {result.alternatives.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Healthier alternatives</Text>
          {result.alternatives.map(alt => (
            <View key={alt.id} style={styles.altRow}>
              <Text style={styles.altTitle}>
                {alt.source_asset} → {alt.destination_asset}
              </Text>
              <Text style={styles.meta}>
                {alt.success_rate.toFixed(1)}% success · health {alt.health_score.toFixed(0)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
};

export const PreflightCheck: React.FC = () => {
  const [source, setSource] = useState('USDC');
  const [destination, setDestination] = useState('');
  const [amount, setAmount] = useState('');
  const { result, loading, error, check } = usePreflight();

  const submit = async () => {
    await check({
      source_asset: source,
      destination_asset: destination,
      amount_usd: parseAmount(amount),
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.intro}>
            Check a corridor before you pay out. PayRaider looks at recent payments on
            the Stellar ledger and tells you whether to proceed.
          </Text>

          <View style={styles.card}>
            <Text style={styles.label}>Sending</Text>
            <TextInput
              style={styles.input}
              value={source}
              onChangeText={setSource}
              autoCapitalize="characters"
              autoCorrect={false}
              placeholder="USDC"
              accessibilityLabel="Asset you are sending"
              testID="preflight-source"
            />
            <Text style={styles.label}>Recipient receives</Text>
            <TextInput
              style={styles.input}
              value={destination}
              onChangeText={setDestination}
              autoCapitalize="characters"
              autoCorrect={false}
              placeholder="NGN"
              accessibilityLabel="Asset the recipient receives"
              testID="preflight-destination"
            />
            <Text style={styles.label}>Amount in USD (optional)</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="2500"
              accessibilityLabel="Amount in US dollars"
              testID="preflight-amount"
            />
            <Pressable
              style={({ pressed }) => [
                styles.button,
                (pressed || loading) && styles.buttonPressed,
              ]}
              onPress={submit}
              disabled={loading}
              accessibilityRole="button"
              accessibilityState={{ disabled: loading, busy: loading }}
              testID="preflight-submit"
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Check payment</Text>
              )}
            </Pressable>
          </View>

          {error ? (
            <Text style={styles.error} accessibilityRole="alert" testID="preflight-error">
              {error}
            </Text>
          ) : null}

          {result ? <Result result={result} /> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Platform.OS === 'ios' ? '#F2F2F7' : '#FAFAFA',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  intro: {
    fontSize: 15,
    color: '#525252',
    marginBottom: 16,
    lineHeight: 21,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#404040',
    marginBottom: 6,
  },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#D4D4D4',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#171717',
    marginBottom: 14,
  },
  button: {
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: Platform.OS === 'ios' ? '#007AFF' : '#1976D2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: '#B91C1C',
    fontSize: 14,
    marginBottom: 16,
  },
  decision: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  decisionLabel: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  summary: {
    fontSize: 15,
    color: '#262626',
    lineHeight: 21,
  },
  meta: {
    fontSize: 13,
    color: '#525252',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#171717',
    marginBottom: 10,
  },
  checkRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  checkSymbol: {
    width: 22,
    fontSize: 16,
    fontWeight: '700',
  },
  checkBody: {
    flex: 1,
  },
  checkName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#262626',
  },
  checkDetail: {
    fontSize: 13,
    color: '#525252',
  },
  altRow: {
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5E5',
  },
  altTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#171717',
  },
});
