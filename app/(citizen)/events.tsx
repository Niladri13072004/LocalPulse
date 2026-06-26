import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import AppHeader from '../../components/AppHeader';
import OfflineBanner from '../../components/OfflineBanner';

interface EventItem {
  id: string;
  title: string;
  description: string;
  category: string;
  date: string;
  time: string;
  location: string;
  attendees: number;
  isOfficial: boolean;
  image: string;
}

const mockEvents: EventItem[] = [
  {
    id: 'ev-1',
    title: 'Rajwada Ward Cleanup Drive',
    description: 'Join local residents this Sunday morning to clean up Rajwada park and sort plastic waste. Trash bags and refreshments will be provided.',
    category: 'Clean-up Drive',
    date: 'Jun 28, 2026',
    time: '07:30 AM - 10:30 AM',
    location: 'Rajwada Central Garden, Indore',
    attendees: 38,
    isOfficial: false,
    image: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?q=80&w=600',
  },
  {
    id: 'ev-2',
    title: 'Monsoon Preparedness Townhall Meeting',
    description: 'Official ward officer meeting discussing storm water drain improvements, emergency waterlogging contacts, and power line checks before monsoon arrival.',
    category: 'Ward Meeting',
    date: 'Jul 02, 2026',
    time: '05:30 PM - 07:30 PM',
    location: 'Ward Community Hall, Kankarbagh, Patna',
    attendees: 75,
    isOfficial: true,
    image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=600',
  }
];

export default function CitizenEventsScreen() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [joinedEvents, setJoinedEvents] = useState<string[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/events');
        if (res.ok) {
          const data = await res.json();
          setEvents(data);
        } else {
          setEvents(mockEvents);
        }
      } catch (err) {
        console.error('Failed to fetch events from backend:', err);
        setEvents(mockEvents);
      }
    };
    fetchEvents();
  }, []);

  const toggleJoinEvent = (id: string) => {
    if (joinedEvents.includes(id)) {
      setJoinedEvents(joinedEvents.filter((eId) => eId !== id));
    } else {
      setJoinedEvents([...joinedEvents, id]);
    }
  };

  return (
    <ScreenWrapper>
      <AppHeader />
      <OfflineBanner />

      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isRSVP = joinedEvents.includes(item.id);
          return (
            <View style={styles.eventCard}>
              <Image source={{ uri: item.image }} style={styles.eventImage} />
              
              <View style={styles.eventBody}>
                <View style={styles.headerRow}>
                  <Text style={styles.eventCategory}>{item.category.toUpperCase()}</Text>
                  {item.isOfficial && (
                    <View style={styles.officialBadge}>
                      <Text style={styles.officialText}>OFFICIAL</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.eventTitle}>{item.title}</Text>
                <Text style={styles.eventDesc}>{item.description}</Text>

                <View style={styles.detailsBox}>
                  <Text style={styles.detailText}>📅 {item.date} | ⏰ {item.time}</Text>
                  <Text style={styles.detailText}>📍 {item.location}</Text>
                  <Text style={styles.detailText}>👥 {item.attendees + (isRSVP ? 1 : 0)} attending</Text>
                </View>

                <TouchableOpacity
                  onPress={() => toggleJoinEvent(item.id)}
                  style={[styles.rsvpBtn, isRSVP && styles.rsvpBtnActive]}
                >
                  <Text style={[styles.rsvpBtnText, isRSVP && styles.rsvpBtnTextActive]}>
                    {isRSVP ? 'Going ✓' : 'RSVP / Join Event'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.titleSection}>
            <Text style={styles.pageTitle}>Community Events</Text>
            <Text style={styles.pageSubtitle}>Collaborate and learn with neighbors</Text>
          </View>
        }
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  titleSection: {
    marginBottom: 20,
  },
  pageTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  pageSubtitle: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 4,
  },
  eventCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
    overflow: 'hidden',
  },
  eventImage: {
    width: '100%',
    height: 140,
  },
  eventBody: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventCategory: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  officialBadge: {
    backgroundColor: '#10B98120',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  officialText: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: '800',
  },
  eventTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  eventDesc: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  detailsBox: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 10,
    gap: 4,
    marginBottom: 16,
  },
  detailText: {
    color: '#E2E8F0',
    fontSize: 12,
  },
  rsvpBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  rsvpBtnActive: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  rsvpBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  rsvpBtnTextActive: {
    color: '#94A3B8',
  },
});
