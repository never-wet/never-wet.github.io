import Foundation

public struct AnalysisResult: Codable, Identifiable, Sendable {
    public let id: UUID
    public let timestamp: Date
    public let overallScore: Double
    public let tier: String
    public let confidenceScore: Double
    public let summary: String
    
    public let eyeArea: MetricItem
    public let jawline: MetricItem
    public let dimorphism: MetricItem
    public let symmetry: MetricItem
    public let dermalQuality: MetricItem
    
    public init(id: UUID = UUID(), timestamp: Date = Date(), overallScore: Double, tier: String, confidenceScore: Double, summary: String, eyeArea: MetricItem, jawline: MetricItem, dimorphism: MetricItem, symmetry: MetricItem, dermalQuality: MetricItem) {
        self.id = id
        self.timestamp = timestamp
        self.overallScore = overallScore
        self.tier = tier
        self.confidenceScore = confidenceScore
        self.summary = summary
        self.eyeArea = eyeArea
        self.jawline = jawline
        self.dimorphism = dimorphism
        self.symmetry = symmetry
        self.dermalQuality = dermalQuality
    }
}

public struct MetricItem: Codable, Identifiable, Sendable {
    public let id: UUID
    public let title: String
    public let primaryValue: String
    public let score: Double // 0.0 to 1.0 or actual value depending on metric
    public let explanation: String
    
    public init(id: UUID = UUID(), title: String, primaryValue: String, score: Double, explanation: String) {
        self.id = id
        self.title = title
        self.primaryValue = primaryValue
        self.score = score
        self.explanation = explanation
    }
}
