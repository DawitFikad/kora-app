# Event Policies & Age Restrictions - Real Data Implementation

## Problem
Event details screen was displaying mock/placeholder text for:
- Event Policies
- Age Restrictions  
- Refund Policy (in trust signals)

## Solution
Connected the UI to real API data from the Event model.

---

## 📊 Database Schema (Already Exists)

From `schema.prisma` - Event model:

```prisma
model Event {
  // ... other fields
  refundPolicy     String    @default("No refunds within 24 hours of event.")
  minAge           Int       @default(0)
  additionalPolicy String?
  // ... other fields
}
```

---

## 🔧 Changes Made

### 1. **Updated Event Model** (`event.dart`)

**Added Fields:**
```dart
// Policy fields
final String? refundPolicy;
final int minAge;
final String? additionalPolicy;
```

**Updated Constructor:**
```dart
Event({
  // ... existing params
  this.refundPolicy,
  this.minAge = 0,
  this.additionalPolicy,
  // ...
});
```

**Updated JSON Parsing:**
```dart
factory Event.fromJson(Map<String, dynamic> json) {
  return Event(
    // ... existing fields
    refundPolicy: json['refundPolicy'],
    minAge: json['minAge'] ?? 0,
    additionalPolicy: json['additionalPolicy'],
    // ...
  );
}
```

---

### 2. **Updated Event Details Screen** (`event_details_screen.dart`)

#### A. **Trust Signals - Refund Policy Card**

**Before:**
```dart
Text("48h before event")  // Hardcoded
```

**After:**
```dart
Text(
  event.refundPolicy != null && event.refundPolicy!.isNotEmpty
      ? (event.refundPolicy!.length > 30 
          ? '${event.refundPolicy!.substring(0, 30)}...'
          : event.refundPolicy!)
      : "See policy details",
  maxLines: 2,
  overflow: TextOverflow.ellipsis,
)
```

**Features:**
- Shows actual refund policy from API
- Smart truncation (30 chars) for card view
- Full text available in expandable section
- Fallback text if no policy set

---

#### B. **Expandable Sections**

**Before:**
```dart
_buildExpandableSection("Event Policies")  // Mock lorem ipsum
_buildExpandableSection("Age Restrictions")  // Mock lorem ipsum
```

**After:**
```dart
// Refund Policy (if exists)
if (event.refundPolicy != null && event.refundPolicy!.isNotEmpty)
  _buildExpandableSection(
    "Refund Policy",
    event.refundPolicy!,
  ),

// Additional Policies (if exists)
if (event.additionalPolicy != null && event.additionalPolicy!.isNotEmpty)
  _buildExpandableSection(
    "Event Policies",
    event.additionalPolicy!,
  ),

// Age Restrictions (always shown)
_buildExpandableSection(
  "Age Restrictions",
  event.minAge > 0 
      ? "This event is restricted to attendees aged ${event.minAge} years and above. Valid ID may be required at entry."
      : "This event is open to all ages. Minors may attend without age restrictions.",
),
```

**Features:**
- Conditional rendering (only show if data exists)
- Dynamic age restriction message based on `minAge`
- Clear, user-friendly language
- Separate sections for different policies

---

#### C. **Updated Method Signature**

**Before:**
```dart
Widget _buildExpandableSection(String title) {
  // ... hardcoded lorem ipsum
}
```

**After:**
```dart
Widget _buildExpandableSection(String title, String content) {
  // ... displays dynamic content
  child: Text(
    content,  // Real data
    style: GoogleFonts.poppins(
      color: Colors.white70,
      fontSize: 14,
      height: 1.6,  // Better readability
    ),
  ),
}
```

---

## 📋 Data Flow

```
API Response
    ↓
Event.fromJson()
    ↓
Event Model (with refundPolicy, minAge, additionalPolicy)
    ↓
EventDetailsScreen
    ↓
├─ Trust Signals Card (truncated refund policy)
└─ Expandable Sections (full policy text)
```

---

## 🎯 User Experience

### Before
- ❌ "Lorem ipsum dolor sit amet..." (looks broken)
- ❌ Same mock text for all events
- ❌ No real information

### After
- ✅ Real refund policy from organizer
- ✅ Actual age restrictions
- ✅ Additional event-specific policies
- ✅ Smart truncation in cards
- ✅ Full details in expandable sections
- ✅ Conditional rendering (only show what exists)

---

## 💡 Smart Features

1. **Truncation Logic**
   - Card shows first 30 chars + "..."
   - Full text in expandable section
   - Prevents card overflow

2. **Conditional Rendering**
   - Only shows sections with actual data
   - No empty/placeholder sections

3. **Age Restriction Intelligence**
   - `minAge = 0`: "Open to all ages"
   - `minAge > 0`: "Restricted to ${minAge}+ years"

4. **Fallback Handling**
   - Missing refund policy: "See policy details"
   - Missing additional policy: Section hidden
   - Default minAge: 0 (all ages)

---

## 📁 Files Modified

1. **`app/mobile/lib/features/events/models/event.dart`**
   - Added policy fields
   - Updated JSON parsing
   - Updated serialization

2. **`app/mobile/lib/features/events/presentation/event_details_screen.dart`**
   - Updated trust signals card
   - Made expandable sections dynamic
   - Added conditional rendering
   - Improved text styling

---

## ✅ Testing Checklist

- [ ] Event with refund policy shows correctly
- [ ] Event without refund policy shows fallback
- [ ] Age restrictions display properly (0 vs 18+)
- [ ] Additional policies appear when set
- [ ] Truncation works for long policies
- [ ] Expandable sections show full text
- [ ] Empty policies don't show sections

---

## 🚀 Result

**The event details screen now displays real, organizer-defined policies instead of placeholder text**, building trust and providing actual value to users making purchase decisions.
