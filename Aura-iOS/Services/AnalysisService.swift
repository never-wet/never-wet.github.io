import Foundation
import UIKit

/// Defines the capabilities of a facial analysis service
public protocol AnalysisServiceProtocol: Sendable {
    func analyze(image: UIImage) async throws -> AnalysisResult
}

/// Simulated local service for development
public final class MockAnalysisService: AnalysisServiceProtocol {
    public init() {}
    
    public func analyze(image: UIImage) async throws -> AnalysisResult {
        try await Task.sleep(nanoseconds: 1_500_000_000)
        return MockData.sampleResult
    }
}

/// Placeholder for a service connecting to an external OpenCV/MediaPipe API
public final class FutureRemoteAnalysisService: AnalysisServiceProtocol {
    public init() {}
    
    public func analyze(image: UIImage) async throws -> AnalysisResult {
        fatalError("Will be implemented via REST API endpoint.")
    }
}
