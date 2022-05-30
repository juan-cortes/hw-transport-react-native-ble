import { AppState, NativeModules } from 'react-native';
import Transport from '@ledgerhq/hw-transport';
import { log } from '@ledgerhq/logs';
import EventEmitter from './EventEmitter';

const NativeBle = NativeModules.HwTransportReactNativeBle;

class Ble extends Transport {
  static appState: String = 'background';
  static appStateSubscription: any;
  static uuid: String = ''; // We probably need more information than the uuid
  static scanObserver: any;
  static isScanning: Boolean = false;

  // To be called from live-common-setup (?) and removed afterwards?
  // Not sure whether we need to cleanup or not if only invoked once
  static listenToAppStateChanges = () => {
    return AppState.addEventListener('change', (state) => {
      switch (state) {
        case 'active':
          NativeBle.onAppStateChange(true);
          break;
        case 'inactive':
          NativeBle.onAppStateChange(false);
          break;
      }
    });
  };

  static listeners = EventEmitter?.addListener('BleTransport', (rawEvent) => {
    const { event, type, data } = JSON.parse(rawEvent);

    switch (event) {
      case 'status':
        /// Status handling
        log('ble', type);
        switch (type) {
          case 'start-scanning':
            Ble.isScanning = true;
            break;
          case 'stop-scanning':
            Ble.isScanning = false;
            break;
        }
        break;
      case 'task':
        switch (type) {
          case 'bulk-progress':
            log('ble', `bulk-progress ${Math.round(data?.progress)}`);
            break;
          default:
            log('ble', type);
            break;
        }
        break;
      case 'new-device':
        Ble.scanObserver.next(data); // Polyfill with device data based on serviceUUID?
        break;
    }
  });

  /// TODO events and whatnot
  static listen(observer: any) {
    log('ble-verbose', 'listen...');
    if (!Ble.isScanning) {
      Ble.isScanning = true;
      Ble.scanObserver = observer;
      NativeBle.listen();
    }

    // Provide a way to cleanup after a listen
    const unsubscribe = () => {
      Ble.stop();
      log('ble-verbose', 'done listening.');
    };

    return {
      unsubscribe,
    };
  }

  private static stop = (): void => {
    Ble.isScanning = false;
    NativeBle.stop();
  };

  private static connect = async (_uuid: String): Promise<any> => {
    log('ble-verbose', `connecting (${_uuid})`);
    Ble.uuid = _uuid;

    return new Promise((f, r) => NativeBle.connect(_uuid, Ble.promisify(f, r)));
  };

  static disconnect = (): Promise<any> => {
    log('ble-verbose', `disconnecting`); // Thought about multi devices?
    return new Promise((f, r) => NativeBle.disconnect(Ble.promisify(f, r)));
  };

  static exchange = (apdu: Buffer): Promise<any> => {
    const apduString = apdu.toString('hex');
    log('apdu', `=> ${apduString}`);

    return new Promise((f, r) =>
      NativeBle.exchange(apduString, Ble.promisify(f, r))
    );
  };

  // React-Native modules use error-first Node-style callbacks
  // we promisify them to handle inasync/await pattern instead
  private static promisify = (resolve, reject) => (e, result) => {
    if (e) {
      reject(Ble.mapError(e)); // TODO introduce some error mapping
      return;
    }
    resolve(result);
  };

  // Map the received error string to a known (or generic) error
  // that we can handle correctly.
  private static mapError = (error: String) => {
    switch (error) {
      case 'user-pending-action':
        return new Error('Action was pending yada yada');
      default:
        return new Error('generic');
    }
  };

  static runner = (url) => {
    // DO it dynamically
    log('ble-verbose', `request to launch runner for url ${url}`);
    NativeBle.runner(url);
  };
}

export default Ble;
