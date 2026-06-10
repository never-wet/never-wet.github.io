//
//  AnalysisSession.swift
//  Aura
//
//  A persisted analysis session — the unit of history for progression tracking.
//

import Foundation

/// One analysis session: the captured-image reference plus its result. Sessions are the
/// historical record that powers score-trend and progression features (roadmap).
public struct AnalysisSession: Codable, Identifiable, Sendable, Hashable {

    public let id: UUID
    public let startedAt: Date
    /// Local identifier / path for the captured image (not the pixels — privacy-first).
    public let imageReference: String?
    /// The result, once analysis completes. `nil` while in flight.
    public let result: AnalysisResult?

    public init(
        id: UUID = UUID(),
        startedAt: Date = .now,
        imageReference: String? = nil,
        result: AnalysisResult? = nil
    ) {
        self.id = id
        self.startedAt = startedAt
        self.imageReference = imageReference
        self.result = result
    }

    /// Returns a copy of the session with its result attached.
    public func completed(with result: AnalysisResult) -> AnalysisSession {
        AnalysisSession(id: id, startedAt: startedAt, imageReference: imageReference, result: result)
    }
}
