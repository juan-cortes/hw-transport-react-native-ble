import { AppRegistry } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';
import { registerTransportModule } from '@ledgerhq/live-common/lib/hw';
import BleTransport from 'hw-transport-react-native-ble';
import { setDeviceMode } from '@ledgerhq/live-common/lib/hw/actions/app';

/// Register transports
setDeviceMode('polling');
registerTransportModule({
  id: 'ble',
  open: (id) => {
    console.log('trying to open');
    return BleTransport.open(id);
  },
  disconnect: (id) => BleTransport.disconnect(id),
});

AppRegistry.registerComponent(appName, () => App);
