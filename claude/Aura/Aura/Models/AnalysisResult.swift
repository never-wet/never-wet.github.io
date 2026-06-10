//
//  AnalysisResult.swift
//  Aura
//
//  The complete result of a facial analysis — the model the dashboard renders.
//

import Foundation

/// The full output of one facial analysis. Everything the dashboard displays comes from
/// here; views never compute or hardcode scores.
public struct AnalysisResult: Codable, Identifiable, Sendable, Hashable {

    public let id: UUID
    /// When the analysis completed.
    public let createdAt: Date
    /// Overall PSL score, 1.0–10.0.
    public let overallScore: Double
    /// Overall confidence (0...1) reported as a percentage in the UI.
    public let confidence: Double
    /// Short, AI-generated assessment summary for the hero card.
    public let summary: String
    /// Per-category metrics powering the Bento grid.
    public let metrics: [MetricItem]
    /// Weighted breakdown behind `overallScore`.
    public let breakdown: ScoreBreakdown
    /// Underlying landmark data (optional — present once a CV backend is wired in).
    public let landmarks: FacialLandmarkData?

    public init(
        id: UUID = UUID(),
        createdAt: Date = .now,
        overallScore: Double,
        confidence: Double,
        summary: String,
        metrics: [MetricItem],
        breakdown: ScoreBreakdown,
        landmarks: FacialLandmarkData? = nil
    ) {
        self.id = id
        self.createdAt = createdAt
        self.overallScore = overallScore
        self.confidence = min(max(confidence, 0), 1)
        self.summary = summary
        self.metrics = metrics
        self.breakdown = breakdown
        self.landmarks = landmarks
    }

    /// The tier the overall score maps to.
    public var tier: PSLTier { PSLTier.tier(for: overallScore) }

    /// Confidence rendered as a whole-number percent (e.g. 92).
    public var confidencePercent: Int { Int((confidence * 100).rounded()) }

    /// Looks up the metric for a given category, if present.
    public func metric(for category: MetricCategory) -> MetricItem? {
        metrics.first { $0.category == category }
    }
}
