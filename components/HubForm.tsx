'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Hub, Collection } from '@/lib/types'
import { useCollections } from './useCollections'
import ContentBlocksEditor from './ContentBlocksEditor'
import DeleteHubForm from './DeleteHubForm'
import { uploadPhoto } from '@/lib/supabase/uploadPhoto'

const THEME_COLORS = [
  { value: '#3B82F6', label: 'Blue' },
  { value: '#22C55E', label: 'Green' },
  { value: '#F59E0B', label: 'Amber' },
  { value: '#F43F5E', label: 'Rose' },
  { value: '#8B5CF6', label: 'Violet' },
  { value: '#14B8A6', label: 'Teal' },
  { value: '#F97316', label: 'Orange' },
  { value: '#64748B', label: 'Slate' },
]

type Template = {
  id: string
  label: string
  emoji: string
  description: string
  title: string
  hubDescription: string
  themeColor: string
}

const TEMPLATES: Template[] = [
  {
    id: 'blank',
    label: 'Blank',
    emoji: '➕',
    description: 'Start from scratch',
    title: '',
    hubDescription: '',
    themeColor: '#3B82F6',
  },
  {
    id: 'artwork',
    label: 'Artwork Archive',
    emoji: '🎨',
    description: 'Document and archive your artwork — photos, materials, story, and status',
    title: 'Untitled Artwork',
    hubDescription: '',
    themeColor: '#8B5CF6',
  },
  {
    id: 'book',
    label: 'Book / Reading Notes',
    emoji: '📖',
    description: 'Save notes, quotes, and reflections about a book',
    title: 'My Reading Notes',
    hubDescription: '',
    themeColor: '#8B5CF6',
  },
  {
    id: 'journal',
    label: 'Daily Reflection / Journal',
    emoji: '📓',
    description: 'A guided daily space for introspection, gratitude, and setting intentions',
    title: 'My Journal',
    hubDescription: '',
    themeColor: '#14B8A6',
  },
  {
    id: 'diary',
    label: 'Diary / Life Log',
    emoji: '📔',
    description: 'A casual daily diary for documenting what happened — events, people, photos, and memories',
    title: 'My Diary',
    hubDescription: '',
    themeColor: '#F59E0B',
  },
  {
    id: 'garden',
    label: 'Garden Planner',
    emoji: '🌱',
    description: 'Plan and track your garden with planting lists, care tasks, and seasonal notes',
    title: 'My Garden',
    hubDescription: '',
    themeColor: '#14B8A6',
  },
  {
    id: 'goal',
    label: 'Goal / Habit Tracker',
    emoji: '🎯',
    description: 'Define a goal, track daily habits, and log progress',
    title: 'My Goal',
    hubDescription: '',
    themeColor: '#F43F5E',
  },
  {
    id: 'grocery',
    label: 'Grocery List',
    emoji: '🛒',
    description: 'A reusable household shopping list organized by category',
    title: 'Grocery List',
    hubDescription: '',
    themeColor: '#22C55E',
  },
  {
    id: 'maintenance',
    label: 'Home Maintenance Log',
    emoji: '🔧',
    description: 'Log appliances, repairs, warranties, and service contacts',
    title: 'My Maintenance Log',
    hubDescription: '',
    themeColor: '#14B8A6',
  },
  {
    id: 'hub_collector',
    label: 'Hub Collector',
    emoji: '🔗',
    description: 'A public button menu linking to Hubs from your Collections — like Linktree for your QR content',
    title: 'My Hub Collection',
    hubDescription: '',
    themeColor: '#3B82F6',
  },
  {
    id: 'pet',
    label: 'Pet Profile',
    emoji: '🐾',
    description: 'Track your pet with care tasks, health history, and vet info',
    title: 'My Pet',
    hubDescription: '',
    themeColor: '#F59E0B',
  },
  {
    id: 'plant',
    label: 'Plant Profile',
    emoji: '🪴',
    description: 'Track a plant with care instructions, growth log, and photos',
    title: 'My Plant',
    hubDescription: '',
    themeColor: '#22C55E',
  },
  {
    id: 'recipe',
    label: 'Recipe',
    emoji: '🍳',
    description: 'Save and share a recipe with photo, ingredients, and instructions',
    title: 'My Recipe',
    hubDescription: '',
    themeColor: '#F97316',
  },
  {
    id: 'ritual',
    label: 'Ritual Template',
    emoji: '🕯️',
    description: 'Document and revisit sacred rituals',
    title: 'My Ritual',
    hubDescription: 'A space to capture the intention, steps, and reflections of this ritual.',
    themeColor: '#8B5CF6',
  },
  {
    id: 'shadow_work',
    label: 'Shadow Work Journal',
    emoji: '🌑',
    description: 'A private space for exploring the hidden, wounded, or unconscious parts of yourself with honesty and compassion',
    title: 'Shadow Work',
    hubDescription: 'Shadow work is the practice of gently exploring the hidden, rejected, wounded, or unconscious parts of ourselves with honesty and compassion.',
    themeColor: '#8B5CF6',
  },
  {
    id: 'travel',
    label: 'Travel Journal',
    emoji: '✈️',
    description: 'Capture a trip with photos, timeline, packing list, and reflections',
    title: 'My Trip',
    hubDescription: '',
    themeColor: '#3B82F6',
  },
  {
    id: 'packing',
    label: 'Travel Packing List',
    emoji: '🧳',
    description: 'A reusable packing checklist for any trip',
    title: 'Packing List',
    hubDescription: '',
    themeColor: '#F59E0B',
  },
  {
    id: 'vehicle',
    label: 'Vehicle Maintenance',
    emoji: '🚗',
    description: "Track your car's specs, maintenance history, and key service contacts",
    title: 'My Vehicle',
    hubDescription: '',
    themeColor: '#64748B',
  },
  {
    id: 'box',
    label: "What's in the Box?",
    emoji: '📦',
    description: 'Label a storage box with contents, location, and notes',
    title: 'My Box',
    hubDescription: '',
    themeColor: '#64748B',
  },
  {
    id: 'workout',
    label: 'Workout Tracker',
    emoji: '💪',
    description: 'Log exercises, track weights, and note progress after every session',
    title: 'My Workout',
    hubDescription: '',
    themeColor: '#F43F5E',
  },
]

const BOX_BLOCKS = [
  { type: 'image' as const, data: { url: '', caption: '' } },
  { type: 'text' as const, data: { label: 'Quick Description', text: '' } },
  { type: 'checklist' as const, data: { label: 'Contents', items: [] } },
  { type: 'text' as const, data: { label: 'Storage Location', text: '' } },
  { type: 'audio' as const, data: { label: 'Box Overview', url: '' } },
  { type: 'timeline' as const, data: { label: 'Added / Removed Items', events: [] } },
  { type: 'file' as const, data: { label: 'Manuals or Documents', url: '' } },
  { type: 'text' as const, data: { label: 'Additional Notes', text: '' } },
]

