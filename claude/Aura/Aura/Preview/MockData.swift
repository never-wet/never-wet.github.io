//
//  MockData.swift
//  Aura
//
//  Canonical sample data. Used by MockAnalysisService (so the app runs with no backend)
//  and by every SwiftUI preview. Single source of demo truth.
//

import Foundation

/// Namespace for deterministic sample fixtures.
public enum MockData {

    /// A complete, realistic HTN-tier sample result.
    public static let sampleResult: AnalysisResult = {
        let metrics: [MetricItem] = [
            eyeAreaHarmony,
            jawlineAngle,
            dimorphismIndex,
            facialSymmetry,
            dermalQuality
        ]

        let breakdown = ScoreBreakdown(components: [
            .init(category: .eyeAreaHarmony, score: 6.4, weight: 0.25),
            .init(category: .jawlineAngle, score: 6.1, weight: 0.22),
            .init(category: .dimorphismIndex, score: 5.7, weight: 0.20),
            .init(category: .facialSymmetry, score: 5.5, weight: 0.18),
            .init(category: .dermalQuality, score: 5.0, weight: 0.15)
        ])

        return AnalysisResult(
            overallScore: 5.8,
            confidence: 0.92,
            summary: "Harmonious upper-third structure with a defined gonial angle. "
                + "Symmetry and dermal clarity are the primary levers for advancement "
                + "into the elite spectrum.",
            metrics: metrics,
            breakdown: breakdown,
            landmarks: sampleLandmarks
        )
    }()

    // MARK: Individual metrics

    static let eyeAreaHarmony = MetricItem(
        category: .eyeAreaHarmony,
        score: 6.4,
        progress: 0.64,
        displayValue: "6.4",
        classification: "Positive Canthal Tilt",
        attributes: [
            .init(label: "Canthal Tilt", value: "+4°"),
            .init(label: "Sclera Exposure", value: "Minimal"),
            .init(label: "Eye Spacing", value: "Ideal"),
            .init(label: "Orbital Support", value: "Strong")
        ],
        explanation: "A positive canthal tilt with minimal sclera show conveys an alert, "
            + "hunter-eye appearance. Orbital support is well above median.",
        improvementTrajectory: "Periorbital hydration and lower-eyelid support could add +0.3 over 12 weeks."
    )

    static let jawlineAngle = MetricItem(
        category: .jawlineAngle,
        score: 6.1,
        progress: 0.61,
        displayValue: "121°",
        classification: "Defined",
        attributes: [
            .init(label: "Gonial Angle", value: "121°"),
            .init(label: "Definition", value: "High")
        ],
        explanation: "A 121° gonial angle sits in the masculine-defined band, supporting a "
            + "structured lower third."
    )

    static let dimorphismIndex = MetricItem(
        category: .dimorphismIndex,
        score: 5.7,
        progress: 0.57,
        displayValue: "5.7",
        classification: "Above Median",
        attributes: [
            .init(label: "Masculinity", value: "Elevated"),
            .init(label: "Marker Estimate", value: "Moderate-High")
        ],
        explanation: "Sexual-dimorphism markers estimate above the population median, "
            + "driven by brow projection and jaw width."
    )

    static let facialSymmetry = MetricItem(
        category: .facialSymmetry,
        score: 5.5,
        progress: 0.55,
        displayValue: "5.5",
        classification: "Balanced",
        attributes: [
            .init(label: "Bilateral", value: "94% consistent"),
            .init(label: "Facial Thirds", value: "Even"),
            .init(label: "Midline", value: "Aligned")
        ],
        explanation: "Bilateral consistency is strong with evenly distributed facial thirds. "
            + "Minor midline deviation is within normal tolerance."
    )

    static let dermalQuality = MetricItem(
        category: .dermalQuality,
        score: 5.0,
        progress: 0.50,
        displayValue: "5.0",
        classification: "Developing",
        attributes: [
            .init(label: "Texture", value: "Fair"),
            .init(label: "Acne Indicators", value: "Low"),
            .init(label: "Clarity", value: "Median")
        ],
        explanation: "Texture and clarity are the largest opportunity. A consistent dermal "
            + "routine is the highest-leverage near-term improvement."
    )

    // MARK: Landmarks (compact placeholder)

    static let sampleLandmarks = FacialLandmarkData(
        source: .mock,
        detectionConfidence: 0.92,
        points: [
            LandmarkPoint(x: 0.38, y: 0.42),
            LandmarkPoint(x: 0.62, y: 0.42),
            LandmarkPoint(x: 0.50, y: 0.56),
            LandmarkPoint(x: 0.50, y: 0.74)
        ],
        measurements: [
            "gonialAngle": 121,
            "canthalTilt": 4,
            "bilateralSymmetry": 0.94
        ]
    )

    /// A representative error message for previewing the error state.
    public static let sampleErrorMessage = AnalysisError.noFaceDetected.errorDescription ?? "Error"
}
