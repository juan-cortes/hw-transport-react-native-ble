import React, { useCallback } from 'react';
import { Observable } from 'rxjs';
import { StyleSheet, View, Text, Button } from 'react-native';
import BleTransport from 'hw-transport-react-native-ble';

export default function App() {
  const [entries, setEntries] = React.useState<string[]>([]);
  const onStart = useCallback(() => {
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

  return (
    <View style={styles.container}>
      <Button onPress={onStart} title={'Start'} />
      <Button onPress={onStop} title={'Stop'} />
      <View style={styles.wrapper}>
        {entries.map((e) => (
          <Text key={e}>{e}</Text>
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