const PLANT_BLOCKS = [
  { type: 'image' as const, data: { url: '', caption: '' } },
  { type: 'text' as const, data: { label: 'Plant Information', text: 'Plant Name:\n\nType / Species:\n\nDate Acquired:\n\nWhere From:\n\nPot Size:' } },
  { type: 'text' as const, data: { label: 'Care Instructions', text: 'Watering:\n\nLight:\n\nSoil:\n\nTemperature:\n\nHumidity:\n\nFertilizing:\n\nRepotting:' } },
  { type: 'checklist' as const, data: { label: 'Care Checklist', items: [
    { id: 'pl-c1', text: 'Water plant' },
    { id: 'pl-c2', text: 'Check soil moisture' },
    { id: 'pl-c3', text: 'Check for pests or disease' },
    { id: 'pl-c4', text: 'Wipe or mist leaves' },
    { id: 'pl-c5', text: 'Rotate toward light' },
  ] } },
  { type: 'timeline' as const, data: { label: 'Growth & Care Log', events: [] } },
  { type: 'audio' as const, data: { label: 'Plant Update', url: '' } },
  { type: 'link' as const, data: { label: 'Care Guide', url: '' } },
  { type: 'text' as const, data: { label: 'Seasonal Notes', text: '' } },
]

const MAINTENANCE_BLOCKS = [
  { type: 'image' as const, data: { url: '', caption: '' } },
  { type: 'text' as const, data: { label: 'Maintenance Information', text: 'Item / Area:\n\nBrand / Model:\n\nSerial Number:\n\nInstalled:\n\nWarranty Expiration:' } },
  { type: 'checklist' as const, data: { label: 'Maintenance Tasks', items: [
    { id: 'mt-c1', text: 'Inspect for damage or wear' },
    { id: 'mt-c2', text: 'Clean filters or vents' },
    { id: 'mt-c3', text: 'Test and run system' },
    { id: 'mt-c4', text: 'Check for leaks or blockages' },
    { id: 'mt-c5', text: 'Schedule next service' },
  ] } },
  { type: 'timeline' as const, data: { label: 'Repair History', events: [] } },
  { type: 'file' as const, data: { label: 'Manuals & Warranty', url: '' } },
  { type: 'phone' as const, data: { label: 'Service Contact', url: '' } },
  { type: 'link' as const, data: { label: 'Product Page', url: '' } },
  { type: 'text' as const, data: { label: 'Additional Notes', text: '' } },
]

const TRAVEL_BLOCKS = [
  { type: 'image' as const, data: { url: '', caption: '' } },
  { type: 'text' as const, data: { label: 'Trip Overview', text: 'Destination:\n\nDates:\n\nTraveling With:\n\nAccommodation:\n\nPurpose of Trip:' } },
  { type: 'timeline' as const, data: { label: 'Travel Timeline', events: [] } },
  { type: 'link' as const, data: { label: 'Maps / Reservations', url: '' } },
  { type: 'checklist' as const, data: { label: 'Packing List', items: [
    { id: 'tv-c1', text: 'Passport / ID' },
    { id: 'tv-c2', text: 'Phone + charger + adapter' },
    { id: 'tv-c3', text: 'Medications' },
    { id: 'tv-c4', text: 'Travel insurance info' },
    { id: 'tv-c5', text: 'Cash / cards' },
    { id: 'tv-c6', text: 'Comfortable shoes' },
  ] } },
  { type: 'audio' as const, data: { label: 'Travel Reflection', url: '' } },
  { type: 'text' as const, data: { label: 'Recommendations', text: '' } },
]

const PET_BLOCKS = [
  { type: 'image' as const, data: { url: '', caption: '' } },
  { type: 'text' as const, data: { label: 'Pet Information', text: 'Name:\n\nSpecies / Breed:\n\nDate of Birth:\n\nColor / Markings:\n\nMicrochip / ID #:' } },
  { type: 'checklist' as const, data: { label: 'Care Tasks', items: [
    { id: 'pt-c1', text: 'Morning feeding' },
    { id: 'pt-c2', text: 'Evening feeding' },
    { id: 'pt-c3', text: 'Fresh water' },
    { id: 'pt-c4', text: 'Exercise / walk or playtime' },
    { id: 'pt-c5', text: 'Grooming as needed' },
  ] } },
  { type: 'timeline' as const, data: { label: 'Vet & Health History', events: [] } },
  { type: 'phone' as const, data: { label: 'Veterinarian', url: '' } },
  { type: 'file' as const, data: { label: 'Vaccination Records', url: '' } },
  { type: 'audio' as const, data: { label: 'Pet Update', url: '' } },
  { type: 'text' as const, data: { label: 'Behavior / Preferences', text: '' } },
]

const BOOK_BLOCKS = [
  { type: 'image' as const, data: { url: '', caption: '' } },
  { type: 'text' as const, data: { label: 'Book Summary', text: 'Title:\n\nAuthor:\n\nGenre:\n\nYear Published:\n\nDate Read:\n\nRating:\n\nSummary:' } },
  { type: 'text' as const, data: { label: 'Favorite Quotes', text: '' } },
  { type: 'audio' as const, data: { label: 'Reading Reflection', url: '' } },
  { type: 'link' as const, data: { label: 'Author / Purchase Link', url: '' } },
  { type: 'timeline' as const, data: { label: 'Reading Progress', events: [] } },
  { type: 'text' as const, data: { label: 'Thoughts & Insights', text: '' } },
]

const GOAL_BLOCKS = [
  { type: 'text' as const, data: { label: 'Goal Overview', text: 'Goal:\n\nWhy This Matters:\n\nTarget Date:\n\nSuccess Looks Like:' } },
  { type: 'checklist' as const, data: { label: 'Habit Checklist', items: [
    { id: 'gl-c1', text: 'Morning routine' },
    { id: 'gl-c2', text: 'Exercise or movement' },
    { id: 'gl-c3', text: 'Read or learn something new' },
    { id: 'gl-c4', text: 'Evening reflection' },
  ] } },
  { type: 'timeline' as const, data: { label: 'Progress Log', events: [] } },
  { type: 'audio' as const, data: { label: 'Progress Update', url: '' } },
  { type: 'link' as const, data: { label: 'Related Resource', url: '' } },
  { type: 'text' as const, data: { label: 'Wins & Challenges', text: '' } },
]

