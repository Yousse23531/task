import Foundation
import Capacitor

// Minimal stub SplashScreen plugin - compatible with Capacitor 8 Swift PM API
// The JS/web layer handles splash screen via the web view lifecycle
@objc(SplashScreenPlugin)
public class SplashScreenPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "SplashScreenPlugin"
    public let jsName = "SplashScreen"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "show", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "hide", returnType: CAPPluginReturnPromise)
    ]

    @objc public func show(_ call: CAPPluginCall) {
        call.resolve()
    }

    @objc public func hide(_ call: CAPPluginCall) {
        call.resolve()
    }
}
