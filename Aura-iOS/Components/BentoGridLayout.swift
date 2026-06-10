import SwiftUI

/// Arranges metrics into the flagship Bento Grid Layout
public struct BentoGridLayout: View {
    let metrics: [MetricItem]
    
    public var body: some View {
        VStack(spacing: 12) {
            // Top Row: 1 Double Height (Left), 2 Squares (Right)
            HStack(alignment: .top, spacing: 12) {
                if let eyeArea = metrics.first(where: { $0.categoryId == "eye_area" }) {
                    MetricCard(metric: eyeArea, isDoubleHeight: true)
                }
                
                VStack(spacing: 12) {
                    if let jawline = metrics.first(where: { $0.categoryId == "jawline" }) {
                        MetricCard(metric: jawline, isDoubleHeight: false)
                    }
                    if let dimorphism = metrics.first(where: { $0.categoryId == "dimorphism" }) {
                        MetricCard(metric: dimorphism, isDoubleHeight: false)
                    }
                }
            }
            
            // Bottom Row: 2 Squares
            HStack(spacing: 12) {
                if let symmetry = metrics.first(where: { $0.categoryId == "symmetry" }) {
                    MetricCard(metric: symmetry, isDoubleHeight: false)
                }
                if let dermal = metrics.first(where: { $0.categoryId == "dermal" }) {
                    MetricCard(metric: dermal, isDoubleHeight: false)
                }
            }
        }
        .accessibilityElement(children: .contain)
    }
}

struct BentoGridLayout_Previews: PreviewProvider {
    static var previews: some View {
        BentoGridLayout(metrics: MockData.sampleMetrics)
            .padding()
            .background(AuraColors.background)
            .previewLayout(.sizeThatFits)
    }
}
