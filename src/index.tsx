import { NativeModules, Platform } from 'react-native';
import EventEmitter from './EventEmitter';
import type { Observer } from 'rxjs';

const LINKING_ERROR =
  `The package 'hw-transport-react-native-ble' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo managed workflow\n';

const HwTransportReactNativeBle = NativeModules.HwTransportReactNativeBle
  ? NativeModules.HwTransportReactNativeBle
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

export default (() => {
  let scanningSub: any;
  let connectSub: any;
  let disconnectSub: any;

  const scan = (sub: Observer<String>): void => {
    if (!scanningSub) {
      // Do we need multiple listeners?
      scanningSub = EventEmitter?.addListener('new-device', (e) => {
        sub.next(e);
      });
      connectSub = EventEmitter?.addListener('device-connected', (e) => {
        sub.next(e);
      });
      disconnectSub = EventEmitter?.addListener('device-disconnected', (e) => {
        sub.next(e);
      });

      HwTransportReactNativeBle.scan();
    }
  };

  const stop = (): void => {
    scanningSub?.remove();
    scanningSub = null;
    connectSub?.remove();
    connectSub = null;
    disconnectSub?.remove();
    disconnectSub = null;

    HwTransportReactNativeBle.stop();
  };

  const connect = (uuid: String): void => {
    HwTransportReactNativeBle.connect(uuid);
  };

  return {
    scan,
    stop,
    connect,
  };
})();
