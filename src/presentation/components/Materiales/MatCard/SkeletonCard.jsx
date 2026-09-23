// src/presentation/components/Materiales/MatCard/SkeletonCard.jsx
// Sprint 18 — Refactorización modular

import React from 'react';
import './MatCard.css';

export default function SkeletonCard() {
  return (
    <div className="mat-card mat-card--skeleton" aria-hidden="true">
      <div className="skel skel--header" />
      <div className="skel skel--icon"   />
      <div className="skel skel--title"  />
      <div className="skel skel--colors" />
      <div className="skel skel--fields" />
      <div className="skel skel--btn"    />
    </div>
  );
}