import SwiftUI

/// Handles the primary photo ingestion step for the user
public struct FallbackCameraSelectionView: View {
    public var onImageSelected: @MainActor (UIImage) -> Void
    @Environment(\.presentationMode) var presentationMode
    
    public init(onImageSelected: @escaping @MainActor (UIImage) -> Void) {
        self.onImageSelected = onImageSelected
    }
    
    public var body: some View {
        ZStack {
            AuraColors.background.ignoresSafeArea()
            
            VStack(spacing: 24) {
                Text("AURA SCAN")
                    .font(.system(.subheadline, design: .default).weight(.bold))
                    .foregroundColor(AuraColors.textSecondary)
                    .tracking(2.0)
                    .accessibilityAddTraits(.isHeader)
                
                Text("Select an image for diagnostic analysis.")
                    .font(.system(.title3).weight(.medium))
                    .foregroundColor(AuraColors.textPrimary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
                
                VStack(spacing: 16) {
                    Button(action: {
                        simulateSelection()
                    }) {
                        HStack {
                            Image(systemName: "camera")
                                .accessibilityHidden(true)
                            Text("TAKE PHOTO")
                        }
                        .font(.system(.subheadline).weight(.bold))
                        .foregroundColor(AuraColors.background)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(AuraColors.textPrimary)
                        .modifier(AuraCornerRadius())
                    }
                    .accessibilityLabel("Take Photo")
                    .accessibilityHint("Opens camera to take a new picture for analysis")
                    
                    Button(action: {
                        simulateSelection()
                    }) {
                        HStack {
                            Image(systemName: "photo.on.rectangle")
                                .accessibilityHidden(true)
                            Text("UPLOAD PHOTO")
                        }
                        .font(.system(.subheadline).weight(.bold))
                        .foregroundColor(AuraColors.textPrimary)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(AuraColors.surface)
                        .overlay(
                            RoundedRectangle(cornerRadius: 5)
                                .stroke(AuraColors.border, lineWidth: 1)
                        )
                        .modifier(AuraCornerRadius())
                    }
                    .accessibilityLabel("Upload Photo")
                    .accessibilityHint("Opens photo library to select an existing picture")
                }
                .padding(.horizontal, 24)
                .padding(.top, 32)
            }
        }
        .preferredColorScheme(.dark)
    }
    
    @MainActor
    private func simulateSelection() {
        let mockImage = UIImage(systemName: "face.dashed") ?? UIImage()
        onImageSelected(mockImage)
        presentationMode.wrappedValue.dismiss()
    }
}

struct FallbackCameraSelectionView_Previews: PreviewProvider {
    static var previews: some View {
        FallbackCameraSelectionView(onImageSelected: { _ in })
    }
}
