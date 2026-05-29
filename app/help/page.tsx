import Link from 'next/link'
import SiteFooter from '@/components/SiteFooter'
import { createClient } from '@/lib/supabase/server'
import HelpTemplateGrid, { type HelpTemplate } from '@/components/HelpTemplateGrid'

const POPULAR_USES = [
  { emoji: '🍳', label: 'QR recipe cards' },
  { emoji: '🎨', label: 'Artwork archives' },
  { emoji: '📸', label: 'Family memory collections' },
  { emoji: '🐾', label: 'Pet emergency info' },
  { emoji: '🕯️', label: 'Ritual journals' },
  { emoji: '🔧', label: 'Home maintenance logs' },
  { emoji: '📦', label: 'Storage box labels' },
  { emoji: '✈️', label: 'Travel journals' },
  { emoji: '🪴', label: 'Plant care tags' },
  { emoji: '📋', label: 'Equipment manuals' },
  { emoji: '📖', label: 'Book notes & reading logs' },
  { emoji: '🎯', label: 'Goal & habit trackers' },
  { emoji: '💪', label: 'Workout & fitness tracking' },
  { emoji: '🚗', label: 'Vehicle maintenance logs' },
  { emoji: '🛒', label: 'Grocery & meal planning' },
]

const BLOCK_TYPES = [
  {
    name: 'Text / Note',
    emoji: '📝',
    description: 'Written content — overviews, instructions, descriptions, reflections. Supports optional label and date. Whitespace preserved.',
  },
  {
    name: 'Checklist',
    emoji: '✅',
    description: 'Tap-to-complete list. Checked state is stored per device — every visitor tracks their own progress. "Begin again" resets all items.',
  },
  {
    name: 'Audio / Voice Note',
    emoji: '🎙️',
    description: 'Embedded audio player for any hosted URL. Add a label and recording date. Record directly or upload a file.',
  },
  {
    name: 'Link',
    emoji: '🔗',
    description: 'A tappable URL row that opens in a new tab. The label is shown instead of the raw address.',
  },
  {
    name: 'Phone',
    emoji: '📞',
    description: 'A tap-to-call number. Tapping opens the device dialer directly.',
  },
  {
    name: 'File / PDF',
    emoji: '📄',
    description: 'A downloadable file from any public URL. Shown as a labeled tappable row.',
  },
  {
    name: 'Image',
    emoji: '🖼️',
    description: 'A full-width photo uploaded directly or linked from a public URL. Displayed with an optional caption.',
  },
  {
    name: 'Timeline',
    emoji: '📅',
    description: 'A vertical sequence of dated entries with accent-color markers. Each entry has an optional date and text description.',
  },
  {
    name: 'Hub Collector',
    emoji: '🔗',
    description: 'A public button menu built from a Collection of Hubs. Each Hub appears as a tappable card with title and description — a Linktree-style navigation page across your content.',
  },
]

