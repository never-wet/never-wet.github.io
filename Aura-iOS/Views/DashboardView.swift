import SwiftUI

/// Flagship Dashboard combining Hero and Bento Grid
public struct DashboardView: View {
    @StateObject private var viewModel = DashboardViewModel()
    @Environment(\.accessibilityReduceMotion) var reduceMotion
    
    public init() {}
    
    public var body: some View {
        ZStack {
            AuraColors.background.ignoresSafeArea()
            
            ScrollView(showsIndicators: false) {
                VStack(spacing: 16) {
                    headerRow
                    
                    if viewModel.isLoading {
                        loadingView
                    } else if let result = viewModel.session?.currentResult {
                        HeroScoreCard(breakdown: result.breakdown)
                            .transition(reduceMotion ? .opacity : .opacity.combined(with: .scale(scale: 0.98)))
                        
                        BentoGridLayout(metrics: result.breakdown.metrics)
                            .transition(reduceMotion ? .opacity : .opacity.combined(with: .scale(scale: 0.98)))
                    } else if let error = viewModel.errorMessage {
                        errorView(message: error)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 40)
            }
        }
        .sheet(isPresented: $viewModel.showCameraSelection) {
            FallbackCameraSelectionView(onImageSelected: { image in
                viewModel.processImage(image, reduceMotion: reduceMotion)
            })
        }
        .preferredColorScheme(.dark)
    }
    
    private var headerRow: some View {
        HStack {
            Text("AURA")
                .font(.system(.headline, design: .default).weight(.bold))
                .foregroundColor(AuraColors.textPrimary)
                .tracking(2.0)
                .accessibilityAddTraits(.isHeader)
            
            Spacer()
            
            Button(action: {
                viewModel.resetSession(reduceMotion: reduceMotion)
            }) {
                Image(systemName: "arrow.counterclockwise")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(AuraColors.textPrimary)
                    .padding(8)
                    .background(AuraColors.border)
                    .modifier(AuraCornerRadius())
            }
            .accessibilityLabel("Reset Session")
            .accessibilityHint("Clears current analysis and opens camera selection")
        }
        .padding(.vertical, 8)
    }
    
    private var loadingView: some View {
        VStack(spacing: 20) {
            Spacer().frame(height: 100)
            ProgressView()
                .progressViewStyle(CircularProgressViewStyle(tint: AuraColors.accentPurple))
                .scaleEffect(1.5)
            Text("ANALYZING FACIAL LANDMARKS...")
                .font(.system(.caption, design: .default).weight(.bold))
                .foregroundColor(AuraColors.textSecondary)
                .tracking(1.5)
        }
        .frame(maxWidth: .infinity)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Analyzing facial landmarks, please wait.")
    }
    
    private func errorView(message: String) -> some View {
        VStack(spacing: 12) {
            Image(systemName: "exclamationmark.triangle")
                .foregroundColor(.red)
                .font(.system(size: 24))
            Text(message)
                .font(.system(.subheadline).weight(.medium))
                .foregroundColor(AuraColors.textPrimary)
                .multilineTextAlignment(.center)
        }
        .padding(24)
        .auraCardStyle()
        .accessibilityElement(children: .combine)
        .accessibilityAddTraits(.isStaticText)
    }
}

struct DashboardView_Previews: PreviewProvider {
    static var previews: some View {
        DashboardView()
    }
}
