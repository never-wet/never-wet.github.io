import SwiftUI

public struct HeroScoreCard: View {
    let result: AnalysisResult
    
    public init(result: AnalysisResult) {
        self.result = result
    }
    
    public var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("PSL SCORE")
                        .font(.system(size: 10, weight: .bold, design: .default))
                        .kerning(1.2)
                        .foregroundColor(Theme.textMuted)
                    
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text(String(format: "%.1f", result.overallScore))
                            .font(.system(size: 48, weight: .semibold, design: .default))
                            .foregroundColor(Theme.accentWhite)
                        
                        Text("/ 10")
                            .font(.system(size: 20, weight: .medium, design: .default))
                            .foregroundColor(Theme.textMuted)
                    }
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 8) {
                    HStack(spacing: 6) {
                        Text("TIER")
                            .font(.system(size: 10, weight: .bold))
                            .kerning(1.0)
                            .foregroundColor(Theme.textMuted)
                        Text(result.tier)
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(Theme.accentPurple)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Theme.accentPurple.opacity(0.15))
                            .cornerRadius(Theme.cornerRadius)
                    }
                    
                    HStack(spacing: 6) {
                        Text("CONFIDENCE")
                            .font(.system(size: 10, weight: .bold))
                            .kerning(1.0)
                            .foregroundColor(Theme.textMuted)
                        Text("\(Int(result.confidenceScore * 100))%")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(Theme.accentBlue)
                    }
                }
            }
            
            Divider()
                .background(Theme.border)
            
            Text(result.summary)
                .font(.system(size: 14, weight: .regular))
                .foregroundColor(Theme.accentWhite.opacity(0.85))
                .lineSpacing(4)
        }
        .padding(20)
        .background(Theme.surface)
        .cornerRadius(Theme.cornerRadius)
        .overlay(
            RoundedRectangle(cornerRadius: Theme.cornerRadius)
                .stroke(Theme.border, lineWidth: 1)
        )
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Overall PSL Score is \(String(format: "%.1f", result.overallScore)) out of 10. Tier is \(result.tier). \(result.summary)")
    }
}
