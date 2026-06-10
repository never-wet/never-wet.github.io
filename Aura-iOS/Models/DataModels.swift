import Foundation

/// Represents a single 3D point on the face mesh
public struct FacialPoint: Codable, Sendable, Equatable {
    public let x: Double
    public let y: Double
    public let z: Double
}

/// Contains all mapped facial landmarks
public struct FacialLandmarkData: Codable, Identifiable, Sendable, Equatable {
    public let id: UUID
    public let points: [FacialPoint]
}

/// Identifies the category of a metric
public struct MetricCategory: Codable, Identifiable, Sendable, Equatable {
    public let id: String
    public let title: String
}

/// Represents an individual facial metric
public struct MetricItem: Codable, Identifiable, Sendable, Equatable {
    public let id: UUID
    public let categoryId: String
    public let name: String
    public let value: Double
    public let displayValue: String
    public let trajectory: String
    public let score: Double
}

/// Represents the high-level breakdown of the analysis
public struct ScoreBreakdown: Codable, Identifiable, Sendable, Equatable {
    public let id: UUID
    public let pslScore: Double
    public let tier: String
    public let confidence: Double
    public let summary: String
    public let metrics: [MetricItem]
}

/// The complete analysis result from an image
public struct AnalysisResult: Codable, Identifiable, Sendable, Equatable {
    public let id: UUID
    public let timestamp: Date
    public let landmarks: FacialLandmarkData
    public let breakdown: ScoreBreakdown
}

/// Tracks the lifecycle of a user's analysis session
public struct AnalysisSession: Codable, Identifiable, Sendable, Equatable {
    public let id: UUID
    public let startDate: Date
    public var currentResult: AnalysisResult?
}