const JOURNAL_BLOCKS = [
  { type: 'text' as const, data: { label: "Today's Reflection", text: '' } },
  { type: 'text' as const, data: { label: 'Mood / Energy', text: '' } },
  { type: 'text' as const, data: { label: 'Gratitude', text: '' } },
  { type: 'text' as const, data: { label: 'What challenged me today?', text: '' } },
  { type: 'text' as const, data: { label: 'What supported me today?', text: '' } },
  { type: 'text' as const, data: { label: 'What did I learn about myself?', text: '' } },
  { type: 'text' as const, data: { label: 'What am I releasing?', text: '' } },
  { type: 'text' as const, data: { label: "Tomorrow's Intention", text: '' } },
  { type: 'audio' as const, data: { label: 'Voice Reflection', url: '' } },
  { type: 'image' as const, data: { url: '', caption: 'Symbol or photo of the day' } },
]

const ARTWORK_BLOCKS = [
  {
    type: 'image' as const,
    data: { url: '', caption: '' },
  },
  {
    type: 'text' as const,
    data: { label: 'Description', text: '' },
  },
  {
    type: 'text' as const,
    data: {
      label: 'Details',
      text: 'Date Created:\n\nMedium:\n\nDimensions:\n\nStatus: In Progress  /  Completed  /  Sold  /  Gifted',
    },
  },
  {
    type: 'text' as const,
    data: { label: 'Color Palette', text: '' },
  },
  {
    type: 'text' as const,
    data: { label: 'Inspiration / Meaning', text: '' },
  },
  {
    type: 'image' as const,
    data: { url: '', caption: 'Additional photos' },
  },
  {
    type: 'link' as const,
    data: { label: 'Music / Playlist', url: '' },
  },
  {
    type: 'text' as const,
    data: { label: 'Notes', text: '' },
  },
]

const RECIPE_BLOCKS = [
  {
    type: 'image' as const,
    data: { url: '', caption: '' },
  },
  {
    type: 'text' as const,
    data: { label: 'Description', text: '' },
  },
  {
    type: 'text' as const,
    data: {
      label: 'At a Glance',
      text: 'Prep Time:\n\nCook Time:\n\nServings:',
    },
  },
  {
    type: 'text' as const,
    data: { label: 'Ingredients', text: '' },
  },
  {
    type: 'text' as const,
    data: { label: 'Instructions', text: '' },
  },
  {
    type: 'text' as const,
    data: { label: 'Notes', text: '' },
  },
  {
    type: 'link' as const,
    data: { label: 'Video', url: '' },
  },
  {
    type: 'link' as const,
    data: { label: 'Source', url: '' },
  },
]

const RITUAL_BLOCKS = [
  {
    type: 'text' as const,
    data: {
      label: 'Ritual Overview',
      text: 'Ritual Name:\n\nDate / Season / Moon Phase:\n\nIntention:\n\nLocation:\n\nWho is participating:',
    },
  },
  {
    type: 'checklist' as const,
    data: {
      label: 'Ritual Setup',
      items: [
        { id: 'rs-1', text: 'Cleanse the space', checked: false },
        { id: 'rs-2', text: 'Prepare altar or ritual area', checked: false },
        { id: 'rs-3', text: 'Gather candles', checked: false },
        { id: 'rs-4', text: 'Gather herbs, crystals, tools, or offerings', checked: false },
        { id: 'rs-5', text: 'Prepare music or playlist', checked: false },
        { id: 'rs-6', text: 'Set water, journal, or divination tools nearby', checked: false },
        { id: 'rs-7', text: 'Silence phone / reduce distractions', checked: false },
        { id: 'rs-8', text: 'Ground and center', checked: false },
      ],
    },
  },
  {
    type: 'text' as const,
    data: {
      label: 'Correspondences',
      text: 'Colors:\n\nHerbs / Plants:\n\nCrystals / Stones:\n\nElements:\n\nDeities / Spirits / Guides:\n\nSymbols:\n\nOfferings:\n\nTarot / Oracle Cards:\n\nOther Notes:',
    },
  },
  {
    type: 'checklist' as const,
    data: {
      label: 'Ritual Steps',
      items: [
        { id: 'rstep-1', text: 'Opening / grounding', checked: false },
        { id: 'rstep-2', text: 'Cleanse or bless the space', checked: false },
        { id: 'rstep-3', text: 'Cast circle or create sacred space', checked: false },
        { id: 'rstep-4', text: 'Call quarters / invite guides', checked: false },
        { id: 'rstep-5', text: 'Invocation or prayer', checked: false },
        { id: 'rstep-6', text: 'Main ritual working', checked: false },
        { id: 'rstep-7', text: 'Meditation / silence / divination', checked: false },
        { id: 'rstep-8', text: 'Offerings or gratitude', checked: false },
        { id: 'rstep-9', text: 'Closing words', checked: false },
        { id: 'rstep-10', text: 'Release quarters / close circle', checked: false },
        { id: 'rstep-11', text: 'Final grounding', checked: false },
      ],
    },
  },
  {
    type: 'text' as const,
    data: {
      label: 'Invocation / Words to Speak',
      text: '',
    },
  },
  {
    type: 'text' as const,
    data: {
      label: 'Quote / Passage',
      text: '',
    },
  },
  {
    type: 'link' as const,
    data: {
      label: 'Reference: Moon & Seasons',
      url: '',
    },
  },
  {
    type: 'link' as const,
    data: {
      label: 'Reference: Herb & Correspondences',
      url: '',
    },
  },
  {
    type: 'link' as const,
    data: {
      label: 'Reference: Sacred Text / Source',
      url: '',
    },
  },
  {
    type: 'link' as const,
    data: {
      label: 'Ritual Playlist',
      url: '',
    },
  },
  {
    type: 'audio' as const,
    data: {
      label: 'Voice Reflections',
      url: '',
    },
  },
  {
    type: 'text' as const,
    data: {
      label: 'Ritual Notes',
      text: 'What energy did I feel before beginning?\n\nWhat shifted during the ritual?\n\nWhat signs, symbols, or synchronicities appeared?\n\nWhat emotions came up?\n\nWhat did I learn?\n\nWhat do I want to remember next time?',
    },
  },
  {
    type: 'image' as const,
    data: {
      url: '',
      caption: 'Photos from this ritual',
    },
  },
  {
    type: 'checklist' as const,
    data: {
      label: 'Follow-Up',
      items: [
        { id: 'fu-1', text: 'Journal reflections', checked: false },
        { id: 'fu-2', text: 'Dispose of offerings respectfully', checked: false },
        { id: 'fu-3', text: 'Clean up ritual space', checked: false },
        { id: 'fu-4', text: 'Save photos or voice notes', checked: false },
        { id: 'fu-5', text: 'Record tarot/oracle cards', checked: false },
        { id: 'fu-6', text: 'Watch for signs over the next few days', checked: false },
        { id: 'fu-7', text: 'Revisit this ritual later', checked: false },
      ],
    },
  },
]

