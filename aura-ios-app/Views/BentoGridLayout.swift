import SwiftUI

public struct BentoGridLayout: View {
    let result: AnalysisResult
    
    public init(result: AnalysisResult) {
        self.result = result
    }
    
    public var body: some View {
        VStack(spacing: 12) {
            // Row 1: Eye Area (Double Height equivalent conceptually, full width here for emphasis or split)
            MetricCard(metric: result.eyeArea, isDoubleHeight: true)
                .frame(height: 140)
            
            // Row 2: Two squares
            HStack(spacing: 12) {
                MetricCard(metric: result.jawline)
                MetricCard(metric: result.dimorphism)
            }
            .frame(height: 160)
            
            // Row 3: Two squares
            HStack(spacing: 12) {
                MetricCard(metric: result.symmetry)
                MetricCard(metric: result.dermalQuality)
            }
            .frame(height: 160)
        }
    }
}
