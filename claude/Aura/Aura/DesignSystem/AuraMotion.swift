//
//  AuraMotion.swift
//  Aura
//
//  Luxury micro-interaction timing. Spring, never bouncy. 0.2–0.4s.
//  Always provide a Reduced Motion fallback.
//

import SwiftUI

/// Animation tokens for Aura. Durations stay within 0.2–0.4s; springs are critically
/// damped to read as "engineered," not playful.
public enum AuraMotion {

    /// Content appearing (cards springing in).
    public static let appear = Animation.spring(response: 0.35, dampingFraction: 0.85)

    /// Press / scale interactions (e.g. card tap-down to 0.98).
    public static let press = Animation.spring(response: 0.25, dampingFraction: 0.9)

    /// Simple opacity transition.
    public static let opacity = Animation.easeInOut(duration: 0.25)

    /// Progress-bar fill animation.
    public static let progress = Animation.spring(response: 0.4, dampingFraction: 0.9)

    /// Returns the appropriate animation honoring the Reduced Motion setting.
    /// When Reduced Motion is on, motion-heavy animations degrade to a quick opacity fade.
    /// - Parameters:
    ///   - animation: The desired animation.
    ///   - reduceMotion: The current `accessibilityReduceMotion` value.
    public static func resolved(_ animation: Animation, reduceMotion: Bool) -> Animation {
        reduceMotion ? .easeInOut(duration: 0.2) : animation
    }
}