const HUB_COLLECTOR_BLOCKS = [
  { type: 'text' as const, data: { label: 'Introduction', text: '' } },
  { type: 'collection_menu' as const, data: { collection_id: '', excluded_hub_ids: [] } },
]

const GARDEN_BLOCKS = [
  { type: 'text' as const, data: { label: 'Garden Overview', text: 'Location, sunlight, soil notes, garden goals, seasonal plans.' } },
  { type: 'checklist' as const, data: { label: 'Planting List', items: [
    { id: 'gd-p1', text: 'Tomatoes' },
    { id: 'gd-p2', text: 'Basil' },
    { id: 'gd-p3', text: 'Peppers' },
    { id: 'gd-p4', text: 'Lettuce' },
    { id: 'gd-p5', text: 'Flowers' },
    { id: 'gd-p6', text: 'Herbs' },
  ] } },
  { type: 'text' as const, data: { label: 'Companion Planting Notes', text: 'What grows well together? What should be kept apart?' } },
  { type: 'timeline' as const, data: { label: 'Garden Log', events: [] } },
  { type: 'checklist' as const, data: { label: 'Garden Tasks', items: [
    { id: 'gd-t1', text: 'Water' },
    { id: 'gd-t2', text: 'Weed' },
    { id: 'gd-t3', text: 'Prune' },
    { id: 'gd-t4', text: 'Fertilize' },
    { id: 'gd-t5', text: 'Check for pests' },
    { id: 'gd-t6', text: 'Harvest' },
  ] } },
  { type: 'image' as const, data: { url: '', caption: '' } },
  { type: 'audio' as const, data: { label: 'Quick Garden Observation', url: '' } },
  { type: 'link' as const, data: { label: 'Planting Guide', url: '' } },
  { type: 'text' as const, data: { label: 'Harvest Notes', text: '' } },
]

const GROCERY_BLOCKS = [
  { type: 'text' as const, data: { label: 'Meal Plan Notes', text: 'Meals planned for the week, recipe reminders, or household requests.' } },
  { type: 'checklist' as const, data: { label: 'Produce', items: [
    { id: 'gr-p1', text: 'Lettuce / greens' },
    { id: 'gr-p2', text: 'Tomatoes' },
    { id: 'gr-p3', text: 'Onions' },
    { id: 'gr-p4', text: 'Potatoes' },
    { id: 'gr-p5', text: 'Fruit' },
  ] } },
  { type: 'checklist' as const, data: { label: 'Meat & Seafood', items: [
    { id: 'gr-m1', text: 'Chicken' },
    { id: 'gr-m2', text: 'Ground beef' },
    { id: 'gr-m3', text: 'Lunch meat' },
    { id: 'gr-m4', text: 'Fish / seafood' },
  ] } },
  { type: 'checklist' as const, data: { label: 'Dairy & Eggs', items: [
    { id: 'gr-d1', text: 'Milk' },
    { id: 'gr-d2', text: 'Eggs' },
    { id: 'gr-d3', text: 'Cheese' },
    { id: 'gr-d4', text: 'Yogurt' },
    { id: 'gr-d5', text: 'Butter' },
  ] } },
  { type: 'checklist' as const, data: { label: 'Pantry', items: [
    { id: 'gr-n1', text: 'Pasta / rice' },
    { id: 'gr-n2', text: 'Canned goods' },
    { id: 'gr-n3', text: 'Bread' },
    { id: 'gr-n4', text: 'Cereal' },
    { id: 'gr-n5', text: 'Snacks' },
  ] } },
  { type: 'checklist' as const, data: { label: 'Spices & Baking', items: [
    { id: 'gr-s1', text: 'Salt / pepper' },
    { id: 'gr-s2', text: 'Garlic powder' },
    { id: 'gr-s3', text: 'Flour' },
    { id: 'gr-s4', text: 'Sugar' },
    { id: 'gr-s5', text: 'Baking items' },
  ] } },
  { type: 'checklist' as const, data: { label: 'Frozen', items: [
    { id: 'gr-f1', text: 'Frozen vegetables' },
    { id: 'gr-f2', text: 'Frozen meals' },
    { id: 'gr-f3', text: 'Ice cream' },
  ] } },
  { type: 'checklist' as const, data: { label: 'Household', items: [
    { id: 'gr-h1', text: 'Paper towels' },
    { id: 'gr-h2', text: 'Toilet paper' },
    { id: 'gr-h3', text: 'Cleaning supplies' },
    { id: 'gr-h4', text: 'Trash bags' },
  ] } },
  { type: 'link' as const, data: { label: 'Recipe Link', url: '' } },
  { type: 'text' as const, data: { label: 'Store Notes / Coupons', text: '' } },
]

const PACKING_BLOCKS = [
  { type: 'text' as const, data: { label: 'Trip Details', text: 'Destination, dates, weather, travel companions, important notes.' } },
  { type: 'checklist' as const, data: { label: 'Essentials', items: [
    { id: 'pk-e1', text: 'Wallet' },
    { id: 'pk-e2', text: 'ID / passport' },
    { id: 'pk-e3', text: 'Keys' },
    { id: 'pk-e4', text: 'Phone' },
    { id: 'pk-e5', text: 'Charger' },
    { id: 'pk-e6', text: 'Medications' },
  ] } },
  { type: 'checklist' as const, data: { label: 'Clothing', items: [
    { id: 'pk-cl1', text: 'Shirts' },
    { id: 'pk-cl2', text: 'Pants / shorts' },
    { id: 'pk-cl3', text: 'Pajamas' },
    { id: 'pk-cl4', text: 'Socks' },
    { id: 'pk-cl5', text: 'Underwear' },
    { id: 'pk-cl6', text: 'Shoes' },
    { id: 'pk-cl7', text: 'Jacket / sweater' },
  ] } },
  { type: 'checklist' as const, data: { label: 'Toiletries', items: [
    { id: 'pk-t1', text: 'Toothbrush' },
    { id: 'pk-t2', text: 'Toothpaste' },
    { id: 'pk-t3', text: 'Shampoo' },
    { id: 'pk-t4', text: 'Deodorant' },
    { id: 'pk-t5', text: 'Hairbrush' },
    { id: 'pk-t6', text: 'Makeup / skincare' },
  ] } },
  { type: 'checklist' as const, data: { label: 'Tech', items: [
    { id: 'pk-tc1', text: 'Phone charger' },
    { id: 'pk-tc2', text: 'Laptop / tablet' },
    { id: 'pk-tc3', text: 'Headphones' },
    { id: 'pk-tc4', text: 'Power bank' },
    { id: 'pk-tc5', text: 'Camera' },
  ] } },
  { type: 'checklist' as const, data: { label: 'Travel Documents', items: [
    { id: 'pk-d1', text: 'Tickets' },
    { id: 'pk-d2', text: 'Hotel confirmation' },
    { id: 'pk-d3', text: 'Rental car info' },
    { id: 'pk-d4', text: 'Insurance cards' },
    { id: 'pk-d5', text: 'Emergency contacts' },
  ] } },
  { type: 'file' as const, data: { label: 'Itinerary / Tickets', url: '' } },
  { type: 'link' as const, data: { label: 'Hotel / Airbnb', url: '' } },
  { type: 'link' as const, data: { label: 'Map / Directions', url: '' } },
  { type: 'phone' as const, data: { label: 'Emergency Contact', url: '' } },
  { type: 'text' as const, data: { label: 'Last-Minute Reminders', text: '' } },
]

