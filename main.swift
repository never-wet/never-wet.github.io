import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking // Required for networking on Windows/Linux Swift
#endif

let apiKey = "YOUR_GEMINI_API"
let urlString = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=\(apiKey)"
guard let url = URL(string: urlString) else { fatalError("Invalid URL") }

// 1. Create the JSON Payload
let prompt = "You are a master Honda mechanic. What are the common symptoms of a failing VTC actuator on a 2015 Honda CR-V?"
let requestBody: [String: Any] = [
    "contents": [
        ["parts": [["text": prompt]]]
    ]
]

var request = URLRequest(url: url)
request.httpMethod = "POST"
request.addValue("application/json", forHTTPHeaderField: "Content-Type")
request.httpBody = try? JSONSerialization.data(withJSONObject: requestBody)

print("Sending request to Gemini...")

// 2. Make the Network Call
let semaphore = DispatchSemaphore(value: 0) // Pause execution until async call finishes

let task = URLSession.shared.dataTask(with: request) { data, response, error in
    defer { semaphore.signal() }
    
    if let error = error {
        print("Error: \(error.localizedDescription)")
        return
    }
    
    guard let data = data else { return }
    
    // 3. Parse the JSON Response
    do {
        if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
           let candidates = json["candidates"] as? [[String: Any]],
           let firstCandidate = candidates.first,
           let content = firstCandidate["content"] as? [String: Any],
           let parts = content["parts"] as? [[String: Any]],
           let text = parts.first?["text"] as? String {
            print("\n--- GEMINI RESPONSE ---\n")
            print(text)
        } else {
            print("Failed to parse response. Raw data: \(String(data: data, encoding: .utf8) ?? "")")
        }
    } catch {
        print("JSON Error: \(error)")
    }
}

task.resume()
semaphore.wait()