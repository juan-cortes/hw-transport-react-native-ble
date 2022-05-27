//
//  EventEmitter.swift
//  hw-transport-react-native-ble
//
//  Created by Juana on 27/5/22.
//

import Foundation

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
        var allEventNames: [String] = ["new-device"]
        return allEventNames
    }()
}
