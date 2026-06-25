import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import AppHeader from '../../components/AppHeader';
import OfflineBanner from '../../components/OfflineBanner';
import { useIssueStore, Issue } from '../../store/useIssueStore';
import { useRouter } from 'expo-router';

const INDORE_CENTER = { lat: 22.7196, lng: 75.8577 };

function getStatusColor(status: Issue['status']) {
  switch (status) {
    case 'open': return '#3B82F6';
    case 'under_review': return '#F59E0B';
    case 'in_progress': return '#8B5CF6';
    case 'resolved': return '#10B981';
  }
}

function getCategoryEmoji(category: Issue['category']) {
  switch (category) {
    case 'Pothole': return '🕳️';
    case 'Water Logging': return '💧';
    case 'Garbage': return '🗑️';
    case 'Electricity': return '⚡';
    case 'Safety': return '🛡️';
    default: return '⚠️';
  }
}

export default function CitizenMapScreen() {
  const router = useRouter();
  const { issues } = useIssueStore();
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [selectedRadius, setSelectedRadius] = useState<number>(3);

  // Generate a beautiful, local, high-fidelity dark SVG vector map of Indore
  const vectorMapHtml = useMemo(() => {
    const width = 600;
    const height = 500;
    const centerLat = INDORE_CENTER.lat;
    const centerLng = INDORE_CENTER.lng;

    // Convert coordinates to pixels
    const project = (lat: number, lng: number) => {
      const scaleX = width * 18;
      const scaleY = height * 18;
      const x = width / 2 + (lng - centerLng) * scaleX;
      const y = height / 2 - (lat - centerLat) * scaleY;
      return { x: Math.round(x), y: Math.round(y) };
    };

    const userPos = project(centerLat, centerLng);

    // Render interactive issue markers inside SVG
    const markersSvg = issues.map((issue) => {
      const pos = project(issue.latitude, issue.longitude);
      const color = getStatusColor(issue.status);
      const emoji = getCategoryEmoji(issue.category);
      const escapedTitle = issue.title.replace(/'/g, "\\'").replace(/"/g, '\\"');
      const escapedDesc = issue.description.replace(/'/g, "\\'").replace(/"/g, '\\"').substring(0, 100);

      return `
        <g class="marker" onclick="selectIssue('${issue.id}', '${escapedTitle}', '${issue.category}', '${issue.status}', '${escapedDesc}', '${issue.wardName}', '${issue.city}')" style="cursor: pointer;">
          <!-- Pulse aura -->
          <circle cx="${pos.x}" cy="${pos.y}" r="22" fill="${color}" opacity="0.1" class="pulse-aura" />
          <!-- Border/background bubble -->
          <circle cx="${pos.x}" cy="${pos.y}" r="16" fill="#1E293B" stroke="${color}" stroke-width="2.5" />
          <!-- Emoji character -->
          <text x="${pos.x}" y="${pos.y + 5}" font-size="14" text-anchor="middle" style="user-select: none;">${emoji}</text>
        </g>
      `;
    }).join('\n');

    return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #FFFFFF; font-family: system-ui, sans-serif; }
    #map-container { width: 100%; height: 100%; position: relative; display: flex; align-items: center; justify-content: center; }
    svg { width: 100%; height: 100%; max-width: ${width}px; max-height: ${height}px; }
    
    /* Animations */
    @keyframes pulse {
      0% { r: 10px; opacity: 0.4; }
      50% { opacity: 0.15; }
      100% { r: 80px; opacity: 0; }
    }
    .pulse-ring {
      animation: pulse 3s infinite linear;
      transform-origin: center;
    }
    .pulse-aura {
      animation: hoverPulse 2s infinite ease-in-out;
    }
    @keyframes hoverPulse {
      0% { transform: scale(0.95); opacity: 0.08; }
      50% { transform: scale(1.05); opacity: 0.15; }
      100% { transform: scale(0.95); opacity: 0.08; }
    }
    .marker:hover circle {
      transform: scale(1.1);
      transition: transform 0.2s ease;
    }
    
    /* Popup styling */
    .popup {
      position: absolute;
      bottom: 20px;
      left: 20px;
      right: 20px;
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 12px;
      color: #1E293B;
      display: none;
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
    }
  </style>
</head>
<body>
  <div id="map-container">
    <svg viewBox="0 0 ${width} ${height}">
      <!-- GIS Grid Background lines -->
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E2E8F0" stroke-width="1" opacity="0.6"/>
        </pattern>
        <radialGradient id="user-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#38BDF8" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />

      <!-- Water Bodies (Khan River & Nehru Park Lake) -->
      <path d="M -50 150 Q 180 200, 300 280 T 650 350" fill="none" stroke="#0284C7" stroke-width="12" opacity="0.18" />
      <path d="M -50 150 Q 180 200, 300 280 T 650 350" fill="none" stroke="#38BDF8" stroke-width="4" opacity="0.3" />
      <ellipse cx="420" cy="180" rx="30" ry="15" fill="#0284C7" opacity="0.15" />

      <!-- Parks & Greenery -->
      <rect x="80" y="100" width="120" height="80" rx="12" fill="#10B981" opacity="0.12" />
      <circle cx="480" cy="350" r="50" fill="#10B981" opacity="0.1" />

      <!-- Major Arterial Roads -->
      <!-- MG Road -->
      <line x1="-50" y1="250" x2="650" y2="250" stroke="#CBD5E1" stroke-width="5" opacity="0.75" />
      <line x1="-50" y1="250" x2="650" y2="250" stroke="#94A3B8" stroke-width="1.5" opacity="0.85" />
      <!-- AB Road -->
      <line x1="300" y1="-50" x2="300" y2="550" stroke="#CBD5E1" stroke-width="5" opacity="0.75" />
      <line x1="300" y1="-50" x2="300" y2="550" stroke="#94A3B8" stroke-width="1.5" opacity="0.85" />

      <!-- Local Streets Grid -->
      <path d="M 120 0 L 120 500 M 200 0 L 200 500 M 400 0 L 400 500 M 480 0 L 480 500" fill="none" stroke="#F1F5F9" stroke-width="2" opacity="0.8" />
      <path d="M 0 120 L 600 120 M 0 380 L 600 380" fill="none" stroke="#F1F5F9" stroke-width="2" opacity="0.8" />

      <!-- Proximity Radius Circle -->
      <circle id="radius-circle" cx="${userPos.x}" cy="${userPos.y}" r="${selectedRadius * 65}" fill="#0284C7" fill-opacity="0.06" stroke="#0284C7" stroke-dasharray="6,4" stroke-width="1.5" />

      <!-- Pulse Radar Effect -->
      <circle cx="${userPos.x}" cy="${userPos.y}" r="${selectedRadius * 65}" fill="url(#user-glow)" />
      
      <!-- User Location Marker -->
      <g>
        <circle cx="${userPos.x}" cy="${userPos.y}" r="22" fill="#38BDF8" opacity="0.25" />
        <circle cx="${userPos.x}" cy="${userPos.y}" r="11" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1" />
        <circle cx="${userPos.x}" cy="${userPos.y}" r="8" fill="#38BDF8" />
      </g>

      <!-- Interactive Issue Markers -->
      ${markersSvg}
    </svg>
  </div>

  <script>
    function selectIssue(id, title, category, status, desc, ward, city) {
      window.parent.postMessage({
        type: 'issueSelect',
        id: id,
        title: title,
        category: category,
        status: status,
        description: desc,
        wardName: ward,
        city: city
      }, '*');
    }

    // Listen to radius change
    window.addEventListener('message', function(e) {
      if (e.data && e.data.type === 'updateRadius') {
        document.getElementById('radius-circle').setAttribute('r', e.data.radius * 65);
      }
    });
  </script>
</body>
</html>`;
  }, [issues, selectedRadius]);

  const handleRadiusChange = (r: number) => {
    setSelectedRadius(r);
    // Send postMessage to the iframe
    if (Platform.OS === 'web') {
      const iframe = document.querySelector('iframe');
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'updateRadius', radius: r }, '*');
      }
    }
  };

  // Listen for messages from the iframe
  React.useEffect(() => {
    if (Platform.OS !== 'web') return;
    
    const handler = (e: MessageEvent) => {
      if (e.data && e.data.type === 'issueSelect') {
        const issue = issues.find(i => i.id === e.data.id);
        if (issue) setSelectedIssue(issue);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [issues]);

  return (
    <ScreenWrapper>
      <AppHeader />
      <OfflineBanner />

      <View style={styles.container}>
        {/* Vector SVG Map (Offline-First / Zero Network Dependency) */}
        {Platform.OS === 'web' ? (
          <View style={{ flex: 1, width: '100%', height: '100%', minHeight: 500, position: 'relative' }}>
            <iframe
              srcDoc={vectorMapHtml}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 'none',
              } as any}
              title="LocalPulse Map"
            />
          </View>
        ) : (
          <View style={styles.fallbackMap}>
            <Text style={styles.fallbackText}>Map is available on web only</Text>
          </View>
        )}

        {/* Floating Radius Controls */}
        <View style={styles.mapControls}>
          <Text style={styles.controlLabel}>Radius Limit</Text>
          <View style={styles.radiusSelector}>
            {[1, 3, 5].map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => handleRadiusChange(r)}
                style={[styles.radiusBtn, selectedRadius === r && styles.radiusBtnActive]}
              >
                <Text style={[styles.radiusBtnText, selectedRadius === r && styles.radiusBtnTextActive]}>
                  {r}km
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Floating Legend */}
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
            <Text style={styles.legendText}>Open</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.legendText}>Under Review</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#8B5CF6' }]} />
            <Text style={styles.legendText}>In Progress</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.legendText}>Resolved</Text>
          </View>
        </View>

        {/* Selected Issue Drawer */}
        {selectedIssue && (
          <View style={styles.drawerContainer}>
            <View style={styles.drawerHeader}>
              <View style={styles.drawerBadgeContainer}>
                <Text style={styles.drawerCategory}>{selectedIssue.category}</Text>
                <View style={[styles.drawerStatusBadge, { backgroundColor: getStatusColor(selectedIssue.status) + '1A' }]}>
                  <Text style={[styles.drawerStatusText, { color: getStatusColor(selectedIssue.status) }]}>
                    {selectedIssue.status.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setSelectedIssue(null)} style={styles.closeBtn}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              activeOpacity={0.9}
              onPress={() => router.push(`/issue/${selectedIssue.id}`)}
              style={styles.drawerView}
            >
              <Text style={styles.drawerTitle}>{selectedIssue.title}</Text>
              <Text style={styles.drawerDescription} numberOfLines={2}>
                {selectedIssue.description}
              </Text>
              <Text style={styles.drawerLocation}>📍 {selectedIssue.wardName}, {selectedIssue.city}</Text>
              
              <View style={styles.drawerFooter}>
                <Text style={styles.drawerActionText}>View full stepper timeline ➔</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  fallbackMap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0F1D',
  },
  fallbackText: {
    color: '#64748B',
    fontSize: 14,
  },
  mapControls: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#1E293BDD',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    // @ts-ignore
    backdropFilter: 'blur(12px)',
  },
  controlLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
    textAlign: 'center',
  },
  radiusSelector: {
    flexDirection: 'row',
    gap: 4,
  },
  radiusBtn: {
    backgroundColor: '#0F172A',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  radiusBtnActive: {
    backgroundColor: '#0284C7',
  },
  radiusBtnText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  radiusBtnTextActive: {
    color: '#FFFFFF',
  },
  legendContainer: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    backgroundColor: '#1E293BDD',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#33415560',
    gap: 6,
    // @ts-ignore
    backdropFilter: 'blur(12px)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: '#E2E8F0',
    fontSize: 10,
    fontWeight: '600',
  },
  drawerContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#1E293BEE',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    elevation: 10,
    // @ts-ignore
    backdropFilter: 'blur(16px)',
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  drawerBadgeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  drawerCategory: {
    backgroundColor: '#334155',
    color: '#F1F5F9',
    fontSize: 9,
    fontWeight: '700',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  drawerStatusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  drawerStatusText: {
    fontSize: 9,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  closeText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: 'bold',
  },
  drawerView: {
    gap: 4,
  },
  drawerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  drawerDescription: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
  },
  drawerLocation: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 4,
  },
  drawerFooter: {
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 8,
    marginTop: 8,
  },
  drawerActionText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
});
