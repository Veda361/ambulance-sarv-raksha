import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Ambulance, Mission, Hospital } from '../../types';

interface HospitalMapProps {
  ambulances: Ambulance[];
  activeMissions?: Mission[];
  hospital?: Hospital | null;
  selectedAmbulanceId?: string | null;
  onSelectAmbulance?: (ambulanceId: string) => void;
  height?: string;
}

export const HospitalMap: React.FC<HospitalMapProps> = ({
  ambulances,
  activeMissions = [],
  hospital,
  selectedAmbulanceId,
  onSelectAmbulance,
  height = '420px',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Default coordinates: Jhansi center or Hospital coordinates
      const defaultLat = hospital?.latitude || 25.4484;
      const defaultLon = hospital?.longitude || 78.5685;

      const map = L.map(mapContainerRef.current, {
        center: [defaultLat, defaultLon],
        zoom: 13,
        zoomControl: true,
      });

      // Dark theme OpenStreetMap tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        maxZoom: 19,
      }).addTo(map);

      markersGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when ambulances or hospital changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = markersGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    // 1. Hospital Marker
    if (hospital && hospital.latitude && hospital.longitude) {
      const hospitalIcon = L.divIcon({
        className: 'custom-map-icon',
        html: `
          <div style="
            background-color: #0284c7;
            border: 2px solid #ffffff;
            color: white;
            border-radius: 8px;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.5);
          ">
            🏥
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      L.marker([hospital.latitude, hospital.longitude], { icon: hospitalIcon })
        .bindPopup(`
          <div style="color: #0f172a; font-family: sans-serif; font-size: 13px;">
            <strong style="font-size: 14px;">${hospital.name}</strong><br/>
            <span>Status: <strong>${hospital.diversion_status}</strong></span><br/>
            <span>Level: ${hospital.trauma_level}</span>
          </div>
        `)
        .addTo(group);
    }

    // 2. Ambulance Markers
    ambulances.forEach((amb) => {
      if (!amb.current_latitude || !amb.current_longitude) return;

      const isSelected = selectedAmbulanceId === amb.id;
      const freshness = amb.location_freshness || 'LIVE';

      let borderColor = '#10b981'; // LIVE
      if (freshness === 'RECENT') borderColor = '#0284c7';
      else if (freshness === 'STALE') borderColor = '#f97316';
      else if (freshness === 'OFFLINE') borderColor = '#ef4444';

      const ambIcon = L.divIcon({
        className: 'custom-map-icon',
        html: `
          <div style="
            background-color: #1e293b;
            border: 3px solid ${borderColor};
            color: white;
            border-radius: 50%;
            width: ${isSelected ? '38px' : '32px'};
            height: ${isSelected ? '38px' : '32px'};
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: ${isSelected ? '16px' : '14px'};
            box-shadow: 0 4px 10px rgba(0,0,0,0.6);
            cursor: pointer;
            transition: transform 0.2s ease;
          ">
            🚑
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([amb.current_latitude, amb.current_longitude], { icon: ambIcon });
      marker.bindPopup(`
        <div style="color: #0f172a; font-family: sans-serif; font-size: 13px;">
          <strong style="font-size: 14px; color: #0284c7;">${amb.call_sign}</strong> (${amb.capability})<br/>
          <span>Status: <strong>${amb.status}</strong></span><br/>
          <span>GPS: <strong style="color: ${borderColor}">${freshness}</strong></span><br/>
          ${amb.current_driver_name ? `<span>Driver: ${amb.current_driver_name}</span><br/>` : ''}
          ${amb.active_mission_code ? `<span>Active: <strong>${amb.active_mission_code}</strong></span>` : ''}
        </div>
      `);

      marker.on('click', () => {
        if (onSelectAmbulance) onSelectAmbulance(amb.id);
      });

      marker.addTo(group);
    });

    // 3. Active Mission Pickup & Destination lines
    activeMissions.forEach((mission) => {
      if (
        mission.pickup_latitude &&
        mission.pickup_longitude &&
        hospital?.latitude &&
        hospital?.longitude
      ) {
        // Pickup Pin
        const pickupIcon = L.divIcon({
          className: 'custom-map-icon',
          html: `
            <div style="
              background-color: #ef4444;
              border: 2px solid white;
              color: white;
              border-radius: 50%;
              width: 24px;
              height: 24px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
              box-shadow: 0 2px 5px rgba(0,0,0,0.4);
            ">
              📍
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        L.marker([mission.pickup_latitude, mission.pickup_longitude], { icon: pickupIcon })
          .bindPopup(`
            <div style="color: #0f172a; font-family: sans-serif; font-size: 13px;">
              <strong>Pickup Location</strong><br/>
              <span>${mission.pickup_address}</span><br/>
              <span>Acuity: <strong>${mission.triage_acuity}</strong></span>
            </div>
          `)
          .addTo(group);

        // Simple dashed route representation
        L.polyline(
          [
            [mission.pickup_latitude, mission.pickup_longitude],
            [hospital.latitude, hospital.longitude],
          ],
          {
            color: '#38bdf8',
            weight: 3,
            opacity: 0.7,
            dashArray: '6, 8',
          }
        ).addTo(group);
      }
    });
  }, [ambulances, activeMissions, hospital, selectedAmbulanceId, onSelectAmbulance]);

  return (
    <div
      ref={mapContainerRef}
      style={{
        width: '100%',
        height,
        borderRadius: '10px',
        overflow: 'hidden',
        border: '1px solid #1f293d',
      }}
    />
  );
};
