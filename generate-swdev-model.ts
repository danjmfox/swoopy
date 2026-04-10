import { makeNodeId, makeEdgeId, makeAnnotationId } from "@swoopy/engine";

/**
 * Generate the Software Development Dynamics model for Swoopy
 *
 * This model captures the classic tension in software teams:
 * - Quick fix path: pressure → cheap hiring → defects → quality crashes
 * - Sustainable path: quality code → attract mentors → improve → velocity grows
 */

export function generateSoftwareDeveloperModel() {
  const nodes = [
    // Primary goal/driver
    {
      id: makeNodeId("n-pressure"),
      label: "Pressure to Deliver",
      x: 100,
      y: 200,
      radius: 40,
      min: 0,
      max: 100,
      initial: 20,
      sizeTier: "M" as const,
      colourTier: "red" as const,
    },
    // Velocity outcomes
    {
      id: makeNodeId("n-velocity"),
      label: "Feature Velocity",
      x: 400,
      y: 200,
      radius: 40,
      min: 0,
      max: 100,
      initial: 50,
      sizeTier: "M" as const,
      colourTier: "yellow" as const,
    },
    // Defect accumulation
    {
      id: makeNodeId("n-defects"),
      label: "Defects in Code",
      x: 700,
      y: 200,
      radius: 40,
      min: 0,
      max: 100,
      initial: 10,
      sizeTier: "M" as const,
      colourTier: "orange" as const,
    },
    // Quality outcome
    {
      id: makeNodeId("n-quality"),
      label: "Code & Design Quality",
      x: 550,
      y: 450,
      radius: 40,
      min: 0,
      max: 100,
      initial: 70,
      sizeTier: "M" as const,
      colourTier: "green" as const,
      annotation: "Inverse of defects; decays with defect pressure",
    },
    // Quick fix path: hiring
    {
      id: makeNodeId("n-cheap-hiring"),
      label: "Cheap Hiring Rate",
      x: 250,
      y: 500,
      radius: 40,
      min: 0,
      max: 100,
      initial: 0,
      sizeTier: "M" as const,
      colourTier: "red" as const,
      annotation: "Quick fix: hire fast, pay less",
    },
    // Low-skill developer fraction
    {
      id: makeNodeId("n-low-skill"),
      label: "Low-skill Developers",
      x: 100,
      y: 650,
      radius: 40,
      min: 0,
      max: 100,
      initial: 20,
      sizeTier: "M" as const,
      colourTier: "orange" as const,
      annotation: "Fraction of team with <6mo experience",
    },
    // Great programmers (mentors/leads)
    {
      id: makeNodeId("n-great-devs"),
      label: "Great Programmers (Mentors)",
      x: 700,
      y: 500,
      radius: 40,
      min: 0,
      max: 100,
      initial: 40,
      sizeTier: "M" as const,
      colourTier: "blue" as const,
      annotation: "Senior devs who can mentor and maintain quality",
    },
    // Ability to improve (mentoring effectiveness)
    {
      id: makeNodeId("n-mentoring"),
      label: "Ability to Improve via Mentoring",
      x: 850,
      y: 650,
      radius: 40,
      min: 0,
      max: 100,
      initial: 60,
      sizeTier: "M" as const,
      colourTier: "teal" as const,
      annotation: "Capacity to grow junior devs into great ones",
    },
  ];

  const edges = [
    // Pressure drives quick-fix hiring (high weight - immediate response)
    {
      kind: "causal" as const,
      id: makeEdgeId("e-pressure-cheap"),
      from: makeNodeId("n-pressure"),
      to: makeNodeId("n-cheap-hiring"),
      polarity: 1 as const,
      weight: 3,
      delay: "none" as const,
      transferFn: "linear" as const,
    },
    // Pressure drives velocity directly (quick fix illusion)
    {
      kind: "causal" as const,
      id: makeEdgeId("e-pressure-vel"),
      from: makeNodeId("n-pressure"),
      to: makeNodeId("n-velocity"),
      polarity: 1 as const,
      weight: 2,
      delay: "none" as const,
      transferFn: "linear" as const,
    },
    // Cheap hiring creates low-skill developers
    {
      kind: "causal" as const,
      id: makeEdgeId("e-cheap-lowskill"),
      from: makeNodeId("n-cheap-hiring"),
      to: makeNodeId("n-low-skill"),
      polarity: 1 as const,
      weight: 2,
      delay: "short" as const,
      transferFn: "linear" as const,
    },
    // High velocity → more defects (speed creates bugs)
    {
      kind: "causal" as const,
      id: makeEdgeId("e-vel-defects"),
      from: makeNodeId("n-velocity"),
      to: makeNodeId("n-defects"),
      polarity: 1 as const,
      weight: 2.5,
      delay: "short" as const,
      transferFn: "linear" as const,
    },
    // Defects degrade quality (delayed, so initial illusion of success)
    {
      kind: "causal" as const,
      id: makeEdgeId("e-defects-quality"),
      from: makeNodeId("n-defects"),
      to: makeNodeId("n-quality"),
      polarity: -1 as const,
      weight: 2,
      delay: "medium" as const,
      transferFn: "linear" as const,
    },
    // Quality supports velocity (slow build)
    {
      kind: "causal" as const,
      id: makeEdgeId("e-quality-vel"),
      from: makeNodeId("n-quality"),
      to: makeNodeId("n-velocity"),
      polarity: 1 as const,
      weight: 1.5,
      delay: "none" as const,
      transferFn: "linear" as const,
    },
    // Low-skill devs degrade quality (direct impact)
    {
      kind: "causal" as const,
      id: makeEdgeId("e-lowskill-quality"),
      from: makeNodeId("n-low-skill"),
      to: makeNodeId("n-quality"),
      polarity: -1 as const,
      weight: 2,
      delay: "none" as const,
      transferFn: "linear" as const,
    },
    // Low-skill devs reduce mentoring capacity
    {
      kind: "causal" as const,
      id: makeEdgeId("e-lowskill-mentor"),
      from: makeNodeId("n-low-skill"),
      to: makeNodeId("n-mentoring"),
      polarity: -1 as const,
      weight: 2,
      delay: "short" as const,
      transferFn: "linear" as const,
    },
    // Great devs support quality (they write good code)
    {
      kind: "causal" as const,
      id: makeEdgeId("e-greatdev-quality"),
      from: makeNodeId("n-great-devs"),
      to: makeNodeId("n-quality"),
      polarity: 1 as const,
      weight: 2,
      delay: "none" as const,
      transferFn: "linear" as const,
    },
    // Quality attracts great devs (positive feedback - virtuous cycle)
    {
      kind: "causal" as const,
      id: makeEdgeId("e-quality-attract"),
      from: makeNodeId("n-quality"),
      to: makeNodeId("n-great-devs"),
      polarity: 1 as const,
      weight: 1.5,
      delay: "medium" as const,
      transferFn: "linear" as const,
    },
    // Mentoring creates great devs (reinforcing loop - grows capacity)
    {
      kind: "causal" as const,
      id: makeEdgeId("e-mentor-great"),
      from: makeNodeId("n-mentoring"),
      to: makeNodeId("n-great-devs"),
      polarity: 1 as const,
      weight: 1,
      delay: "long" as const,
      transferFn: "linear" as const,
    },
    // Great devs enable mentoring (builds capacity)
    {
      kind: "causal" as const,
      id: makeEdgeId("e-great-mentor"),
      from: makeNodeId("n-great-devs"),
      to: makeNodeId("n-mentoring"),
      polarity: 1 as const,
      weight: 1,
      delay: "none" as const,
      transferFn: "linear" as const,
    },
  ];

  const annotations = [
    {
      id: makeAnnotationId("a-quickfix"),
      x: 150,
      y: 80,
      text: "QUICK FIX PATH: ↓ pressure → cheap hiring → defects → quality crashes",
    },
    {
      id: makeAnnotationId("a-quality"),
      x: 600,
      y: 80,
      text: "SUSTAINABLE PATH: quality code → attract mentors → improve → velocity grows",
    },
    {
      id: makeAnnotationId("a-delays"),
      x: 400,
      y: 750,
      text: "KEY DELAYS: hiring & mentoring take weeks/months; defect impact delayed by medium term",
    },
  ];

  return {
    version: 4,
    graph: {
      nodes,
      edges,
      annotations,
    },
  };
}

// Output JSON for Swoopy URL
console.log(JSON.stringify(generateSoftwareDeveloperModel()));
