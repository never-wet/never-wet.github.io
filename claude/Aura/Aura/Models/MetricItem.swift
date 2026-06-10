//
//  MetricItem.swift
//  Aura
//
//  A single analyzed metric — the data unit each Bento card renders.
//

import Foundation

/// A single measured facial metric, fully self-describing so the UI can render any metric
/// generically without category-specific code.
public struct MetricItem: Codable, Identifiable, Sendable, Hashable {

    public let id: UUID
    /// Which dashboard card this belongs to.
    public let category: MetricCategory
    /// Score on the 0–10 scale for this individual metric.
    public let score: Double
    /// Normalized progress 0.0–1.0 used for the linear indicator (often `score / 10`).
    public let progress: Double
    /// Headline value string, pre-formatted for display (e.g. "121°", "5.8").
    public let displayValue: String
    /// Short structural classification (e.g. "Defined", "Hunter Eyes").
    public let classification: String
    /// Sub-measurements shown as label/value pairs (e.g. "Canthal Tilt" → "+4°").
    public let attributes: [MetricAttribute]
    /// Human-readable explanation of the result.
    public let explanation: String
    /// Optional improvement trajectory copy. `nil` hides the trajectory row.
    public let improvementTrajectory: String?

    public init(
        id: UUID = UUID(),
        category: MetricCategory,
        score: Double,
        progress: Double,
        displayValue: String,
        classification: String,
        attributes: [MetricAttribute] = [],
        explanation: String,
        improvementTrajectory: String? = nil
    ) {
        self.id = id
        self.category = category
        self.score = score
        self.progress = min(max(progress, 0), 1)
        self.displayValue = displayValue
        self.classification = classification
        self.attributes = attributes
        self.explanation = explanation
        self.improvementTrajectory = improvementTrajectory
    }
}

/// A named sub-measurement within a metric (e.g. "Sclera Exposure" → "Minimal").
public struct MetricAttribute: Codable, Identifiable, Sendable, Hashable {
    public let id: UUID
    public let label: String
    public let value: String

    public init(id: UUID = UUID(), label: String, value: String) {
        self.id = id
        self.label = label
        self.value = value
    }
}
