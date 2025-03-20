/**
 * Represents a customer persona with their characteristics, problems, and fit scores.
 */
export interface CustomerPersona {
  /** The name of the persona */
  name: string;
  /** A brief overview of the persona */
  overview: string;
  /** Key characteristics or points about the persona */
  keyPoints: string[];
  /** The main pain point experienced by the persona */
  topPainPoint: string;
  /** The biggest frustration faced by the persona */
  biggestFrustration: string;
  /** The current solution being used by the persona */
  currentSolution: string;
  /** Numerical scores indicating how well the persona fits the product */
  scores: {
    /** How well the problem matches the persona's needs (1-5) */
    problemMatch: number;
    /** How urgent the problem is for the persona (1-5) */
    urgencyToSolve: number;
    /** The persona's ability to pay for the solution (1-5) */
    abilityToPay: number;
  };
} 