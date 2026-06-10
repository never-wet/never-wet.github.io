//
//  LinearProgressIndicator.swift
//  Aura
//
//  The ONLY progress primitive in Aura. Linear, cornerRadius(5), accent fill.
//  No circular progress bars anywhere in the product.
//

import SwiftUI

/// A linear progress bar with a clinical track and accent-colored fill. Animates its fill
/// with a critically-damped spring (honoring Reduced Motion).
public struct LinearProgressIndicator: View {

    /// Normalized progress, 0.0–1.0.
    private let progress: Double
    /// Fill color; defaults to the primary purple accent.
    private let tint: Color
    /// Bar thickness.
    private let height: CGFloat

    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    public init(progress: Double, tint: Color = AuraColor.accentPurple, height: CGFloat = 6) {
        self.progress = min(max(progress, 0), 1)
        self.tint = tint
        self.height = height
    }

    public var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                RoundedRectangle(cornerRadius: AuraSpacing.corner, style: .continuous)
                    .fill(AuraColor.secondarySurface)
                    .overlay(
                        RoundedRectangle(cornerRadius: AuraSpacing.corner, style: .continuous)
                            .strokeBorder(AuraColor.border, lineWidth: AuraSpacing.hairline)
                    )

                RoundedRectangle(cornerRadius: AuraSpacing.corner, style: .continuous)
                    .fill(tint)
                    .frame(width: max(0, geo.size.width * progress))
                    .animation(AuraMotion.resolved(AuraMotion.progress, reduceMotion: reduceMotion), value: progress)
            }
        }
        .frame(height: height)
        .accessibilityElement()
        .accessibilityValue("\(Int((progress * 100).rounded())) percent")
    }
}

#Preview("LinearProgress") {
    ZStack {
        AuraColor.background.ignoresSafeArea()
        VStack(spacing: AuraSpacing.lg) {
            LinearProgressIndicator(progress: 0.58)
            LinearProgressIndicator(progress: 0.82, tint: AuraColor.accentBlue)
            LinearProgressIndicator(progress: 0.34, tint: AuraColor.accentPurple, height: 10)
        }
        .padding()
    }
}
