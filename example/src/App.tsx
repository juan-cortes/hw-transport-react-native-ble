import React, { useEffect, useCallback } from 'react';
import { Observable } from 'rxjs';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import BleTransport from 'hw-transport-react-native-ble';
import { log, listen } from '@ledgerhq/logs';

export default function App() {
  const [entries, setEntries] = React.useState<string[]>([]);
  const [logs, setLogs] = React.useState<string[]>([]);
  useEffect(() => {
    listen(({ type, message }) => {
      setLogs((logs) => [JSON.stringify({ type, message }), ...logs]);
    });
  }, []);
  const onStart = useCallback(() => {
    setEntries([]);
    const sub = new Observable((s) => BleTransport.listen(s)).subscribe({
      next: (entry) =>
        setEntries((currentEntries) => [entry, ...currentEntries]),
    });
    return () => {
      sub.ubsubscribe();
    };
  }, []);

  const onStop = useCallback(() => {
    BleTransport.stop();
  }, []);

  const onConnect = useCallback((uuid) => {
    BleTransport.connect(uuid);
  }, []);

  const onDisconnect = useCallback(() => {
    BleTransport.disconnect();
  }, []);

  const onExchange = useCallback(() => {
    const result = BleTransport.exchange('b001000000');
    result.then((apdu) => {
      log('apdu ', `<= ${apdu}`);
    });
  }, []);

  const onInstallBTC = useCallback(() => {
    BleTransport.installBTC(); // Long running task init
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{'Demo of the BleTransport RN Module'}</Text>
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.btn} onPress={onStart}>
          <Text>{'Scan'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={onStop}>
          <Text>{'Kill'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={onDisconnect}>
          <Text>{'Disc.'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={onExchange}>
          <Text>{'Send'}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.btn} onPress={onInstallBTC}>
          <Text>{'Install BTC'}</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.header}>{'Visible devices'}</Text>
      <View style={styles.wrapper}>
        {entries.map((e) => (
          <TouchableOpacity
            key={e}
            style={[styles.btn, { flex: 0 }]}
            onPress={() => onConnect(e)}
          >
            <Text>{e}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.header}>{'Logs'}</Text>
      <View style={styles.wrapper}>
        <ScrollView>
          {logs.map((e, i) => (
            <Text key={`log_${i}`}>{e}</Text>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#eeeeee',
    width: '100%',
    borderColor: 'black',
    borderWidth: 1,
  },
  buttons: {
    flexDirection: 'row',
    padding: 10,
  },
  btn: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eeeeee',
  },
  wrapper: {
    padding: 8,
    flex: 1,
    width: '100%',
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
});
