import SwiftUI

public struct MetricCard: View {
    let metric: MetricItem
    let isDoubleHeight: Bool
    
    public init(metric: MetricItem, isDoubleHeight: Bool = false) {
        self.metric = metric
        self.isDoubleHeight = isDoubleHeight
    }
    
    public var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(metric.title.uppercased())
                .font(.system(size: 10, weight: .bold))
                .kerning(1.2)
                .foregroundColor(Theme.textMuted)
            
            Text(metric.primaryValue)
                .font(.system(size: 24, weight: .medium))
                .foregroundColor(Theme.accentWhite)
                .minimumScaleFactor(0.5)
                .lineLimit(1)
            
            // Linear Progress Bar (No circular, engineered look)
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Rectangle()
                        .fill(Theme.secondarySurface)
                        .frame(height: 4)
                        .cornerRadius(2)
                    
                    Rectangle()
                        .fill(LinearGradient(colors: [Theme.accentPurple, Theme.accentBlue], startPoint: .leading, endPoint: .trailing))
                        .frame(width: geo.size.width * metric.score, height: 4)
                        .cornerRadius(2)
                }
            }
            .frame(height: 4)
            
            Spacer(minLength: 0)
            
            Text(metric.explanation)
                .font(.system(size: 12, weight: .regular))
                .foregroundColor(Theme.textMuted)
                .lineLimit(isDoubleHeight ? nil : 2)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(16)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .background(Theme.surface)
        .cornerRadius(Theme.cornerRadius)
        .overlay(
            RoundedRectangle(cornerRadius: Theme.cornerRadius)
                .stroke(Theme.border, lineWidth: 1)
        )
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(metric.title). Value: \(metric.primaryValue). \(metric.explanation)")
    }
}
