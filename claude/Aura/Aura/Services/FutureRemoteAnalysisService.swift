//
//  FutureRemoteAnalysisService.swift
//  Aura
//
//  Reference scaffold for a real backend. Conforms to the same protocol as the mock, so
//  swapping it in requires no UI changes. The networking is implemented; the endpoint
//  contract is documented inline for the backend team.
//

import Foundation

/// Talks to a remote Aura analysis backend over HTTPS.
///
/// Expected contract:
/// - `POST {baseURL}/v1/analyze`
/// - `multipart/form-data` with field `image` (JPEG) and `includeLandmarks` (Bool string)
/// - `Authorization: Bearer {apiKey}`
/// - Response: `200` with a JSON `AnalysisResult`; non-2xx → mapped to ``AnalysisError``.
public struct FutureRemoteAnalysisService: AnalysisServiceProtocol {

    private let baseURL: URL
    private let apiKey: String
    private let session: URLSession
    private let decoder: JSONDecoder

    public init(baseURL: URL, apiKey: String, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.apiKey = apiKey
        self.session = session
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        self.decoder = decoder
    }

    public func analyze(_ request: AnalysisRequest) async throws -> AnalysisResult {
        guard let imageData = request.imageData else {
            throw AnalysisError.lowQualityImage
        }

        let endpoint = baseURL.appendingPathComponent("v1/analyze")
        let boundary = "AuraBoundary-\(UUID().uuidString)"

        var urlRequest = URLRequest(url: endpoint)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        urlRequest.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        urlRequest.httpBody = Self.multipartBody(
            imageData: imageData,
            includeLandmarks: request.includeLandmarks,
            boundary: boundary
        )

        do {
            let (data, response) = try await session.data(for: urlRequest)
            guard let http = response as? HTTPURLResponse else { throw AnalysisError.unknown }

            switch http.statusCode {
            case 200...299:
                do {
                    return try decoder.decode(AnalysisResult.self, from: data)
                } catch {
                    throw AnalysisError.decoding
                }
            case 422:
                throw AnalysisError.noFaceDetected
            default:
                throw AnalysisError.network("HTTP \(http.statusCode)")
            }
        } catch is CancellationError {
            throw AnalysisError.cancelled
        } catch let error as AnalysisError {
            throw error
        } catch {
            throw AnalysisError.network(error.localizedDescription)
        }
    }

    /// Builds a `multipart/form-data` body for the analyze endpoint.
    private static func multipartBody(imageData: Data, includeLandmarks: Bool, boundary: String) -> Data {
        var body = Data()
        let lineBreak = "\r\n"

        func append(_ string: String) { body.append(Data(string.utf8)) }

        // image field
        append("--\(boundary)\(lineBreak)")
        append("Content-Disposition: form-data; name=\"image\"; filename=\"capture.jpg\"\(lineBreak)")
        append("Content-Type: image/jpeg\(lineBreak)\(lineBreak)")
        body.append(imageData)
        append(lineBreak)

        // includeLandmarks field
        append("--\(boundary)\(lineBreak)")
        append("Content-Disposition: form-data; name=\"includeLandmarks\"\(lineBreak)\(lineBreak)")
        append("\(includeLandmarks)\(lineBreak)")

        append("--\(boundary)--\(lineBreak)")
        return body
    }
}
