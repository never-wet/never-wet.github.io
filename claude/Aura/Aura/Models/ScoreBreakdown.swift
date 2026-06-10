//
//  ScoreBreakdown.swift
//  Aura
//
//  Per-feature contributions to the overall PSL score. This is the payload that future
//  ML / GPT layers consume and emit (anonymized — no raw image).
//

import Foundation

/// A decomposition of the overall PSL score into weighted per-category contributions.
///
/// The overall score is `sum(weight * normalizedScore)` across components. Keeping the
/// breakdown explicit lets premium reports and GPT recommendations reason about *why* a
/// score landed where it did.
public struct ScoreBreakdown: Codable, Sendable, Hashable {

    /// Weighted contribution of one metric category to the overall score.
    public struct Component: Codable, Identifiable, Sendable, Hashable {
        public let id: UUID
        public let category: MetricCategory
        /// 0–10 score for this category.
        public let score: Double
        /// Relative weight (0–1) in the overall computation.
        public let weight: Double

        public init(id: UUID = UUID(), category: MetricCategory, score: Double, weight: Double) {
            self.id = id
            self.category = category
            self.score = score
            self.weight = weight
        }

        /// This component's contribution to the overall (weighted) score.
        public var weightedContribution: Double { score * weight }
    }

    public let components: [Component]

    public init(components: [Component]) {
        self.components = components
    }

    /// The overall PSL score derived from the weighted components, clamped to 1.0–10.0.
    /// If weights don't sum to 1, the result is normalized by the total weight.
    public var overallScore: Double {
        let totalWeight = components.reduce(0) { $0 + $1.weight }
        guard totalWeight > 0 else { return 1.0 }
        let weighted = components.reduce(0) { $0 + $1.weightedContribution } / totalWeight
        return min(max(weighted, 1.0), 10.0)
    }
}
