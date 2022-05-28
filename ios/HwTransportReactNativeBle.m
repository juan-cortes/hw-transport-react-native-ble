#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(HwTransportReactNativeBle, RCTEventEmitter)

RCT_EXTERN_METHOD(listen)
RCT_EXTERN_METHOD(stop)
RCT_EXTERN_METHOD(connect: (NSString *) string)
RCT_EXTERN_METHOD(disconnect)
RCT_EXTERN_METHOD(exchange: (NSString *) apdu)

RCT_EXTERN_METHOD(installBTC)
@end
