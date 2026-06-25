import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useIssueStore, Issue } from '../../store/useIssueStore';

const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  Indore: { lat: 22.7196, lng: 75.8577 },
  Patna: { lat: 25.5940, lng: 85.1560 },
  Jaipur: { lat: 26.9215, lng: 75.8242 },
  Lucknow: { lat: 26.8510, lng: 80.9425 },
  Nagpur: { lat: 21.1458, lng: 79.0882 },
  Kolkata: { lat: 22.5726, lng: 88.3639 },
};

function getPriorityColor(priority: Issue['priority']) {
  switch (priority) {
    case 'critical': return '#EF4444';
    case 'high': return '#F97316';
    case 'medium': return '#F59E0B';
    case 'low': return '#3B82F6';
  }
}

export default function AdminHeatmapScreen() {
  const [selectedCity, setSelectedCity] = useState('Indore');
  const { issues } = useIssueStore();
  const cities = ['Indore', 'Patna', 'Jaipur', 'Lucknow', 'Nagpur', 'Kolkata'];

  // Filter issues for the selected city
  const cityIssues = useMemo(() => {
    return issues.filter((issue) => issue.city.toLowerCase() === selectedCity.toLowerCase());
  }, [issues, selectedCity]);

  // Generate a beautiful dark SVG heatmap grid with zero network dependencies
  const vectorHeatmapHtml = useMemo(() => {
    const width = 600;
    const height = 500;
    const coords = CITY_COORDINATES[selectedCity] || CITY_COORDINATES.Indore;

    // Convert coordinates to pixels centered on city location
    const project = (lat: number, lng: number) => {
      const scaleX = width * 18;
      const scaleY = height * 18;
      const x = width / 2 + (lng - coords.lng) * scaleX;
      const y = height / 2 - (lat - coords.lat) * scaleY;
      return { x: Math.round(x), y: Math.round(y) };
    };

    // Generate dynamic road variation based on city name seed
    const seed = selectedCity.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const riverY = 150 + (seed % 100);
    const parkX = 100 + (seed % 150);
    const parkY = 80 + (seed % 120);

    // Render interactive heat spot markers inside SVG
    const markersSvg = cityIssues.map((issue) => {
      const pos = project(issue.latitude, issue.longitude);
      const color = getPriorityColor(issue.priority);
      const size = issue.priority === 'critical' ? 45 : issue.priority === 'high' ? 35 : 25;
      const escapedTitle = issue.title.replace(/'/g, "\\'").replace(/"/g, '\\"');
      const escapedDesc = issue.description.replace(/'/g, "\\'").replace(/"/g, '\\"').substring(0, 80);

      return `
        <g class="heat-point" onclick="showPopup('${escapedTitle}', '${issue.priority}', '${escapedDesc}', '${issue.wardName}')" style="cursor: pointer;">
          <!-- Heat glow outer -->
          <circle cx="${pos.x}" cy="${pos.y}" r="${size * 1.5}" fill="${color}" opacity="0.12" class="pulse-aura" />
          <!-- Heat glow mid -->
          <circle cx="${pos.x}" cy="${pos.y}" r="${size}" fill="${color}" opacity="0.22" />
          <!-- Core point -->
          <circle cx="${pos.x}" cy="${pos.y}" r="8" fill="${color}" stroke="#FFFFFF" stroke-width="1.5" />
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
    .pulse-aura {
      animation: auraPulse 2.5s infinite ease-in-out;
      transform-origin: center;
    }
    @keyframes auraPulse {
      0% { transform: scale(0.92); opacity: 0.08; }
      50% { transform: scale(1.08); opacity: 0.18; }
      100% { transform: scale(0.92); opacity: 0.08; }
    }
    
    /* Info Card Popup overlay */
    #info-card {
      position: absolute;
      top: 16px;
      left: 16px;
      right: 16px;
      background: rgba(255, 255, 255, 0.95);
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 12px;
      color: #1E293B;
      display: none;
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
      backdrop-filter: blur(8px);
      z-index: 100;
    }
    #info-card h4 { font-size: 14px; margin-bottom: 4px; font-weight: 700; color: #1E293B; }
    #info-card p { font-size: 11px; color: #64748B; margin-bottom: 6px; line-height: 1.4; }
    #info-card .badge { display: inline-block; font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; }
  </style>
</head>
<body>
  <div id="map-container">
    <div id="info-card">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2px;">
        <h4 id="card-title">Issue Title</h4>
        <span id="card-badge" class="badge">CRITICAL</span>
      </div>
      <p id="card-desc">Description of issue...</p>
      <span id="card-ward" style="font-size: 10px; color: #64748B; font-weight: 600;">📍 Ward Name</span>
    </div>

    <svg viewBox="0 0 ${width} ${height}">
      <!-- GIS Grid Background -->
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E2E8F0" stroke-width="1" opacity="0.6"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />

      <!-- Water Bodies (Dynamic river shape based on city) -->
      <path d="M -50 ${riverY} Q 180 ${riverY + 50}, 300 ${riverY - 20} T 650 ${riverY + 30}" fill="none" stroke="#1D4ED8" stroke-width="16" opacity="0.12" />
      <path d="M -50 ${riverY} Q 180 ${riverY + 50}, 300 ${riverY - 20} T 650 ${riverY + 30}" fill="none" stroke="#3B82F6" stroke-width="6" opacity="0.18" />

      <!-- Parks & Green Zones -->
      <rect x="${parkX}" y="${parkY}" width="110" height="70" rx="10" fill="#10B981" opacity="0.1" />

      <!-- City Streets Grid -->
      <line x1="-50" y1="200" x2="650" y2="200" stroke="#CBD5E1" stroke-width="4.5" opacity="0.75" />
      <line x1="300" y1="-50" x2="300" y2="550" stroke="#CBD5E1" stroke-width="4.5" opacity="0.75" />
      
      <path d="M 150 0 L 150 500 M 450 0 L 450 500" fill="none" stroke="#F1F5F9" stroke-width="1.5" opacity="0.8" />
      <path d="M 0 100 L 600 100 M 0 350 L 600 350" fill="none" stroke="#F1F5F9" stroke-width="1.5" opacity="0.8" />

      <!-- Dynamic Heat Spots -->
      ${markersSvg.length > 0 ? markersSvg : `<text x="300" y="240" fill="#94A3B8" font-size="13" text-anchor="middle" font-weight="600">No active heat spots reported in ${selectedCity}</text>`}
    </svg>
  </div>

  <script>
    var timeoutId;
    function showPopup(title, priority, desc, ward) {
      clearTimeout(timeoutId);
      var card = document.getElementById('info-card');
      document.getElementById('card-title').innerText = title;
      document.getElementById('card-desc').innerText = desc;
      document.getElementById('card-ward').innerText = "📍 " + ward;
      
      var badge = document.getElementById('card-badge');
      badge.innerText = priority;
      
      var badgeColor = '#EF4444';
      if (priority === 'high') badgeColor = '#F97316';
      else if (priority === 'medium') badgeColor = '#F59E0B';
      else if (priority === 'low') badgeColor = '#3B82F6';
      
      badge.style.backgroundColor = badgeColor + '20';
      badge.style.color = badgeColor;
      badge.style.border = '1px solid ' + badgeColor;
      
      card.style.display = 'block';
      
      // Auto-hide popup card after 5 seconds
      timeoutId = setTimeout(function() {
        card.style.display = 'none';
      }, 5000);
    }
  </script>
</body>
</html>`;
  }, [cityIssues, selectedCity]);

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <Text style={styles.title}>Civic Spatial Heatmap</Text>
        <Text style={styles.subtitle}>Real-time density analysis of reported complaints</Text>
      </View>

      <View style={styles.container}>
        {/* City Selector */}
        <View style={styles.cityRow}>
          {cities.map((city) => (
            <TouchableOpacity
              key={city}
              onPress={() => setSelectedCity(city)}
              style={[styles.cityTab, selectedCity === city && styles.cityTabActive]}
            >
              <Text style={[styles.cityTabText, selectedCity === city && styles.cityTabTextActive]}>
                {city}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Heatmap Canvas */}
        <View style={styles.mapCanvas}>
          {Platform.OS === 'web' ? (
            <View style={{ flex: 1, width: '100%', height: '100%', minHeight: 500, position: 'relative' }}>
              <iframe
                srcDoc={vectorHeatmapHtml}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none',
                } as any}
                title="Civic Spatial Heatmap"
              />
            </View>
          ) : (
            <View style={styles.fallbackMap}>
              <Text style={styles.fallbackText}>Heatmap is available on web only</Text>
            </View>
          )}

          {/* Density Indicators overlay */}
          <View style={styles.intensityCard}>
            <Text style={styles.intensityTitle}>Hotspot Classification</Text>
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                <Text style={styles.legendText}>Critical priority issues</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#F97316' }]} />
                <Text style={styles.legendText}>High priority issues</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.legendText}>Medium priority issues</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
                <Text style={styles.legendText}>Low priority issues</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  title: {
    color: '#1E293B',
    fontSize: 22,
    fontWeight: '900',
  },
  subtitle: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  cityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  cityTab: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cityTabActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  cityTabText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  cityTabTextActive: {
    color: '#FFFFFF',
  },
  mapCanvas: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
    overflow: 'hidden',
  },
  fallbackMap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  fallbackText: {
    color: '#64748B',
    fontSize: 14,
  },
  intensityCard: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFFD0',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    // @ts-ignore
    backdropFilter: 'blur(12px)',
  },
  intensityTitle: {
    color: '#1E293B',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6,
  },
  legend: {
    gap: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: '#64748B',
    fontSize: 11,
  },
});