const VEHICLE_BLOCKS = [
  { type: 'text' as const, data: { label: 'Vehicle Details', text: 'Year:\n\nMake:\n\nModel / Trim:\n\nVIN:\n\nLicense Plate:\n\nColor:' } },
  { type: 'text' as const, data: { label: 'Important Specs', text: 'Oil type:\n\nTire size:\n\nWiper blade size:\n\nBattery type:\n\nPreferred fuel:' } },
  { type: 'timeline' as const, data: { label: 'Maintenance Log', events: [] } },
  { type: 'checklist' as const, data: { label: 'Routine Maintenance', items: [
    { id: 'vc-c1', text: 'Oil change' },
    { id: 'vc-c2', text: 'Tire pressure check' },
    { id: 'vc-c3', text: 'Tire rotation' },
    { id: 'vc-c4', text: 'Wiper blades' },
    { id: 'vc-c5', text: 'Air filter' },
    { id: 'vc-c6', text: 'Cabin filter' },
    { id: 'vc-c7', text: 'Brakes' },
    { id: 'vc-c8', text: 'Inspection / registration' },
  ] } },
  { type: 'phone' as const, data: { label: 'Mechanic', url: '' } },
  { type: 'phone' as const, data: { label: 'Roadside Assistance', url: '' } },
  { type: 'file' as const, data: { label: 'Insurance / Registration', url: '' } },
  { type: 'image' as const, data: { url: '', caption: 'Receipts / damage photos' } },
  { type: 'text' as const, data: { label: 'Notes for Next Service', text: '' } },
]

const WORKOUT_BLOCKS = [
  { type: 'text' as const, data: { label: 'Workout Goal', text: 'What are you working toward? Strength, endurance, mobility, weight loss, consistency, recovery, etc.' } },
  { type: 'checklist' as const, data: { label: 'Warmup', items: [
    { id: 'wt-w1', text: '5–10 minutes light cardio' },
    { id: 'wt-w2', text: 'Dynamic stretching' },
    { id: 'wt-w3', text: 'Mobility work' },
    { id: 'wt-w4', text: 'Warmup sets' },
  ] } },
  { type: 'checklist' as const, data: { label: 'Workout Exercises', items: [
    { id: 'wt-e1', text: 'Exercise 1 — sets / reps / weight' },
    { id: 'wt-e2', text: 'Exercise 2 — sets / reps / weight' },
    { id: 'wt-e3', text: 'Exercise 3 — sets / reps / weight' },
    { id: 'wt-e4', text: 'Exercise 4 — sets / reps / weight' },
    { id: 'wt-e5', text: 'Exercise 5 — sets / reps / weight' },
  ] } },
  { type: 'text' as const, data: { label: 'Current Weights / PRs', text: 'Track weights, reps, personal records, or progress notes here.' } },
  { type: 'timeline' as const, data: { label: 'Workout Log', events: [] } },
  { type: 'link' as const, data: { label: 'Workout Playlist or Video', url: '' } },
  { type: 'audio' as const, data: { label: 'Quick Gym Note', url: '' } },
  { type: 'text' as const, data: { label: 'Post-Workout Notes', text: 'How did it feel? What should change next time?' } },
]

const DIARY_BLOCKS = [
  { type: 'text' as const, data: { label: "Today's Date", text: '' } },
  { type: 'text' as const, data: { label: 'What Happened Today', text: '' } },
  { type: 'timeline' as const, data: { label: 'Timeline of My Day', events: [
    { id: 'dy-t1', date: '', text: 'Morning' },
    { id: 'dy-t2', date: '', text: 'Afternoon' },
    { id: 'dy-t3', date: '', text: 'Evening' },
  ] } },
  { type: 'text' as const, data: { label: 'People & Places', text: '' } },
  { type: 'image' as const, data: { url: '', caption: 'Photos from today' } },
  { type: 'audio' as const, data: { label: 'Voice Note', url: '' } },
  { type: 'text' as const, data: { label: 'Random Thoughts', text: '' } },
  { type: 'link' as const, data: { label: 'Links / Keepsakes', url: '' } },
  { type: 'text' as const, data: { label: 'Mood / Energy', text: '' } },
  { type: 'text' as const, data: { label: 'One Thing I Want to Remember', text: '' } },
]

const SHADOW_BLOCKS = [
  { type: 'text' as const, data: { label: 'Prompt or Theme', text: '' } },
  { type: 'text' as const, data: { label: 'Current Emotional State', text: '' } },
  { type: 'text' as const, data: { label: 'Trigger or Situation', text: '' } },
  { type: 'text' as const, data: { label: 'What Am I Avoiding?', text: '' } },
  { type: 'text' as const, data: { label: 'Patterns & Reactions', text: '' } },
  { type: 'text' as const, data: { label: 'Inner Dialogue', text: '' } },
  { type: 'text' as const, data: { label: 'Memory or Origin', text: '' } },
  { type: 'text' as const, data: { label: 'Reframing / Compassion', text: '' } },
  { type: 'checklist' as const, data: { label: 'Release / Ritual / Action Step', items: [] } },
  { type: 'audio' as const, data: { label: 'Voice Reflection', url: '' } },
  { type: 'image' as const, data: { url: '', caption: 'Symbol, card, or image' } },
  { type: 'text' as const, data: { label: 'Closing Insight', text: '' } },
]

const BLOCKS_BY_TEMPLATE: Record<string, { type: string; data: object }[]> = {
  artwork:     ARTWORK_BLOCKS,
  ritual:      RITUAL_BLOCKS,
  recipe:      RECIPE_BLOCKS,
  box:         BOX_BLOCKS,
  plant:       PLANT_BLOCKS,
  maintenance: MAINTENANCE_BLOCKS,
  travel:      TRAVEL_BLOCKS,
  pet:         PET_BLOCKS,
  book:        BOOK_BLOCKS,
  goal:        GOAL_BLOCKS,
  journal:     JOURNAL_BLOCKS,
  diary:       DIARY_BLOCKS,
  shadow_work: SHADOW_BLOCKS,
  hub_collector: HUB_COLLECTOR_BLOCKS,
  garden:        GARDEN_BLOCKS,
  grocery:     GROCERY_BLOCKS,
  packing:     PACKING_BLOCKS,
  vehicle:     VEHICLE_BLOCKS,
  workout:     WORKOUT_BLOCKS,
}