const TEMPLATES = [
  {
    name: 'Blank',
    templateId: 'blank',
    emoji: '➕',
    tagline: 'Start from scratch with your own structure.',
    description: 'Empty hub — no pre-built blocks. Use this when building something custom or when no existing template fits.',
    borderClass: 'border-l-blue-500',
    blocks: [],
  },
  {
    name: 'Artwork Archive',
    templateId: 'artwork',
    emoji: '🎨',
    tagline: 'Document and archive a piece of artwork.',
    description: 'Photos, materials, story, and status. Attach to the back of a painting or use as a standalone record.',
    borderClass: 'border-l-violet-500',
    blocks: [
      { label: 'Main photo', type: 'Image', note: 'Primary photo of the artwork' },
      { label: 'Description', type: 'Text', note: 'A short description or context' },
      { label: 'Details', type: 'Text', note: 'Date created, medium, dimensions, status' },
      { label: 'Color Palette', type: 'Text', note: 'Colors used — e.g. burnt sienna, cobalt blue' },
      { label: 'Inspiration / Meaning', type: 'Text', note: 'Story, symbols, or meaning behind the work' },
      { label: 'Additional photos', type: 'Image', note: 'Process shots or alternate views' },
      { label: 'Music / Playlist', type: 'Link', note: 'Optional playlist URL — starts collapsed' },
      { label: 'Notes', type: 'Text', note: 'Materials, exhibition history, ideas for next time' },
    ],
  },
  {
    name: 'Book / Reading Notes',
    templateId: 'book',
    emoji: '📖',
    tagline: 'Capture quotes, reflections, and reading progress.',
    description: 'Notes, quotes, and reflections about a book.',
    borderClass: 'border-l-violet-500',
    blocks: [
      { label: 'Book cover photo', type: 'Image', note: '' },
      { label: 'Book Summary', type: 'Text', note: 'Title, author, genre, year, date read, rating, summary' },
      { label: 'Favorite Quotes', type: 'Text', note: 'Passages worth keeping' },
      { label: 'Reading Reflection', type: 'Audio', note: 'Voice thoughts while reading or after finishing' },
      { label: 'Author / Purchase Link', type: 'Link', note: "Author's site, Goodreads, or purchase page" },
      { label: 'Reading Progress', type: 'Timeline', note: 'Log when you started, paused, resumed, finished' },
      { label: 'Thoughts & Insights', type: 'Text', note: 'Deeper reflections, connections, things to act on' },
    ],
  },
  {
    name: 'Daily Reflection / Journal',
    templateId: 'journal',
    emoji: '📓',
    tagline: 'A guided space for introspection, gratitude, and intention.',
    description: 'End-of-day reflection oriented toward meaning — what it meant, not just what happened.',
    borderClass: 'border-l-teal-500',
    blocks: [
      { label: "Today's Reflection", type: 'Text', note: 'Open introspective space' },
      { label: 'Mood / Energy', type: 'Text', note: 'How you feel, energy level' },
      { label: 'Gratitude', type: 'Text', note: 'What you\'re grateful for' },
      { label: 'What challenged me today?', type: 'Text', note: 'Honest reflection on difficulty' },
      { label: 'What supported me today?', type: 'Text', note: 'What helped, who showed up' },
      { label: 'What did I learn about myself?', type: 'Text', note: 'Insight, pattern, or realization' },
      { label: 'What am I releasing?', type: 'Text', note: 'What you\'re letting go of' },
      { label: "Tomorrow's Intention", type: 'Text', note: 'A single focus or intention for tomorrow' },
      { label: 'Voice Reflection', type: 'Audio', note: 'Spoken reflection — starts collapsed' },
      { label: 'Symbol or photo of the day', type: 'Image', note: 'Optional' },
    ],
  },
  {
    name: 'Diary / Life Log',
    templateId: 'diary',
    emoji: '📔',
    tagline: 'A casual daily record of what happened — events, people, photos.',
    description: 'Focused on capturing real life as it unfolds, not interpreting it.',
    borderClass: 'border-l-amber-500',
    blocks: [
      { label: "Today's Date", type: 'Text', note: 'Date, day of week, or season' },
      { label: 'What Happened Today', type: 'Text', note: 'The story of the day' },
      { label: 'Timeline of My Day', type: 'Timeline', note: 'Pre-seeded with Morning / Afternoon / Evening' },
      { label: 'People & Places', type: 'Text', note: 'Who you saw, where you went' },
      { label: 'Photos from today', type: 'Image', note: 'Starts collapsed' },
      { label: 'Voice Note', type: 'Audio', note: 'Capture a thought or memory — starts collapsed' },
      { label: 'Random Thoughts', type: 'Text', note: 'Little things, funny moments, ideas' },
      { label: 'Links / Keepsakes', type: 'Link', note: 'Playlist, article, recipe, or anything from today' },
      { label: 'Mood / Energy', type: 'Text', note: 'How today felt' },
      { label: 'One Thing I Want to Remember', type: 'Text', note: 'The moment or detail worth saving — starts collapsed' },
    ],
  },
  {
    name: 'Garden Planner',
    templateId: 'garden',
    emoji: '🪴',
    tagline: 'Track plantings, tasks, and garden observations.',
    description: 'Plot overview, planting checklist, care tasks, and growth log.',
    borderClass: 'border-l-teal-500',
    blocks: [
      { label: 'Garden Overview', type: 'Text', note: 'Location, sunlight, soil notes, goals, seasonal plans' },
      { label: 'Planting List', type: 'Checklist', note: 'Tomatoes, basil, peppers, lettuce, flowers, herbs' },
      { label: 'Companion Planting Notes', type: 'Text', note: 'What grows together, what to keep apart' },
      { label: 'Garden Log', type: 'Timeline', note: 'Seeds started, transplanted, fertilized, first harvest, pest issues' },
      { label: 'Garden Tasks', type: 'Checklist', note: 'Water, weed, prune, fertilize, check pests, harvest' },
      { label: 'Garden photos', type: 'Image', note: '' },
      { label: 'Quick Garden Observation', type: 'Audio', note: 'Voice note recorded in the garden' },
      { label: 'Planting Guide', type: 'Link', note: 'Optional external planting guide or resource' },
      { label: 'Harvest Notes', type: 'Text', note: 'Yield, flavor, what to grow again' },
    ],
  },
  {
    name: 'Goal / Habit Tracker',
    templateId: 'goal',
    emoji: '🎯',
    tagline: 'Define a goal, track habits, and log milestones.',
    description: 'Goal overview, daily habit checklist, progress log, and voice check-ins.',
    borderClass: 'border-l-rose-500',
    blocks: [
      { label: 'Goal Overview', type: 'Text', note: 'Goal, why it matters, target date, success definition' },
      { label: 'Habit Checklist', type: 'Checklist', note: 'Morning routine, exercise, read/learn, evening reflection' },
      { label: 'Progress Log', type: 'Timeline', note: 'Milestones, breakthroughs, and setbacks' },
      { label: 'Progress Update', type: 'Audio', note: 'Quick voice check-in on how the goal is going' },
      { label: 'Related Resource', type: 'Link', note: 'A book, course, article, or tool' },
      { label: 'Wins & Challenges', type: 'Text', note: "What's working and what isn't" },
    ],
  },
  {
    name: 'Grocery List',
    templateId: 'grocery',
    emoji: '🛒',
    tagline: 'Organized shopping list by category with meal plan notes.',
    description: 'Meal plan, category checklists, and store notes.',
    borderClass: 'border-l-green-500',
    blocks: [
      { label: 'Meal Plan Notes', type: 'Text', note: 'Meals for the week, recipe reminders, household requests' },
      { label: 'Produce', type: 'Checklist', note: 'Lettuce/greens, tomatoes, onions, potatoes, fruit' },
      { label: 'Meat & Seafood', type: 'Checklist', note: 'Chicken, ground beef, lunch meat, fish/seafood' },
      { label: 'Dairy & Eggs', type: 'Checklist', note: 'Milk, eggs, cheese, yogurt, butter' },
      { label: 'Pantry', type: 'Checklist', note: 'Pasta/rice, canned goods, bread, cereal, snacks' },
      { label: 'Spices & Baking', type: 'Checklist', note: 'Salt/pepper, garlic powder, flour, sugar, baking items' },
      { label: 'Frozen', type: 'Checklist', note: 'Frozen vegetables, frozen meals, ice cream' },
      { label: 'Household', type: 'Checklist', note: 'Paper towels, toilet paper, cleaning supplies, trash bags' },
      { label: 'Recipe Link', type: 'Link', note: 'Optional — link to a recipe being shopped for' },
      { label: 'Store Notes / Coupons', type: 'Text', note: 'Coupon reminders, store-specific notes, brand preferences' },
    ],
  },
  {
    name: 'Home Maintenance Log',
    templateId: 'maintenance',
    emoji: '🔧',
    tagline: 'Log repairs, warranties, and service contacts.',
    description: 'Attach to an appliance, breaker box, HVAC unit, or any area of the home.',
    borderClass: 'border-l-teal-500',
    blocks: [
      { label: 'Photo', type: 'Image', note: 'Photo of the appliance or area' },
      { label: 'Maintenance Information', type: 'Text', note: 'Brand/model, serial number, installed, warranty' },
      { label: 'Maintenance Tasks', type: 'Checklist', note: 'Inspect, clean filters, test, check leaks, schedule service' },
      { label: 'Repair History', type: 'Timeline', note: 'All repairs and service visits' },
      { label: 'Manuals & Warranty', type: 'File', note: 'Upload or link manual and warranty documents' },
      { label: 'Service Contact', type: 'Phone', note: 'Tap-to-call repair line' },
      { label: 'Product Page', type: 'Link', note: 'Optional product or parts page' },
      { label: 'Additional Notes', type: 'Text', note: 'Other notes about the item or area' },
    ],
  },
  {
    name: 'Hub Collector',
    templateId: 'hub_collector',
    emoji: '🔗',
    tagline: 'A public-facing button menu of Hubs from a Collection.',
    description: 'Turns a Collection into a Linktree-style page. Add intro text and link to one or more Collections.',
    borderClass: 'border-l-blue-500',
    blocks: [
      { label: 'Introduction', type: 'Text', note: 'Optional intro text shown above the hub menu' },
      { label: 'Hub Menu', type: 'Hub Collector', note: 'Select a Collection — Hubs appear as tappable cards' },
    ],
  },
  {
    name: 'Pet Profile',
    templateId: 'pet',
    emoji: '🐾',
    tagline: 'Care tasks, health history, vet info, and photos.',
    description: 'Attach to a pet carrier, food station, or pet folder.',
    borderClass: 'border-l-amber-500',
    blocks: [
      { label: 'Photos', type: 'Image', note: '' },
      { label: 'Pet Information', type: 'Text', note: 'Name, breed, DOB, markings, microchip/ID' },
      { label: 'Care Tasks', type: 'Checklist', note: 'Morning/evening feeding, water, exercise, grooming' },
      { label: 'Vet & Health History', type: 'Timeline', note: 'Vet visits, medications, illnesses, health events' },
      { label: 'Veterinarian', type: 'Phone', note: 'Tap-to-call vet number' },
      { label: 'Vaccination Records', type: 'File', note: 'Upload vaccination and health certificates' },
      { label: 'Pet Update', type: 'Audio', note: 'Quick voice update on how your pet is doing' },
      { label: 'Behavior / Preferences', type: 'Text', note: 'Favorites, quirks, training notes, dietary restrictions' },
    ],
  },
  {
    name: 'Plant Profile',
    templateId: 'plant',
    emoji: '🪴',
    tagline: 'Care instructions, growth log, and watering reminders.',
    description: 'Attach to a pot or shelf tag.',
    borderClass: 'border-l-green-500',
    blocks: [
      { label: 'Photo', type: 'Image', note: '' },
      { label: 'Plant Information', type: 'Text', note: 'Name, species, date acquired, pot size' },
      { label: 'Care Instructions', type: 'Text', note: 'Watering, light, soil, temperature, humidity, fertilizing' },
      { label: 'Care Checklist', type: 'Checklist', note: 'Water, check soil, check pests, wipe leaves, rotate' },
      { label: 'Growth & Care Log', type: 'Timeline', note: 'Repotting, milestones, and care events' },
      { label: 'Plant Update', type: 'Audio', note: 'Quick voice update on how the plant is doing' },
      { label: 'Care Guide', type: 'Link', note: 'Optional species reference' },
      { label: 'Seasonal Notes', type: 'Text', note: 'Spring/summer/fall/winter adjustments' },
    ],
  },
  {
    name: 'Recipe',
    templateId: 'recipe',
    emoji: '🍳',
    tagline: 'Photos, ingredients, instructions, and cooking notes.',
    description: 'Attach to a cookbook, a kitchen item, or share a family recipe via QR.',
    borderClass: 'border-l-orange-500',
    blocks: [
      { label: 'Recipe photo', type: 'Image', note: '' },
      { label: 'Description', type: 'Text', note: 'A short intro or context for the recipe' },
      { label: 'At a Glance', type: 'Text', note: 'Prep time, cook time, servings' },
      { label: 'Ingredients', type: 'Text', note: 'Full list — one per line or freeform' },
      { label: 'Instructions', type: 'Text', note: 'Step-by-step method' },
      { label: 'Notes', type: 'Text', note: 'Tips, substitutions, variations, storage' },
      { label: 'Video', type: 'Link', note: 'Optional — YouTube, TikTok, etc.' },
      { label: 'Source', type: 'Link', note: 'Optional — original recipe or credit' },
    ],
  },
  {
    name: 'Ritual',
    templateId: 'ritual',
    emoji: '🕯️',
    tagline: 'A complete space for ritual practice and reflection.',
    description: '14 blocks in ceremonial order. Adapt labels and content to any practice.',
    borderClass: 'border-l-violet-500',
    blocks: [
      { label: 'Ritual Overview', type: 'Text', note: 'Date, intention, location, participants, moon phase' },
      { label: 'Ritual Setup', type: 'Checklist', note: '8 setup steps — cleanse, altar, candles, ground and center' },
      { label: 'Correspondences', type: 'Text', note: 'Colors, herbs, crystals, elements, symbols' },
      { label: 'Ritual Steps', type: 'Checklist', note: '11 steps from opening through closing and grounding' },
      { label: 'Invocation / Words to Speak', type: 'Text', note: 'Italic with accent border — ceremonial styling' },
      { label: 'Quote / Passage', type: 'Text', note: 'Italic with accent border — sacred text, poetry, seasonal' },
      { label: 'Reference: Moon & Seasons', type: 'Link', note: 'Your preferred moon calendar or seasonal guide' },
      { label: 'Reference: Herb & Correspondences', type: 'Link', note: 'Preferred herb, crystal, or element reference' },
      { label: 'Reference: Sacred Text / Source', type: 'Link', note: 'Source text, tradition resource, or citation' },
      { label: 'Ritual Playlist', type: 'Link', note: 'Spotify or any music URL' },
      { label: 'Voice Reflections', type: 'Audio', note: 'Voice note recorded during or after ritual' },
      { label: 'Ritual Notes', type: 'Text', note: 'Energy, shifts, signs, emotions, lessons' },
      { label: 'Photos', type: 'Image', note: 'Altar or ritual photos' },
      { label: 'Follow-Up', type: 'Checklist', note: 'Journaling, cleanup, divination record, watching for signs' },
    ],
  },
  {
    name: 'Shadow Work Journal',
    templateId: 'shadow_work',
    emoji: '🌑',
    tagline: 'A private space for exploring your hidden or wounded self.',
    description: 'Prompted inner work — triggers, patterns, inner dialogue, compassion, and closing insight.',
    borderClass: 'border-l-violet-500',
    blocks: [
      { label: 'Prompt or Theme', type: 'Text', note: 'What you\'re exploring today' },
      { label: 'Current Emotional State', type: 'Text', note: 'Emotions present right now' },
      { label: 'Trigger or Situation', type: 'Text', note: 'The experience or interaction that brought this forward' },
      { label: 'What Am I Avoiding?', type: 'Text', note: 'Honest self-inquiry' },
      { label: 'Patterns & Reactions', type: 'Text', note: 'Recurring fears, behaviors, or reactions noticed' },
      { label: 'Inner Dialogue', type: 'Text', note: 'The voice inside — what it\'s saying' },
      { label: 'Memory or Origin', type: 'Text', note: 'When you felt this before — starts collapsed' },
      { label: 'Reframing / Compassion', type: 'Text', note: 'How to respond with honesty and compassion' },
      { label: 'Release / Ritual / Action Step', type: 'Checklist', note: 'What to release, change, or acknowledge' },
      { label: 'Voice Reflection', type: 'Audio', note: 'Spoken reflection — starts collapsed' },
      { label: 'Symbol, card, or image', type: 'Image', note: 'Tarot card, artwork, or mood image' },
      { label: 'Closing Insight', type: 'Text', note: 'The truth you\'re leaving with today' },
    ],
  },
  {
    name: 'Travel Journal',
    templateId: 'travel',
    emoji: '✈️',
    tagline: 'Trip overview, timeline, packing list, and reflections.',
    description: 'Capture a trip with photos, timeline, packing list, and reflections.',
    borderClass: 'border-l-blue-500',
    blocks: [
      { label: 'Photos', type: 'Image', note: '' },
      { label: 'Trip Overview', type: 'Text', note: 'Destination, dates, traveling with, accommodation, purpose' },
      { label: 'Travel Timeline', type: 'Timeline', note: 'Day-by-day destinations, events, and moments' },
      { label: 'Maps / Reservations', type: 'Link', note: 'Maps, bookings, or itineraries' },
      { label: 'Packing List', type: 'Checklist', note: 'Passport/ID, phone+charger, medications, insurance, cash' },
      { label: 'Travel Reflection', type: 'Audio', note: 'Record a reflection from the road or after returning' },
      { label: 'Recommendations', type: 'Text', note: 'Restaurants, places, tips you want to remember' },
    ],
  },
  {
    name: 'Travel Packing List',
    templateId: 'packing',
    emoji: '🧳',
    tagline: 'Packing checklists, trip details, and travel documents.',
    description: 'Essentials, clothing, toiletries, tech, and travel documents by category.',
    borderClass: 'border-l-amber-500',
    blocks: [
      { label: 'Trip Details', type: 'Text', note: 'Destination, dates, weather, travel companions, notes' },
      { label: 'Essentials', type: 'Checklist', note: 'Wallet, ID/passport, keys, phone, charger, medications' },
      { label: 'Clothing', type: 'Checklist', note: 'Shirts, pants/shorts, pajamas, socks, underwear, shoes, jacket' },
      { label: 'Toiletries', type: 'Checklist', note: 'Toothbrush, toothpaste, shampoo, deodorant, hairbrush, makeup/skincare' },
      { label: 'Tech', type: 'Checklist', note: 'Phone charger, laptop/tablet, headphones, power bank, camera' },
      { label: 'Travel Documents', type: 'Checklist', note: 'Tickets, hotel confirmation, rental car, insurance cards, emergency contacts' },
      { label: 'Itinerary / Tickets', type: 'File', note: 'Upload PDF or paste URL' },
      { label: 'Hotel / Airbnb', type: 'Link', note: 'Booking confirmation link' },
      { label: 'Map / Directions', type: 'Link', note: 'Maps, navigation, or offline directions' },
      { label: 'Emergency Contact', type: 'Phone', note: 'Tap-to-call emergency contact number' },
      { label: 'Last-Minute Reminders', type: 'Text', note: 'Things to do before leaving or on the way' },
    ],
  },
  {
    name: 'Vehicle Maintenance',
    templateId: 'vehicle',
    emoji: '🚗',
    tagline: 'Track oil changes, repairs, specs, and service contacts.',
    description: 'Vehicle details, maintenance log, routine checklist, and service contacts.',
    borderClass: 'border-l-slate-500',
    blocks: [
      { label: 'Vehicle Details', type: 'Text', note: 'Year, make, model/trim, VIN, license plate, color' },
      { label: 'Important Specs', type: 'Text', note: 'Oil type, tire size, wiper blade size, battery type, preferred fuel' },
      { label: 'Maintenance Log', type: 'Timeline', note: 'Oil changes, tire rotations, inspections, repairs' },
      { label: 'Routine Maintenance', type: 'Checklist', note: 'Oil change, tire pressure, tire rotation, wipers, air filter, cabin filter, brakes, inspection' },
      { label: 'Mechanic', type: 'Phone', note: 'Tap-to-call mechanic' },
      { label: 'Roadside Assistance', type: 'Phone', note: 'Tap-to-call roadside line' },
      { label: 'Insurance / Registration', type: 'File', note: 'Upload or link insurance card and registration' },
      { label: 'Receipts / damage photos', type: 'Image', note: '' },
      { label: 'Notes for Next Service', type: 'Text', note: 'What to mention, check, or fix at the next appointment' },
    ],
  },
  {
    name: "What's in the Box?",
    templateId: 'box',
    emoji: '📦',
    tagline: 'Label any storage box with a contents list and photo.',
    description: 'Attach a QR code to any box so you always know what\'s inside.',
    borderClass: 'border-l-slate-500',
    blocks: [
      { label: 'Photo', type: 'Image', note: 'Photo of the box or its contents' },
      { label: 'Quick Description', type: 'Text', note: 'One-line summary of what this box holds' },
      { label: 'Contents', type: 'Checklist', note: 'Add each item as a checklist entry' },
      { label: 'Storage Location', type: 'Text', note: 'Where the box lives — e.g. attic shelf 3, garage left wall' },
      { label: 'Box Overview', type: 'Audio', note: 'Optional audio walkthrough of the contents' },
      { label: 'Added / Removed Items', type: 'Timeline', note: 'Log changes over time' },
      { label: 'Manuals or Documents', type: 'File', note: 'Related documents stored with the box' },
      { label: 'Additional Notes', type: 'Text', note: 'Condition, fragile warnings, last opened date' },
    ],
  },
  {
    name: 'Workout Tracker',
    templateId: 'workout',
    emoji: '💪',
    tagline: 'Log workouts, track PRs, and stay consistent.',
    description: 'Goal, warmup, exercises, progress log, and session notes.',
    borderClass: 'border-l-rose-500',
    blocks: [
      { label: 'Workout Goal', type: 'Text', note: 'Strength, endurance, mobility, weight loss, consistency, recovery' },
      { label: 'Warmup', type: 'Checklist', note: 'Light cardio, dynamic stretching, mobility work, warmup sets' },
      { label: 'Workout Exercises', type: 'Checklist', note: 'Exercise 1–5 with sets/reps/weight placeholder' },
      { label: 'Current Weights / PRs', type: 'Text', note: 'Track weights, reps, PRs, and progress notes' },
      { label: 'Workout Log', type: 'Timeline', note: 'Log each session — date, what was completed, how it went' },
      { label: 'Workout Playlist or Video', type: 'Link', note: 'Spotify playlist or YouTube workout video' },
      { label: 'Quick Gym Note', type: 'Audio', note: 'Voice note recorded at the gym' },
      { label: 'Post-Workout Notes', type: 'Text', note: 'How it felt, what to change next time' },
    ],
  },
]

