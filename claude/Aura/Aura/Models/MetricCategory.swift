//
//  MetricCategory.swift
//  Aura
//
//  Enumerates the analyzable facial metric categories. Adding a case here + populating it
//  in the service layer is all that's required to surface a new card — the UI is generic.
//

import Foundation

/// A category of facial analysis surfaced as a card on the dashboard.
public enum MetricCategory: String, Codable, Sendable, CaseIterable, Identifiable {
    case eyeAreaHarmony
    case jawlineAngle
    case dimorphismIndex
    case facialSymmetry
    case dermalQuality

    public var id: String { rawValue }

    /// Title shown on the card.
    public var title: String {
        switch self {
        case .eyeAreaHarmony: return "Eye Area Harmony"
        case .jawlineAngle:   return "Jawline Angle"
        case .dimorphismIndex: return "Dimorphism Index"
        case .facialSymmetry: return "Facial Symmetry"
        case .dermalQuality:  return "Dermal Quality"
        }
    }

    /// SF Symbol representing the category.
    public var systemImage: String {
        switch self {
        case .eyeAreaHarmony: return "eye"
        case .jawlineAngle:   return "triangle"
        case .dimorphismIndex: return "figure.stand"
        case .facialSymmetry: return "rectangle.split.2x1"
        case .dermalQuality:  return "circle.grid.cross"
        }
    }

    /// Relative footprint within the Bento grid.
    public var layout: BentoSpan {
        switch self {
        case .eyeAreaHarmony: return .doubleHeight
        default:              return .square
        }
    }
}

/// How much room a metric occupies in the Bento grid.
public enum BentoSpan: String, Codable, Sendable {
    /// 1×1 cell.
    case square
    /// 1 column × 2 rows.
    case doubleHeight
}