const TAG_PLACEHOLDERS: Record<string, string> = {
  ritual:      'Type a tag and press Enter — e.g. sabbat, full moon',
  recipe:      'Type a tag and press Enter — e.g. dinner, vegetarian, quick',
  artwork:     'Type a tag and press Enter — e.g. oil-painting, portrait, 2024',
  box:         'Type a tag and press Enter — e.g. garage, tools, holiday-decor',
  plant:       'Type a tag and press Enter — e.g. succulent, indoor, kitchen',
  maintenance: 'Type a tag and press Enter — e.g. hvac, kitchen, annual',
  travel:      'Type a tag and press Enter — e.g. europe, family-trip, 2024',
  pet:         'Type a tag and press Enter — e.g. dog, rescue, senior',
  book:        'Type a tag and press Enter — e.g. fiction, recommended, 2024',
  goal:        'Type a tag and press Enter — e.g. fitness, learning, 2024',
  journal:     'Type a tag and press Enter — e.g. daily, gratitude, 2024',
  diary:       'Type a tag and press Enter — e.g. daily, memories, 2024',
  shadow_work: 'Type a tag and press Enter — e.g. shadow-work, inner-work, healing',
  hub_collector: 'Type a tag and press Enter — e.g. recipes, portfolio, family',
  garden:        'Type a tag and press Enter — e.g. vegetable, herb, spring',
  grocery:     'Type a tag and press Enter — e.g. weekly, family, meal-prep',
  packing:     'Type a tag and press Enter — e.g. vacation, weekend, family-trip',
  vehicle:     'Type a tag and press Enter — e.g. honda, 2020, sedan',
  workout:     'Type a tag and press Enter — e.g. strength, cardio, weekly',
}

type Props = {
  hub?: Hub
  userId: string
  username?: string
  initialCollectionId?: string
  initialTemplateId?: string
}