const CEREMONIAL_LABELS = ['invocation', 'words to speak', 'quote', 'passage', 'poem', 'prayer', 'sacred']

export default async function HelpPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isLoggedIn = !!user

  return (
    <div className="min-h-screen bg-[#FAF9F7]">
      <header className="bg-white border-b border-stone-200 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-stone-400 hover:text-stone-700 transition-colors">
              « Dashboard
            </Link>
            <h1 className="text-base font-semibold text-stone-900">HubCollector™ — Help & Reference</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-10 space-y-14">

        {/* What is HubCollector? */}
        <section>
          <h2 className="text-lg font-semibold text-stone-800 mb-4">What is HubCollector™?</h2>
          <div className="text-stone-600 leading-[1.75] space-y-3 max-w-prose text-sm">
            <p>
              HubCollector lets you create living digital pages (&ldquo;Hubs&rdquo;) that can be accessed through
              the app, a saved link, or a QR code attached to a real-world object. Organize recipes,
              rituals, pet profiles, artwork, journals, manuals, memories, and more into Collections
              you can update anytime — without reprinting the code.
            </p>
            <p>
              Attach a QR code to anything physical: a storage box, a plant pot, a piece of art,
              a recipe card, an appliance, a pet carrier. Scan it and see the full story behind the object.
            </p>
          </div>
          <div className="mt-5 rounded-xl bg-stone-50 border border-stone-200 px-5 py-4">
            <p className="text-sm text-stone-700 leading-[1.7]">
              <span className="text-stone-400 mr-2 select-none">✦</span>
              HubCollector helps you remember not just information — but where things are, how things work, and why they mattered.
            </p>
          </div>
        </section>

        {/* Popular uses */}
        <section>
          <h2 className="text-lg font-semibold text-stone-800 mb-4">What people use it for</h2>
          <div className="flex flex-wrap gap-2">
            {POPULAR_USES.map(u => (
              <span
                key={u.label}
                className="flex items-center gap-1.5 text-sm text-stone-600 bg-white border border-stone-100 rounded-full px-3 py-1.5 leading-none"
              >
                <span>{u.emoji}</span>
                <span>{u.label}</span>
              </span>
            ))}
          </div>
        </section>

        {/* Templates */}
        <section>
          <h2 className="text-lg font-semibold text-stone-800 mb-2">Templates</h2>
          <p className="text-sm text-stone-500 leading-[1.65] mb-5">
            Start with a template and everything is already laid out — just fill in what matters to you.
          </p>

          <HelpTemplateGrid templates={TEMPLATES as HelpTemplate[]} isLoggedIn={isLoggedIn} />
        </section>

        {/* How hubs work */}
        <section>
          <h2 className="text-lg font-semibold text-stone-800 mb-4">How Hubs work</h2>
          <div className="text-stone-600 leading-[1.75] space-y-3 max-w-prose text-sm">
            <p>
              Each Hub is a page with a permanent, printable URL. You create the Hub, print the QR code,
              and attach it to something — a box, a wall, a jar, a frame.
              The QR always points to the same address, so you can keep editing the content forever.
            </p>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="bg-white rounded-xl border border-stone-100 p-4">
              <div className="text-sm font-semibold text-stone-800 mb-1">Interactive Page</div>
              <p className="text-xs text-stone-500 leading-[1.6]">
                Shows a full content page with text, images, audio, links, checklists, timelines, and more.
                Visitors can interact directly — checking off items, playing audio, following links.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-stone-100 p-4">
              <div className="text-sm font-semibold text-stone-800 mb-1">Redirect Link</div>
              <p className="text-xs text-stone-500 leading-[1.6]">
                Instantly sends visitors to another URL — no page shown.
                Useful when the QR code should act as a permanent shortcut to an external site.
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { label: 'Public', desc: 'Anyone can find and view' },
              { label: 'Unlisted', desc: 'Only people with the link can view' },
              { label: 'Private', desc: 'Only you, when signed in' },
            ].map(p => (
              <div key={p.label} className="bg-white rounded-xl border border-stone-100 px-4 py-3">
                <div className="text-xs font-semibold text-stone-700 mb-0.5">{p.label}</div>
                <p className="text-[11px] text-stone-400 leading-[1.55]">{p.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-stone-400 mt-2">New Hubs default to Private.</p>
        </section>

        {/* Collections & Organization */}
        <section>
          <h2 className="text-lg font-semibold text-stone-800 mb-4">Collections &amp; Organization</h2>
          <div className="text-stone-600 leading-[1.75] space-y-3 max-w-prose text-sm">
            <p>
              Collections are curated groups of Hubs — a way to organise your archive into meaningful spaces.
              Think of them less like folders and more like shelves: a shelf for home, a shelf for creative work, a shelf for rituals.
            </p>
            <p>
              <strong>Browsing by Collection:</strong> Click a Collection card on the dashboard to filter the Hub list to just that Collection. Click again to return to all Hubs. The Collection&apos;s description appears when it&apos;s selected — add one via the Collection&apos;s ⋮ menu.
            </p>
            <p>
              <strong>Assigning a Hub:</strong> Open the Hub card&apos;s ⋮ menu and choose <em>Move to Collection</em>.
              You can also set the Collection during Hub creation, or from the Hub&apos;s Settings tab.
            </p>
            <p>
              <strong>Uncollected Hubs</strong> appear in their own filter at the bottom of the Collections list — so nothing gets lost.
            </p>
          </div>
        </section>

        {/* Block types */}
        <section>
          <h2 className="text-lg font-semibold text-stone-800 mb-2">Block types</h2>
          <p className="text-sm text-stone-500 leading-[1.65] mb-5 max-w-prose">
            Every Hub is built from blocks. Mix and match as many as you need — add, reorder, and remove at any time.
          </p>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {BLOCK_TYPES.map(b => (
              <div key={b.name} className="bg-white rounded-xl border border-stone-100 p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-lg leading-none">{b.emoji}</span>
                  <span className="text-sm font-semibold text-stone-800">{b.name}</span>
                </div>
                <p className="text-xs text-stone-500 leading-[1.6]">{b.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Advanced styling */}
        <section>
          <h2 className="text-lg font-semibold text-stone-800 mb-4">Advanced styling</h2>

          <h3 className="text-sm font-semibold text-stone-700 mb-2">Styled quote &amp; passage text</h3>
          <p className="text-sm text-stone-500 leading-[1.65] mb-3 max-w-prose">
            Any <strong>Text</strong> block whose label contains one of these words automatically renders in italic
            with a thin accent-color left border — useful for quotes, poetry, spoken text, or ceremonial content:
          </p>
          <div className="flex flex-wrap gap-2 mb-6">
            {CEREMONIAL_LABELS.map(w => (
              <span key={w} className="text-xs text-stone-500 bg-stone-100 px-2.5 py-1 rounded-full">{w}</span>
            ))}
          </div>

          <h3 className="text-sm font-semibold text-stone-700 mb-2">Default collapse state</h3>
          <p className="text-sm text-stone-500 leading-[1.65] mb-3 max-w-prose">
            On the public hub view, blocks are collapsible. The initial open or closed state is controlled automatically
            by keywords in the block&apos;s label — you can change it simply by renaming the label.
          </p>
          <div className="border-t border-stone-100 divide-y divide-stone-100 text-xs">
            <div className="py-2.5 flex gap-4">
              <span className="font-semibold text-stone-600 w-32 flex-shrink-0">Open by default</span>
              <span className="text-stone-400">Label contains: <em>overview, step, note, invocation, words</em></span>
            </div>
            <div className="py-2.5 flex gap-4">
              <span className="font-semibold text-stone-600 w-32 flex-shrink-0">Closed by default</span>
              <span className="text-stone-400">Label contains: <em>setup, correspond, photo, memor, follow, playlist, voice</em></span>
            </div>
            <div className="py-2.5 flex gap-4">
              <span className="font-semibold text-stone-600 w-32 flex-shrink-0">Open (fallback)</span>
              <span className="text-stone-400">Everything else</span>
            </div>
          </div>
        </section>

        {/* Good to know */}
        <section>
          <h2 className="text-lg font-semibold text-stone-800 mb-4">Good to know</h2>
          <ul className="space-y-3 text-sm text-stone-600 leading-[1.7] max-w-prose">
            <li>
              <strong>The URL slug is permanent.</strong> It&apos;s encoded in the QR code — changing it breaks printed codes.
              Choose it carefully at creation time and leave it alone after printing.
            </li>
            <li>
              <strong>Block order matters.</strong> Blocks appear in sort order. Use the ▲▼ arrows in the editor to reorder.
              High-priority content should come first.
            </li>
            <li>
              <strong>Checklists are per-device.</strong> Checked state is stored in each visitor&apos;s browser — not the database.
              Every new device starts fresh. Great for shared checklists where each person tracks their own progress.
            </li>
            <li>
              <strong>Images can be uploaded or linked.</strong> Upload a photo directly from the image block editor,
              or paste any public URL. Uploaded images are stored securely in Supabase Storage.
            </li>
            <li>
              <strong>Hub type can be set anytime.</strong> Even Hubs created from Blank can get a template badge —
              open Settings and choose a Hub type. This only updates the label; it doesn&apos;t add or remove blocks.
            </li>
            <li>
              <strong>Content indicator dots.</strong> In the block editor, a green dot means the block has content;
              a hollow ring means it&apos;s empty. Useful for scanning after applying a template to see what still needs filling in.
            </li>
          </ul>
        </section>

      </main>

      <SiteFooter />
    </div>
  )
}
