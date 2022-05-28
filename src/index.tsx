import { NativeModules } from 'react-native';
import Transport from '@ledgerhq/hw-transport';
import { log } from '@ledgerhq/logs';
import EventEmitter from './EventEmitter';

const HwTransportReactNativeBle = NativeModules.HwTransportReactNativeBle;

class BleTransport extends Transport {
  static uuid: String = ''; // We probably need more information than the uuid
  static isScanning: Boolean = false;
  static isConnected: Boolean = false;
  static listeners: { [key: string]: any } = {
    status: EventEmitter?.addListener('status', (status) => {
      log('ble', status);
      switch (status) {
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
    }),
  };

  static listen(observer: any) {
    log('ble-verbose', 'listen...');
    if (!BleTransport.listeners.scanning) {
      BleTransport.listeners.scanning = EventEmitter?.addListener(
        'new-device',
        (e) => observer.next(e)
      );
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
    BleTransport.listeners.scanning?.remove();
    BleTransport.listeners.scanning = null;
    HwTransportReactNativeBle.stop();
  };

  private static connect = (_uuid: String): void => {
    log('ble-verbose', `user connect req (${_uuid})`);
    BleTransport.uuid = _uuid;
    HwTransportReactNativeBle.connect(_uuid);
  };

  static disconnect = async (id: any) => {
    log('ble-verbose', `user disconnect req (${id})`);
    HwTransportReactNativeBle.disconnect();
  };

  static installBTC = async () => {
    // DO it dynamically
    log('ble-verbose', `request to install BTC`);
    HwTransportReactNativeBle.installBTC();
  };

  static exchange = (apdu: Buffer): Promise<any> => {
    const apduString = apdu.toString('hex');
    log('apdu', `=> ${apduString}`);

    // Create a promise that will be resolved when we receive the apdu event
    const promise = new Promise((resolve, _) => {
      BleTransport.listeners.apdu = EventEmitter?.addListener('apdu', (data) =>
        resolve(data)
      );
    });

    promise.then((result) => {
      console.log('cleanup', result);
      BleTransport.listeners.apdu?.remove();
      BleTransport.listeners.apdu = null;
    });

    HwTransportReactNativeBle.exchange(apduString);
    return promise;
  };
}

export default BleTransport;
