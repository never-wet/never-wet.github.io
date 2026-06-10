import Foundation
import UIKit
import SwiftUI
import Combine

/// Manages the state and business logic of the flagship dashboard
@MainActor
public final class DashboardViewModel: ObservableObject {
    @Published public var session: AnalysisSession?
    @Published public var isLoading: Bool = false
    @Published public var errorMessage: String? = nil
    @Published public var showCameraSelection: Bool = true
    
    private let analysisService: AnalysisServiceProtocol
    
    public init(analysisService: AnalysisServiceProtocol = MockAnalysisService()) {
        self.analysisService = analysisService
    }
    
    /// Processes a selected image and updates state accordingly
    public func processImage(_ image: UIImage, reduceMotion: Bool = false) {
        self.showCameraSelection = false
        self.isLoading = true
        self.errorMessage = nil
        self.session = AnalysisSession(id: UUID(), startDate: Date(), currentResult: nil)
        
        Task {
            do {
                let result = try await analysisService.analyze(image: image)
                
                if reduceMotion {
                    self.session?.currentResult = result
                    self.isLoading = false
                } else {
                    withAnimation(.spring(response: 0.4, dampingFraction: 0.8, blendDuration: 0)) {
                        self.session?.currentResult = result
                        self.isLoading = false
                    }
                }
            } catch {
                if reduceMotion {
                    self.errorMessage = "Analysis failed. Please ensure the image is clear and try again."
                    self.isLoading = false
                } else {
                    withAnimation {
                        self.errorMessage = "Analysis failed. Please ensure the image is clear and try again."
                        self.isLoading = false
                    }
                }
            }
        }
    }
    
    /// Clears current session data to start over
    public func resetSession(reduceMotion: Bool = false) {
        if reduceMotion {
            self.session = nil
            self.errorMessage = nil
            self.isLoading = false
            self.showCameraSelection = true
        } else {
            withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
                self.session = nil
                self.errorMessage = nil
                self.isLoading = false
                self.showCameraSelection = true
            }
        }
    }
}
