import SwiftUI

/// Luxury Clinical Dark Mode Colors
public enum AuraColors {
    public static let background = Color(hex: "#09090A")
    public static let surface = Color(hex: "#0D0D12")
    public static let secondarySurface = Color(hex: "#09090B")
    public static let border = Color(hex: "#24242B")
    public static let accentPurple = Color(hex: "#8B5CF6")
    public static let accentBlue = Color(hex: "#60A5FA")
    public static let textPrimary = Color(hex: "#FFFFFF")
    public static let textSecondary = Color(hex: "#A1A1AA")
}

/// Enforces the strict rule against pills and large curves
public struct AuraCornerRadius: ViewModifier {
    public func body(content: Content) -> some View {
        content.cornerRadius(5)
    }
}

extension View {
    /// Applies the standard clinical premium look to any card
    public func auraCardStyle() -> some View {
        self
            .background(AuraColors.secondarySurface)
            .modifier(AuraCornerRadius())
            .overlay(
                RoundedRectangle(cornerRadius: 5)
                    .stroke(AuraColors.border, lineWidth: 1)
            )
    }
}

/// Standard accessibility modifiers for metric text
public struct MetricAccessibilityText: ViewModifier {
    let label: String
    let value: String
    
    public func body(content: Content) -> some View {
        content
            .accessibilityElement(children: .combine)
            .accessibilityLabel("\(label): \(value)")
    }
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue:  Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
