//
//  PSLTier.swift
//  Aura
//
//  The PSL (1.0–10.0) scoring framework. Tier boundaries live here as the single
//  source of truth so the entire system can be recalibrated by editing one table.
//

import SwiftUI

/// A named band on the 1.0–10.0 PSL aesthetic scale.
///
/// The score → tier mapping is centralized in ``tier(for:)``. Recalibrating the framework
/// means editing only this type; no view or view-model code changes.
public enum PSLTier: String, Codable, Sendable, CaseIterable, Identifiable {
    case subThree
    case subFive
    case ltn
    case mtn
    case htn
    case chad
    case trueAdam

    public var id: String { rawValue }

    /// Inclusive score range that maps to this tier.
    public var range: ClosedRange<Double> {
        switch self {
        case .subThree: return 1.0...2.9
        case .subFive:  return 3.0...4.9
        case .ltn:      return 5.0...5.2
        case .mtn:      return 5.3...5.5
        case .htn:      return 5.6...5.9
        case .chad:     return 6.0...6.9
        case .trueAdam: return 7.0...10.0
        }
    }

    /// Short code shown in the UI (e.g. "HTN").
    public var code: String {
        switch self {
        case .subThree: return "SUB-3"
        case .subFive:  return "SUB-5"
        case .ltn:      return "LTN"
        case .mtn:      return "MTN"
        case .htn:      return "HTN"
        case .chad:     return "CHAD"
        case .trueAdam: return "TRUE ADAM"
        }
    }

    /// Human-readable name.
    public var displayName: String {
        switch self {
        case .subThree: return "Sub-3"
        case .subFive:  return "Sub-5"
        case .ltn:      return "Low Tier Normie"
        case .mtn:      return "Mid Tier Normie"
        case .htn:      return "High Tier Normie"
        case .chad:     return "Chad"
        case .trueAdam: return "True Adam"
        }
    }

    /// One-line clinical descriptor.
    public var descriptor: String {
        switch self {
        case .subThree: return "Severe structural deficiencies, major asymmetry, recessed features."
        case .subFive:  return "Below average with minor structural weaknesses."
        case .ltn:      return "Lower end of the normal aesthetic spectrum."
        case .mtn:      return "Median of the normal aesthetic spectrum."
        case .htn:      return "Upper end of the normal aesthetic spectrum."
        case .chad:     return "Strong masculine structure."
        case .trueAdam: return "Near-ideal facial proportions."
        }
    }

    /// Accent color used to tint score / tier presentation.
    public var accent: Color {
        switch self {
        case .subThree, .subFive:  return AuraColor.accentBlue
        case .ltn, .mtn, .htn:     return AuraColor.accentBlue
        case .chad, .trueAdam:     return AuraColor.accentPurple
        }
    }

    /// Resolves a continuous score to its tier. Scores are clamped to 1.0–10.0.
    /// - Parameter score: A value in the PSL range.
    /// - Returns: The matching ``PSLTier``.
    public static func tier(for score: Double) -> PSLTier {
        let clamped = min(max(score, 1.0), 10.0)
        return allCases.first { $0.range.contains(clamped) } ?? .mtn
    }
}
