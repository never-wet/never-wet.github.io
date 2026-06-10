//
//  AuraColor.swift
//  Aura
//
//  Luxury Clinical Dark Mode color tokens.
//  Single source of truth for every color in the app — never use literal Colors in views.
//

import SwiftUI

/// Namespaced color palette for Aura's "Luxury Clinical Dark Mode" theme.
///
/// All values are defined as 8-digit-safe hex initializers so the palette can be tuned
/// in one place. Text colors are expressed as white at descending opacity to keep the
/// clinical, monochromatic hierarchy consistent.
public enum AuraColor {

    // MARK: Surfaces

    /// App canvas. `#09090A`
    public static let background = Color(hex: 0x09090A)

    /// Primary card surface. `#16161A`
    public static let surface = Color(hex: 0x16161A)

    /// Nested / inset surface. `#09090B`
    public static let secondarySurface = Color(hex: 0x09090B)

    /// Hairline border on every card. `#24242B`
    public static let border = Color(hex: 0x24242B)

    // MARK: Accents

    /// Primary accent — scores, key progress. `#8B5CF6`
    public static let accentPurple = Color(hex: 0x8B5CF6)

    /// Secondary accent — supporting data. `#60A5FA`
    public static let accentBlue = Color(hex: 0x60A5FA)

    /// Primary text / pure accent white. `#FFFFFF`
    public static let accentWhite = Color(hex: 0xFFFFFF)

    // MARK: Text hierarchy (white at descending opacity)

    /// Primary text — 100% white.
    public static let textPrimary = Color.white

    /// Secondary text — 70% white.
    public static let textSecondary = Color.white.opacity(0.70)

    /// Tertiary text / metric labels — 45% white.
    public static let textTertiary = Color.white.opacity(0.45)
}

// MARK: - Hex initializer

extension Color {
    /// Creates a `Color` from a 24-bit RGB hex value, e.g. `0x8B5CF6`.
    /// - Parameters:
    ///   - hex: Packed `0xRRGGBB` value.
    ///   - opacity: Alpha, defaults to fully opaque.
    init(hex: UInt32, opacity: Double = 1.0) {
        let red = Double((hex >> 16) & 0xFF) / 255.0
        let green = Double((hex >> 8) & 0xFF) / 255.0
        let blue = Double(hex & 0xFF) / 255.0
        self.init(.sRGB, red: red, green: green, blue: blue, opacity: opacity)
    }
}
