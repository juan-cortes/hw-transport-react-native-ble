import React, { useCallback } from 'react';
import { Observable } from 'rxjs';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import BleTransport from 'hw-transport-react-native-ble';

export default function App() {
  const [entries, setEntries] = React.useState<string[]>([]);
  const onStart = useCallback(() => {
    setEntries([]);
    const sub = new Observable((s) => BleTransport.scan(s)).subscribe({
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

  return (
    <View style={styles.container}>
      <Text>{'Demo of the BleTransport RN Module'}</Text>
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.btn} onPress={onStart}>
          <Text>{'Scan'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={onStop}>
          <Text>{'Kill'}</Text>
        </TouchableOpacity>
      </View>
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
  buttons: {
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 20,
  },
  btn: {
    borderWidth: 1,
    flex: 1,
    padding: 8,
    borderColor: 'black',
    alignItems: 'center',
  },
  wrapper: {
    borderWidth: 1,
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
