import SwiftUI

public struct DashboardView: View {
    @StateObject private var viewModel = DashboardViewModel()
    
    public init() {}
    
    public var body: some View {
        NavigationView {
            ZStack {
                Theme.background.ignoresSafeArea()
                
                if viewModel.isAnalyzing {
                    VStack(spacing: 24) {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: Theme.accentPurple))
                            .scaleEffect(1.5)
                        
                        Text("PROCESSING BIOMETRICS...")
                            .font(.system(size: 12, weight: .bold))
                            .kerning(1.5)
                            .foregroundColor(Theme.textMuted)
                    }
                } else if let result = viewModel.result {
                    ScrollView(showsIndicators: false) {
                        VStack(spacing: 20) {
                            HeroScoreCard(result: result)
                            BentoGridLayout(result: result)
                        }
                        .padding(.horizontal, 16)
                        .padding(.top, 24)
                        .padding(.bottom, 40)
                    }
                } else {
                    VStack(spacing: 16) {
                        Image(systemName: "faceid")
                            .font(.system(size: 48, weight: .ultraLight))
                            .foregroundColor(Theme.border)
                        
                        Text("NO DATA")
                            .font(.system(size: 12, weight: .bold))
                            .kerning(2.0)
                            .foregroundColor(Theme.textMuted)
                    }
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .principal) {
                    Text("A U R A")
                        .font(.system(size: 16, weight: .bold, design: .serif))
                        .foregroundColor(Theme.accentWhite)
                        .kerning(4.0)
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: {
                        viewModel.resetSession()
                    }) {
                        Image(systemName: "arrow.triangle.2.circlepath")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(Theme.accentWhite)
                    }
                    .accessibilityLabel("Reset Session")
                }
            }
            .sheet(isPresented: $viewModel.showCameraSelection) {
                FallbackCameraSelectionView {
                    // Simulate selecting an image
                    viewModel.processImage(UIImage())
                }
                .presentationDetents([.height(300)])
            }
            .onAppear {
                if viewModel.result == nil && !viewModel.isAnalyzing {
                    viewModel.showCameraSelection = true
                }
            }
        }
        .preferredColorScheme(.dark)
    }
}

struct DashboardView_Previews: PreviewProvider {
    static var previews: some View {
        DashboardView()
    }
}
