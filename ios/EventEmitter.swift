//
//  EventEmitter.swift
//  hw-transport-react-native-ble
//
//  Created by Juana on 27/5/22.
//

import Foundation

enum Events: String, CaseIterable {
    case newDevice = "new-device"
    case status = "status"
    case apdu = "apdu"
}
enum Status: String, CaseIterable {
    case startScanning = "start-scanning"
    case stopScanning = "stop-scanning"
    case deviceConnected = "device-connected"
    case deviceDisconnected = "device-disconnected"
    case error = "error"
}

class EventEmitter {
    public static var sharedInstance = EventEmitter()
    private var eventEmitter: HwTransportReactNativeBle!

    private init() {}

    func registerEventEmitter(eventEmitter: HwTransportReactNativeBle) {
        self.eventEmitter = eventEmitter
    }

    func dispatch(name: String, body: Any?) {
        eventEmitter.sendEvent(withName: name, body: body)
    }

    lazy var allEvents: [String] = {
        return Events.allCases.map { $0.rawValue }
    }()
}