function slugify(val: string) {
  return val
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function HubForm({ hub, userId, username, initialCollectionId, initialTemplateId }: Props) {
  const { collections, setCollections, loading: collectionsLoading } = useCollections(userId)
  const [collectionId, setCollectionId] = useState<string | null>(hub?.collection_id ?? initialCollectionId ?? null)
  const [showNewCollection, setShowNewCollection] = useState(false)
  const [newCollectionTitle, setNewCollectionTitle] = useState('')
  const [creatingCollection, setCreatingCollection] = useState(false)
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const supabase = createClient()
  const isEditing = !!hub

  const preselected = !isEditing && initialTemplateId
    ? TEMPLATES.find(t => t.id === initialTemplateId) ?? null
    : null

  const [templateChosen, setTemplateChosen] = useState(isEditing || !!preselected)

  const [title, setTitle] = useState(hub?.title ?? preselected?.title ?? '')
  const [slug, setSlug] = useState(hub?.slug ?? (preselected ? slugify(preselected.title) : ''))
  const [mode, setMode] = useState<'landing' | 'redirect'>(
    (hub?.mode as 'landing' | 'redirect') ?? 'landing'
  )
  const [redirectUrl, setRedirectUrl] = useState(hub?.redirect_url ?? '')
  const [description, setDescription] = useState(hub?.description ?? preselected?.hubDescription ?? '')
  const [imageUrl, setImageUrl] = useState(hub?.image_url ?? '')
  const [themeColor, setThemeColor] = useState(hub?.theme_color ?? preselected?.themeColor ?? '#3B82F6')
  const [privacyMode, setPrivacyMode] = useState<'public' | 'unlisted' | 'private'>(
    hub?.privacy_mode ?? 'private'
  )
  const [tags, setTags] = useState<string[]>(hub?.tags ?? [])
  const [tagInput, setTagInput] = useState('')
  const [error, setError] = useState('')
  const [slugError, setSlugError] = useState('')
  const [createdHubId, setCreatedHubId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'content' | 'settings'>('content')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(hub?.template_id ?? preselected?.id ?? null)

  async function createCollection() {
    if (!newCollectionTitle.trim()) return
    setCreatingCollection(true)
    const { data, error } = await supabase
      .from('collections')
      .insert({ user_id: userId, title: newCollectionTitle.trim() })
      .select()
      .single()
    if (!error && data) {
      setCollections(prev => [data, ...prev])
      setCollectionId(data.id)
    }
    setNewCollectionTitle('')
    setShowNewCollection(false)
    setCreatingCollection(false)
  }

  function addTag(val: string) {
    const cleaned = val.trim().toLowerCase().replace(/^#/, '').replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    if (cleaned && !tags.includes(cleaned)) setTags(prev => [...prev, cleaned])
    setTagInput('')
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput) }
    else if (e.key === 'Backspace' && !tagInput && tags.length > 0) setTags(prev => prev.slice(0, -1))
  }

  function applyTemplate(t: Template) {
    setTitle(t.title)
    setSlug(slugify(t.title))
    setDescription(t.hubDescription)
    setThemeColor(t.themeColor)
    setSelectedTemplateId(t.id)
    setTemplateChosen(true)
  }

  if (!templateChosen) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-500 mb-4">Choose a starting point:</p>
        {TEMPLATES.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => applyTemplate(t)}
            className="w-full flex items-center gap-4 border border-gray-200 rounded-xl p-4 text-left hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            <span className="text-3xl">{t.emoji}</span>
            <div>
              <div className="font-medium text-gray-900 text-sm">{t.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{t.description}</div>
            </div>
          </button>
        ))}
      </div>
    )
  }

  function handleTitleChange(val: string) {
    setTitle(val)
    if (!isEditing) setSlug(slugify(val))
  }

  function handleSlugChange(val: string) {
    setSlug(slugify(val))
    setSlugError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSlugError('')

    if (!slug) {
      setSlugError('Slug is required')
      return
    }

    startTransition(async () => {
      if (isEditing) {
        const { error: hubError } = await supabase
          .from('hubs')
          .update({
            title,
            slug,
            mode,
            redirect_url: mode === 'redirect' ? redirectUrl : null,
            description: mode === 'landing' ? description || null : null,
            image_url: mode === 'landing' ? imageUrl || null : null,
            theme_color: themeColor,
            collection_id: collectionId || null,
            template_id: selectedTemplateId || null,
            privacy_mode: privacyMode,
            tags,
          })
          .eq('id', hub.id)

        if (hubError) {
          if (hubError.code === '23505') setSlugError('That slug is already taken')
          else setError(hubError.message)
          return
        }
      } else {
        const { data: newHub, error: hubError } = await supabase
          .from('hubs')
          .insert({
            user_id: userId,
            title,
            slug,
            mode,
            redirect_url: mode === 'redirect' ? redirectUrl : null,
            description: mode === 'landing' ? description || null : null,
            image_url: mode === 'landing' ? imageUrl || null : null,
            theme_color: themeColor,
            collection_id: collectionId || null,
            template_id: selectedTemplateId || null,
            privacy_mode: privacyMode,
            tags,
          })
          .select()
          .single()

        if (hubError) {
          if (hubError.code === '23505') setSlugError('That slug is already taken')
          else setError(hubError.message)
          return
        }

        const templateBlocks = selectedTemplateId ? (BLOCKS_BY_TEMPLATE[selectedTemplateId] ?? null) : null
        if (templateBlocks) {
          await Promise.all(
            templateBlocks.map((b, i) =>
              fetch(`/api/hub/${newHub.id}/content_blocks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: b.type, data: { ...b.data, _templateDefault: true }, sort_order: i }),
              })
            )
          )
        }

        setCreatedHubId(newHub.id)
        return
      }

      router.push('/dashboard')
      router.refresh()
    })
  }

  if (createdHubId) {
    return (
      <div className="space-y-6">
        {title && <h2 className="text-lg font-semibold text-gray-900">{title}</h2>}
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <p className="text-sm font-medium text-green-800">Hub created! Add content blocks below.</p>
        </div>
        <ContentBlocksEditor hubId={createdHubId} hubTitle={title} templateId={selectedTemplateId ?? undefined} />
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => window.open(`/h/${username}/${slug}`, '_blank')}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
          >
            View Hub
          </button>
          <button
            type="button"
            onClick={() => router.push(`/dashboard/hub/${createdHubId}/edit`)}
            className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Edit Settings
          </button>
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Collections
          </button>
        </div>
      </div>
    )
  }

  // ── Edit mode: Content / Settings tabs ──────────────────────────────────
  if (isEditing) {
    return (
      <div>
        <div className="flex border-b border-gray-200 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('content')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === 'content'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Content
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === 'settings'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Settings
          </button>
        </div>

        {activeTab === 'content' && (
          mode === 'landing' ? (
            <ContentBlocksEditor hubId={hub.id} hubTitle={hub.title} />
          ) : (
            <p className="text-sm text-gray-400 py-12 text-center">Content blocks are not available in redirect mode.</p>
          )
        )}

        {activeTab === 'settings' && (
          <>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Collection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Collection</label>
              <div className="flex gap-2">
                <select
                  value={collectionId ?? ''}
                  onChange={e => setCollectionId(e.target.value || null)}
                  title="Collection"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={collectionsLoading}
                >
                  <option value="">No Collection</option>
                  {collections.map((c: Collection) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNewCollection(v => !v)}
                  className="text-sm text-blue-600 border border-blue-200 rounded-lg px-3 py-2 hover:bg-blue-50 transition-colors whitespace-nowrap"
                >
                  + New
                </button>
              </div>
              {showNewCollection && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={newCollectionTitle}
                    onChange={e => setNewCollectionTitle(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); createCollection() } }}
                    placeholder="Collection name"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={createCollection}
                    disabled={creatingCollection || !newCollectionTitle.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
                  >
                    {creatingCollection ? '…' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowNewCollection(false); setNewCollectionTitle('') }}
                    className="text-sm text-gray-400 hover:text-gray-600 px-2"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Hub type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hub type <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <select
                value={selectedTemplateId ?? ''}
                onChange={e => setSelectedTemplateId(e.target.value || null)}
                title="Hub type"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No type / unlabeled</option>
                {TEMPLATES.filter(t => t.id !== 'blank').map(t => (
                  <option key={t.id} value={t.id}>{t.emoji} {t.label}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">Shows a template badge on your dashboard card. Does not add or remove content blocks.</p>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hub Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => handleTitleChange(e.target.value)}
                placeholder="e.g. Home Hub, Workshop, Office"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-400">
                Slug <span className="text-xs font-normal text-amber-500">⚠ changing this breaks printed QR codes</span>
              </label>
              <div className="flex items-center border border-gray-200 bg-gray-50 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                <span className="px-3 py-2.5 bg-gray-100 text-gray-400 text-sm border-r border-gray-200 select-none">
                  /h/{username ?? '…'}/
                </span>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={e => handleSlugChange(e.target.value)}
                  placeholder="our-home"
                  className="flex-1 px-3 py-2.5 text-sm focus:outline-none bg-transparent text-gray-400"
                />
              </div>
              {slugError && <p className="text-red-500 text-xs mt-1">{slugError}</p>}
            </div>

            {/* Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mode</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMode('landing')}
                  className={`border rounded-xl p-4 text-left transition-colors ${
                    mode === 'landing' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className={`font-medium text-sm ${mode === 'landing' ? 'text-blue-700' : 'text-gray-700'}`}>
                    Interactive Page
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">Text, images, audio, links, checklists, timelines, and more</div>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('redirect')}
                  className={`border rounded-xl p-4 text-left transition-colors ${
                    mode === 'redirect' ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className={`font-medium text-sm ${mode === 'redirect' ? 'text-amber-700' : 'text-gray-700'}`}>
                    Redirect Link
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">Send visitors to a URL</div>
                </button>
              </div>
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: 'public', label: 'Public', description: 'Anyone with the link' },
                  { value: 'unlisted', label: 'Unlisted', description: 'Not listed publicly' },
                  { value: 'private', label: 'Private', description: 'Only you can view' },
                ] as const).map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPrivacyMode(opt.value)}
                    className={`border rounded-xl p-3 text-left transition-colors ${
                      privacyMode === opt.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`font-medium text-xs ${privacyMode === opt.value ? 'text-blue-700' : 'text-gray-700'}`}>
                      {opt.label}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5 leading-tight">{opt.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-full">
                    #{tag}
                    <button type="button" onClick={() => setTags(prev => prev.filter(t => t !== tag))} className="text-gray-400 hover:text-gray-700 leading-none">×</button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={() => { if (tagInput.trim()) addTag(tagInput) }}
                placeholder="Type a tag and press Enter — e.g. seasonal, car, kitchen"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">Press Enter or comma to add. Used for filtering in your dashboard.</p>
            </div>

            {/* Redirect URL */}
            {mode === 'redirect' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destination URL</label>
                <input
                  type="url"
                  required
                  value={redirectUrl}
                  onChange={e => setRedirectUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Landing page extras */}
            {mode === 'landing' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="A short message shown on the public page"
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hub Image <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      title="Upload hub image"
                      onChange={async e => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setError('')
                          const url = await uploadPhoto(file, slug || 'temp', 0)
                          if (url) setImageUrl(url)
                          else setError('Image upload failed. Check console for details.')
                        }
                      }}
                      className="block w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-gray-200 file:text-sm file:text-gray-600 file:bg-white hover:file:bg-gray-50"
                    />
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={e => setImageUrl(e.target.value)}
                      placeholder="Or paste an image URL"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {imageUrl && (
                    <img src={imageUrl} alt="Hub image preview" className="mt-2 h-16 rounded-xl object-cover border" />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Theme color</label>
                  <div className="flex gap-2 flex-wrap">
                    {THEME_COLORS.map(c => (
                      <button
                        key={c.value}
                        type="button"
                        title={c.label}
                        onClick={() => setThemeColor(c.value)}
                        className={`w-8 h-8 rounded-full transition-all ${
                          themeColor === c.value
                            ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                            : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: c.value }}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
              >
                {isPending ? 'Saving…' : 'Save changes'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Danger zone</p>
            <DeleteHubForm hubId={hub.id} />
          </div>
          </>
        )}
      </div>
    )
  }

  // ── Create mode ─────────────────────────────────────────────────────────
  const tagPlaceholder = TAG_PLACEHOLDERS[selectedTemplateId ?? ''] ?? 'Type a tag and press Enter — e.g. seasonal, car, kitchen'
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Hub Title</label>
        <input
          type="text"
          required
          value={title}
          onChange={e => handleTitleChange(e.target.value)}
          placeholder="e.g. Home Hub, Workshop, Office"
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Slug */}
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700">Slug</label>
        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
          <span className="px-3 py-2.5 bg-gray-100 text-gray-400 text-sm border-r border-gray-200 select-none">
            /h/{username ?? '…'}/
          </span>
          <input
            type="text"
            required
            value={slug}
            onChange={e => handleSlugChange(e.target.value)}
            placeholder="our-home"
            className="flex-1 px-3 py-2.5 text-sm focus:outline-none bg-transparent text-gray-900"
          />
        </div>
        {slugError && <p className="text-red-500 text-xs mt-1">{slugError}</p>}
        {!slugError && (
          <p className="text-gray-400 text-xs mt-1">The permanent URL your QR code will always point to.</p>
        )}
      </div>

      {/* Collection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Collection <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <div className="flex gap-2">
          <select
            value={collectionId ?? ''}
            onChange={e => setCollectionId(e.target.value || null)}
            title="Collection"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={collectionsLoading}
          >
            <option value="">No Collection</option>
            {collections.map((c: Collection) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowNewCollection(v => !v)}
            className="text-sm text-blue-600 border border-blue-200 rounded-lg px-3 py-2 hover:bg-blue-50 transition-colors whitespace-nowrap"
          >
            + New
          </button>
        </div>
        {showNewCollection && (
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={newCollectionTitle}
              onChange={e => setNewCollectionTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); createCollection() } }}
              placeholder="Collection name"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              type="button"
              onClick={createCollection}
              disabled={creatingCollection || !newCollectionTitle.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
            >
              {creatingCollection ? '…' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => { setShowNewCollection(false); setNewCollectionTitle('') }}
              className="text-sm text-gray-400 hover:text-gray-600 px-2"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Mode */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Mode</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setMode('landing')}
            className={`border rounded-xl p-4 text-left transition-colors ${
              mode === 'landing' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className={`font-medium text-sm ${mode === 'landing' ? 'text-blue-700' : 'text-gray-700'}`}>
              Landing Page
            </div>
            <div className="text-xs text-gray-400 mt-0.5">Show a page with links</div>
          </button>
          <button
            type="button"
            onClick={() => setMode('redirect')}
            className={`border rounded-xl p-4 text-left transition-colors ${
              mode === 'redirect' ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className={`font-medium text-sm ${mode === 'redirect' ? 'text-amber-700' : 'text-gray-700'}`}>
              Redirect Link
            </div>
            <div className="text-xs text-gray-400 mt-0.5">Send visitors to a URL</div>
          </button>
        </div>
      </div>

      {/* Visibility */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
        <div className="grid grid-cols-3 gap-2">
          {([
            { value: 'public', label: 'Public', description: 'Anyone with the link' },
            { value: 'unlisted', label: 'Unlisted', description: 'Not listed publicly' },
            { value: 'private', label: 'Private', description: 'Only you can view' },
          ] as const).map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPrivacyMode(opt.value)}
              className={`border rounded-xl p-3 text-left transition-colors ${
                privacyMode === opt.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className={`font-medium text-xs ${privacyMode === opt.value ? 'text-blue-700' : 'text-gray-700'}`}>
                {opt.label}
              </div>
              <div className="text-xs text-gray-400 mt-0.5 leading-tight">{opt.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tags <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.map(tag => (
            <span key={tag} className="flex items-center gap-1 bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-full">
              #{tag}
              <button type="button" onClick={() => setTags(prev => prev.filter(t => t !== tag))} className="text-gray-400 hover:text-gray-700 leading-none">×</button>
            </span>
          ))}
        </div>
        <input
          type="text"
          value={tagInput}
          onChange={e => setTagInput(e.target.value)}
          onKeyDown={handleTagKeyDown}
          onBlur={() => { if (tagInput.trim()) addTag(tagInput) }}
          placeholder={tagPlaceholder}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-400 mt-1">Press Enter or comma to add. Used for filtering in your dashboard.</p>
      </div>

      {/* Redirect URL */}
      {mode === 'redirect' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Destination URL</label>
          <input
            type="url"
            required
            value={redirectUrl}
            onChange={e => setRedirectUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Landing page extras */}
      {mode === 'landing' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="A short message shown on the public page"
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hub Image <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <div className="space-y-2">
              <input
                type="file"
                accept="image/*"
                title="Upload hub image"
                onChange={async e => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setError('')
                    const url = await uploadPhoto(file, slug || 'temp', 0)
                    if (url) setImageUrl(url)
                    else setError('Image upload failed. Check console for details.')
                  }
                }}
                className="block w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-gray-200 file:text-sm file:text-gray-600 file:bg-white hover:file:bg-gray-50"
              />
              <input
                type="url"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                placeholder="Or paste an image URL"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {imageUrl && (
              <img src={imageUrl} alt="Hub image preview" className="mt-2 h-16 rounded-xl object-cover border" />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Theme color</label>
            <div className="flex gap-2 flex-wrap">
              {THEME_COLORS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  onClick={() => setThemeColor(c.value)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    themeColor === c.value
                      ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
        >
          {isPending ? 'Saving…' : 'Create Hub'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
