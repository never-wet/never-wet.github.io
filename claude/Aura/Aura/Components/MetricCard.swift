//
//  MetricCard.swift
//  Aura
//
//  Generic Bento cell. Renders any MetricItem regardless of category. Double-height cards
//  reveal attributes, explanation, and improvement trajectory; square cards stay compact.
//

import SwiftUI

/// A single metric tile in the Bento grid. Layout adapts to the metric's `category.layout`.
public struct MetricCard: View {

    private let metric: MetricItem
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var appeared = false

    public init(metric: MetricItem) {
        self.metric = metric
    }

    private var isExpanded: Bool { metric.category.layout == .doubleHeight }

    public var body: some View {
        AuraCard {
            VStack(alignment: .leading, spacing: AuraSpacing.md) {
                header
                valueRow
                LinearProgressIndicator(progress: metric.progress, tint: tint)

                if isExpanded {
                    expandedDetail
                }
            }
        }
        .frame(maxHeight: .infinity, alignment: .top)
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
        HStack(spacing: AuraSpacing.sm) {
            Image(systemName: metric.category.systemImage)
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(tint)
            Text(metric.category.title.cased(for: AuraTypography.metricLabel))
                .auraText(AuraTypography.metricLabel)
                .foregroundStyle(AuraColor.textTertiary)
        }
    }

    private var valueRow: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(metric.displayValue)
                .auraText(AuraTypography.metricValue)
                .foregroundStyle(AuraColor.textPrimary)
            Text(metric.classification)
                .auraText(AuraTypography.caption)
                .foregroundStyle(AuraColor.textSecondary)
        }
    }

    private var expandedDetail: some View {
        VStack(alignment: .leading, spacing: AuraSpacing.md) {
            // Attribute grid (label/value pairs)
            VStack(spacing: AuraSpacing.sm) {
                ForEach(metric.attributes) { attribute in
                    HStack {
                        Text(attribute.label)
                            .auraText(AuraTypography.caption)
                            .foregroundStyle(AuraColor.textTertiary)
                        Spacer()
                        Text(attribute.value)
                            .auraText(AuraTypography.caption)
                            .foregroundStyle(AuraColor.textPrimary)
                    }
                }
            }

            Divider().overlay(AuraColor.border)

            Text(metric.explanation)
                .auraText(AuraTypography.body)
                .foregroundStyle(AuraColor.textSecondary)
                .fixedSize(horizontal: false, vertical: true)

            if let trajectory = metric.improvementTrajectory {
                HStack(alignment: .top, spacing: AuraSpacing.sm) {
                    Image(systemName: "arrow.up.right")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(AuraColor.accentPurple)
                    Text(trajectory)
                        .auraText(AuraTypography.caption)
                        .foregroundStyle(AuraColor.textSecondary)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .padding(AuraSpacing.md)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(AuraColor.secondarySurface)
                .clipShape(RoundedRectangle(cornerRadius: AuraSpacing.corner, style: .continuous))
            }
        }
    }

    // MARK: Helpers

    private var tint: Color {
        metric.score >= 6.0 ? AuraColor.accentPurple : AuraColor.accentBlue
    }

    private var accessibilityLabel: String {
        var parts = ["\(metric.category.title). \(metric.displayValue). \(metric.classification)."]
        if isExpanded {
            parts.append(metric.explanation)
            if let trajectory = metric.improvementTrajectory { parts.append(trajectory) }
        }
        return parts.joined(separator: " ")
    }
}

#Preview("MetricCard — square") {
    ZStack {
        AuraColor.background.ignoresSafeArea()
        MetricCard(metric: MockData.jawlineAngle)
            .frame(width: 180)
            .padding()
    }
}

#Preview("MetricCard — double height") {
    ZStack {
        AuraColor.background.ignoresSafeArea()
        MetricCard(metric: MockData.eyeAreaHarmony)
            .frame(width: 200)
            .padding()
    }
}
