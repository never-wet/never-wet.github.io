//
//  AuraCard.swift
//  Aura
//
//  Base surface primitive. Every card in the app is built on this: Surface fill,
//  hairline Border stroke, cornerRadius(5). No other rounding values are permitted.
//

import SwiftUI

/// A clinical surface container. Wraps arbitrary content with the standard fill, hairline
/// border, padding, and the global 5-pt corner radius.
public struct AuraCard<Content: View>: View {

    private let padding: CGFloat
    private let content: Content

    public init(padding: CGFloat = AuraSpacing.lg, @ViewBuilder content: () -> Content) {
        self.padding = padding
        self.content = content()
    }

    public var body: some View {
        content
            .padding(padding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(AuraColor.surface)
            .clipShape(RoundedRectangle(cornerRadius: AuraSpacing.corner, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: AuraSpacing.corner, style: .continuous)
                    .strokeBorder(AuraColor.border, lineWidth: AuraSpacing.hairline)
            )
    }
}

#Preview("AuraCard") {
    ZStack {
        AuraColor.background.ignoresSafeArea()
        AuraCard {
            VStack(alignment: .leading, spacing: AuraSpacing.sm) {
                Text("SURFACE".cased(for: AuraTypography.metricLabel))
                    .auraText(AuraTypography.metricLabel)
                    .foregroundStyle(AuraColor.textTertiary)
                Text("Engineered container")
                    .auraText(AuraTypography.metricValue)
                    .foregroundStyle(AuraColor.textPrimary)
            }
        }
        .padding()
    }
}
