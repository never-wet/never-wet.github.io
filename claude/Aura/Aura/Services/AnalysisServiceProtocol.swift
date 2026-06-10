//
//  AnalysisServiceProtocol.swift
//  Aura
//
//  The single seam between the UI and any analysis backend. Mock, on-device CV, or remote
//  implementations are fully interchangeable behind this protocol.
//

import Foundation

/// Input to an analysis pass. Carries image bytes (Sendable) and tuning options rather than
/// a `UIImage`, so requests cross actor boundaries safely and remain platform-neutral.
public struct AnalysisRequest: Sendable {
    /// JPEG/PNG-encoded image bytes. `nil` is permitted for mock/demo flows.
    public let imageData: Data?
    /// Whether the caller wants the (more expensive) full breakdown + landmarks.
    public let includeLandmarks: Bool

    public init(imageData: Data?, includeLandmarks: Bool = true) {
        self.imageData = imageData
        self.includeLandmarks = includeLandmarks
    }
}

/// Errors surfaced by any analysis service. Mapped to user-facing copy by the view model.
public enum AnalysisError: LocalizedError, Sendable {
    case noFaceDetected
    case lowQualityImage
    case network(String)
    case decoding
    case cancelled
    case unknown

    public var errorDescription: String? {
        switch self {
        case .noFaceDetected: return "No face detected. Re-center your face and try again."
        case .lowQualityImage: return "Image quality is too low for a reliable assessment."
        case .network(let detail): return "Network error: \(detail)"
        case .decoding: return "The analysis response could not be read."
        case .cancelled: return "Analysis cancelled."
        case .unknown: return "Something went wrong. Please try again."
        }
    }
}

/// Abstracts facial analysis. Implementations may run on-device (Vision/MediaPipe/OpenCV),
/// in the cloud, or as a deterministic mock. The UI depends only on this protocol.
public protocol AnalysisServiceProtocol: Sendable {
    /// Runs a full facial analysis and returns a complete result.
    /// - Parameter request: The image + options to analyze.
    /// - Returns: A populated ``AnalysisResult``.
    /// - Throws: ``AnalysisError`` on failure; honors task cancellation.
    func analyze(_ request: AnalysisRequest) async throws -> AnalysisResult
}
