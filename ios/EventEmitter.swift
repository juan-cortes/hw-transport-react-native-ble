//
//  EventEmitter.swift
//  hw-transport-react-native-ble
//
//  Created by Juana on 27/5/22.
//

import Foundation

enum Event: String, CaseIterable {
    case newDevice = "new-device"
    case status = "status"
    case apdu = "apdu"
    case task = "task"
}

enum Status: String, CaseIterable {
    case startScanning = "start-scanning"
    case stopScanning = "stop-scanning"
    case deviceConnected = "device-connected"
    case deviceDisconnected = "device-disconnected"
    case error = "error"
}


enum Action: String, CaseIterable {
    case permissionRequested = "device-permission-requested"
    case permissionGranted = "device-permission-granted"
    case permissionRefused = "device-permission-refused"
    case bulkProgress = "bulk-progress"
}

class EventEmitter {
    public static var sharedInstance = EventEmitter()
    private var eventEmitter: HwTransportReactNativeBle!

    private init() {}

    func registerEventEmitter(eventEmitter: HwTransportReactNativeBle) {
        self.eventEmitter = eventEmitter
    }

    func dispatch(name: String, body: Any?) {
        dispatch(name: name, body: body, replaceable: false)
    }

    func dispatch(name: String, body: Any?, replaceable: Bool) {
        eventEmitter.sendEvent(withName: name, body: body)
    }

    lazy var allEvents: [String] = {
        return Event.allCases.map { $0.rawValue }
    }()
}
