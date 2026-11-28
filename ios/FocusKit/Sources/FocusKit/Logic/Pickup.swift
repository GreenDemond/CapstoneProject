import Foundation

public enum Pickup {
  /// The welcome line on Today. It never says how long the student was away: a later day
  /// gets the welcome-back line, the same day or an unknown date gets the plain one.
  public static func line(
    savedOn: Date?, now: Date, calendar: Calendar = .current, in content: Content
  ) -> String {
    guard let savedOn, !calendar.isDate(savedOn, inSameDayAs: now) else {
      return content.pickup.sameDay
    }
    return content.pickup.laterDay
  }
}
