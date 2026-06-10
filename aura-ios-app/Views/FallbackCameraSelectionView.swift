import SwiftUI

public struct FallbackCameraSelectionView: View {
    @Environment(\.dismiss) private var dismiss
    let onSelectPhoto: () -> Void
    
    public init(onSelectPhoto: @escaping () -> Void) {
        self.onSelectPhoto = onSelectPhoto
    }
    
    public var body: some View {
        ZStack {
            Theme.background.ignoresSafeArea()
            
            VStack(spacing: 24) {
                Text("INITIALIZE SCAN")
                    .font(.system(size: 14, weight: .bold))
                    .kerning(2.0)
                    .foregroundColor(Theme.accentWhite)
                
                Text("Select an imaging source to begin facial structural analysis.")
                    .font(.system(size: 14, weight: .regular))
                    .foregroundColor(Theme.textMuted)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
                
                VStack(spacing: 12) {
                    Button(action: {
                        dismiss()
                        onSelectPhoto()
                    }) {
                        HStack {
                            Image(systemName: "camera.viewfinder")
                            Text("Capture Biometric Data")
                                .font(.system(size: 14, weight: .semibold))
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(Theme.surface)
                        .foregroundColor(Theme.accentWhite)
                        .cornerRadius(Theme.cornerRadius)
                        .overlay(
                            RoundedRectangle(cornerRadius: Theme.cornerRadius)
                                .stroke(Theme.border, lineWidth: 1)
                        )
                    }
                    
                    Button(action: {
                        dismiss()
                        onSelectPhoto()
                    }) {
                        HStack {
                            Image(systemName: "photo.on.rectangle")
                            Text("Upload Clinical Image")
                                .font(.system(size: 14, weight: .semibold))
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(Theme.background)
                        .foregroundColor(Theme.textMuted)
                        .cornerRadius(Theme.cornerRadius)
                        .overlay(
                            RoundedRectangle(cornerRadius: Theme.cornerRadius)
                                .stroke(Theme.border, lineWidth: 1)
                        )
                    }
                }
                .padding(.horizontal, 24)
            }
        }
    }
}
