import Foundation

/// Provides mock data for previews and offline development
public enum MockData {
    public static let sampleMetrics: [MetricItem] = [
        MetricItem(id: UUID(), categoryId: "eye_area", name: "Canthal Tilt", value: 4.2, displayValue: "Positive", trajectory: "Ideal", score: 8.5),
        MetricItem(id: UUID(), categoryId: "jawline", name: "Gonial Angle", value: 121.0, displayValue: "121°", trajectory: "Strong", score: 9.0),
        MetricItem(id: UUID(), categoryId: "dimorphism", name: "Masculinity Index", value: 0.85, displayValue: "High", trajectory: "Chad-lite", score: 7.8),
        MetricItem(id: UUID(), categoryId: "symmetry", name: "Bilateral Consistency", value: 0.92, displayValue: "92%", trajectory: "Excellent", score: 9.2),
        MetricItem(id: UUID(), categoryId: "dermal", name: "Texture Score", value: 0.88, displayValue: "Clear", trajectory: "Stable", score: 8.8)
    ]
    
    public static let sampleBreakdown = ScoreBreakdown(
        id: UUID(),
        pslScore: 5.8,
        tier: "HTN",
        confidence: 92.0,
        summary: "High Tier Normie with strong jawline angle (121°) and positive canthal tilt. Facial harmony is elevated by excellent bilateral consistency. Minor improvements possible in dermal texture.",
        metrics: sampleMetrics
    )
    
    public static let sampleResult = AnalysisResult(
        id: UUID(),
        timestamp: Date(),
        landmarks: FacialLandmarkData(id: UUID(), points: []),
        breakdown: sampleBreakdown
    )
}
