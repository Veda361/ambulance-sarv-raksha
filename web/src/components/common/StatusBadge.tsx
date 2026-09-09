import React from 'react';

interface StatusBadgeProps {
  type: 'status' | 'state' | 'acuity' | 'freshness' | 'severity';
  value: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, value }) => {
  let badgeClass = 'badge-info';
  let label = value.replace(/_/g, ' ');

  if (type === 'acuity') {
    if (value === 'RED_CRITICAL') {
      badgeClass = 'badge-critical';
      label = 'CRITICAL (RED)';
    } else if (value === 'YELLOW_URGENT') {
      badgeClass = 'badge-urgent';
      label = 'URGENT (YELLOW)';
    } else if (value === 'GREEN_NON_URGENT') {
      badgeClass = 'badge-available';
      label = 'NON-URGENT (GREEN)';
    } else {
      badgeClass = 'badge-maintenance';
      label = 'EXPECTANT';
    }
  } else if (type === 'severity') {
    if (value === 'CRITICAL') badgeClass = 'badge-critical';
    else if (value === 'HIGH') badgeClass = 'badge-urgent';
    else if (value === 'MEDIUM') badgeClass = 'badge-info';
    else badgeClass = 'badge-available';
  } else if (type === 'freshness') {
    if (value === 'LIVE') {
      badgeClass = 'badge-available';
      label = '● LIVE GPS';
    } else if (value === 'RECENT') {
      badgeClass = 'badge-info';
      label = 'RECENT (<2M)';
    } else if (value === 'STALE') {
      badgeClass = 'badge-urgent';
      label = 'STALE (>5M)';
    } else {
      badgeClass = 'badge-critical';
      label = 'OFFLINE';
    }
  } else if (type === 'status') {
    if (value === 'AVAILABLE') badgeClass = 'badge-available';
    else if (['ASSIGNED', 'EN_ROUTE', 'ON_SCENE', 'TRANSPORTING'].includes(value)) badgeClass = 'badge-urgent';
    else if (value === 'AT_HOSPITAL') badgeClass = 'badge-info';
    else badgeClass = 'badge-maintenance';
  } else if (type === 'state') {
    if (['COMPLETED'].includes(value)) badgeClass = 'badge-available';
    else if (['CANCELLED', 'REJECTED'].includes(value)) badgeClass = 'badge-critical';
    else if (['PATIENT_ONBOARD', 'EN_ROUTE_TO_HOSPITAL'].includes(value)) badgeClass = 'badge-urgent';
    else badgeClass = 'badge-info';
  }

  return (
    <span className={`badge ${badgeClass}`} role="status">
      <span className="badge-dot" aria-hidden="true" />
      {label}
    </span>
  );
};
