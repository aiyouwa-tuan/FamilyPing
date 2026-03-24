import Foundation
import WatchConnectivity

/// Manages Watch <-> Phone communication via WCSession.
class WatchConnectivityManager: NSObject, ObservableObject {
    static let shared = WatchConnectivityManager()

    @Published var lastCheckinTime: String? = nil
    @Published var streakCount: Int = 0

    private var session: WCSession?

    private override init() {
        super.init()

        if WCSession.isSupported() {
            session = WCSession.default
            session?.delegate = self
            session?.activate()
        }
    }

    // MARK: - Send to Phone

    /// Send a check-in with the selected mood to the phone app.
    func sendCheckin(mood: String) {
        guard let session = session, session.isReachable else {
            // Fallback: use transferUserInfo for background delivery
            sendInBackground(["type": "checkin", "mood": mood, "timestamp": ISO8601DateFormatter().string(from: Date())])
            return
        }

        let message: [String: Any] = [
            "type": "checkin",
            "mood": mood,
            "timestamp": ISO8601DateFormatter().string(from: Date()),
        ]

        session.sendMessage(message, replyHandler: { reply in
            DispatchQueue.main.async {
                if let time = reply["lastCheckinTime"] as? String {
                    self.lastCheckinTime = time
                }
                if let streak = reply["streakCount"] as? Int {
                    self.streakCount = streak
                }
            }
        }, errorHandler: { error in
            print("[WatchConnectivity] sendCheckin error: \(error.localizedDescription)")
            // Retry via background transfer
            self.sendInBackground(message)
        })
    }

    /// Send an SOS alert to the phone app.
    func sendSOS() {
        guard let session = session else { return }

        let message: [String: Any] = [
            "type": "sos",
            "timestamp": ISO8601DateFormatter().string(from: Date()),
        ]

        if session.isReachable {
            session.sendMessage(message, replyHandler: nil, errorHandler: { error in
                print("[WatchConnectivity] sendSOS error: \(error.localizedDescription)")
                self.sendInBackground(message)
            })
        } else {
            sendInBackground(message)
        }
    }

    // MARK: - Background Transfer

    private func sendInBackground(_ message: [String: Any]) {
        session?.transferUserInfo(message)
    }
}

// MARK: - WCSessionDelegate

extension WatchConnectivityManager: WCSessionDelegate {
    func session(
        _ session: WCSession,
        activationDidCompleteWith activationState: WCSessionActivationState,
        error: Error?
    ) {
        if let error = error {
            print("[WatchConnectivity] Activation error: \(error.localizedDescription)")
        } else {
            print("[WatchConnectivity] Session activated: \(activationState.rawValue)")
        }
    }

    /// Receive messages from the phone app (e.g., status updates).
    func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
        DispatchQueue.main.async {
            self.handleReceivedData(message)
        }
    }

    func session(
        _ session: WCSession,
        didReceiveMessage message: [String: Any],
        replyHandler: @escaping ([String: Any]) -> Void
    ) {
        DispatchQueue.main.async {
            self.handleReceivedData(message)
        }
        replyHandler(["status": "received"])
    }

    /// Receive application context updates from the phone.
    func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String: Any]) {
        DispatchQueue.main.async {
            self.handleReceivedData(applicationContext)
        }
    }

    /// Receive background user info transfers from the phone.
    func session(_ session: WCSession, didReceiveUserInfo userInfo: [String: Any] = [:]) {
        DispatchQueue.main.async {
            self.handleReceivedData(userInfo)
        }
    }

    // MARK: - Data Handling

    private func handleReceivedData(_ data: [String: Any]) {
        if let time = data["lastCheckinTime"] as? String {
            lastCheckinTime = time
        }
        if let streak = data["streakCount"] as? Int {
            streakCount = streak
        }
    }
}
