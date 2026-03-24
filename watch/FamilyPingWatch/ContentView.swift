import SwiftUI

// MARK: - Models

enum MoodOption: String, CaseIterable, Identifiable {
    case great = "great"
    case ok = "ok"
    case notGreat = "not_great"

    var id: String { rawValue }

    var emoji: String {
        switch self {
        case .great: return "\u{1F60A}"
        case .ok: return "\u{1F642}"
        case .notGreat: return "\u{1F614}"
        }
    }

    var label: String {
        switch self {
        case .great: return "Great"
        case .ok: return "OK"
        case .notGreat: return "Not Great"
        }
    }

    var color: Color {
        switch self {
        case .great: return .green
        case .ok: return .orange
        case .notGreat: return .red
        }
    }
}

// MARK: - Main View

struct ContentView: View {
    @StateObject private var connectivity = WatchConnectivityManager.shared
    @State private var showMoodSelector = false
    @State private var sosProgress: CGFloat = 0
    @State private var sosTimer: Timer? = nil
    @State private var sosSent = false
    @State private var checkinSent = false
    @State private var checkinMood: MoodOption? = nil

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    // Status section
                    statusSection

                    // Check-in button
                    checkinButton

                    // SOS button
                    sosButton
                }
                .padding(.horizontal, 8)
                .padding(.vertical, 12)
            }
            .navigationTitle("FamilyPing")
        }
        .sheet(isPresented: $showMoodSelector) {
            moodSelectorView
        }
    }

    // MARK: - Status Section

    private var statusSection: some View {
        VStack(spacing: 6) {
            if let mood = checkinMood {
                Text("\(mood.emoji) Checked in")
                    .font(.headline)
                    .foregroundColor(mood.color)
            } else if let lastTime = connectivity.lastCheckinTime {
                Text("Last: \(lastTime)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            } else {
                Text("No check-in today")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            if connectivity.streakCount > 0 {
                Text("\u{1F525} \(connectivity.streakCount)-day streak")
                    .font(.caption2)
                    .foregroundColor(.orange)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
    }

    // MARK: - Check-in Button

    private var checkinButton: some View {
        Button(action: {
            showMoodSelector = true
        }) {
            HStack(spacing: 8) {
                Text("\u{2705}")
                    .font(.title2)
                Text("Check In")
                    .font(.title3)
                    .fontWeight(.bold)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(checkinSent ? Color.green.opacity(0.3) : Color.green)
            .foregroundColor(.white)
            .cornerRadius(16)
        }
        .buttonStyle(.plain)
        .disabled(checkinSent)
    }

    // MARK: - SOS Button

    private var sosButton: some View {
        VStack(spacing: 4) {
            ZStack(alignment: .leading) {
                // Background
                RoundedRectangle(cornerRadius: 16)
                    .fill(sosSent ? Color.red.opacity(0.3) : Color.red)
                    .frame(height: 64)

                // Progress overlay
                if sosProgress > 0 && !sosSent {
                    GeometryReader { geometry in
                        RoundedRectangle(cornerRadius: 16)
                            .fill(Color.red.opacity(0.5))
                            .frame(width: geometry.size.width * sosProgress)
                    }
                    .frame(height: 64)
                }

                // Label
                HStack(spacing: 8) {
                    Text("\u{1F198}")
                        .font(.title2)
                    Text(sosSent ? "SOS Sent!" : "SOS")
                        .font(.title3)
                        .fontWeight(.bold)
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 64)
            }
            .frame(height: 64)
            .gesture(
                LongPressGesture(minimumDuration: 3.0)
                    .onChanged { _ in
                        startSOSTimer()
                    }
                    .onEnded { _ in
                        triggerSOS()
                    }
            )
            .simultaneousGesture(
                DragGesture(minimumDistance: 0)
                    .onEnded { _ in
                        cancelSOSTimer()
                    }
            )

            if !sosSent {
                Text("Hold 3 seconds")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
    }

    // MARK: - Mood Selector Sheet

    private var moodSelectorView: some View {
        VStack(spacing: 12) {
            Text("How are you?")
                .font(.headline)
                .padding(.top, 8)

            ForEach(MoodOption.allCases) { mood in
                Button(action: {
                    handleCheckin(mood: mood)
                }) {
                    HStack(spacing: 10) {
                        Text(mood.emoji)
                            .font(.title2)
                        Text(mood.label)
                            .font(.title3)
                            .fontWeight(.semibold)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(mood.color.opacity(0.2))
                    .foregroundColor(mood.color)
                    .cornerRadius(14)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 8)
    }

    // MARK: - Actions

    private func handleCheckin(mood: MoodOption) {
        checkinMood = mood
        checkinSent = true
        showMoodSelector = false
        connectivity.sendCheckin(mood: mood.rawValue)
    }

    private func startSOSTimer() {
        guard !sosSent else { return }
        sosTimer?.invalidate()
        sosProgress = 0

        // Animate progress over 3 seconds
        let steps = 30
        let interval = 3.0 / Double(steps)
        var current = 0

        sosTimer = Timer.scheduledTimer(withTimeInterval: interval, repeats: true) { timer in
            current += 1
            sosProgress = CGFloat(current) / CGFloat(steps)
            if current >= steps {
                timer.invalidate()
            }
        }
    }

    private func cancelSOSTimer() {
        guard !sosSent else { return }
        sosTimer?.invalidate()
        sosTimer = nil
        withAnimation(.easeOut(duration: 0.2)) {
            sosProgress = 0
        }
    }

    private func triggerSOS() {
        guard !sosSent else { return }
        sosSent = true
        sosTimer?.invalidate()
        sosProgress = 1.0
        connectivity.sendSOS()
        WKInterfaceDevice.current().play(.notification)
    }
}

#Preview {
    ContentView()
}
