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
  const [isConnected, setIsConnected] = React.useState<boolean>(false);
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

  const onConnect = useCallback((uuid) => {
    BleTransport.connect(uuid).then(() => setIsConnected(true));
  }, []);

  const onDisconnect = useCallback(() => {
    if (!isConnected) return;
    BleTransport.disconnect().then(() => setIsConnected(false));
  }, [isConnected]);

  const onExchange = useCallback(() => {
    if (!isConnected) return;
    const result = BleTransport.exchange('b001000000');
    result.then(([e, apdu]) => {
      log(e ? 'error' : 'apdu', e ? e : `<= ${apdu}`);
    });
  }, [isConnected]);

  const onInstallBTC = useCallback(() => {
    if (!isConnected) return;
    let url =
      'wss://scriptrunner.api.live.ledger.com/update/install?' +
      'targetId=855638020' +
      '&perso=perso_11' +
      '&firmware=nanox%2F2.0.2-2%2Fbitcoin%2Fapp_2.0.4' +
      '&firmwareKey=nanox%2F2.0.2-2%2Fbitcoin%2Fapp_2.0.4_key' +
      '&hash=8bf06e39e785ba5a8cf27bfa95036ccab02d756f8b8f44c3c3137fd035d5cb0c' +
      '&livecommonversion=22.0.0';
    BleTransport.runner(url); // Long running task init
  }, [isConnected]);

  const onUninstallBTC = useCallback(() => {
    if (!isConnected) return;
    let url =
      'wss://scriptrunner.api.live.ledger.com/update/install?' +
      'targetId=855638020' +
      '&perso=perso_11' +
      '&firmware=nanox%2F2.0.2-2%2Fbitcoin%2Fapp_2.0.4_del' +
      '&firmwareKey=nanox%2F2.0.2-2%2Fbitcoin%2Fapp_2.0.4_del_key' +
      '&hash=8bf06e39e785ba5a8cf27bfa95036ccab02d756f8b8f44c3c3137fd035d5cb0c' +
      '&livecommonversion=22.0.0';
    BleTransport.runner(url); // Long running task init
  }, [isConnected]);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{'Demo of the BleTransport RN Module'}</Text>
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.btn} onPress={onStart}>
          <Text>{'Scan'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={onDisconnect}>
          <Text style={!isConnected ? styles.disabled : {}}>{'Disc.'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={onExchange}>
          <Text style={!isConnected ? styles.disabled : {}}>{'Send'}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.btn} onPress={onInstallBTC}>
          <Text style={!isConnected ? styles.disabled : {}}>
            {'Install BTC'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={onUninstallBTC}>
          <Text style={!isConnected ? styles.disabled : {}}>
            {'Uninstall BTC'}
          </Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.header}>{'Visible devices (click to connect)'}</Text>
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
      <View style={[styles.wrapper, { flex: 3 }]}>
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
  disabled: {
    color: '#ccc',
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
