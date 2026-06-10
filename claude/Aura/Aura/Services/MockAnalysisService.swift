//
//  MockAnalysisService.swift
//  Aura
//
//  Deterministic, offline analysis service. Ships as the default so the app runs with zero
//  backend and previews/tests stay stable.
//

import Foundation

/// Returns a fixed, realistic ``AnalysisResult`` after a short simulated latency.
///
/// Deterministic by design: same input → same output, which keeps previews and snapshot
/// tests stable. Honors task cancellation during the simulated delay.
public struct MockAnalysisService: AnalysisServiceProtocol {

    /// Simulated processing latency, in seconds.
    private let latency: Duration

    /// Optional override allowing tests to force a specific outcome.
    private let forcedResult: AnalysisResult?

    public init(latency: Duration = .milliseconds(900), forcedResult: AnalysisResult? = nil) {
        self.latency = latency
        self.forcedResult = forcedResult
    }

    public func analyze(_ request: AnalysisRequest) async throws -> AnalysisResult {
        // Simulate work; surfaces cancellation as a thrown CancellationError → mapped by VM.
        try await Task.sleep(for: latency)
        try Task.checkCancellation()
        return forcedResult ?? MockData.sampleResult
    }
}
