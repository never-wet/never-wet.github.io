//
//  FacialLandmarkData.swift
//  Aura
//
//  Normalized facial-landmark payload. Backend-agnostic: Vision, MediaPipe, OpenCV, or a
//  custom API all populate this same structure.
//

import CoreGraphics
import Foundation

/// A normalized facial landmark point in unit image space (0...1, origin top-left).
public struct LandmarkPoint: Codable, Sendable, Hashable {
    public let x: Double
    public let y: Double
    /// Optional depth/confidence channel (0...1). `nil` for 2D-only providers.
    public let z: Double?

    public init(x: Double, y: Double, z: Double? = nil) {
        self.x = x
        self.y = y
        self.z = z
    }

    /// Convenience conversion to a `CGPoint` in unit space.
    public var cgPoint: CGPoint { CGPoint(x: x, y: y) }
}

/// The raw geometric output of a landmark-detection pass, plus a few derived measurements
/// the scoring engine consumes. Source-agnostic by design.
public struct FacialLandmarkData: Codable, Identifiable, Sendable, Hashable {

    /// Which detector produced this data.
    public enum Source: String, Codable, Sendable {
        case vision
        case mediaPipe
        case openCV
        case custom
        case mock
    }

    public let id: UUID
    public let source: Source
    /// Detector confidence for the landmark pass (0...1).
    public let detectionConfidence: Double
    /// Ordered landmark points in unit image space.
    public let points: [LandmarkPoint]
    /// Derived geometric measurements keyed by name (e.g. "gonialAngle" → 121).
    public let measurements: [String: Double]

    public init(
        id: UUID = UUID(),
        source: Source,
        detectionConfidence: Double,
        points: [LandmarkPoint],
        measurements: [String: Double] = [:]
    ) {
        self.id = id
        self.source = source
        self.detectionConfidence = detectionConfidence
        self.points = points
        self.measurements = measurements
    }
}
