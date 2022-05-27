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

  const scan = (sub: Observer<String>): void => {
    if (!scanningSub) {
      // Do we need multiple listeners?
      scanningSub = EventEmitter?.addListener('new-device', (e) => {
        sub.next(e);
      });

      HwTransportReactNativeBle.scan();
    }
  };

  const stop = (): void => {
    scanningSub?.remove();
    scanningSub = null;

    HwTransportReactNativeBle.stop();
  };

  return {
    scan,
    stop,
  };
})();
