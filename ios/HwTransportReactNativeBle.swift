import Foundation
import BleTransport
import Bluejay

@objc(HwTransportReactNativeBle)
class HwTransportReactNativeBle: RCTEventEmitter {
    var transport: BleTransport? = nil
    var isConnected: Bool = false

    override init() {
        let configuration = BleTransportConfiguration(services: [BleService(serviceUUID: "13D63400-2C97-0004-0000-4C6564676572",
                                                                            notifyUUID: "13d63400-2c97-0004-0001-4c6564676572",
                                                                            writeWithResponseUUID: "13d63400-2c97-0004-0002-4c6564676572",
                                                                            writeWithoutResponseUUID: "13d63400-2c97-0004-0003-4c6564676572")])
        self.transport = BleTransport(configuration: configuration)
        super.init()    
        EventEmitter.sharedInstance.registerEventEmitter(eventEmitter: self)
    }

    /// Emit a status update, mostly flags
    private func emit(_ event: Events, withStatus: Status) -> Void {
        emit(event, withPayload: withStatus.rawValue)
    }
    /// Emit an event with a payload, such as finding a new device
    private func emit(_ event: Events, withPayload: String) -> Void {
        EventEmitter.sharedInstance.dispatch(name: event.rawValue, body: withPayload)
    }
    
    ///  Since scan seems to be triggered a million times per second, emit only when the size changes
    var lastSeenSize: Int = 0
    var seenDevicesByUUID : [String: PeripheralIdentifier] = [:]

    @objc
    func listen() -> Void {
        if let transport = transport, transport.isBluetoothAvailable {
            self.seenDevicesByUUID = [:]
            self.emit(Events.status, withStatus: Status.startScanning)
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
                } stopped: {
                    self.emit(Events.status, withStatus: Status.stopScanning)
                }
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
    func installBTC() -> Void {
        if let transport = transport, isConnected {
            // Try to run a scriptrunner thingie
            
        }
    }

    /// Connection events are handled on the JavaScript side to keep a state that is accessible from LLM
    @objc
    func connect(_ uuid: String) -> Void {
        if let transport = transport, !isConnected {
            if let peripheral = self.seenDevicesByUUID[uuid] {
                DispatchQueue.main.async {
                    transport.connect(toPeripheralID: peripheral) {
                        self.emit(Events.status, withStatus: Status.deviceDisconnected)
                        self.isConnected = false
                    } success: { PeripheralIdentifier in
                        self.emit(Events.status, withStatus: Status.deviceConnected)
                        self.isConnected = true
                    } failure: { e in
                        self.emit(Events.status, withStatus: Status.deviceDisconnected)
                        self.isConnected = false
                    }
                }
            }
        }
    }
    
    @objc
    func disconnect() -> Void {
        if let transport = transport, isConnected {
            DispatchQueue.main.async { /// Seems like I'm going to have to do this all the time
                transport.disconnect(immediate: true, completion: { _ in
                    // Already handled on the connect func
                })
            }
        }
    }
    
    @objc
    func exchange(_ apdu: String) -> Void {
        if let transport = transport {
            DispatchQueue.main.async { /// Seems like I'm going to have to do this all the time
                transport.exchange(apdu: APDU(raw: apdu)) { [weak self] result in
                    guard let self = self else { return }
                    switch result {
                    case .success(let response):
                        self.emit(Events.apdu, withPayload: response)
                    case .failure(let error):
                        switch error {
                        case .readError(let description):
                            self.emit(Events.apdu, withPayload: "read error \(String(describing:description))")
                        case .writeError(let description):
                            self.emit(Events.apdu, withPayload: "write error \(String(describing:description))")
                        case .pendingActionOnDevice:
                            self.emit(Events.apdu, withPayload: "pending error")
                        default:
                            self.emit(Events.apdu, withPayload: "another error")
                        }
                    }
                }
            }
        }
    }
    
    @objc open override func supportedEvents() -> [String] {
        return EventEmitter.sharedInstance.allEvents
    }
}
