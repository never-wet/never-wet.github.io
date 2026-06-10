//
//  HeroScoreCard.swift
//  Aura
//
//  Full-width flagship hero. Displays overall PSL score, tier, confidence, and the
//  AI-generated assessment summary — like the header of a diagnostic report.
//

import SwiftUI

/// The full-width hero card at the top of the dashboard.
public struct HeroScoreCard: View {

    private let result: AnalysisResult
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var appeared = false

    public init(result: AnalysisResult) {
        self.result = result
    }

    public var body: some View {
        AuraCard(padding: AuraSpacing.xl) {
            VStack(alignment: .leading, spacing: AuraSpacing.lg) {
                header
                scoreRow
                Divider().overlay(AuraColor.border)
                Text(result.summary)
                    .auraText(AuraTypography.body)
                    .foregroundStyle(AuraColor.textSecondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .opacity(appeared ? 1 : 0)
        .scaleEffect(appeared ? 1 : 0.98)
        .onAppear {
            withAnimation(AuraMotion.resolved(AuraMotion.appear, reduceMotion: reduceMotion)) {
                appeared = true
            }
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel(accessibilityLabel)
    }

    // MARK: Subviews

    private var header: some View {
        HStack {
            Text("OVERALL ASSESSMENT".cased(for: AuraTypography.metricLabel))
                .auraText(AuraTypography.metricLabel)
                .foregroundStyle(AuraColor.textTertiary)
            Spacer()
            confidenceBadge
        }
    }

    private var scoreRow: some View {
        HStack(alignment: .firstTextBaseline, spacing: AuraSpacing.md) {
            HStack(alignment: .firstTextBaseline, spacing: 2) {
                Text(String(format: "%.1f", result.overallScore))
                    .auraText(AuraTypography.heroScore)
                    .foregroundStyle(AuraColor.textPrimary)
                Text("/ 10")
                    .auraText(AuraTypography.sectionTitle)
                    .foregroundStyle(AuraColor.textTertiary)
            }
            Spacer()
            tierBadge
        }
    }

    private var tierBadge: some View {
        VStack(alignment: .trailing, spacing: AuraSpacing.xs) {
            Text(result.tier.code)
                .auraText(AuraTypography.sectionTitle)
                .foregroundStyle(result.tier.accent)
            Text(result.tier.displayName)
                .auraText(AuraTypography.caption)
                .foregroundStyle(AuraColor.textTertiary)
        }
        .padding(.horizontal, AuraSpacing.md)
        .padding(.vertical, AuraSpacing.sm)
        .background(AuraColor.secondarySurface)
        .clipShape(RoundedRectangle(cornerRadius: AuraSpacing.corner, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: AuraSpacing.corner, style: .continuous)
                .strokeBorder(result.tier.accent.opacity(0.4), lineWidth: AuraSpacing.hairline)
        )
    }

    private var confidenceBadge: some View {
        HStack(spacing: AuraSpacing.xs) {
            Image(systemName: "checkmark.seal")
                .font(.system(size: 11, weight: .semibold))
            Text("\(result.confidencePercent)% confidence")
                .auraText(AuraTypography.caption)
        }
        .foregroundStyle(AuraColor.accentBlue)
    }

    private var accessibilityLabel: String {
        "Overall PSL score \(String(format: "%.1f", result.overallScore)) out of 10. "
            + "Tier \(result.tier.displayName). "
            + "Confidence \(result.confidencePercent) percent. "
            + result.summary
    }
}

#Preview("HeroScoreCard") {
    ZStack {
        AuraColor.background.ignoresSafeArea()
        HeroScoreCard(result: MockData.sampleResult)
            .padding()
    }
}
