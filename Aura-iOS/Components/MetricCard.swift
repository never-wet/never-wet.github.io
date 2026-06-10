import SwiftUI

/// Base View for a Metric card, supports Double-height and Square layout
public struct MetricCard: View {
    let metric: MetricItem
    let isDoubleHeight: Bool
    
    public init(metric: MetricItem, isDoubleHeight: Bool = false) {
        self.metric = metric
        self.isDoubleHeight = isDoubleHeight
    }
    
    public var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(metric.name.uppercased())
                .font(.system(isDoubleHeight ? .caption : .caption2, design: .default).weight(.bold))
                .foregroundColor(AuraColors.textSecondary)
                .tracking(1.2)
                .lineLimit(1)
            
            Spacer()
            
            Text(metric.displayValue)
                .font(.system(.title2, design: .default).weight(.medium))
                .foregroundColor(AuraColors.textPrimary)
            
            Text(metric.trajectory)
                .font(.system(.caption, design: .default).weight(.medium))
                .foregroundColor(isDoubleHeight ? AuraColors.accentBlue : AuraColors.textSecondary)
        }
        .padding(16)
        .frame(maxWidth: .infinity, minHeight: isDoubleHeight ? 224 : 106, alignment: .topLeading)
        .auraCardStyle()
        .modifier(MetricAccessibilityText(label: metric.name, value: "\(metric.displayValue), Trajectory: \(metric.trajectory)"))
    }
}

struct MetricCard_Previews: PreviewProvider {
    static var previews: some View {
        HStack(spacing: 12) {
            MetricCard(metric: MockData.sampleMetrics[0], isDoubleHeight: true)
            VStack(spacing: 12) {
                MetricCard(metric: MockData.sampleMetrics[1])
                MetricCard(metric: MockData.sampleMetrics[2])
            }
        }
        .padding()
        .background(AuraColors.background)
        .previewLayout(.sizeThatFits)
    }
}
