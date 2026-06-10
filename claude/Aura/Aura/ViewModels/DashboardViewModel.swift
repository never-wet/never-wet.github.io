//
//  DashboardViewModel.swift
//  Aura
//
//  MVVM view model for the flagship dashboard. Owns view state, loading/error handling,
//  refresh, and session reset. Depends only on AnalysisServiceProtocol (DI).
//

import SwiftUI

/// Drives ``DashboardView``. All mutable state lives here and is published on the main actor.
@MainActor
public final class DashboardViewModel: ObservableObject {

    /// The finite states the dashboard can be in.
    public enum ViewState: Equatable {
        case idle
        case loading
        case loaded(AnalysisResult)
        case error(String)

        public static func == (lhs: ViewState, rhs: ViewState) -> Bool {
            switch (lhs, rhs) {
            case (.idle, .idle), (.loading, .loading): return true
            case let (.loaded(a), .loaded(b)): return a == b
            case let (.error(a), .error(b)): return a == b
            default: return false
            }
        }
    }

    // MARK: Published state

    @Published public private(set) var state: ViewState = .idle
    /// Controls presentation of the camera-selection sheet.
    @Published public var isCameraSelectionPresented = false
    /// The current session (history unit). Reset clears this.
    @Published public private(set) var session: AnalysisSession?

    // MARK: Dependencies

    private let service: any AnalysisServiceProtocol
    /// The most recent image bytes, retained so "Retry" can re-run without re-capture.
    private var lastImageData: Data?
    /// In-flight analysis task, cancelled on reset / re-analyze.
    private var analysisTask: Task<Void, Never>?

    public init(service: any AnalysisServiceProtocol) {
        self.service = service
    }

    // MARK: Derived

    /// The loaded result, if any. Convenience for the view.
    public var result: AnalysisResult? {
        if case let .loaded(result) = state { return result }
        return nil
    }

    public var isLoading: Bool {
        if case .loading = state { return true }
        return false
    }

    // MARK: Intents

    /// Kicks off analysis for the supplied image bytes. Cancels any in-flight analysis.
    /// - Parameter imageData: Encoded image; `nil` runs the mock/demo path.
    public func analyze(imageData: Data?) {
        lastImageData = imageData
        session = AnalysisSession(imageReference: imageData == nil ? "mock" : "captured")

        analysisTask?.cancel()
        state = .loading

        analysisTask = Task { [weak self] in
            guard let self else { return }
            let request = AnalysisRequest(imageData: imageData)
            do {
                let result = try await service.analyze(request)
                guard !Task.isCancelled else { return }
                self.state = .loaded(result)
                self.session = self.session?.completed(with: result)
            } catch is CancellationError {
                // Superseded or reset — leave state to the newer action.
            } catch {
                guard !Task.isCancelled else { return }
                let message = (error as? AnalysisError)?.errorDescription
                    ?? error.localizedDescription
                self.state = .error(message)
            }
        }
    }

    /// Re-runs analysis using the last captured image (error-recovery affordance).
    public func retry() {
        analyze(imageData: lastImageData)
    }

    /// Clears analysis + cached image, resets state, and opens the camera selection flow.
    /// This is the floating Reset button's action.
    public func reset() {
        analysisTask?.cancel()
        analysisTask = nil
        lastImageData = nil
        session = nil
        state = .idle
        isCameraSelectionPresented = true
    }

    /// Opens the camera-selection sheet without clearing existing state (e.g. empty-state CTA).
    public func beginCapture() {
        isCameraSelectionPresented = true
    }

    /// Called by the camera flow once an image is available.
    public func didCapture(imageData: Data?) {
        isCameraSelectionPresented = false
        analyze(imageData: imageData)
    }
}
