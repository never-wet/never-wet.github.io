import SwiftUI

/// Flagship full-width dashboard hero score card
public struct HeroScoreCard: View {
    let breakdown: ScoreBreakdown
    
    public var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("PSL SCORE")
                        .font(.system(.caption, design: .default).weight(.bold))
                        .foregroundColor(AuraColors.textSecondary)
                        .tracking(1.5)
                    
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text(String(format: "%.1f", breakdown.pslScore))
                            .font(.system(size: 48, weight: .semibold, design: .default))
                            .foregroundColor(AuraColors.textPrimary)
                        Text("/ 10")
                            .font(.system(.title3).weight(.medium))
                            .foregroundColor(AuraColors.textSecondary)
                    }
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 4) {
                    Text("TIER")
                        .font(.system(.caption, design: .default).weight(.bold))
                        .foregroundColor(AuraColors.textSecondary)
                        .tracking(1.5)
                    Text(breakdown.tier)
                        .font(.system(.title2).weight(.bold))
                        .foregroundColor(AuraColors.accentPurple)
                }
            }
            .accessibilityElement(children: .ignore)
            .accessibilityLabel("Overall PSL Score is \(String(format: "%.1f", breakdown.pslScore)) out of 10. Tier is \(breakdown.tier).")
            
            Divider().background(AuraColors.border)
            
            HStack {
                Text("AI ASSESSMENT")
                    .font(.system(.caption2).weight(.bold))
                    .foregroundColor(AuraColors.textSecondary)
                    .tracking(1.5)
                Spacer()
                Text("CONFIDENCE: \(Int(breakdown.confidence))%")
                    .font(.system(.caption2).weight(.bold))
                    .foregroundColor(AuraColors.accentBlue)
            }
            .accessibilityElement(children: .ignore)
            .accessibilityLabel("AI Assessment, Confidence \(Int(breakdown.confidence)) percent")
            
            Text(breakdown.summary)
                .font(.system(.subheadline))
                .foregroundColor(AuraColors.textPrimary)
                .lineSpacing(4)
                .accessibilityLabel("Assessment Summary: \(breakdown.summary)")
        }
        .padding(20)
        .auraCardStyle()
    }
}

struct HeroScoreCard_Previews: PreviewProvider {
    static var previews: some View {
        HeroScoreCard(breakdown: MockData.sampleBreakdown)
            .padding()
            .background(AuraColors.background)
            .previewLayout(.sizeThatFits)
    }
}
