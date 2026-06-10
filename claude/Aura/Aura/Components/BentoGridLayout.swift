//
//  BentoGridLayout.swift
//  Aura
//
//  Composes the dashboard's Bento grid: the double-height Eye Area Harmony card alongside
//  stacked square cards, then a final row of square cards. Two equal columns, `md` gutter.
//

import SwiftUI

/// Lays out the metric cards in Aura's signature Bento arrangement.
///
/// Layout:
/// ```
/// ┌──────────────┬──────────────┐
/// │              │  Jawline     │
/// │  Eye Area    ├──────────────┤
/// │  Harmony     │  Dimorphism  │
/// │ (double H)   │              │
/// ├──────────────┼──────────────┤
/// │  Symmetry    │  Dermal      │
/// └──────────────┴──────────────┘
/// ```
public struct BentoGridLayout: View {

    private let result: AnalysisResult

    public init(result: AnalysisResult) {
        self.result = result
    }

    public var body: some View {
        VStack(spacing: AuraSpacing.md) {
            // Top region: double-height card beside two stacked squares.
            HStack(alignment: .top, spacing: AuraSpacing.md) {
                if let eye = result.metric(for: .eyeAreaHarmony) {
                    MetricCard(metric: eye)
                        .frame(maxWidth: .infinity)
                }

                VStack(spacing: AuraSpacing.md) {
                    if let jaw = result.metric(for: .jawlineAngle) {
                        MetricCard(metric: jaw)
                    }
                    if let dimorphism = result.metric(for: .dimorphismIndex) {
                        MetricCard(metric: dimorphism)
                    }
                }
                .frame(maxWidth: .infinity)
            }

            // Bottom region: two square cards.
            HStack(alignment: .top, spacing: AuraSpacing.md) {
                if let symmetry = result.metric(for: .facialSymmetry) {
                    MetricCard(metric: symmetry)
                        .frame(maxWidth: .infinity)
                }
                if let dermal = result.metric(for: .dermalQuality) {
                    MetricCard(metric: dermal)
                        .frame(maxWidth: .infinity)
                }
            }
        }
    }
}

#Preview("BentoGridLayout") {
    ZStack {
        AuraColor.background.ignoresSafeArea()
        ScrollView {
            BentoGridLayout(result: MockData.sampleResult)
                .padding()
        }
    }
}
