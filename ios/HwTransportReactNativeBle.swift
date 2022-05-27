import Foundation
import BleTransport
import Bluejay

@objc(HwTransportReactNativeBle)
class HwTransportReactNativeBle: RCTEventEmitter {
    var transport: BleTransport? = nil
    
    override init() {
        let configuration = BleTransportConfiguration(services: [BleService(serviceUUID: "13D63400-2C97-0004-0000-4C6564676572",
                                                                            notifyUUID: "13d63400-2c97-0004-0001-4c6564676572",
                                                                            writeWithResponseUUID: "13d63400-2c97-0004-0002-4c6564676572",
                                                                            writeWithoutResponseUUID: "13d63400-2c97-0004-0003-4c6564676572")])
        self.transport = BleTransport(configuration: configuration)
        super.init()
        
        EventEmitter.sharedInstance.registerEventEmitter(eventEmitter: self)
    }

    /// Convenience method to emit an event that will be listened from the JS side
    private func emit(_ event: Events) -> Void {
        emit(event, withPayload: "")
    }
    private func emit(_ event: Events, withPayload: String) -> Void {
        EventEmitter.sharedInstance.dispatch(name: event.rawValue, body: withPayload)
    }
    
    ///  Since scan seems to be triggered a million times per second, emit only when the size changes
    var lastSeenSize: Int = 0
    var seenDevicesByUUID : [String: PeripheralIdentifier] = [:]

    @objc
    func scan() -> Void {
        if let transport = transport, transport.isBluetoothAvailable {
            DispatchQueue.main.async { /// Seems like I'm going to have to do this all the time
                transport.scan { [weak self] discoveries in
                    if discoveries.count != self!.lastSeenSize {
                        self?.lastSeenSize = discoveries.count
                        discoveries.forEach{
                            let uuid = String(describing: $0.peripheral.uuid)
                            self?.seenDevicesByUUID[uuid] = $0.peripheral
                            self?.emit(Events.newDevice, withPayload: uuid)
                        }
                    }
                } stopped: {  }
            }
        }
    }
    
    @objc
    func stop() -> Void {
        if let transport = transport, transport.isBluetoothAvailable {
            DispatchQueue.main.async { /// Seems like I'm going to have to do this all the time
                transport.stopScanning()
            }
        }
    }

    @objc
    func connect(_ uuid: String) -> Void {
        // Try to connect to this UUID, which is a string I know.
        if let transport = transport {
            if let peripheral = self.seenDevicesByUUID[uuid] {
                DispatchQueue.main.async { /// Seems like I'm going to have to do this all the time
                    transport.connect(toPeripheralID: peripheral) {
                        self.emit(Events.deviceConnected)
                    } success: { PeripheralIdentifier in
                        self.emit(Events.deviceConnected, withPayload: "OK \(uuid)")
                    } failure: { e in
                        self.emit(Events.deviceDisconnected, withPayload: String(describing: e))
                    }
                }
            }
            
        }
    }
    
    @objc
    func disconnect() -> Void {
        if let transport = transport {
            DispatchQueue.main.async { /// Seems like I'm going to have to do this all the time
                transport.disconnect(immediate: true, completion: { _ in
                    self.emit(Events.deviceDisconnected)
                })
            }
        }
    }
    
    @objc open override func supportedEvents() -> [String] {
        return EventEmitter.sharedInstance.allEvents
    }
}
