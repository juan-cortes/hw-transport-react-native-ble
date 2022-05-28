import { NativeModules } from 'react-native';
import Transport from '@ledgerhq/hw-transport';
import { log } from '@ledgerhq/logs';
import EventEmitter from './EventEmitter';

const HwTransportReactNativeBle = NativeModules.HwTransportReactNativeBle;

class BleTransport extends Transport {
  static uuid: String = ''; // We probably need more information than the uuid
  static scanObserver: any;
  static isScanning: Boolean = false;
  static isConnected: Boolean = false;

  static listeners = EventEmitter?.addListener('BleTransport', (rawEvent) => {
    const { event, type, data } = JSON.parse(rawEvent);
    log('ble', JSON.stringify({ type, data }));

    switch (event) {
      case 'status':
        /// Status handling
        switch (type) {
          case 'start-scanning':
            BleTransport.isScanning = true;
            break;
          case 'stop-scanning':
            BleTransport.isScanning = false;
            break;
          case 'connected':
            BleTransport.isConnected = true;
            break;
          case 'disconnected':
            BleTransport.isConnected = false;
            break;
        }
        break;
      case 'task':
        // Do something
        break;
      case 'new-device':
        BleTransport.scanObserver.next(type);
        break;
    }
  });

  /// TODO events and whatnot
  static listen(observer: any) {
    log('ble-verbose', 'listen...');
    if (!BleTransport.isScanning) {
      BleTransport.isScanning = true;
      BleTransport.scanObserver = observer;
      HwTransportReactNativeBle.listen();
    }

    // Provide a way to cleanup after a listen
    const unsubscribe = () => {
      BleTransport.stop();
      log('ble-verbose', 'done listening.');
    };

    return {
      unsubscribe,
    };
  }

  private static stop = (): void => {
    BleTransport.isScanning = false;
    HwTransportReactNativeBle.stop();
  };

  private static connect = async (_uuid: String): Promise<any> => {
    log('ble-verbose', `user connect req (${_uuid})`);
    BleTransport.uuid = _uuid;

    return new Promise((resolve) => {
      HwTransportReactNativeBle.connect(_uuid, resolve);
    });
  };

  static disconnect = (id: any): Promise<any> => {
    log('ble-verbose', `user disconnect req (${id})`);

    return new Promise((resolve) => {
      HwTransportReactNativeBle.disconnect(resolve);
    });
  };

  static exchange = (apdu: Buffer): Promise<any> => {
    const apduString = apdu.toString('hex');
    log('apdu', `=> ${apduString}`);

    return new Promise((resolve) => {
      HwTransportReactNativeBle.exchange(apduString, (...p) => resolve(p));
    });
  };

  static runner = (url) => {
    // DO it dynamically
    log('ble-verbose', `request to launch runner for url ${url}`);
    HwTransportReactNativeBle.runner(url);
  };
}

export default BleTransport;
