import { NativeModules } from 'react-native';
import Transport from '@ledgerhq/hw-transport';
import { log } from '@ledgerhq/logs';
import EventEmitter from './EventEmitter';

const NativeBle = NativeModules.HwTransportReactNativeBle;

class Ble extends Transport {
  static uuid: String = ''; // We probably need more information than the uuid
  static scanObserver: any;
  static isScanning: Boolean = false;
  static isConnected: Boolean = false;

  static listeners = EventEmitter?.addListener('BleTransport', (rawEvent) => {
    const { event, type, data } = JSON.parse(rawEvent);
    log('ble', JSON.stringify({ type }));

    switch (event) {
      case 'status':
        /// Status handling
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
        // Do something
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
    log('ble-verbose', `user connect req (${_uuid})`);
    Ble.uuid = _uuid;

    return new Promise((resolve) => {
      NativeBle.connect(_uuid, resolve);
    });
  };

  static disconnect = (id: any): Promise<any> => {
    log('ble-verbose', `user disconnect req (${id})`);

    return new Promise((resolve) => {
      NativeBle.disconnect(resolve);
    });
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
    console.log('wadus', e, result);
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
        return new Error(error);
    }
  };

  static runner = (url) => {
    // DO it dynamically
    log('ble-verbose', `request to launch runner for url ${url}`);
    NativeBle.runner(url);
  };
}

export default Ble;
