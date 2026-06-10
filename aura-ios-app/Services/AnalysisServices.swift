import Foundation
import UIKit

public protocol AnalysisServiceProtocol: Sendable {
    func analyze(image: UIImage) async throws -> AnalysisResult
}

public enum AnalysisError: Error {
    case invalidImage
    case processingFailed
}

public final class MockAnalysisService: AnalysisServiceProtocol {
    public init() {}
    
    public func analyze(image: UIImage) async throws -> AnalysisResult {
        // Simulate complex clinical processing delay
        try await Task.sleep(nanoseconds: 2_500_000_000)
        
        return AnalysisResult(
            overallScore: 5.8,
            tier: "HTN",
            confidenceScore: 0.92,
            summary: "Structure displays high-tier normie characteristics. Strong orbital support is counterbalanced by minor mid-face asymmetry. Dimorphic traits align well with masculine ideals.",
            eyeArea: MetricItem(
                title: "Eye Area Harmony",
                primaryValue: "Neutral Canthal",
                score: 0.75,
                explanation: "Positive orbital vector with minimal sclera show."
            ),
            jawline: MetricItem(
                title: "Jawline Angle",
                primaryValue: "121°",
                score: 0.85,
                explanation: "Optimal gonial angle within masculine ranges."
            ),
            dimorphism: MetricItem(
                title: "Dimorphism Index",
                primaryValue: "Strong",
                score: 0.88,
                explanation: "Prominent brow ridge and chin projection."
            ),
            symmetry: MetricItem(
                title: "Facial Symmetry",
                primaryValue: "89%",
                score: 0.89,
                explanation: "Minor bilateral deviation at nasal bridge."
            ),
            dermalQuality: MetricItem(
                title: "Dermal Quality",
                primaryValue: "Clear",
                score: 0.95,
                explanation: "High texture score with low surface aberrations."
            )
        )
    }
}
