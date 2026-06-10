//
//  FallbackCameraSelectionView.swift
//  Aura
//
//  Presented as a sheet. Two paths to an image: Take Photo (camera) or Upload Photo
//  (PhotosPicker). Architecture supports UIImagePickerController, PhotosPicker, Vision, and
//  future live scanning. Emits encoded image bytes via `onImagePicked`.
//

import SwiftUI
import PhotosUI

/// The fallback capture chooser. Hands encoded JPEG bytes back to the caller.
public struct FallbackCameraSelectionView: View {

    /// Called with encoded image data once the user captures or selects a photo.
    /// A `nil` payload signals the demo/mock path.
    private let onImagePicked: (Data?) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var photosItem: PhotosPickerItem?
    @State private var showCamera = false

    public init(onImagePicked: @escaping (Data?) -> Void) {
        self.onImagePicked = onImagePicked
    }

    public var body: some View {
        ZStack {
            AuraColor.background.ignoresSafeArea()

            VStack(alignment: .leading, spacing: AuraSpacing.xl) {
                header

                VStack(spacing: AuraSpacing.md) {
                    captureOption(
                        title: "Take Photo",
                        subtitle: "Live capture with the front camera",
                        systemImage: "camera",
                        tint: AuraColor.accentPurple
                    ) {
                        #if canImport(UIKit)
                        showCamera = true
                        #else
                        onImagePicked(nil)
                        #endif
                    }

                    PhotosPicker(selection: $photosItem, matching: .images) {
                        optionContent(
                            title: "Upload Photo",
                            subtitle: "Select an existing image from your library",
                            systemImage: "photo.on.rectangle.angled",
                            tint: AuraColor.accentBlue
                        )
                    }
                    .buttonStyle(.plain)
                }

                Spacer()

                // Demo affordance so the app is usable without a camera (e.g. simulator).
                Button {
                    onImagePicked(nil)
                } label: {
                    Text("Use sample assessment")
                        .auraText(AuraTypography.caption)
                        .foregroundStyle(AuraColor.textTertiary)
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.plain)
            }
            .padding(AuraSpacing.xl)
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
        .task(id: photosItem) {
            await loadSelectedPhoto()
        }
        #if canImport(UIKit)
        .fullScreenCover(isPresented: $showCamera) {
            CameraImagePicker { data in
                showCamera = false
                if let data { onImagePicked(data) }
            }
            .ignoresSafeArea()
        }
        #endif
    }

    // MARK: Subviews

    private var header: some View {
        VStack(alignment: .leading, spacing: AuraSpacing.sm) {
            Text("NEW ASSESSMENT".cased(for: AuraTypography.metricLabel))
                .auraText(AuraTypography.metricLabel)
                .foregroundStyle(AuraColor.textTertiary)
            Text("Capture your face")
                .auraText(AuraTypography.sectionTitle)
                .foregroundStyle(AuraColor.textPrimary)
            Text("Front-facing, neutral expression, even lighting yields the most reliable analysis.")
                .auraText(AuraTypography.body)
                .foregroundStyle(AuraColor.textSecondary)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private func captureOption(
        title: String,
        subtitle: String,
        systemImage: String,
        tint: Color,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            optionContent(title: title, subtitle: subtitle, systemImage: systemImage, tint: tint)
        }
        .buttonStyle(.plain)
    }

    private func optionContent(title: String, subtitle: String, systemImage: String, tint: Color) -> some View {
        AuraCard {
            HStack(spacing: AuraSpacing.lg) {
                Image(systemName: systemImage)
                    .font(.system(size: 20, weight: .medium))
                    .foregroundStyle(tint)
                    .frame(width: 28)
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .auraText(AuraTypography.cardTitle)
                        .foregroundStyle(AuraColor.textPrimary)
                    Text(subtitle)
                        .auraText(AuraTypography.caption)
                        .foregroundStyle(AuraColor.textTertiary)
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(AuraColor.textTertiary)
            }
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(title). \(subtitle)")
    }

    // MARK: Photo loading

    private func loadSelectedPhoto() async {
        guard let photosItem else { return }
        if let data = try? await photosItem.loadTransferable(type: Data.self) {
            onImagePicked(data)
        }
    }
}

#if canImport(UIKit)
import UIKit

/// Thin `UIImagePickerController` bridge for live camera capture. Emits JPEG `Data`.
struct CameraImagePicker: UIViewControllerRepresentable {
    let onComplete: (Data?) -> Void

    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.delegate = context.coordinator
        picker.sourceType = UIImagePickerController.isSourceTypeAvailable(.camera) ? .camera : .photoLibrary
        picker.cameraDevice = .front
        return picker
    }

    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}

    func makeCoordinator() -> Coordinator { Coordinator(onComplete: onComplete) }

    final class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let onComplete: (Data?) -> Void
        init(onComplete: @escaping (Data?) -> Void) { self.onComplete = onComplete }

        func imagePickerController(
            _ picker: UIImagePickerController,
            didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]
        ) {
            let image = info[.originalImage] as? UIImage
            onComplete(image?.jpegData(compressionQuality: 0.9))
        }

        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            onComplete(nil)
        }
    }
}
#endif

#Preview("CameraSelection") {
    Color.black
        .sheet(isPresented: .constant(true)) {
            FallbackCameraSelectionView { _ in }
        }
}
