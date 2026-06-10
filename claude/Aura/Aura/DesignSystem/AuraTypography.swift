//
//  AuraTypography.swift
//  Aura
//
//  SF Pro type scale. Hierarchy is expressed through weight and tracking, not oversized text.
//

import SwiftUI

/// Aura's typographic scale. Each style is a `Font` plus the tracking the design system
/// specifies; apply tracking via the `.auraText(_:)` view modifier so both travel together.
public enum AuraTypography {

    /// A single text style: font + letter spacing (tracking).
    public struct Style: Sendable {
        public let font: Font
        public let tracking: CGFloat
        public let uppercased: Bool

        public init(font: Font, tracking: CGFloat, uppercased: Bool = false) {
            self.font = font
            self.tracking = tracking
            self.uppercased = uppercased
        }
    }

    /// Large hero score — 56 / Semibold / -1.0.
    public static let heroScore = Style(font: .system(size: 56, weight: .semibold, design: .default), tracking: -1.0)

    /// Section title — 17 / Semibold.
    public static let sectionTitle = Style(font: .system(size: 17, weight: .semibold), tracking: 0)

    /// Card title — 13 / Medium / 0.3.
    public static let cardTitle = Style(font: .system(size: 13, weight: .medium), tracking: 0.3)

    /// Metric value — 28 / Semibold / -0.5.
    public static let metricValue = Style(font: .system(size: 28, weight: .semibold), tracking: -0.5)

    /// Metric label — 11 / Medium / 0.6 / UPPERCASE.
    public static let metricLabel = Style(font: .system(size: 11, weight: .medium), tracking: 0.6, uppercased: true)

    /// Body / insight — 14 / Regular.
    public static let body = Style(font: .system(size: 14, weight: .regular), tracking: 0)

    /// Caption — 11 / Regular / 0.2.
    public static let caption = Style(font: .system(size: 11, weight: .regular), tracking: 0.2)
}

// MARK: - View modifier

private struct AuraTextModifier: ViewModifier {
    let style: AuraTypography.Style
    func body(content: Content) -> some View {
        content
            .font(style.font)
            .tracking(style.tracking)
    }
}

public extension View {
    /// Applies an `AuraTypography.Style` (font + tracking) to a text view.
    func auraText(_ style: AuraTypography.Style) -> some View {
        modifier(AuraTextModifier(style: style))
    }
}

public extension String {
    /// Applies the casing transform a style requires (e.g. uppercasing metric labels).
    /// Call as `label.cased(for: AuraTypography.metricLabel)`.
    func cased(for style: AuraTypography.Style) -> String {
        style.uppercased ? uppercased() : self
    }
}
