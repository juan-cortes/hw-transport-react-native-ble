import Foundation


@objc(HwTransportReactNativeBle)
class HwTransportReactNativeBle: RCTEventEmitter {
    var nonce: Int = 0
    var scanningTimer: Timer!

    
    override init() {
        super.init()
        EventEmitter.sharedInstance.registerEventEmitter(eventEmitter: self)
    }
    
    /// Stub for scan, I can't get the import to work. kill me.
    @objc(scan)
    func scan() -> Void {
        guard self.scanningTimer == nil else { return }
        DispatchQueue.main.async {
            self.scanningTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { timer in
                EventEmitter.sharedInstance.dispatch(name: "new-device", body: "test from swift \(self.nonce)")
                self.nonce += 1
            }
        }
    }
    
    @objc(stop)
    func stop() -> Void {
        self.scanningTimer?.invalidate()
        self.scanningTimer = nil
    }
    
    @objc open override func supportedEvents() -> [String] {
        return EventEmitter.sharedInstance.allEvents
    }
}
