//
//  AuraSpacing.swift
//  Aura
//
//  8-pt soft grid spacing tokens + the global corner radius rule.
//

import CoreGraphics

/// Layout spacing tokens. Use these instead of literal values everywhere.
public enum AuraSpacing {
    /// 4 pt.
    public static let xs: CGFloat = 4
    /// 8 pt.
    public static let sm: CGFloat = 8
    /// 12 pt — default grid gutter.
    public static let md: CGFloat = 12
    /// 16 pt — default card padding.
    public static let lg: CGFloat = 16
    /// 24 pt.
    public static let xl: CGFloat = 24
    /// 32 pt.
    public static let xxl: CGFloat = 32

    /// The one true corner radius. Every element uses this — no pills, no capsules.
    public static let corner: CGFloat = 5

    /// Hairline border width.
    public static let hairline: CGFloat = 1
}
