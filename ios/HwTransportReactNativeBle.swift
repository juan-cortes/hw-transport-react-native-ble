import Foundation
import BleTransport
import Bluejay

@objc(HwTransportReactNativeBle)
class HwTransportReactNativeBle: RCTEventEmitter {
    var transport: BleTransport? = nil
    var isConnected: Bool = false
    var runner: Runner?
    
    override init() {
        let configuration = BleTransportConfiguration(services: [BleService(serviceUUID: "13D63400-2C97-0004-0000-4C6564676572",
                                                                            notifyUUID: "13d63400-2c97-0004-0001-4c6564676572",
                                                                            writeWithResponseUUID: "13d63400-2c97-0004-0002-4c6564676572",
                                                                            writeWithoutResponseUUID: "13d63400-2c97-0004-0003-4c6564676572")])
        self.transport = BleTransport(configuration: configuration)
        super.init()
        EventEmitter.sharedInstance.registerEventEmitter(eventEmitter: self)
    }
    
    /// Emit an action from a runner (this is too vague though, figure it out)
    private func emitFromRunner(_ type: Action, withPayload: String) -> Void {
        EventEmitter.sharedInstance.dispatch(
            event: Event.task,
            type: type.rawValue,
            data: withPayload
        )
    }
    /// Emit a status update, mostly flags
    private func emit(_ event: Event, withStatus: Status) -> Void {
        emit(event, withPayload: withStatus.rawValue)
    }
    /// Emit an event with a payload, such as finding a new device
    private func emit(_ event: Event, withPayload: String) -> Void {
        EventEmitter.sharedInstance.dispatch(event: event, type: withPayload, data: nil)
    }
    
    private func emit(_ event: Event, type: String, andData: String) -> Void {
        EventEmitter.sharedInstance.dispatch(event: event, type: type, data: andData)
    }
    
    private func blackHole (_ : String) -> Void {}
    
    ///  Since scan seems to be triggered a million times per second, emit only when the size changes
    var lastSeenSize: Int = 0
    var seenDevicesByUUID : [String: PeripheralIdentifier] = [:]
    
    @objc
    func listen() -> Void {
        if let transport = transport, transport.isBluetoothAvailable {
            self.seenDevicesByUUID = [:]
            self.emit(Event.status, withStatus: Status.startScanning)
            DispatchQueue.main.async { /// Seems like I'm going to have to do this all the time
                transport.scan { [weak self] discoveries in
                    if discoveries.count != self!.lastSeenSize {
                        self?.lastSeenSize = discoveries.count
                        
                        /// Found devices are handled via events since we need more than one call
                        discoveries.forEach{
                            let uuid = String(describing: $0.peripheral.uuid)
                            self?.seenDevicesByUUID[uuid] = $0.peripheral
                            self?.emit(Event.newDevice, type: uuid, andData: $0.peripheral.name)
                        }
                    }
                } stopped: {
                    self.emit(Event.status, withStatus: Status.stopScanning)
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
    func runner(_ url: String) -> Void {
        if let transport = transport, isConnected {
            // Try to run a scriptrunner thingie
            self.runner = Runner(
                transport,
                endpoint: URL(string: url)!,
                onEvent: self.emitFromRunner,
                onDone: self.blackHole
            )
            
            /// Runner apdus need to be handled via events
        }
    }
    
    /// Connection events are handled on the JavaScript side to keep a state that is accessible from LLM
    @objc
    func connect(_ uuid: String, callback: @escaping RCTResponseSenderBlock) -> Void {
        if let transport = transport, !isConnected {
            if let peripheral = self.seenDevicesByUUID[uuid] {
                DispatchQueue.main.async {
                    transport.connect(toPeripheralID: peripheral) {
                        self.isConnected = false
                        callback(["Disconnected", false])
                    } success: { PeripheralIdentifier in
                        self.isConnected = true
                        callback([NSNull(), true])
                    } failure: { e in
                        self.isConnected = false
                        callback([String(describing: e), false])
                    }
                }
            }
        }
    }
    
    
    @objc
    func disconnect(callback: @escaping RCTResponseSenderBlock) -> Void {
        if let transport = transport, isConnected {
            DispatchQueue.main.async { /// Seems like I'm going to have to do this all the time
                transport.disconnect(immediate: true, completion: { _ in
                    callback([NSNull(), true])
                })
            }
        }
    }
    
    @objc
    func exchange(_ apdu: String, callback: @escaping RCTResponseSenderBlock) -> Void {
        if let transport = transport {
            DispatchQueue.main.async { /// Seems like I'm going to have to do this all the time
                transport.exchange(apdu: APDU(raw: apdu)) { result in
                    switch result {
                    case .success(let response):
                        callback([NSNull(), response])
                    case .failure(let error):
                        switch error {
                        case .readError(let description):
                            callback([ "read error \(String(describing:description))"])
                        case .writeError(let description):
                            callback([ "write error \(String(describing:description))"])
                        case .pendingActionOnDevice:
                            callback([ "pending action"])
                        default:
                            callback([ "another action"])
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
