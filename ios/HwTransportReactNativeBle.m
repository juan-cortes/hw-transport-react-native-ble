#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(HwTransportReactNativeBle, RCTEventEmitter)

RCT_EXTERN_METHOD(scan)
RCT_EXTERN_METHOD(stop)
RCT_EXTERN_METHOD(connect: (NSString *) string)
RCT_EXTERN_METHOD(disconnect)

@end
