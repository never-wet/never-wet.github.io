import SwiftUI
import UIKit

@MainActor
public final class DashboardViewModel: ObservableObject {
    @Published public private(set) var result: AnalysisResult?
    @Published public private(set) var isAnalyzing: Bool = false
    @Published public var showCameraSelection: Bool = false
    @Published public var error: Error?
    
    private let analysisService: AnalysisServiceProtocol
    
    public init(analysisService: AnalysisServiceProtocol = MockAnalysisService()) {
        self.analysisService = analysisService
    }
    
    public func resetSession() {
        withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
            result = nil
            isAnalyzing = false
            error = nil
        }
        showCameraSelection = true
    }
    
    public func processImage(_ image: UIImage) {
        showCameraSelection = false
        isAnalyzing = true
        error = nil
        
        Task {
            do {
                let analysisResult = try await analysisService.analyze(image: image)
                withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                    self.result = analysisResult
                    self.isAnalyzing = false
                }
            } catch {
                withAnimation {
                    self.error = error
                    self.isAnalyzing = false
                }
            }
        }
    }
}
