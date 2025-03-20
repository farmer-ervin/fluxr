import { CustomerPersona } from '@/types/customer';

/**
 * Extracts the first paragraph from an HTML string.
 * This is used to get a concise description from the enhanced problem statement.
 * 
 * @param htmlString - The HTML string containing the full problem statement
 * @returns The text content of the first paragraph, without HTML tags
 */
export function extractFirstParagraph(htmlString: string): string {
  // Match the content of the first <p> tag
  const match = htmlString.match(/<p>([^<]+)<\/p>/);
  if (match && match[1]) {
    return match[1].trim();
  }
  // Fallback: if no <p> tag is found, return the first sentence or the whole string
  return htmlString.split(/[.!?](?:\s|$)/)[0].trim();
}

/**
 * Transforms a CustomerPersona object into an HTML string representation
 * for storing in the PRD's target_audience field.
 * 
 * @param persona - The CustomerPersona object to transform
 * @returns An HTML string representation of the persona
 */
export function transformPersonaToHtml(persona: CustomerPersona): string {
  return `
<div class="persona">
  <div class="persona-header">
    <h3 class="persona-name">${persona.name}</h3>
  </div>

  <div class="persona-overview">
    <p>${persona.overview}</p>
  </div>

  <div class="persona-key-points">
    <h4>Key Points</h4>
    <ul>
      ${persona.keyPoints.map((point: string) => `<li>${point}</li>`).join('\n      ')}
    </ul>
  </div>

  <div class="persona-problems">
    <h4>Problems & Solutions</h4>
    <ul>
      <li><strong>Top Pain Point:</strong> ${persona.topPainPoint}</li>
      <li><strong>Biggest Frustration:</strong> ${persona.biggestFrustration}</li>
      <li><strong>Current Solution:</strong> ${persona.currentSolution}</li>
    </ul>
  </div>

  <div class="persona-scores">
    <h4>Persona Fit</h4>
    <ul>
      <li><strong>Problem Match:</strong> ${persona.scores.problemMatch}/5</li>
      <li><strong>Urgency to Solve:</strong> ${persona.scores.urgencyToSolve}/5</li>
      <li><strong>Ability to Pay:</strong> ${persona.scores.abilityToPay}/5</li>
    </ul>
  </div>
</div>`;
} 